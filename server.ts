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
    let targetUrl = req.url.substring(1); // remove leading slash
    
    if (!targetUrl.startsWith('http')) {
      return res.status(400).send("Invalid proxy URL. Must start with http:// or https://");
    }

    try {
      const headers: Record<string, string> = {
        'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': req.headers['accept'] || '*/*',
        'Accept-Language': req.headers['accept-language'] || 'en-US,en;q=0.9',
      };
      
      if (req.headers.range) {
        headers['Range'] = req.headers.range;
      }

      const response = await fetch(targetUrl, { 
        headers,
        redirect: 'manual'
      });
      
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location');
        if (location) {
          const absoluteLocation = new URL(location, targetUrl).href;
          return res.redirect(`/proxy/${absoluteLocation}`);
        }
      }

      res.status(response.status);

      const headersToForward = ['content-type', 'content-length', 'accept-ranges', 'content-range', 'cache-control'];
      headersToForward.forEach(h => {
        const val = response.headers.get(h);
        if (val) res.setHeader(h, val);
      });
      
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        const html = await response.text();
        const $ = cheerio.load(html);
        
        const isMuted = req.headers.cookie?.includes('bypass_muted=true');
        if (isMuted) {
          $('head').prepend(`
            <script>
              (function() {
                function muteMedia(node) {
                  if (node.tagName === 'VIDEO' || node.tagName === 'AUDIO') node.muted = true;
                  if (node.querySelectorAll) {
                    try { node.querySelectorAll('video, audio').forEach(m => m.muted = true); } catch(e) {}
                  }
                }
                document.addEventListener('DOMContentLoaded', () => muteMedia(document));
                const observer = new MutationObserver(mutations => {
                  mutations.forEach(m => m.addedNodes.forEach(muteMedia));
                });
                if (document.documentElement) {
                  observer.observe(document.documentElement, { childList: true, subtree: true });
                }
              })();
            </script>
          `);
        }

        const rewriteUrl = (originalUrl: string) => {
          if (!originalUrl || originalUrl.startsWith('data:') || originalUrl.startsWith('blob:') || originalUrl.startsWith('#')) return originalUrl;
          try {
            const absoluteUrl = new URL(originalUrl, targetUrl).href;
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
    } catch (error) {
      console.error('Proxy error:', error);
      res.status(500).send(`Error proxying to ${targetUrl}`);
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
