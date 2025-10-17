import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with user's auth token
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Validate user session
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { invoiceId } = await req.json();

    console.log(`Génération de facture demandée pour l'invoice ID: ${invoiceId}`);

    // Validate invoiceId format (must be UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!invoiceId || !uuidRegex.test(invoiceId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid invoice ID format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch invoice details - RLS will automatically enforce that user can only access their own invoices
    const { data: invoice, error: invoiceError } = await supabaseClient
      .from('teacher_invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();

    if (invoiceError || !invoice) {
      console.error('Erreur récupération facture:', invoiceError);
      return new Response(
        JSON.stringify({ error: 'Invoice not found or access denied', details: invoiceError?.message }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Facture trouvée: ${invoice.invoice_number}`);

    // Additional authorization check: verify user owns this invoice or is admin
    const { data: isAdmin } = await supabaseClient
      .rpc('has_role', { _user_id: user.id, _role: 'admin' });

    if (invoice.teacher_id !== user.id && !isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized to access this invoice' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch teacher profile - RLS policies apply
    const { data: profile, error: profileError } = await supabaseClient
      .from('teacher_profiles')
      .select('*')
      .eq('user_id', invoice.teacher_id)
      .single();

    if (profileError) {
      return new Response(
        JSON.stringify({ error: 'Failed to retrieve teacher information' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Génération du PDF pour la facture ${invoice.invoice_number}`);

    // Générer le PDF avec pdf-lib
    const pdfBytes = await generateInvoicePDF(invoice, profile);
    
    // Nom du fichier (nettoyage)
    const safeNumber = String(invoice.invoice_number || '').trim().replace(/\//g, '-');
    const fileName = `facture_${safeNumber}.pdf`;
    const filePath = `${invoice.teacher_id}/invoices/${fileName}`;
    
    console.log(`Upload du PDF vers: ${filePath}`);

    // Upload vers le bucket storage
    const { error: uploadError } = await supabaseClient
      .storage
      .from('teacher-invoices')
      .upload(
        filePath,
        pdfBytes,
        {
          contentType: 'application/pdf',
          upsert: true
        }
      );

    if (uploadError) {
      console.error('Erreur upload:', uploadError);
      return new Response(
        JSON.stringify({ error: 'Failed to upload PDF', details: uploadError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('PDF uploadé avec succès');

    // Générer URL signée valide 1 heure
    const { data: signed, error: signError } = await supabaseClient
      .storage
      .from('teacher-invoices')
      .createSignedUrl(filePath, 3600);

    if (signError || !signed?.signedUrl) {
      console.error('Erreur génération URL:', signError);
      return new Response(
        JSON.stringify({ error: 'Failed to sign PDF URL', details: signError?.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Mettre à jour la facture avec le chemin du PDF
    const { error: updateError } = await supabaseClient
      .from('teacher_invoices')
      .update({ pdf_path: filePath })
      .eq('id', invoiceId);

    if (updateError) {
      console.error('Erreur mise à jour facture:', updateError);
    }

    console.log('PDF généré et URL signée créée:', signed.signedUrl);

    return new Response(
      JSON.stringify({ 
        success: true, 
        pdfUrl: signed.signedUrl,
        message: 'Invoice generated successfully'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    // Log error with ID but don't expose sensitive details to client
    const errorId = crypto.randomUUID();
    console.error(`Invoice generation error [${errorId}]:`, error instanceof Error ? error.message : 'Unknown error');
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        errorId,
        message: 'An error occurred while generating the invoice. Please contact support with this error ID.'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function generateInvoicePDF(invoice: any, profile: any): Promise<Uint8Array> {
  // Créer un nouveau document PDF
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4 en points
  
  // Charger les polices
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  const { width, height } = page.getSize();
  const margin = 50;
  let y = height - margin;
  
  const invoiceDate = new Date(invoice.invoice_date).toLocaleDateString('fr-FR');
  const currentDate = new Date().toLocaleDateString('fr-FR');
  
  // Couleur bleue primaire
  const primaryBlue = rgb(0.145, 0.388, 0.922); // #2563eb
  const textGray = rgb(0.2, 0.2, 0.2);
  const lightGray = rgb(0.42, 0.45, 0.5);
  
  // Ligne bleue en haut
  page.drawLine({
    start: { x: margin, y: y },
    end: { x: width - margin, y: y },
    thickness: 2,
    color: primaryBlue,
  });
  y -= 20;
  
  // Nom de l'enseignant (en-tête gauche)
  page.drawText(profile?.full_name || 'Enseignant', {
    x: margin,
    y: y,
    size: 16,
    font: helveticaBold,
    color: primaryBlue,
  });
  y -= 20;
  
  // Adresse
  if (profile?.address) {
    const addressLines = profile.address.split('\n');
    for (const line of addressLines) {
      page.drawText(line, {
        x: margin,
        y: y,
        size: 10,
        font: helveticaFont,
        color: textGray,
      });
      y -= 14;
    }
  }
  
  // SIRET, email, téléphone
  if (invoice?.siret) {
    page.drawText(`SIRET: ${invoice.siret}`, {
      x: margin,
      y: y,
      size: 10,
      font: helveticaFont,
      color: textGray,
    });
    y -= 14;
  }
  
  if (profile?.email) {
    page.drawText(`Email: ${profile.email}`, {
      x: margin,
      y: y,
      size: 10,
      font: helveticaFont,
      color: textGray,
    });
    y -= 14;
  }
  
  if (profile?.phone) {
    page.drawText(`Tél: ${profile.phone}`, {
      x: margin,
      y: y,
      size: 10,
      font: helveticaFont,
      color: textGray,
    });
  }
  
  // Informations facture (en-tête droite)
  y = height - margin - 20;
  page.drawText('FACTURE', {
    x: width - margin - 80,
    y: y,
    size: 14,
    font: helveticaBold,
    color: primaryBlue,
  });
  y -= 18;
  
  page.drawText(invoice.invoice_number, {
    x: width - margin - helveticaBold.widthOfTextAtSize(invoice.invoice_number, 12) / 2 - 40,
    y: y,
    size: 12,
    font: helveticaBold,
    color: primaryBlue,
  });
  y -= 18;
  
  page.drawText(`Date: ${invoiceDate}`, {
    x: width - margin - 80,
    y: y,
    size: 10,
    font: helveticaFont,
    color: textGray,
  });
  
  // Section CLIENT
  y = height - 220;
  page.drawText('CLIENT', {
    x: margin,
    y: y,
    size: 10,
    font: helveticaBold,
    color: primaryBlue,
  });
  y -= 16;
  
  page.drawText('Regen School', {
    x: margin,
    y: y,
    size: 10,
    font: helveticaBold,
    color: textGray,
  });
  
  // Section DESCRIPTION
  y -= 30;
  page.drawText('DESCRIPTION', {
    x: margin,
    y: y,
    size: 10,
    font: helveticaBold,
    color: primaryBlue,
  });
  y -= 16;
  
  // Découper la description en plusieurs lignes si nécessaire
  const maxDescWidth = width - 2 * margin;
  const descWords = invoice.description.split(' ');
  let currentLine = '';
  
  for (const word of descWords) {
    const testLine = currentLine + word + ' ';
    const testWidth = helveticaFont.widthOfTextAtSize(testLine, 10);
    
    if (testWidth > maxDescWidth && currentLine !== '') {
      page.drawText(currentLine, {
        x: margin,
        y: y,
        size: 10,
        font: helveticaFont,
        color: textGray,
      });
      y -= 14;
      currentLine = word + ' ';
    } else {
      currentLine = testLine;
    }
  }
  
  if (currentLine !== '') {
    page.drawText(currentLine, {
      x: margin,
      y: y,
      size: 10,
      font: helveticaFont,
      color: textGray,
    });
    y -= 24;
  }
  
  // Tableau - En-tête
  const tableTop = y;
  page.drawRectangle({
    x: margin,
    y: tableTop - 20,
    width: width - 2 * margin,
    height: 20,
    color: primaryBlue,
  });
  
  // Texte en-tête tableau (en blanc)
  const whiteColor = rgb(1, 1, 1);
  page.drawText('Désignation', {
    x: margin + 5,
    y: tableTop - 14,
    size: 9,
    font: helveticaBold,
    color: whiteColor,
  });
  
  page.drawText('Quantité', {
    x: width - margin - 200,
    y: tableTop - 14,
    size: 9,
    font: helveticaBold,
    color: whiteColor,
  });
  
  page.drawText('Prix Unit.', {
    x: width - margin - 120,
    y: tableTop - 14,
    size: 9,
    font: helveticaBold,
    color: whiteColor,
  });
  
  page.drawText('Montant HT', {
    x: width - margin - 60,
    y: tableTop - 14,
    size: 9,
    font: helveticaBold,
    color: whiteColor,
  });
  
  y = tableTop - 36;
  
  // Lignes du tableau
  if (invoice.hours && invoice.rate_per_hour) {
    page.drawText('Heures de cours', {
      x: margin + 5,
      y: y,
      size: 9,
      font: helveticaFont,
      color: textGray,
    });
    
    page.drawText(`${invoice.hours} h`, {
      x: width - margin - 200,
      y: y,
      size: 9,
      font: helveticaFont,
      color: textGray,
    });
    
    page.drawText(`${invoice.rate_per_hour.toFixed(2)} €`, {
      x: width - margin - 120,
      y: y,
      size: 9,
      font: helveticaFont,
      color: textGray,
    });
    
    const lineAmount = (invoice.hours * invoice.rate_per_hour).toFixed(2);
    page.drawText(`${lineAmount} €`, {
      x: width - margin - 60 - helveticaFont.widthOfTextAtSize(`${lineAmount} €`, 9),
      y: y,
      size: 9,
      font: helveticaFont,
      color: textGray,
    });
    
    y -= 20;
  }
  
  if (invoice.other_amount) {
    page.drawText('Autres prestations', {
      x: margin + 5,
      y: y,
      size: 9,
      font: helveticaFont,
      color: textGray,
    });
    
    page.drawText('-', {
      x: width - margin - 200,
      y: y,
      size: 9,
      font: helveticaFont,
      color: textGray,
    });
    
    page.drawText('-', {
      x: width - margin - 120,
      y: y,
      size: 9,
      font: helveticaFont,
      color: textGray,
    });
    
    const otherAmount = invoice.other_amount.toFixed(2);
    page.drawText(`${otherAmount} €`, {
      x: width - margin - 60 - helveticaFont.widthOfTextAtSize(`${otherAmount} €`, 9),
      y: y,
      size: 9,
      font: helveticaFont,
      color: textGray,
    });
    
    y -= 20;
  }
  
  // Section totaux (fond gris)
  y -= 20;
  const totalBoxX = width - margin - 150;
  const totalBoxY = y - 60;
  
  page.drawRectangle({
    x: totalBoxX,
    y: totalBoxY,
    width: 140,
    height: 60,
    color: rgb(0.95, 0.96, 0.97),
    borderColor: rgb(0.9, 0.91, 0.93),
    borderWidth: 1,
  });
  
  y = totalBoxY + 45;
  
  // Total HT
  page.drawText('Total HT:', {
    x: totalBoxX + 10,
    y: y,
    size: 9,
    font: helveticaFont,
    color: textGray,
  });
  
  const totalHT = invoice.total_amount.toFixed(2);
  page.drawText(`${totalHT} €`, {
    x: totalBoxX + 130 - helveticaFont.widthOfTextAtSize(`${totalHT} €`, 9),
    y: y,
    size: 9,
    font: helveticaFont,
    color: textGray,
  });
  
  y -= 15;
  
  // TVA
  page.drawText('TVA (0%):', {
    x: totalBoxX + 10,
    y: y,
    size: 9,
    font: helveticaFont,
    color: textGray,
  });
  
  page.drawText('0.00 €', {
    x: totalBoxX + 130 - helveticaFont.widthOfTextAtSize('0.00 €', 9),
    y: y,
    size: 9,
    font: helveticaFont,
    color: textGray,
  });
  
  y -= 5;
  
  // Ligne de séparation
  page.drawLine({
    start: { x: totalBoxX + 10, y: y },
    end: { x: totalBoxX + 130, y: y },
    thickness: 1,
    color: primaryBlue,
  });
  
  y -= 15;
  
  // Total TTC
  page.drawText('TOTAL TTC:', {
    x: totalBoxX + 10,
    y: y,
    size: 11,
    font: helveticaBold,
    color: primaryBlue,
  });
  
  const totalTTC = invoice.total_amount.toFixed(2);
  page.drawText(`${totalTTC} €`, {
    x: totalBoxX + 130 - helveticaBold.widthOfTextAtSize(`${totalTTC} €`, 11),
    y: y,
    size: 11,
    font: helveticaBold,
    color: primaryBlue,
  });
  
  // Coordonnées bancaires
  if (invoice?.bank_iban) {
    y = totalBoxY - 40;
    
    page.drawText('COORDONNÉES BANCAIRES', {
      x: margin,
      y: y,
      size: 10,
      font: helveticaBold,
      color: primaryBlue,
    });
    y -= 16;
    
    page.drawText(`IBAN: ${invoice.bank_iban}`, {
      x: margin,
      y: y,
      size: 9,
      font: helveticaFont,
      color: textGray,
    });
    
    if (invoice.bank_bic) {
      y -= 14;
      page.drawText(`BIC: ${invoice.bank_bic}`, {
        x: margin,
        y: y,
        size: 9,
        font: helveticaFont,
        color: textGray,
      });
    }
  }
  
  // Pied de page
  const footerY = 60;
  page.drawText(`Facture générée le ${currentDate}`, {
    x: width / 2 - helveticaFont.widthOfTextAtSize(`Facture générée le ${currentDate}`, 8) / 2,
    y: footerY,
    size: 8,
    font: helveticaFont,
    color: lightGray,
  });
  
  const legalText = 'En cas de retard de paiement, des pénalités de 3 fois le taux d\'intérêt légal seront appliquées.';
  page.drawText(legalText, {
    x: width / 2 - helveticaFont.widthOfTextAtSize(legalText, 8) / 2,
    y: footerY - 12,
    size: 8,
    font: helveticaFont,
    color: lightGray,
  });
  
  // Sauvegarder le PDF
  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}
