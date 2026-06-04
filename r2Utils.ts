
import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { supabase } from './supabase';

/**
 * Helper to get the absolute API URL.
 * In native Capacitor apps, relative paths like /api/... resolve to local files.
 * We must use an absolute URL for the backend.
 */
async function fetchWithTimeout(resource: string | Request, options: any = {}, timeout = 15000) {
  // If we are on native, use CapacitorHttp for potentially better CORS/redirect handling
  // EXCEPTION: Do not use CapacitorHttp for uploading files to R2 natively, as it corrupts binary data (sends base64 strings instead of raw bytes). Using standard fetch for PUTting to presigned URLs works perfectly.
  const isR2Upload = options.method === 'PUT' && typeof resource === 'string' && resource.includes('.r2.');

  if (Capacitor.isNativePlatform() && typeof resource === 'string' && resource.startsWith('http') && !isR2Upload) {
    try {
      console.log(`[HTTP_NATIVE] Requesting: ${resource} (${options.method || 'GET'})`);
      
      // Standard API request
      let data = undefined;
      if (options.body) {
        if (typeof options.body === 'string') {
          try {
            data = JSON.parse(options.body);
          } catch (e) {
            data = options.body;
          }
        } else {
          data = options.body;
        }
      }

      const nativeOptions = {
        url: resource,
        method: options.method || 'GET',
        headers: options.headers || {},
        data: data,
        connectTimeout: timeout,
        readTimeout: timeout
      };

      const response = await CapacitorHttp.request(nativeOptions);
      
      return {
        ok: response.status >= 200 && response.status < 300,
        status: response.status,
        statusText: String(response.status),
        headers: {
          get: (name: string) => response.headers[name] || response.headers[name.toLowerCase()]
        },
        json: async () => typeof response.data === 'string' ? JSON.parse(response.data) : response.data,
        text: async () => typeof response.data === 'string' ? response.data : JSON.stringify(response.data)
      } as any;
    } catch (error) {
      console.error('[HTTP_NATIVE_ERROR]', error);
      throw error;
    }
  }

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(resource, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error: any) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. Please check your internet connection and try again.');
    }
    throw error;
  }
}

function getApiUrl(path: string): string {
  // 1. Try environment variable first
  const envApiUrl = (import.meta as any).env.VITE_API_URL;
  if (envApiUrl && envApiUrl !== 'undefined' && envApiUrl !== '') {
    const baseUrl = envApiUrl.endsWith('/') ? envApiUrl.slice(0, -1) : envApiUrl;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${baseUrl}${cleanPath}`;
  }

  // 2. Try window.location.origin
  if (typeof window !== 'undefined' && window.location) {
    const origin = window.location.origin;
    const isNative = origin.startsWith('capacitor://') || 
                   origin.startsWith('ionic://') || 
                   origin.startsWith('http://localhost') || 
                   origin.includes('127.0.0.1');

    if (!isNative && origin && origin !== 'null') {
      const baseUrl = origin.endsWith('/') ? origin.slice(0, -1) : origin;
      const cleanPath = path.startsWith('/') ? path : `/${path}`;
      return `${baseUrl}${cleanPath}`;
    }
  }

  // 3. Fallback for Native: Targeting the known backend URL for this project
  if (Capacitor.isNativePlatform()) {
    // We MUST use the public 'Shared App URL' for native apps because the Dev URL is protected
    // by Identity Aware Proxy (IAP) requiring a Google login cookie, which the native App doesn't have.
    const preUrl = 'https://ais-pre-ccad7mpgq7vqasiqr54t54-105564735267.europe-west2.run.app';
    const fallbackUrl = preUrl;
    
    const baseUrl = fallbackUrl.endsWith('/') ? fallbackUrl.slice(0, -1) : fallbackUrl;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    console.log(`[API_URL] Native detected. Targeting Public URL: ${baseUrl}${cleanPath}`);
    return `${baseUrl}${cleanPath}`;
  }

  return path;
}

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export async function uploadToR2(file: File): Promise<string> {
  console.log(`[R2_UPLOAD] Starting for: ${file.name} (${file.type}, ${file.size} bytes)`);
  
  try {
    let presignedUrl = "";
    let publicUrl = "";

    // For native Android apps, we use a secure Supabase Edge Function to generate the R2 URL
    if (Capacitor.isNativePlatform()) {
      console.log(`[R2_UPLOAD] Native detected. Getting presigned URL via Supabase Edge Function...`);
      const ext = file.name.split('.').pop() || 'jpg';
      const uniqueFileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;

      const { data, error } = await supabase.functions.invoke('r2-presign', {
        body: { 
          fileName: uniqueFileName, 
          contentType: file.type || 'image/jpeg' 
        }
      });

      if (error) {
        console.error('[R2_UPLOAD] Edge Function Error:', error);
        throw new Error(`Failed to get presigned URL from Edge Function. Please ensure 'r2-presign' is deployed in Supabase: ${error.message}`);
      }

      if (!data || !data.presignedUrl) {
         throw new Error('Edge function returned invalid data: ' + JSON.stringify(data));
      }

      presignedUrl = data.presignedUrl;
      publicUrl = data.publicUrl;

    } else {
      // Standard flow for web applications
      const apiUrl = getApiUrl('/api/upload/presigned');
      const response = await fetchWithTimeout(apiUrl, {
        method: 'POST',
        cache: 'no-cache',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type
        })
      });

      const contentType = response.headers.get('content-type');

      if (!response.ok || (contentType && contentType.includes('text/html'))) {
        const text = await response.text();
        console.error('[R2_UPLOAD] Presigned URL request failed:', response.status, text.slice(0, 200));
        
        if (text.includes('<!DOCTYPE html>') || (contentType && contentType.includes('text/html'))) {
          throw new Error('Server returned an HTML page. Please Update your Shared App in AI Studio.');
        }
        throw new Error(`Server error (${response.status}): ${text.slice(0, 100)}`);
      }

      const data = await response.json();
      presignedUrl = data.presignedUrl;
      publicUrl = data.publicUrl;
    }

    // 2. Upload to R2 using the generated URL
    console.log(`[R2_UPLOAD] URL obtained. Uploading to R2...`);
    const uploadResponse = await fetchWithTimeout(presignedUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type
      }
    }, 30000); // 30s for the actual upload

    if (!uploadResponse.ok) {
      console.error('[R2_UPLOAD] R2 upload failed:', uploadResponse.status);
      throw new Error('Failed to upload file to storage.');
    }

    console.log(`[R2_UPLOAD] Success: ${publicUrl}`);
    return publicUrl;
  } catch (err: any) {
    console.error('[R2_UPLOAD] Error:', err);
    throw err;
  }
}

