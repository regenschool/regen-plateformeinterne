import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Fetch the markdown file from the public URL
    const markdownUrl = new URL("/docs/guides/admin-onboarding.md", req.url).toString();
    const markdownResponse = await fetch(markdownUrl);
    
    if (!markdownResponse.ok) {
      throw new Error(`Failed to fetch markdown: ${markdownResponse.statusText}`);
    }
    
    const markdown = await markdownResponse.text();

    // Convert markdown to styled HTML
    const html = generateStyledHTML(markdown);

    // Return HTML that can be printed as PDF
    return new Response(html, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8",
      },
    });

  } catch (error) {
    console.error("Error generating guide:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function generateStyledHTML(markdown: string): string {
  // Convert markdown to HTML with enhanced styling
  let html = markdown;

  // Escape HTML special characters in code blocks first
  html = html.replace(/```([\s\S]*?)```/g, (match, code) => {
    return '<pre><code>' + escapeHtml(code.trim()) + '</code></pre>';
  });

  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // Italic
  html = html.replace(/(?<!\*)\*(?!\*)([^*]+)(?<!\*)\*(?!\*)/g, '<em>$1</em>');

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Blockquotes
  html = html.replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>');

  // Unordered lists
  html = html.replace(/^\* (.*$)/gim, '<li>$1</li>');
  html = html.replace(/^- (.*$)/gim, '<li>$1</li>');

  // Numbered lists
  html = html.replace(/^\d+\. (.*$)/gim, '<li>$1</li>');

  // Wrap consecutive <li> in <ul>
  html = html.replace(/(<li>.*?<\/li>\s*)+/gs, (match) => {
    return '<ul>' + match + '</ul>';
  });

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // Horizontal rules
  html = html.replace(/^---$/gim, '<hr>');

  // Paragraphs
  html = html.split('\n\n').map(para => {
    if (!para.trim()) return '';
    if (para.startsWith('<h') || para.startsWith('<ul') || 
        para.startsWith('<pre') || para.startsWith('<hr') ||
        para.startsWith('<blockquote')) {
      return para;
    }
    return '<p>' + para + '</p>';
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Guide Administrateur - Regen School</title>
  <style>
    @page {
      size: A4;
      margin: 2.5cm;
    }
    
    @media print {
      body { margin: 0; }
      .page-break { page-break-before: always; }
      h1, h2, h3 { page-break-after: avoid; }
      pre, blockquote { page-break-inside: avoid; }
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.8;
      color: #1a202c;
      max-width: 21cm;
      margin: 0 auto;
      padding: 20px;
      background: #ffffff;
    }
    
    h1 {
      color: #2563eb;
      font-size: 2.5em;
      border-bottom: 4px solid #2563eb;
      padding-bottom: 15px;
      margin-top: 40px;
      margin-bottom: 20px;
    }
    
    h2 {
      color: #1e40af;
      font-size: 2em;
      margin-top: 35px;
      margin-bottom: 15px;
      border-left: 6px solid #3b82f6;
      padding-left: 15px;
    }
    
    h3 {
      color: #3b82f6;
      font-size: 1.5em;
      margin-top: 25px;
      margin-bottom: 12px;
    }
    
    p {
      margin: 12px 0;
      text-align: justify;
    }
    
    pre {
      background: #f8fafc;
      border: 2px solid #e2e8f0;
      border-left: 6px solid #3b82f6;
      padding: 20px;
      overflow-x: auto;
      border-radius: 8px;
      font-family: 'Courier New', monospace;
      font-size: 0.9em;
      line-height: 1.6;
      margin: 20px 0;
    }
    
    code {
      background: #e5e7eb;
      padding: 3px 8px;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 0.9em;
      color: #dc2626;
    }
    
    pre code {
      background: transparent;
      padding: 0;
      color: #1e293b;
    }
    
    blockquote {
      background: #fef3c7;
      border-left: 6px solid #f59e0b;
      padding: 20px;
      margin: 20px 0;
      border-radius: 8px;
      font-style: italic;
    }
    
    ul, ol {
      margin: 15px 0;
      padding-left: 40px;
    }
    
    li {
      margin: 8px 0;
      line-height: 1.6;
    }
    
    a {
      color: #2563eb;
      text-decoration: none;
      border-bottom: 1px solid #93c5fd;
    }
    
    a:hover {
      border-bottom-color: #2563eb;
    }
    
    hr {
      border: none;
      border-top: 2px solid #e5e7eb;
      margin: 40px 0;
    }
    
    strong {
      color: #1e40af;
      font-weight: 600;
    }
    
    .cover {
      text-align: center;
      padding: 150px 0;
      page-break-after: always;
    }
    
    .cover h1 {
      font-size: 4em;
      border: none;
      margin-bottom: 30px;
      color: #1e40af;
    }
    
    .cover p {
      font-size: 1.8em;
      color: #64748b;
      margin: 20px 0;
    }
    
    .cover .subtitle {
      font-size: 1.4em;
      color: #475569;
      margin-top: 60px;
      font-weight: 500;
    }
    
    .cover .date {
      font-size: 1.1em;
      color: #94a3b8;
      margin-top: 80px;
    }
    
    @media screen {
      body {
        background: #f1f5f9;
        padding: 40px;
      }
    }
  </style>
</head>
<body>
  <div class="cover">
    <h1>📘 Guide Administrateur</h1>
    <p>Regen School</p>
    <p class="subtitle">Version Débutant - Pas à Pas</p>
    <p class="date">${new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
  </div>
  
  <div class="content">
    ${html}
  </div>
  
  <script>
    // Auto-print on load if requested
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('autoprint') === 'true') {
      window.onload = () => {
        setTimeout(() => window.print(), 500);
      };
    }
  </script>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}
