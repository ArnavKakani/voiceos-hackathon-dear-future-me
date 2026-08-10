import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const reminderMessages = [
  "Hey there! 📝 Take a quick moment to jot down this week's highlights on Dear Future Me—your future self will thank you!",
  "Pause. Breathe. ✨ What's one thing you want your future self to remember? Log into Dear Future Me and write it down!",
  "Gentle reminder 🌱—your thoughts matter! Spend a few minutes journaling on Dear Future Me today.",
  "It's journaling o'clock! 🕰️ Share your thoughts or reflections from the week on Dear Future Me.",
  "Hey friend! 💭 Time to reflect. What lesson did this week teach you? Dear Future Me is waiting.",
  "Don't forget: your story matters! 📖 Write a quick entry on Dear Future Me to track your journey.",
  "Hello! 🌟 Ready to capture your week? Write your future self a little note on Dear Future Me today!",
  "Checking in! 🖋️ What's something meaningful you experienced recently? Record it on Dear Future Me!",
  "Weekly reflection time! 🌙 Write it, feel it, remember it—log into Dear Future Me now.",
  "Future you is curious about today! 🧩 Take a moment to journal on Dear Future Me this week."
];

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Check if today is Friday
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 5 = Friday
    const hour = now.getHours();
    
    // Only send reminders on Fridays at 3 PM (15:00)
    if (dayOfWeek !== 5 || hour !== 15) {
      return new Response(
        JSON.stringify({
          success: false,
          message: `Reminders only sent on Fridays at 3 PM. Current: ${now.toLocaleString()}`
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get all users with phone numbers and notifications enabled
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('phone, name')
      .not('phone', 'is', null)
      .eq('notifications_enabled', true);

    if (error) throw error;

    const results = [];
    
    for (const profile of profiles || []) {
      if (profile.phone) {
        // Select a random reminder message
        const randomMessage = reminderMessages[Math.floor(Math.random() * reminderMessages.length)];
        
        // In a real implementation, you would integrate with an SMS service like Twilio
        // Here's how you would set it up:
        /*
        const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
        const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
        const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');
        
        const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            From: twilioPhoneNumber,
            To: profile.phone,
            Body: randomMessage
          })
        });
        */
        
        // For now, we'll just log the message that would be sent
        console.log(`Would send to ${profile.phone}: ${randomMessage}`);
        
        results.push({
          phone: profile.phone,
          name: profile.name,
          message: randomMessage,
          status: 'queued', // In real implementation, this would be the actual send status
          timestamp: new Date().toISOString()
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${results.length} reminder messages for Friday 3 PM`,
        results,
        scheduledFor: 'Fridays at 3 PM',
        nextRun: 'Next Friday at 3 PM'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error sending reminders:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});