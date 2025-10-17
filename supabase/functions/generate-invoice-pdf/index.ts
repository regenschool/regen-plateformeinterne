import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

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
      .select('*, teacher:teacher_id(*)')
      .eq('id', invoiceId)
      .single();

    if (invoiceError || !invoice) {
      return new Response(
        JSON.stringify({ error: 'Invoice not found or access denied' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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

    // Generate simple HTML invoice
    const html = generateInvoiceHTML(invoice, profile);

    // For now, we'll return the HTML directly
    // In production, you'd convert this to PDF using a library like Puppeteer
    // For Deno, you could use: https://deno.land/x/pdfgen
    
    // Create a simple text-based PDF-like response
    const fileName = `facture_${invoice.invoice_number.replace(/\//g, '-')}.html`;
    
    // Store HTML in storage bucket (as a temporary solution)
    const { data: uploadData, error: uploadError } = await supabaseClient
      .storage
      .from('teacher-invoices')
      .upload(
        `${invoice.teacher_id}/${fileName}`,
        new Blob([html], { type: 'text/html' }),
        {
          contentType: 'text/html',
          upsert: true
        }
      );

    if (uploadError) {
      return new Response(
        JSON.stringify({ error: 'Failed to generate invoice' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate a signed URL valid for 5 minutes
    const { data: signed, error: signError } = await supabaseClient
      .storage
      .from('teacher-invoices')
      .createSignedUrl(`${invoice.teacher_id}/${fileName}`, 60 * 5);

    if (signError || !signed?.signedUrl) {
      return new Response(
        JSON.stringify({ error: 'Failed to sign invoice URL' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update invoice with storage path
    await supabaseClient
      .from('teacher_invoices')
      .update({ pdf_path: `${invoice.teacher_id}/${fileName}` })
      .eq('id', invoiceId);

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

function generateInvoiceHTML(invoice: any, profile: any): string {
  const invoiceDate = new Date(invoice.invoice_date).toLocaleDateString('fr-FR');
  
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Facture ${invoice.invoice_number}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: Arial, sans-serif;
      padding: 40px;
      background: white;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
    }
    .header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 3px solid #2563eb;
    }
    .company-info {
      flex: 1;
    }
    .company-info h1 {
      color: #2563eb;
      font-size: 24px;
      margin-bottom: 10px;
    }
    .invoice-info {
      text-align: right;
    }
    .invoice-number {
      font-size: 20px;
      font-weight: bold;
      color: #2563eb;
      margin-bottom: 5px;
    }
    .section {
      margin-bottom: 30px;
    }
    .section-title {
      font-weight: bold;
      margin-bottom: 10px;
      color: #2563eb;
      font-size: 14px;
      text-transform: uppercase;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    thead {
      background: #2563eb;
      color: white;
    }
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }
    th {
      font-weight: bold;
    }
    .text-right {
      text-align: right;
    }
    .total-section {
      margin-top: 30px;
      display: flex;
      justify-content: flex-end;
    }
    .total-box {
      background: #f3f4f6;
      padding: 20px;
      border-radius: 8px;
      min-width: 300px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
    }
    .total-row.grand-total {
      font-size: 18px;
      font-weight: bold;
      color: #2563eb;
      border-top: 2px solid #2563eb;
      padding-top: 10px;
      margin-top: 10px;
    }
    .footer {
      margin-top: 60px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      font-size: 12px;
      color: #6b7280;
      text-align: center;
    }
    @media print {
      body {
        padding: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-info">
      <h1>${profile?.full_name || 'Enseignant'}</h1>
      ${profile?.address ? `<p>${profile.address.replace(/\n/g, '<br>')}</p>` : ''}
      ${profile?.siret ? `<p>SIRET: ${profile.siret}</p>` : ''}
      ${profile?.email ? `<p>Email: ${profile.email}</p>` : ''}
      ${profile?.phone ? `<p>Tél: ${profile.phone}</p>` : ''}
    </div>
    <div class="invoice-info">
      <div class="invoice-number">FACTURE</div>
      <div class="invoice-number">${invoice.invoice_number}</div>
      <p>Date: ${invoiceDate}</p>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Client</div>
    <p><strong>Regen School</strong></p>
  </div>

  <div class="section">
    <div class="section-title">Description</div>
    <p>${invoice.description}</p>
  </div>

  <table>
    <thead>
      <tr>
        <th>Désignation</th>
        <th class="text-right">Quantité</th>
        <th class="text-right">Prix Unitaire</th>
        <th class="text-right">Montant HT</th>
      </tr>
    </thead>
    <tbody>
      ${invoice.hours && invoice.rate_per_hour ? `
      <tr>
        <td>Heures de cours</td>
        <td class="text-right">${invoice.hours} h</td>
        <td class="text-right">${invoice.rate_per_hour.toFixed(2)} €</td>
        <td class="text-right">${(invoice.hours * invoice.rate_per_hour).toFixed(2)} €</td>
      </tr>
      ` : ''}
      ${invoice.other_amount ? `
      <tr>
        <td>Autres prestations</td>
        <td class="text-right">-</td>
        <td class="text-right">-</td>
        <td class="text-right">${invoice.other_amount.toFixed(2)} €</td>
      </tr>
      ` : ''}
    </tbody>
  </table>

  <div class="total-section">
    <div class="total-box">
      <div class="total-row">
        <span>Total HT:</span>
        <span>${invoice.total_amount.toFixed(2)} €</span>
      </div>
      <div class="total-row">
        <span>TVA (0%):</span>
        <span>0.00 €</span>
      </div>
      <div class="total-row grand-total">
        <span>TOTAL TTC:</span>
        <span>${invoice.total_amount.toFixed(2)} €</span>
      </div>
    </div>
  </div>

  ${invoice?.bank_iban ? `
  <div class="section" style="margin-top: 40px;">
    <div class="section-title">Coordonnées Bancaires</div>
    <p>IBAN: ${invoice.bank_iban}</p>
    ${invoice.bank_bic ? `<p>BIC: ${invoice.bank_bic}</p>` : ''}
  </div>
  ` : ''}

  <div class="footer">
    <p>Facture générée le ${new Date().toLocaleDateString('fr-FR')}</p>
    <p>En cas de retard de paiement, des pénalités de 3 fois le taux d'intérêt légal seront appliquées.</p>
  </div>
</body>
</html>
  `;
}
