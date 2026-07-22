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
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const payload = await req.json();
    console.log("1. Webhook received payload type:", payload.type, "table:", payload.table);

    // Trigger on UPDATE to 'pets' table
    if (payload.type === 'UPDATE' && payload.table === 'pets') {
      const oldRecord = payload.old_record || {};
      const newRecord = payload.record;

      console.log(`2. Pet UPDATE received. Pet ID: ${newRecord.id}, Old Status: ${oldRecord.status}, New Status: ${newRecord.status}`);

      // We handle the edge case where REPLICA IDENTITY FULL isn't applied to pets
      // If oldRecord.status is undefined, it means this was updated but we don't have the old status.
      // Easiest is to always notify if the new status is approved or rejected.
      // But let's check what the logs say.

      const statusChanged = oldRecord.status !== newRecord.status;
      const isTargetStatus = newRecord.status === 'approved' || newRecord.status === 'rejected';

      console.log(`3. Evaluation: Status Changed: ${statusChanged}, Is Target Status: ${isTargetStatus}`);

      if (isTargetStatus && (statusChanged || oldRecord.status === undefined)) {
        const ownerId = newRecord.owner_id;
        const petName = newRecord.name || 'Your pet';
        console.log(`4. Target owner: ${ownerId}, Pet Name: ${petName}`);

        const { data: recipientProfile, error: profileErr } = await supabase.from('profiles').select('fcm_token').eq('id', ownerId).single();
        console.log(`5. Profile fetch:`, JSON.stringify(recipientProfile), "Error:", profileErr);

        if (!recipientProfile || !recipientProfile.fcm_token) {
          console.log("FAILED: User has no FCM token. Silently exiting.");
          return new Response("User has no FCM token saved, silently ignoring.", { status: 200 });
        }

        const rawToken = String(recipientProfile.fcm_token);
        const fcmToken = rawToken.includes('|') ? rawToken.split('|')[0] : rawToken;

        const title = newRecord.status === 'approved' ? 'Pet Approved! 🎉' : 'Pet Rejected';
        const body = newRecord.status === 'approved' 
          ? `Great news! ${petName} is now live and visible to everyone.` 
          : `Unfortunately, your listing for ${petName} was rejected.`;

        console.log(`6. Attempting send to Firebase with title: "${title}"`);
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
              title,
              body,
            },
            data: {
              type: 'pet_status',
              petId: String(newRecord.id)
            }
          });
          console.log('7. SUCCESS! FCM response:', response);
          return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
        } catch (firebaseErr) {
          console.error("FIREBASE ERROR:", firebaseErr);
          return new Response(JSON.stringify({ error: firebaseErr.message }), { status: 500, headers: { "Content-Type": "application/json" } });
        }
      } else {
        console.log("FAILED: Conditions not met to trigger notification.");
      }
    }

    console.log("FAILED: Not an UPDATE on pets table.");
    return new Response("Ignored (Not a status change).", { status: 200 });
  } catch (error) {
    console.error("Critical Error processing request:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});
