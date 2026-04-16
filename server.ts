import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { Readable } from "stream";
import * as cheerio from "cheerio";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/proxy", async (req, res) => {
    // Extract the target URL more robustly
    const fullPath = req.originalUrl;
    const proxyPrefix = "/proxy/";
    const prefixIndex = fullPath.indexOf(proxyPrefix);
    
    if (prefixIndex === -1) {
      return res.status(400).send("Invalid proxy request");
    }

    let targetUrl = fullPath.substring(prefixIndex + proxyPrefix.length);
    
    // Handle cases where the URL might be missing the protocol double slash due to some parsers
    if (targetUrl.startsWith('http:/') && !targetUrl.startsWith('http://')) {
      targetUrl = targetUrl.replace('http:/', 'http://');
    } else if (targetUrl.startsWith('https:/') && !targetUrl.startsWith('https://')) {
      targetUrl = targetUrl.replace('https:/', 'https://');
    }

    if (!targetUrl.startsWith('http')) {
      return res.status(400).send("Invalid proxy URL. Must start with http:// or https://. Received: " + targetUrl);
    }

    console.log(`[Proxy] Fetching: ${targetUrl}`);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const headers: Record<string, string> = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': targetUrl,
      };
      
      if (req.headers.range) {
        headers['Range'] = req.headers.range as string;
      }

      const response = await fetch(targetUrl, { 
        method: req.method,
        headers,
        redirect: 'manual',
        signal: controller.signal
      });
      
      clearTimeout(timeout);
      
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location');
        if (location) {
          const absoluteLocation = new URL(location, targetUrl).href;
          console.log(`[Proxy] Redirecting to: ${absoluteLocation}`);
          return res.redirect(`/proxy/${absoluteLocation}`);
        }
      }

      res.status(response.status);

      const headersToForward = ['content-type', 'content-length', 'accept-ranges', 'content-range', 'cache-control'];
      headersToForward.forEach(h => {
        const val = response.headers.get(h);
        if (val) res.setHeader(h, val);
      });
      
      // Specifically remove security headers if they leaked through (though we use a whitelist)
      res.removeHeader('X-Frame-Options');
      res.removeHeader('Content-Security-Policy');
      res.removeHeader('Content-Security-Policy-Report-Only');

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        let html = await response.text();
        const $ = cheerio.load(html);
        
        // Base URL handling
        const base = $('base').attr('href');
        const effectiveBaseUrl = base ? new URL(base, targetUrl).href : targetUrl;

        const isMuted = req.headers.cookie?.includes('bypass_muted=true');
        if (isMuted) {
          $('head').prepend(`
            <script>
              (function() {
                function muteMedia(node) {
                  if (!node) return;
                  if (node.tagName === 'VIDEO' || node.tagName === 'AUDIO') node.muted = true;
                  if (node.querySelectorAll) {
                    try { node.querySelectorAll('video, audio').forEach(m => m.muted = true); } catch(e) {}
                  }
                }
                window.addEventListener('DOMContentLoaded', () => muteMedia(document));
                const observer = new MutationObserver(mutations => {
                  mutations.forEach(m => {
                    m.addedNodes.forEach(node => {
                      if (node.nodeType === 1) muteMedia(node);
                    });
                  });
                });
                observer.observe(document.documentElement, { childList: true, subtree: true });
              })();
            </script>
          `);
        }

        const isAdblockEnabled = req.headers.cookie?.includes('bypass_adblock=true');
        if (isAdblockEnabled) {
          // Remove obvious ad containers using Cheerio
          const adSelectors = [
            '.ad', '.ads', '.ad-container', '.adsbox', '.ad-slot', 
            '[id^="google_ads"]', '[id*="taboola"]', '[class*="sponsored"]',
            'iframe[src*="doubleclick"]', 'iframe[src*="ads"]',
            'script[src*="doubleclick"]', 'script[src*="adsystem"]', 'script[src*="googlesyndication"]'
          ];
          $(adSelectors.join(', ')).remove();

          // Programmatically block popups as an extra precaution
          $('head').prepend(`
            <script>
              (function() {
                window.open = function() { console.warn("Bypass.Core: Pop-up blocked."); return null; };
                window.alert = function() { console.warn("Bypass.Core: Alert blocked."); };
                window.confirm = function() { console.warn("Bypass.Core: Confirm blocked."); return false; };
                window.prompt = function() { console.warn("Bypass.Core: Prompt blocked."); return null; };
              })();
            </script>
          `);
        }

        const rewriteUrl = (originalUrl: string) => {
          if (!originalUrl || originalUrl.startsWith('data:') || originalUrl.startsWith('blob:') || originalUrl.startsWith('#') || originalUrl.startsWith('javascript:')) return originalUrl;
          try {
            const absoluteUrl = new URL(originalUrl, effectiveBaseUrl).href;
            return `/proxy/${absoluteUrl}`;
          } catch (e) {
            return originalUrl;
          }
        };

        $('[src]').each((_, el) => {
          const src = $(el).attr('src');
          if (src) $(el).attr('src', rewriteUrl(src));
        });

        $('[href]').each((_, el) => {
          const href = $(el).attr('href');
          if (href) $(el).attr('href', rewriteUrl(href));
        });
        
        $('form[action]').each((_, el) => {
          const action = $(el).attr('action');
          if (action) $(el).attr('action', rewriteUrl(action));
        });

        // Inject a script to help with dynamic requests
        $('head').append(`
          <script>
            (function() {
              const originalFetch = window.fetch;
              window.fetch = function(input, init) {
                if (typeof input === 'string' && !input.startsWith('http') && !input.startsWith('/proxy/')) {
                  const absolute = new URL(input, window.location.href).href;
                  if (absolute.includes('/proxy/')) {
                     return originalFetch(absolute, init);
                  }
                  return originalFetch('/proxy/' + absolute, init);
                }
                return originalFetch(input, init);
              };
              
              const originalOpen = XMLHttpRequest.prototype.open;
              XMLHttpRequest.prototype.open = function(method, url) {
                if (typeof url === 'string' && !url.startsWith('http') && !url.startsWith('/proxy/')) {
                   const absolute = new URL(url, window.location.href).href;
                   if (!absolute.includes('/proxy/')) {
                     url = '/proxy/' + absolute;
                   }
                }
                return originalOpen.apply(this, arguments);
              };
            })();
          </script>
        `);

        res.setHeader('Content-Type', 'text/html');
        res.send($.html());
      } else {
        if (response.body) {
          const nodeStream = Readable.fromWeb(response.body as any);
          nodeStream.pipe(res);
        } else {
          res.end();
        }
      }
    } catch (error: any) {
      console.error('Proxy error:', error);
      res.status(500).send(`
        <div style="background:#000; color:#CCFF00; font-family:monospace; padding:40px; height:100vh;">
          <h1>TUNNEL ERROR</h1>
          <p>Failed to reach: ${targetUrl}</p>
          <p>Reason: ${error.message}</p>
          <button onclick="window.location.reload()" style="background:#CCFF00; color:#000; boarder:none; padding:10px 20px; cursor:pointer;">RETRY</button>
        </div>
      `);
    }
  });

  // Catch-all for absolute path requests from the proxy iframe
  app.use((req, res, next) => {
    const referer = req.headers.referer;
    if (referer && referer.includes('/proxy/')) {
      const refererMatch = referer.match(/\/proxy\/(https?:\/\/[^\/]+)/);
      if (refererMatch) {
        const targetOrigin = refererMatch[1];
        const targetUrl = targetOrigin + req.originalUrl;
        return res.redirect(`/proxy/${targetUrl}`);
      }
    }
    next();
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
