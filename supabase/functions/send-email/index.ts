import { Resend } from 'npm:resend@3.2.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email, letterContent } = await req.json();

    const data = await resend.emails.send({
      from: 'Dear Future Me <noreply@resend.dev>',
      to: email,
      subject: 'Your Letter to Future Self',
      html: `
        <h1>Dear Future You,</h1>
        <p>Here's the letter you wrote to yourself:</p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          ${letterContent.replace(/\n/g, '<br>')}
        </div>
        <p>Remember to read this when you need encouragement or perspective.</p>
        <p>Best wishes,<br>Your Past Self</p>
      `,
    });

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});