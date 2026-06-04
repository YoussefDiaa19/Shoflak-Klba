import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { S3Client, PutObjectCommand } from "npm:@aws-sdk/client-s3";
import { getSignedUrl } from "npm:@aws-sdk/s3-request-presigner";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const accessKeyId = Deno.env.get('R2_ACCESS_KEY_ID');
    const secretAccessKey = Deno.env.get('R2_SECRET_ACCESS_KEY');
    const accountId = Deno.env.get('R2_ACCOUNT_ID');
    const bucketName = Deno.env.get('R2_BUCKET_NAME');
    let publicDomain = Deno.env.get('R2_PUBLIC_DOMAIN') || `https://pub-${accountId}.r2.dev`;
    if (publicDomain.endsWith('/')) {
      publicDomain = publicDomain.slice(0, -1);
    }

    if (!accessKeyId || !secretAccessKey || !accountId || !bucketName) {
      throw new Error("Missing R2 environment variables in Edge Function. Please set them using: supabase secrets set R2_ACCESS_KEY_ID=...");
    }

    const client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    const body = await req.json();
    const fileName = body.fileName || `${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
    const contentType = body.contentType || 'image/jpeg';

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileName,
      ContentType: contentType,
    });

    const presignedUrl = await getSignedUrl(client, command, { expiresIn: 3600 });
    const publicUrl = `${publicDomain}/${fileName}`;

    return new Response(
      JSON.stringify({ presignedUrl, publicUrl }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
