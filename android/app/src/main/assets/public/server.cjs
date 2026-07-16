"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_vite = require("vite");
var import_path = __toESM(require("path"), 1);
var import_url = require("url");
var import_client_s3 = require("@aws-sdk/client-s3");
var import_s3_request_presigner = require("@aws-sdk/s3-request-presigner");
var import_cors = __toESM(require("cors"), 1);
var import_meta = {};
var getDirname = () => {
  try {
    return import_path.default.dirname((0, import_url.fileURLToPath)(import_meta.url));
  } catch (e) {
    return typeof __dirname !== "undefined" ? __dirname : process.cwd();
  }
};
var _dirname = getDirname();
var s3Client = null;
var getS3Client = () => {
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const accountId = process.env.R2_ACCOUNT_ID;
  if (!accessKeyId || !secretAccessKey || !accountId) {
    console.error("Missing R2 credentials in environment variables.");
    throw new Error("Missing Cloudflare R2 credentials in environment");
  }
  if (!s3Client) {
    console.log(`Initializing S3 client for account: ${accountId}`);
    s3Client = new import_client_s3.S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey
      }
    });
  }
  return s3Client;
};
async function startServer() {
  const app = (0, import_express.default)();
  app.use((0, import_cors.default)());
  const PORT = 3e3;
  app.use((req, res, next) => {
    const start = Date.now();
    console.log(`[INCOMING] ${req.method} ${req.url} - UA: ${req.headers["user-agent"]}`);
    console.log(`[HEADERS] ${JSON.stringify(req.headers)}`);
    res.on("finish", () => {
      const duration = Date.now() - start;
      console.log(`[RESPONSE] ${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`);
    });
    next();
  });
  const apiRouter = import_express.default.Router();
  apiRouter.use((0, import_cors.default)());
  apiRouter.use(import_express.default.json());
  apiRouter.options("*", (0, import_cors.default)());
  apiRouter.use((req, res, next) => {
    console.log(`[API_ROUTER] ${req.method} ${req.url} - ${JSON.stringify(req.headers["content-type"])}`);
    next();
  });
  apiRouter.get("/health", (req, res) => {
    const r2Configured = !!(process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY && process.env.R2_ACCOUNT_ID && process.env.R2_BUCKET_NAME);
    res.json({
      status: "ok",
      time: (/* @__PURE__ */ new Date()).toISOString(),
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
      if (publicDomain.endsWith("/")) {
        publicDomain = publicDomain.slice(0, -1);
      }
      const key = `uploads/${Date.now()}-${fileName}`;
      const command = new import_client_s3.PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        ContentType: fileType
      });
      const presignedUrl = await (0, import_s3_request_presigner.getSignedUrl)(client, command, { expiresIn: 3600 });
      const publicUrl = `${publicDomain}/${key}`;
      res.json({ presignedUrl, publicUrl, key });
    } catch (error) {
      console.error("[API_ERROR]", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });
  apiRouter.all("*", (req, res) => {
    res.status(404).json({ error: `API route not found: ${req.url}` });
  });
  app.use("/api", apiRouter);
  app.get("/auth/callback", (req, res) => {
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
              // 1. Mobile-specific redirection handler for OAuth callback when opened in Safari View Controller or Chrome Custom Tab
              const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
              
              if (isMobileDevice && (hash.includes('access_token') || search.includes('code='))) {
                console.log("No window opener, but on mobile device with tokens. Redirecting to app...");
                status.innerHTML = "<h3>Login successful!</h3><p>Redirecting you back to Shoflak Klba app...</p>";
                
                const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
                const schemes = isIOS 
                  ? ['shoflakklba', 'com.shoflakklba.app', 'com.shoflakklba', 'com.shoflakklba.app.PUV3DTN3CN', 'com.shoflakklba.app.puv3dtn3cn']
                  : ['shoflakklba', 'com.shoflakklba', 'com.shoflakklba.app'];
                  
                const cleanPath = "auth/callback" + search + hash;
                
                // Show a manual redirect button immediately in case browser blocks automatic deep-linking
                closeBtn.style.display = "block";
                closeBtn.innerText = "Open App / \u0641\u062A\u062D \u0627\u0644\u062A\u0637\u0628\u064A\u0642";
                closeBtn.style.background = "#e2a05e";
                closeBtn.onclick = () => {
                  window.location.href = schemes[0] + "://" + cleanPath;
                };
                
                // Attempt automatic redirection across available schemes in sequence
                let currentAttempt = 0;
                function attemptAutoRedirect() {
                  if (currentAttempt < schemes.length) {
                    const nextSchemeUrl = schemes[currentAttempt] + "://" + cleanPath;
                    console.log("Trying custom scheme redirect:", nextSchemeUrl);
                    window.location.href = nextSchemeUrl;
                    currentAttempt++;
                    setTimeout(attemptAutoRedirect, 500);
                  }
                }
                
                // Start redirecting
                attemptAutoRedirect();
              } else {
                console.log("No window opener detected and not mobile with tokens. Redirecting to home...");
                status.innerText = "No parent window detected. Redirecting to home...";
                window.location.href = '/' + search + hash;
              }
            }
          </script>
        </body>
      </html>
    `);
  });
  const isDev = process.env.NODE_ENV !== "production" || !process.env.NODE_ENV;
  console.log(`Vite running in ${isDev ? "development" : "production"} mode`);
  if (isDev) {
    console.log("Starting Vite in middleware mode...");
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.resolve(_dirname, "dist");
    console.log(`Serving static files from: ${distPath}`);
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      if (req.url.startsWith("/api/")) {
        return res.status(404).json({ error: "API route not found" });
      }
      res.sendFile(import_path.default.resolve(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
  app.use((req, res) => {
    console.warn(`[FINAL_FALLTHROUGH] ${req.method} ${req.url}`);
    if (req.url.startsWith("/api/")) {
      res.status(404).json({ error: "API not found" });
    } else {
      res.status(404).send("Not found");
    }
  });
}
startServer().catch((err) => {
  console.error("Critical server startup error:", err);
});
//# sourceMappingURL=server.cjs.map
