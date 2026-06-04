import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { initializeApp, cert } from "npm:firebase-admin@11.11.1/app";
import { getMessaging } from "npm:firebase-admin@11.11.1/messaging";

const serviceAccount = {
  projectId: "shoflakklba",
  privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDkpnBIurO2Dg1f\n/zlKRRoL8hWNy1N00bcVVMh0DlouQvvxmcTACi0XL+80bOzUltseL75AJownC94r\nZqVnjGQNFh4vwqR4dMZus6iB8LzmF5coQfH9DmVFaH4iSr84xBHbgFmBbzza/sC0\nr83sz5AmIcCptOCT7WVcfADfy3Hy54k9BJAOOuVBr0pVxRweGDBbNdepBnppbzBJ\nXpJFrmng+l2FWmvcCBhEsXOn8zcdEYue65n5CU1z2/sXF5f1XYEgQcoQudhcWA3V\n/vCkn9EOBYUzoW/P1hz2Iz8K2BaxpSwecjHSCJEechQCsGMAPjGW5RsKwiKQcLL8\nklukH7z1AgMBAAECggEAEPGWg4U2WQjci98VZ0AMqJL1bu8AzbjWuOFyA0um+iOj\nmOk8r8BxS/UU5E0oFa7iKO//yLAylZgnDA9MtYotRdz8OqzRVE3PAJgWph5pWSGp\nZWXRoV+GOKkAI9lnJzU8X4g42cMc/tt++0TF3UUaWQEKTmkldUDT0JEt3Wetl4LW\nBybcLvhw8fGdeC+3RuZWx9wlSfzs3ml9bu8g3DVplRQF0aqETDyZqEK0XWs/O6xP\nRoMNhYFrN45qJz0dXNJlFrwHT48us1E6BriH9/d4teG9sS72DuHCs86R7Qn0r3Eh\n+gNUdHBhHcRqaVIg/78tsUlVs9LYyOm4tdptO8COgQKBgQD2YNlxNLaFktKIGPbg\n63B0txQ6uJv3lidoIerWtThc0rX/7cT+EVzsYW6QidTGj9ZZSWQWxc+5xEXocwxn\nrbA9ax0F8c0GW81uh+VvlAmLA0otP+I01dy3q4NS+ORVOvdrAZkLfeeG95hJ8XOE\nqs6D8WquF9cSWCVVI361lIgAQQKBgQDtlFpi4nIB/fRubz31RKaJlG0/hl9y6iOM\nxu58Q8aiNQ7k0SehQJ55JVFZqZCbkdCj6dHV+4lzlca9+dHbpyBQpEuxMTeAMRgI\nZBPu1uVcIuc5Hn0x3YuQYXYby76wO1wovQ2FikzeE3oh5p4HHRprH+cDwIWqGfUz\nb7/N5wPPtQKBgQDCePvpoaQYlyXbC2mDbBPd7Mzo9OMXcMw2I9+MDosoqaHDG9kM\neoQQiW+OY10yRkL5QzbfytAGX+iWbIl0JOMh97R3Br/AryHehyIRCpblxXj9cpmI\n/u4zhAwqqA8DP4IgUqiNK5pfLHxmkVGPfIt6FksQk/zNnAoLw/K2PUGEgQKBgCFF\nd2sFv2WcBRE6LvkcRh5aVPpifReAxr2+VkO80iKBP7a3u88PV6IrobrmzkObJhbu\ndd57vYIcZZrRU5xpSVNBzv/fnqArP+xc55W5LqG6mZscM/g5yIPNwlaeL/RKO9vQ\nrgYXmjA3lhENVPA2GS8LZrTVz2JFBFvRuJDDW3tJAoGAbvZDm6cg37otYEiiCQ9C\nKjYcIyd/wFz92294RIzf7I89XokQFaY1LKX8UVtJM4ZWR6sz43g4fttkXV5SX/dg\nUodbKsvhoGEqTqAgg+cUC/Zpt5/Q/isBS+4iS2OJXmo/aTDipG2hEZe6N6T5c34B\nDZAf1PdLe1TaDA4KrBDD3y4=\n-----END PRIVATE KEY-----\n",
  clientEmail: "firebase-adminsdk-fbsvc@shoflakklba.iam.gserviceaccount.com"
};

let isFirebaseInitialized = false;
try {
  initializeApp({ credential: cert(serviceAccount) });
  isFirebaseInitialized = true;
} catch (error) {
  console.log("Firebase initialization status:", error);
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // 1. Verify User is Admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response(JSON.stringify({ error: 'Missing JWT Authorization header' }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    
    // Retrieve token string securely
    const token = authHeader.replace('Bearer ', '').trim();
    
    // We already have the generic supabase client constructed with the SERVICE_ROLE_KEY (which has admin bypass rights), 
    // but auth.getUser(jwt) checks the token's validity against the auth server regardless of admin rights. 
    // Passing the raw token directly solves the 'session missing' issue.
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: `Unauthorized Signature: ${authErr?.message || 'Invalid JWT'}` }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
    if (!profile || !profile.is_admin) {
      return new Response(JSON.stringify({ error: 'Forbidden. Your profile is not set to is_admin = true.' }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // 2. Parse body
    const { title, body } = await req.json();
    if (!title || !body) {
      return new Response(JSON.stringify({ error: 'Missing title or body in request payload.' }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // 3. Fetch ALL fcm_tokens that are not null
    const { data: profiles, error: dbErr } = await supabase.from('profiles').select('fcm_token').not('fcm_token', 'is', null);
    if (dbErr) return new Response(JSON.stringify({ error: 'DB Error fetching tokens: ' + dbErr.message }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    
    if (!profiles || profiles.length === 0) {
      return new Response(JSON.stringify({ success: true, message: 'No devices to notify (no FCM tokens found in profiles table).' }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Filter unique valid tokens
    const tokens = Array.from(new Set(profiles.map(p => p.fcm_token).filter(t => t && typeof t === 'string' && t.length > 10)));
    
    if (tokens.length === 0) {
      return new Response(JSON.stringify({ success: true, message: 'No valid tokens found after filtering.' }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // 4. Send Multicast via Firebase
    console.log(`Sending broadcast to ${tokens.length} devices...`);

    const messagePayload = {
      tokens: tokens,
      android: {
        notification: {
          channelId: 'default',
          sound: 'default'
        }
      },
      notification: { title, body },
      data: { type: 'announcement' }
    };

    const response = await getMessaging().sendEachForMulticast(messagePayload);
    console.log(`Broadcast completed. Success: ${response.successCount}, Failures: ${response.failureCount}`);

    return new Response(JSON.stringify({ 
      success: true, 
      sent: response.successCount, 
      failed: response.failureCount,
      message: `Successfully sent to ${response.successCount} devices!`
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error: any) {
    console.error("Critical Error processing broadcast:", error);
    return new Response(JSON.stringify({ error: error.message || 'Unknown internal error occurred' }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
