import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { initializeApp, cert } from "npm:firebase-admin@11.11.1/app";
import { getMessaging } from "npm:firebase-admin@11.11.1/messaging";

// Firebase Admin initialization using your exact Service Account Key
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

serve(async (req) => {
  // Setup Supabase Client securely loaded inside Deno Environment
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const payload = await req.json();
    console.log("1. Webhook received payload type:", payload.type, "table:", payload.table);

    // We only trigger when a new row is INSERTED into the "messages" table
    if (payload.type === 'INSERT' && payload.table === 'messages') {
      const message = payload.record;
      const senderId = message.sender_id;
      const chatId = message.chat_id;
      console.log(`2. Message received. Sender: ${senderId}, ChatID: ${chatId}`);

      // 1. Find the chat to figure out who the recipient is
      const { data: chat, error: chatError } = await supabase.from('chats').select('participants').eq('id', chatId).single();
      console.log("3. Chat fetched:", JSON.stringify(chat), "Error:", chatError);
      
      if (!chat || !chat.participants) {
        console.log("FAILED: Chat not found or participants missing.");
        return new Response("Chat not found", { status: 404 });
      }

      const recipientId = chat.participants.find((id: string) => id !== senderId);
      console.log("4. Recipient ID calculated as:", recipientId);
      
      if (!recipientId) return new Response("Recipient not found in chat", { status: 404 });

      // 2. Find recipient's FCM token from Profiles
      const { data: recipientProfile, error: profileError } = await supabase.from('profiles').select('fcm_token').eq('id', recipientId).single();
      console.log("5. Recipient Profile fetched:", JSON.stringify(recipientProfile), "Error:", profileError);

      if (!recipientProfile || !recipientProfile.fcm_token) {
        console.log("FAILED: Recipient has no FCM token. Silently exiting.");
        return new Response("User has no FCM token saved, silently ignoring.", { status: 200 });
      }

      const rawToken = String(recipientProfile.fcm_token);
      let fcmToken = rawToken;
      let activeChatId: string | null = null;

      if (rawToken.includes('|')) {
        const parts = rawToken.split('|');
        fcmToken = parts[0];
        activeChatId = parts[1] || null;
      }

      console.log(`Checking activeChatId: "${activeChatId}" against message chatId: "${chatId}"`);

      // If recipient is currently inside this chat room, SUPPRESS PUSH NOTIFICATION
      if (activeChatId && String(activeChatId).trim() === String(chatId).trim()) {
        console.log(`SUPPRESSED: Recipient ${recipientId} is actively inside chat ${chatId}. FCM push skipped!`);
        return new Response("User inside active chat, push suppressed.", { status: 200 });
      }

      if (!fcmToken || fcmToken.trim().length === 0) {
        return new Response("Invalid FCM token", { status: 200 });
      }

      // 3. Find sender's name
      const { data: senderProfile } = await supabase.from('profiles').select('name').eq('id', senderId).single();
      const senderName = senderProfile?.name || 'Someone';
      console.log("6. Sender name resolved:", senderName);

      // 4. Fire the push to the Phone
      let notificationBody = message.text || 'New message';
      
      const rawImageUrls = message.image_urls || message.image_url;
      let imgCount = 0;
      if (Array.isArray(rawImageUrls)) {
        imgCount = rawImageUrls.length;
      } else if (typeof rawImageUrls === 'string' && rawImageUrls.length > 0) {
        if (rawImageUrls.startsWith('[') && rawImageUrls.endsWith(']')) {
          try { imgCount = JSON.parse(rawImageUrls).length; } catch(e) { imgCount = 1; }
        } else if (rawImageUrls.includes(',')) {
          imgCount = rawImageUrls.split(',').length;
        } else {
          imgCount = 1;
        }
      }

      if (imgCount > 0) {
        const photoText = imgCount === 1 ? '1 photo' : `${imgCount} photos`;
        notificationBody = message.text ? `${message.text} (Sent ${photoText})` : `Sent ${photoText}`;
      }
      
      console.log("7. ATTEMPTING TO SEND TO FIREBASE...");
      try {
        const response = await getMessaging().send({
          token: fcmToken,
          android: {
            notification: {
              channelId: 'default',
              sound: 'default'
            }
          },
          notification: {
            title: `New message from ${senderName}`,
            body: notificationBody,
          },
          data: {
            chatId: chatId,
            type: 'chat_message'
          }
        });
        console.log('8. SUCCESS! FCM Push Notification Sent Successfully. Firebase Response:', response);
        return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
      } catch (firebaseErr) {
        console.error("FIREBASE SEND ERROR:", firebaseErr);
        return new Response(JSON.stringify({ error: firebaseErr.message }), { status: 500, headers: { "Content-Type": "application/json" } });
      }
    }

    console.log("FAILED: Payload was not an INSERT on messages table.");
    return new Response("Ignored (Not a new message).", { status: 200 });
  } catch (error) {
    console.error("Critical Error processing request:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});
