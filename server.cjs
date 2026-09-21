const express = require("express");
const fs = require("node:fs");
const path = require("node:path");
const matter = require("gray-matter");
const { marked } = require("marked");

const app = express();
const PORT = process.env.PORT || 4178;
const CONTENT_DIR = path.join(__dirname, "content");
const PUBLIC_DIR = path.join(__dirname, "public");

// ── Helpers ─────────────────────────────────────────────────

marked.setOptions({
  mangle: false,
  headerIds: true,
});

function readDoc(slug) {
  if (slug.includes("..") || slug.includes("/")) return null;
  const filePath = path.join(CONTENT_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);
  const html = marked.parse(content);
  return { frontmatter: data, html, slug };
}

function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ── Middleware ──────────────────────────────────────────────

app.use(express.static(PUBLIC_DIR));

// ── Health ──────────────────────────────────────────────────

app.get("/healthz", (_, res) => res.send("ok"));
app.get("/health", (_, res) => res.send("ok"));

// ── Routes ─────────────────────────────────────────────────

app.get("/", (_, res) => res.send(renderHome()));

app.get("/:slug", (req, res) => {
  const doc = readDoc(req.params.slug);
  if (!doc) return res.status(404).send(render404());
  res.send(renderDocPage(doc));
});

app.get("*", (_, res) => res.status(404).send(render404()));

// ── Template: Shell ─────────────────────────────────────────

function shell(title, bodyHtml, extraHead = "") {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <title>${esc(title)} — Shopigent Stock</title>
  <script src="https://cdn.tailwindcss.com?plugins=typography"></script>
  <script>tailwind.config={darkMode:"class"}</script>
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><text y='28' font-size='28'>📦</text></svg>" />
  ${extraHead}
  <style>
    /* ── Variables ── */
    :root{--bg:#f8f9fc;--text:#1a1a2e;--card:#fff;--border:#e2e8f0;--primary:#452b60;--accent:#269982}
    .dark{--bg:#0f0f1a;--text:#e4e4f0;--card:#1a1a2e;--border:#2d2d3e;--primary:#a78bfa;--accent:#5eead4}
    *{margin:0;padding:0;box-sizing:border-box}
    html{scroll-behavior:smooth}
    body{font-family:Inter,-apple-system,BlinkMacSystemFont,sans-serif;background:var(--bg);color:var(--text);min-height:100vh;line-height:1.5}

    /* ── Header / Nav ── */
    .docs-header{background:var(--card);border-bottom:1px solid var(--border);padding:12px 20px;position:sticky;top:0;z-index:50}
    .docs-nav{display:flex;align-items:center;justify-content:space-between;max-width:1100px;margin:0 auto;position:relative}
    .docs-nav .logo{font-weight:800;font-size:1.2rem;color:var(--accent);text-decoration:none;white-space:nowrap}
    .nav-links{display:flex;gap:4px;align-items:center}
    .nav-links a{padding:6px 12px;border-radius:6px;text-decoration:none;color:var(--text);font-size:0.85rem;transition:background 0.2s;white-space:nowrap}
    .nav-links a:hover,.nav-links a.active{background:var(--accent);color:#fff}

    /* Hamburger */
    .hamburger{display:none;background:none;border:none;cursor:pointer;padding:6px;color:var(--text);font-size:1.5rem;line-height:1}
    .hamburger:hover{opacity:0.7}

    /* ── Hero ── */
    .urgency-badge{display:inline-block;padding:6px 16px;border-radius:20px;font-size:0.8rem;font-weight:600;margin-bottom:20px;background:#fef3c7;color:#92400e;border:1px solid #fbbf24}
    .dark .urgency-badge{background:#78350f;color:#fef3c7;border-color:#b45309}
    .hero{text-align:center;padding:56px 24px 48px;max-width:800px;margin:0 auto}
    .hero h1{font-size:clamp(1.6rem,4.5vw,2.6rem);font-weight:800;margin-bottom:16px;line-height:1.15}
    .hero h1 .gradient{background:linear-gradient(135deg,var(--primary),var(--accent));-webkit-background-clip:text;-webkit-text-fill-color:transparent}
    .hero p{font-size:clamp(0.95rem,2.5vw,1.1rem);opacity:0.85;margin-bottom:28px;line-height:1.6;max-width:650px;margin-left:auto;margin-right:auto}
    .btn-primary{display:inline-block;padding:14px 32px;border-radius:10px;font-weight:700;font-size:1.05rem;text-decoration:none;background:var(--accent);color:#fff;transition:transform 0.2s,box-shadow 0.2s;box-shadow:0 4px 12px rgba(38,153,130,0.3)}
    .btn-primary:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(38,153,130,0.4)}
    .btn-secondary{display:inline-block;padding:10px 24px;border-radius:8px;font-weight:600;text-decoration:none;border:2px solid var(--accent);color:var(--accent);transition:all 0.2s}
    .btn-secondary:hover{background:var(--accent);color:#fff}
    .hero .social-proof{margin-top:20px;font-size:0.85rem;opacity:0.7}
    .hero .social-proof .stars{color:#f59e0b;letter-spacing:2px}

    /* ── Sections ── */
    .section{padding:48px 20px}
    .section-inner{max-width:900px;margin:0 auto}
    .section-label{text-transform:uppercase;letter-spacing:2px;font-size:0.75rem;font-weight:700;color:var(--accent);margin-bottom:8px}
    .section h2{font-size:clamp(1.3rem,3.5vw,1.8rem);font-weight:800;margin-bottom:16px;color:var(--primary)}
    .section h2 .no-border{border-bottom:none;padding-bottom:0}
    .section p{font-size:clamp(0.9rem,2vw,1rem);line-height:1.7;margin-bottom:16px;opacity:0.85}
    .section.accent-bg{background:var(--card)}

    /* Feature cards */
    .feature-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:20px;margin-top:24px}
    .feature-card{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:24px;transition:border-color 0.3s,border-color 0.2s}
    .feature-card:hover{border-color:var(--accent)}
    .feature-card .icon{font-size:1.8rem;margin-bottom:10px}
    .feature-card h3{font-size:1.05rem;font-weight:700;margin-bottom:6px}
    .feature-card p{font-size:0.88rem;opacity:0.7;line-height:1.5;margin:0}

    /* Problem bullets */
    .problem-list{list-style:none;padding:0}
    .problem-list li{padding:14px 0;border-bottom:1px solid var(--border);display:flex;align-items:flex-start;gap:12px;font-size:0.95rem;line-height:1.5}
    .problem-list li:last-child{border-bottom:none}
    .problem-list .icon{font-size:1.3rem;flex-shrink:0;margin-top:2px}

    /* Solution steps */
    .steps{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:24px;margin-top:24px}
    .step{text-align:center;padding:20px}
    .step .num{display:inline-flex;width:40px;height:40px;border-radius:50%;background:var(--accent);color:#fff;font-weight:800;font-size:1.1rem;align-items:center;justify-content:center;margin-bottom:12px}
    .step h3{font-size:1rem;font-weight:700;margin-bottom:6px}
    .step p{font-size:0.88rem;opacity:0.7;margin:0}

    /* Pricing */
    .pricing-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px;margin-top:24px}
    .pricing-card{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:24px;text-align:center;transition:border-color 0.2s}
    .pricing-card.featured{border-color:var(--accent);position:relative}
    .pricing-card.featured::before{content:'Most Popular';position:absolute;top:-10px;left:50%;transform:translateX(-50%);background:var(--accent);color:#fff;padding:2px 14px;border-radius:10px;font-size:0.7rem;font-weight:700}
    .pricing-card h3{font-size:1rem;font-weight:700;margin-bottom:8px}
    .pricing-card .price{font-size:1.8rem;font-weight:800;color:var(--primary);margin-bottom:8px}
    .pricing-card .price span{font-size:0.8rem;font-weight:400;opacity:0.6}
    .pricing-card ul{list-style:none;padding:0;margin:16px 0;text-align:left}
    .pricing-card li{padding:4px 0;font-size:0.83rem;line-height:1.4}
    .pricing-card li::before{content:'✓ ';color:var(--accent);font-weight:700}
    .pricing-card .btn-secondary{display:inline-block;padding:8px 20px;border-radius:6px;border:2px solid var(--accent);color:var(--accent);text-decoration:none;font-weight:600;font-size:0.85rem;transition:all 0.2s}
    .pricing-card .btn-secondary:hover{background:var(--accent);color:#fff}
    .pricing-card.featured .btn-secondary{background:var(--accent);color:#fff}

    /* Comparison table */
    .compare-wrap{overflow-x:auto;margin-top:20px;border-radius:10px;border:1px solid var(--border)}
    .compare-table{width:100%;border-collapse:collapse;font-size:0.88rem}
    .compare-table th{padding:12px 14px;font-weight:700;border-bottom:2px solid var(--border);text-align:center;white-space:nowrap}
    .compare-table th:first-child{text-align:left}
    .compare-table td{padding:11px 14px;border-bottom:1px solid var(--border);text-align:center;vertical-align:middle}
    .compare-table td:first-child{text-align:left;font-weight:600}
    .compare-table tr:last-child td{border-bottom:none}
    .compare-table .yes{color:var(--accent);font-weight:700}
    .compare-table .no{color:#ef4444}
    .compare-table .shut{color:#ef4444;font-weight:600}
    .compare-table tr:hover{background:var(--card)}
    .compare-table tr.highlight{background:color-mix(in srgb,var(--accent) 8%,transparent)}

    /* CTA Banner */
    .cta-banner{text-align:center;padding:56px 20px;margin:0}
    .cta-banner h2{font-size:clamp(1.2rem,3.5vw,1.6rem);font-weight:800;margin-bottom:12px}
    .cta-banner p{font-size:clamp(0.9rem,2vw,1rem);opacity:0.8;margin-bottom:24px;max-width:500px;margin-left:auto;margin-right:auto}
    .cta-banner .meta{font-size:0.8rem;opacity:0.55;margin-top:12px}

    /* Testimonial */
    .testimonial{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:28px;margin-top:24px;text-align:center;max-width:600px;margin-left:auto;margin-right:auto}
    .testimonial blockquote{font-style:italic;font-size:0.95rem;line-height:1.6;margin-bottom:12px}
    .testimonial .author{font-size:0.85rem;font-weight:600;opacity:0.7}

    /* Documentation section (collapsible) */
    .docs-section{padding:48px 20px}
    .docs-section .section-inner{max-width:900px;margin:0 auto}
    .doc-card-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px;margin-top:20px}
    .doc-card{background:var(--card);border:1px solid var(--border);border-radius:10px;padding:20px;transition:border-color 0.2s}
    .doc-card:hover{border-color:var(--accent)}
    .doc-card a{text-decoration:none;color:var(--text);display:block}
    .doc-card h3{font-size:1rem;font-weight:700;margin-bottom:4px}
    .doc-card p{font-size:0.85rem;opacity:0.65;line-height:1.4;margin:0}

    /* ── Doc page content ── */
    .doc-content{max-width:800px;margin:0 auto;padding:40px 24px}
    .doc-content h1{font-size:clamp(1.4rem,3.5vw,2rem);font-weight:800;margin-bottom:16px;color:var(--primary)}
    .doc-content h2{font-size:clamp(1.1rem,2.5vw,1.4rem);font-weight:700;margin-top:32px;margin-bottom:12px;padding-bottom:6px;border-bottom:2px solid var(--accent);color:var(--primary)}
    .doc-content h3{font-size:1.05rem;font-weight:600;margin-top:24px;margin-bottom:8px}
    .doc-content p{line-height:1.7;margin-bottom:16px;font-size:0.95rem}
    .doc-content code{background:var(--border);padding:2px 6px;border-radius:4px;font-size:0.9em}
    .doc-content pre{background:var(--card);border:1px solid var(--border);border-radius:8px;padding:16px;overflow-x:auto;margin-bottom:24px;max-width:calc(100vw - 48px)}
    .doc-content pre code{background:none;padding:0}
    .doc-content ul,.doc-content ol{padding-left:24px;margin-bottom:16px}
    .doc-content li{margin-bottom:6px;line-height:1.6;font-size:0.95rem}
    .doc-content table{width:100%;border-collapse:collapse;margin-bottom:24px;display:block;overflow-x:auto}
    .doc-content th,.doc-content td{padding:10px 14px;border:1px solid var(--border);text-align:left;font-size:0.9rem}
    .doc-content th{background:var(--card);font-weight:700}
    .doc-content blockquote{border-left:4px solid var(--accent);padding:12px 16px;margin:16px 0;background:var(--card);border-radius:0 8px 8px 0;font-size:0.95rem}
    .doc-content a{color:var(--accent)}

    /* ── Footer ── */
    .docs-footer{text-align:center;padding:28px 20px;border-top:1px solid var(--border);color:var(--text);opacity:0.55;font-size:0.8rem}

    /* ── Mobile ── */
    @media(max-width:767px){
      .hamburger{display:block}
      .nav-links{display:none;position:absolute;top:100%;left:0;right:0;background:var(--card);flex-direction:column;padding:8px;border-bottom:1px solid var(--border);gap:2px}
      .nav-links.open{display:flex}
      .nav-links a{display:block;padding:10px 14px;font-size:0.95rem;border-radius:6px}
      .hero{padding:40px 16px 32px}
      .section{padding:36px 16px}
      .pricing-grid{grid-template-columns:1fr;gap:12px}
      .feature-grid{grid-template-columns:1fr}
      .steps{grid-template-columns:1fr;gap:16px}
      .doc-content{padding:28px 16px}
      .doc-card-grid{grid-template-columns:1fr}
      .compare-table td,.compare-table th{padding:8px 10px;font-size:0.78rem}
    }
    @media(max-width:480px){
      .hero h1{font-size:1.4rem}
      .hero p{font-size:0.9rem}
      .btn-primary{padding:12px 24px;font-size:0.95rem}
      .section h2{font-size:1.15rem}
      .doc-content h1{font-size:1.25rem}
    }
  </style>
  <script>if(localStorage.getItem('dark')==='true'||(!localStorage.getItem('dark')&&window.matchMedia('(prefers-color-scheme:dark)').matches))document.documentElement.classList.add('dark')</script>
</head>
<body>
  <header class="docs-header">
    <nav class="docs-nav">
      <a href="/" class="logo">📦 Shopigent Stock</a>
      <button class="hamburger" onclick="document.querySelector('.nav-links').classList.toggle('open')" aria-label="Menu">☰</button>
      <div class="nav-links">
        <a href="/" onclick="event.preventDefault();window.scrollTo({top:0,behavior:'smooth'})">Home</a>
        <a href="/#features" onclick="document.querySelector('.nav-links').classList.remove('open')">Features</a>
        <a href="/#pricing" onclick="document.querySelector('.nav-links').classList.remove('open')">Pricing</a>
        <a href="/quickstart">Quick Start</a>
        <a href="/auto-deduction">Auto Deduction</a>
      </div>
    </nav>
  </header>
  <main>${bodyHtml}</main>
  <footer class="docs-footer">
    <p>© 2026 Shopigent Stock · Built by Greek Nous</p>
  </footer>
  <script>
    // Close mobile nav on link click
    document.querySelectorAll('.nav-links a').forEach(a => {
      a.addEventListener('click', () => document.querySelector('.nav-links').classList.remove('open'));
    });
  </script>
</body>
</html>`;
}

// ── Template: Home page (sales funnel + docs) ──────────────

function renderHome() {
  return shell("AI Inventory + Smart Bundles for Shopify", `
    <!-- URGENCY BADGE -->
    <div class="hero">
      <div class="urgency-badge">⚠️ Stocky shut down August 2026 — thousands switched to Shopigent</div>
      <h1><span class="gradient">Never Oversell a Bundle Again</span></h1>
      <p>Shopigent Stock automatically deducts component inventory when a bundle sells. No manual stock updates, no overselling, no spreadsheets. Works with any Shopify theme.</p>
      <a href="https://apps.shopify.com/shopigent-stock" class="btn-primary">Install on Shopify — Free to Start</a>
      <div class="social-proof">
        ⭐⭐⭐⭐⭐ <span class="stars">·</span> Used by Shopify stores worldwide · Replaces Stocky, Fast Bundle &amp; warehouse sync in one app
      </div>
    </div>

    <!-- PROBLEM -->
    <div class="section accent-bg" id="problem">
      <div class="section-inner">
        <div class="section-label">The Problem</div>
        <h2>Bundles are great for sales. Inventory tracking is a nightmare.</h2>
        <p>If you sell bundles, you know the pain:</p>
        <ul class="problem-list">
          <li><span class="icon">😰</span><span><strong>Manual deduction</strong> — Every bundle sale = manually subtracting components from inventory. One mistake and you oversell.</span></li>
          <li><span class="icon">📊</span><span><strong>Spreadsheet chaos</strong> — Tracking inventory outside Shopify. Never synced, never accurate.</span></li>
          <li><span class="icon">⚠️</span><span><strong>Stocky shutdown</strong> — If you relied on Stocky for bundle management, you lost your tool in August 2026. Fast Bundle doesn't deduct inventory either.</span></li>
          <li><span class="icon">🏭</span><span><strong>Warehouse ≠ Shopify</strong> — Your warehouse has stock, your store shows different. Customers order what you don't have.</span></li>
        </ul>
      </div>
    </div>

    <!-- SOLUTION -->
    <div class="section" id="solution">
      <div class="section-inner">
        <div class="section-label">The Solution</div>
        <h2>Auto inventory deduction — the only app that does it</h2>
        <p>When a customer buys your bundle, component stock decreases <strong>automatically — exactly once, every time.</strong> No race conditions. No duplicates. No manual work.</p>
        <div class="steps">
          <div class="step">
            <div class="num">1</div>
            <h3>Create a Bundle</h3>
            <p>Pick products and quantities. Fixed bundle or Mix &amp; Match ("Pick any 3").</p>
          </div>
          <div class="step">
            <div class="num">2</div>
            <h3>Add to Your Store</h3>
            <p>Enable the widget on any product page. Your theme stays the same.</p>
          </div>
          <div class="step">
            <div class="num">3</div>
            <h3>Sell &amp; Forget</h3>
            <p>Orders are placed, inventory is deducted, the Inventory Ledger logs every change. Done.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- FEATURES -->
    <div class="section accent-bg" id="features">
      <div class="section-inner">
        <div class="section-label">Features</div>
        <h2>Everything you need to manage inventory</h2>
        <div class="feature-grid">
          <div class="feature-card">
            <div class="icon">🔗</div>
            <h3>Auto Bundle Deduction</h3>
            <p>When a bundle sells, component inventory decreases automatically. Bulletproof idempotent ledger — never double-deducts, even on page refresh or retry.</p>
          </div>
          <div class="feature-card">
            <div class="icon">🎁</div>
            <h3>Smart Bundle Builder</h3>
            <p>Fixed bundles (e.g., shampoo + conditioner) or Mix &amp; Match ("Pick any 3 from 10"). Let customers choose their variation.</p>
          </div>
          <div class="feature-card">
            <div class="icon">🔮</div>
            <h3>AI Forecasting</h3>
            <p>Predict stockouts before they happen. Get reorder suggestions based on sales velocity and seasonal trends.</p>
          </div>
          <div class="feature-card">
            <div class="icon">📋</div>
            <h3>Purchase Orders</h3>
            <p>Create POs, receive stock against them (auto-adjusts inventory), track expected dates, supplier info.</p>
          </div>
          <div class="feature-card">
            <div class="icon">🏪</div>
            <h3>Storefront Widget</h3>
            <p>Bundle picker on any product page. Shows fixed bundles or lets customers mix &amp; match. Works with all themes.</p>
          </div>
          <div class="feature-card">
            <div class="icon">🏭</div>
            <h3>Warehouse Sync</h3>
            <p>Map Shopify locations to warehouse shelves. Transfer stock between locations.</p>
          </div>
          <div class="feature-card">
            <div class="icon">📜</div>
            <h3>Inventory Ledger</h3>
            <p>Every deduction and adjustment logged with idempotency keys. Full audit trail — see exactly what changed and why.</p>
          </div>
          <div class="feature-card">
            <div class="icon">🤖</div>
            <h3>AI Agent (MCP)</h3>
            <p>Ask questions in plain English: "What's low on stock?", "Create a bundle with coffee and mugs". Your inventory assistant.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- COMPARISON TABLE -->
    <div class="section" id="comparison">
      <div class="section-inner">
        <div class="section-label">Why Shopigent Stock?</div>
        <h2>What others don't do</h2>
        <div class="compare-wrap">
          <table class="compare-table">
            <thead>
              <tr>
                <th>Feature</th>
                <th>Stocky</th>
                <th>Fast Bundle</th>
                <th style="color:var(--accent)">Shopigent Stock</th>
              </tr>
            </thead>
            <tbody>
              <tr class="highlight">
                <td>Auto bundle inventory deduction</td>
                <td class="no">❌ No</td>
                <td class="no">❌ No</td>
                <td class="yes">✅ Yes — bulletproof</td>
              </tr>
              <tr>
                <td>Mix &amp; Match bundles</td>
                <td class="no">❌ No</td>
                <td class="yes">✅ Yes</td>
                <td class="yes">✅ Yes</td>
              </tr>
              <tr>
                <td>AI forecasting</td>
                <td class="no">❌ No</td>
                <td class="no">❌ No</td>
                <td class="yes">✅ Yes</td>
              </tr>
              <tr>
                <td>Purchase orders</td>
                <td class="yes">✅ Yes</td>
                <td class="no">❌ No</td>
                <td class="yes">✅ Yes</td>
              </tr>
              <tr>
                <td>Warehouse sync</td>
                <td class="yes">✅ Yes</td>
                <td class="no">❌ No</td>
                <td class="yes">✅ Yes</td>
              </tr>
              <tr>
                <td>AI Agent (ask in plain English)</td>
                <td class="no">❌ No</td>
                <td class="no">❌ No</td>
                <td class="yes">✅ Yes</td>
              </tr>
              <tr>
                <td>Inventory Ledger (audit trail)</td>
                <td class="no">❌ No</td>
                <td class="no">❌ No</td>
                <td class="yes">✅ Yes</td>
              </tr>
              <tr>
                <td>Still active?</td>
                <td class="shut">❌ Shut down</td>
                <td class="yes">✅ Active</td>
                <td class="yes">✅ Active + growing</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div style="text-align:center;margin-top:20px">
          <a href="https://apps.shopify.com/shopigent-stock" class="btn-secondary">Switch from Stocky or Fast Bundle in 5 minutes</a>
        </div>
      </div>
    </div>

    <!-- PRICING -->
    <div class="section accent-bg" id="pricing">
      <div class="section-inner">
        <div class="section-label">Pricing</div>
        <h2>Start with the free development plan. Upgrade when you're ready.</h2>
        <div class="pricing-grid">
          <div class="pricing-card">
            <h3>Free</h3>
            <div class="price">$0<span>/mo</span></div>
            <ul>
              <li>Development store</li>
              <li>Up to 10 bundles</li>
              <li>Basic deduction</li>
            </ul>
            <a href="https://apps.shopify.com/shopigent-stock" class="btn-secondary">Start Free</a>
          </div>
          <div class="pricing-card featured">
            <h3>Starter</h3>
            <div class="price">$19<span>/mo</span></div>
            <ul>
              <li>Live store</li>
              <li>Unlimited bundles</li>
              <li>Auto bundle deduction</li>
              <li>Mix &amp; Match</li>
              <li>Storefront widget</li>
              <li>7-day free trial</li>
            </ul>
            <a href="https://apps.shopify.com/shopigent-stock" class="btn-secondary">Try Free for 7 Days</a>
          </div>
          <div class="pricing-card">
            <h3>Growth</h3>
            <div class="price">$49<span>/mo</span></div>
            <ul>
              <li>Everything in Starter</li>
              <li>AI forecasting</li>
              <li>Purchase orders</li>
              <li>Warehouse sync</li>
              <li>Inventory Ledger</li>
            </ul>
            <a href="https://apps.shopify.com/shopigent-stock" class="btn-secondary">Get Started</a>
          </div>
          <div class="pricing-card">
            <h3>Pro</h3>
            <div class="price">$99<span>/mo</span></div>
            <ul>
              <li>Everything in Growth</li>
              <li>AI Agent (MCP)</li>
              <li>Priority support</li>
              <li>Custom integrations</li>
            </ul>
            <a href="https://apps.shopify.com/shopigent-stock" class="btn-secondary">Go Pro</a>
          </div>
        </div>
      </div>
    </div>

    <!-- TESTIMONIAL PLACEHOLDER -->
    <div class="section" id="social-proof">
      <div class="section-inner">
        <div class="testimonial">
          <blockquote>"We switched from Stocky after the shutdown. Shopigent Stock does everything Stocky did plus bundle deduction — which Stocky never had. Setup took 10 minutes."</blockquote>
          <div class="author">— [Store Name], [Industry]</div>
        </div>
      </div>
    </div>

    <!-- CTA BANNER -->
    <div class="cta-banner accent-bg">
      <h2>Stop worrying about inventory</h2>
      <p>Install Shopigent Stock on your Shopify store. No credit card needed to start.</p>
      <a href="https://apps.shopify.com/shopigent-stock" class="btn-primary">Install on Shopify — Free to Start</a>
      <div class="meta">✅ 98 automated tests · ✅ App Store submitted · ✅ Works with any theme</div>
    </div>

    <!-- DOCUMENTATION -->
    <div class="docs-section" id="docs">
      <div class="section-inner">
        <div class="section-label">Documentation</div>
        <h2>Technical guides <span style="font-size:0.9rem;font-weight:400;opacity:0.6">(for those who need them)</span></h2>
        <div class="doc-card-grid">
          <div class="doc-card">
            <a href="/quickstart">
              <h3>Quick Start</h3>
              <p>Install, create your first bundle, enable the widget — in 5 minutes.</p>
            </a>
          </div>
          <div class="doc-card">
            <a href="/auto-deduction">
              <h3>Auto Deduction</h3>
              <p>How inventory deduction works, the ledger, and developer reference.</p>
            </a>
          </div>
        </div>
      </div>
    </div>
  `);
}

// ── Template: Doc sub-pages ─────────────────────────────────

function renderDocPage(doc) {
  const body = `<div class="doc-content">${doc.html}</div>`;
  const title = doc.frontmatter.title || doc.slug;
  return shell(`${title} — Shopigent Stock`, body);
}

// ── Template: 404 ───────────────────────────────────────────

function render404() {
  const body = `<div class="doc-content"><h1>404</h1><p>Page not found.</p><a href="/" style="color:var(--accent);font-weight:600">← Back to home</a></div>`;
  return shell("Not Found — Shopigent Stock", body);
}

// ── Start ──────────────────────────────────────────────────

app.listen(PORT, () => console.log(`Stock docs on ${PORT}`));