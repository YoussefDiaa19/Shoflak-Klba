
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import cors from "cors";

// Robust __dirname for both ESM and CJS
const getDirname = () => {
  try {
    return path.dirname(fileURLToPath(import.meta.url));
  } catch (e) {
    return typeof __dirname !== 'undefined' ? __dirname : process.cwd();
  }
};

const _dirname = getDirname();

// Lazy-initialized S3 client for R2
let s3Client: S3Client | null = null;
const getS3Client = () => {
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const accountId = process.env.R2_ACCOUNT_ID;

    if (!accessKeyId || !secretAccessKey || !accountId) {
      console.error("Missing R2 credentials in environment variables.");
      throw new Error("Missing Cloudflare R2 credentials in environment");
    }

    if (!s3Client) {
      console.log(`Initializing S3 client for account: ${accountId}`);
      s3Client = new S3Client({
        region: "auto",
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
    }
    return s3Client;
};

async function startServer() {
  const app = express();
  app.use(cors()); // Allow all origins for now to avoid cross-device issues
  const PORT = 3000;

  // 1. Logging and Health
  app.use((req, res, next) => {
    const start = Date.now();
    console.log(`[INCOMING] ${req.method} ${req.url} - UA: ${req.headers['user-agent']}`);
    console.log(`[HEADERS] ${JSON.stringify(req.headers)}`);
    res.on("finish", () => {
      const duration = Date.now() - start;
      console.log(`[RESPONSE] ${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`);
    });
    next();
  });

  // 2. API Routes
  const apiRouter = express.Router();
  apiRouter.use(cors());
  apiRouter.use(express.json());

  // Handle preflight for all API routes
  apiRouter.options("*", cors());

  // Log all hits to /api
  apiRouter.use((req, res, next) => {
    console.log(`[API_ROUTER] ${req.method} ${req.url} - ${JSON.stringify(req.headers['content-type'])}`);
    next();
  });

  apiRouter.get("/health", (req, res) => {
    const r2Configured = !!(process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY && process.env.R2_ACCOUNT_ID && process.env.R2_BUCKET_NAME);
    res.json({ 
      status: "ok", 
      time: new Date().toISOString(),
      r2Configured,
      nodeEnv: process.env.NODE_ENV
    });
  });

  apiRouter.all("/upload/presigned", async (req, res) => {
    if (req.method === "OPTIONS") return res.sendStatus(204);
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed. Use POST." });
    }

    console.log(`[API_PRESIGNED] Handling ${req.method} for ${req.body?.fileName}`);
    try {
      const { fileName, fileType } = req.body;
      if (!fileName || !fileType) {
        return res.status(400).json({ error: "fileName and fileType are required" });
      }

      const accessKeyId = process.env.R2_ACCESS_KEY_ID;
      const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
      const accountId = process.env.R2_ACCOUNT_ID;
      const bucketName = process.env.R2_BUCKET_NAME;

      if (!accessKeyId || !secretAccessKey || !accountId || !bucketName) {
        return res.status(500).json({ error: "Cloudflare R2 is not configured" });
      }

      const client = getS3Client();
      let publicDomain = process.env.R2_PUBLIC_DOMAIN || `https://pub-${accountId}.r2.dev`;
      if (publicDomain.endsWith('/')) {
        publicDomain = publicDomain.slice(0, -1);
      }
      const key = `uploads/${Date.now()}-${fileName}`;
      
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        ContentType: fileType,
      });

      const presignedUrl = await getSignedUrl(client, command, { expiresIn: 3600 });
      const publicUrl = `${publicDomain}/${key}`;

      res.json({ presignedUrl, publicUrl, key });
    } catch (error: any) {
      console.error("[API_ERROR]", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });

  // Explicitly handle 404s within the API router
  apiRouter.all("*", (req, res) => {
    res.status(404).json({ error: `API route not found: ${req.url}` });
  });

  app.use("/api", apiRouter);

  // 2. Auth Callback
  app.get("/auth/callback", (req, res) => {
    // The tokens might be in the query or the fragment (hash)
    // Client-side JS can access the hash, server-side can't.
    // So we return a script that handles both cases.
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Authenticating...</title>
          <style>
            body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #fdf2e9; color: #4a3728; }
            .loader { border: 4px solid #f3f3f3; border-top: 4px solid #e2a05e; border-radius: 50%; width: 40px; height: 40px; animate: spin 1s linear infinite; margin-bottom: 20px; }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          </style>
        </head>
        <body>
          <div class="loader"></div>
          <p id="status">Completing your login...</p>
          <div id="debug" style="font-size: 10px; color: #999; margin-top: 20px; max-width: 80%; word-break: break-all; display: none;"></div>
          <button id="closeBtn" style="display: none; margin-top: 20px; padding: 10px 20px; background: #e2a05e; color: white; border: none; rounded: 10px; cursor: pointer; font-weight: bold;">Close Window</button>
          
          <script>
            window.onerror = function(message, source, lineno, colno, error) {
              console.error("GLOBAL POPUP ERROR:", message, error);
              const status = document.getElementById('status');
              if (status) {
                status.innerText = "Script Error: " + message;
                status.style.color = "red";
              }
              return false;
            };

            console.log("OAuth Callback Page Loaded");
            const hash = window.location.hash;
            const search = window.location.search;
            const debug = document.getElementById('debug');
            const status = document.getElementById('status');
            const closeBtn = document.getElementById('closeBtn');
            
            console.log("Hash length:", hash.length);
            console.log("Search params:", search);
            debug.innerText = "Full URL: " + window.location.href;
            
            if (window.opener) {
              console.log("Window opener found, communicating...");
              
              if (hash.includes('access_token')) {
                console.log("Found access_token in fragment");
                status.innerText = "Login successful! Syncing session...";
                
                // Write to localStorage for robust cross-tab sync strictly on same domain
                try {
                  localStorage.setItem('supabase.auth.token', hash);
                  console.log("Tokens written to localStorage");
                } catch (e) {
                  console.error("localStorage write failed:", e);
                }

                window.opener.postMessage({ 
                  type: 'OAUTH_SUCCESS', 
                  payload: { hash, search }
                }, '*');
                setTimeout(() => window.close(), 1000);
              } else {
                const params = new URLSearchParams(search || hash.replace('#', '?'));
                const error = params.get('error_description') || params.get('error');
                
                if (error) {
                  console.error("OAuth error detected:", error);
                  status.innerText = "Login error: " + error;
                  status.style.color = "red";
                  window.opener.postMessage({ 
                    type: 'OAUTH_ERROR', 
                    error: error.includes('email') ? 'Permission Denied: ' + error : error 
                  }, '*');
                  closeBtn.style.display = "block";
                  closeBtn.onclick = () => window.close();
                } else {
                  console.warn("No access_token or error found in URL.");
                  debug.style.display = "block";
                  status.innerText = "Authentication state unknown. Check settings.";
                }
              }
            } else {
              console.log("No window opener detected. Redirecting to home...");
              status.innerText = "No parent window detected. Redirecting...";
              window.location.href = '/';
            }
          </script>
        </body>
      </html>
    `);
  });

  // Vite middleware for development
  const isDev = process.env.NODE_ENV !== "production" || !process.env.NODE_ENV;
  console.log(`Vite running in ${isDev ? 'development' : 'production'} mode`);

  if (isDev) {
    console.log("Starting Vite in middleware mode...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    const distPath = path.resolve(_dirname, "dist");
    console.log(`Serving static files from: ${distPath}`);
    
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      // Avoid serving index.html for missed API routes even in production
      if (req.url.startsWith('/api/')) {
        return res.status(404).json({ error: "API route not found" });
      }
      res.sendFile(path.resolve(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });

  // Final catch-all for anything that slipped through
  app.use((req, res) => {
    console.warn(`[FINAL_FALLTHROUGH] ${req.method} ${req.url}`);
    if (req.url.startsWith('/api/')) {
      res.status(404).json({ error: "API not found" });
    } else {
      res.status(404).send("Not found");
    }
  });
}

startServer().catch(err => {
  console.error("Critical server startup error:", err);
});
