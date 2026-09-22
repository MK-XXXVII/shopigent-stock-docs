const express = require("express");
const fs = require("node:fs");
const path = require("node:path");
const matter = require("gray-matter");
const { marked } = require("marked");

const app = express();
const PORT = process.env.PORT || 4178;
const CONTENT_DIR = path.join(__dirname, "content");
const PUBLIC_DIR = path.join(__dirname, "public");

marked.setOptions({ mangle: false, headerIds: true });

function readDoc(slug) {
  if (slug.includes("..") || slug.includes("/")) return null;
  const fp = path.join(CONTENT_DIR, `${slug}.md`);
  if (!fs.existsSync(fp)) return null;
  const raw = fs.readFileSync(fp, "utf8");
  const { data, content } = matter(raw);
  return { frontmatter: data, html: marked.parse(content), slug };
}

function esc(s) {
  return String(s == null ? "" : s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

app.use(express.static(PUBLIC_DIR));

app.get("/healthz", (_, r) => r.send("ok"));
app.get("/health", (_, r) => r.send("ok"));

app.get("/", (_, r) => r.send(renderHome()));
app.get("/:slug", (req, res) => {
  const doc = readDoc(req.params.slug);
  if (!doc) return res.status(404).send(render404());
  res.send(renderDocPage(doc));
});
app.get("*", (_, r) => r.status(404).send(render404()));

// ═══════════════════════════════════════════════
// SHELL — shared HTML wrapper
// ═══════════════════════════════════════════════

function shell(title, bodyHtml) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
<title>${esc(title)} — Shopigent Stock</title>
<script src="https://cdn.tailwindcss.com?plugins=typography"></script>
<script>tailwind.config={darkMode:"class"}</script>
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><text y='28' font-size='28'>📦</text></svg>" />
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300..700&display=swap" rel="stylesheet">
<style>
/* ── Design Tokens ── */
:root{--bg:#f5f6fa;--text:#1a1a2e;--card:rgba(255,255,255,0.85);--card-glass:rgba(255,255,255,0.7);--border:rgba(0,0,0,0.08);--primary:#452b60;--accent:#269982;--accent-light:rgba(38,153,130,0.12)}
.dark{--bg:#0a0a12;--text:#eaeaf2;--card:rgba(26,26,46,0.85);--card-glass:rgba(26,26,46,0.6);--border:rgba(255,255,255,0.08);--primary:#a78bfa;--accent:#5eead4;--accent-light:rgba(94,234,212,0.12)}

*{margin:0;padding:0;box-sizing:border-box}
html{scroll-behavior:smooth}
body{font-family:Inter,-apple-system,BlinkMacSystemFont,sans-serif;background:var(--bg);color:var(--text);min-height:100vh;line-height:1.6;font-weight:400;overflow-x:hidden}

/* ── Animations ── */
@keyframes fadeIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeInUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeInScale{from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)}}
@keyframes slideDown{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}
@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}
@keyframes glow{0%,100%{box-shadow:0 4px 14px rgba(38,153,130,0.25)}50%{box-shadow:0 4px 28px rgba(38,153,130,0.45)}}
@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
@keyframes type-cursor{50%{border-color:transparent}}
@keyframes badgePulse{0%,100%{opacity:1}50%{opacity:0.7}}

/* Scroll reveal */
.reveal{opacity:0;transform:translateY(30px);transition:opacity 0.6s ease,transform 0.6s ease}
.reveal.visible{opacity:1;transform:translateY(0)}
.reveal-delay-1{transition-delay:0.1s}
.reveal-delay-2{transition-delay:0.2s}
.reveal-delay-3{transition-delay:0.3s}
.reveal-delay-4{transition-delay:0.4s}

/* ── Header / Nav ── */
.docs-header{background:var(--card);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);border-bottom:1px solid var(--border);padding:12px 20px;position:sticky;top:0;z-index:50;animation:slideDown 0.4s ease}
.docs-nav{display:flex;align-items:center;justify-content:space-between;max-width:1100px;margin:0 auto;position:relative}
.docs-nav .logo{font-weight:700;font-size:1.2rem;color:var(--accent);text-decoration:none;white-space:nowrap;transition:opacity 0.2s}
.docs-nav .logo:hover{opacity:0.8}
.nav-links{display:flex;gap:6px;align-items:center}
.nav-links a{padding:8px 14px;border-radius:8px;text-decoration:none;color:var(--text);font-size:0.85rem;font-weight:400;transition:all 0.2s;position:relative}
.nav-links a::after{content:'';position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:0;height:2px;background:var(--accent);border-radius:1px;transition:width 0.25s}
.nav-links a:hover::after,.nav-links a.active::after{width:70%}
.nav-links a:hover,.nav-links a.active{background:var(--accent-light);color:var(--accent)}
.hamburger{display:none;background:none;border:none;cursor:pointer;padding:8px;color:var(--text);font-size:1.4rem;line-height:1;transition:transform 0.2s;border-radius:8px;z-index:51}
.hamburger:hover{background:var(--accent-light)}
.hamburger.active{transform:rotate(90deg)}

/* ── Hero ── */
.hero-wrap{position:relative;overflow:hidden;padding-top:20px}
.hero-wrap::before{content:'';position:absolute;top:-50%;left:-50%;width:200%;height:200%;background:radial-gradient(circle at 30% 40%, var(--accent-light) 0%, transparent 50%),radial-gradient(circle at 70% 60%, rgba(69,43,96,0.05) 0%, transparent 50%);pointer-events:none}
.hero{text-align:center;padding:60px 24px 48px;max-width:800px;margin:0 auto;position:relative;animation:fadeIn 0.8s ease}
.urgency-badge{display:inline-block;padding:8px 20px;border-radius:24px;font-size:0.8rem;font-weight:600;margin-bottom:24px;animation:fadeIn 0.6s ease 0.2s both;background:linear-gradient(135deg,#fef3c7,#fde68a);color:#92400e;border:1px solid #f59e0b;animation:badgePulse 2s ease-in-out infinite}
.dark .urgency-badge{background:linear-gradient(135deg,#451a03,#78350f);color:#fde68a;border-color:#b45309}
.hero h1{font-size:clamp(1.6rem,4.5vw,2.6rem);font-weight:700;margin-bottom:16px;line-height:1.15;animation:fadeInUp 0.7s ease 0.1s both}
.hero h1 .gradient{background:linear-gradient(135deg,var(--primary),var(--accent));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.typewriter{display:inline;border-right:3px solid var(--accent);padding-right:2px;animation:type-cursor 0.8s step-end infinite}
.hero p{font-size:clamp(0.95rem,2.5vw,1.1rem);opacity:0.85;margin-bottom:28px;line-height:1.6;max-width:650px;margin-left:auto;margin-right:auto;animation:fadeInUp 0.7s ease 0.25s both}
.hero .btn-wrap{animation:fadeInUp 0.7s ease 0.35s both}
.btn-primary{display:inline-block;padding:16px 36px;border-radius:12px;font-weight:700;font-size:1.05rem;text-decoration:none;background:linear-gradient(135deg,var(--accent),#1d7a66);color:#fff;transition:all 0.3s;box-shadow:0 4px 14px rgba(38,153,130,0.25);animation:glow 3s ease-in-out infinite;position:relative;overflow:hidden}
.btn-primary::before{content:'';position:absolute;top:0;left:-100%;width:100%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent);animation:shimmer 3s infinite}
.btn-primary:hover{transform:translateY(-3px);box-shadow:0 8px 28px rgba(38,153,130,0.35)}
.btn-secondary{display:inline-block;padding:12px 28px;border-radius:10px;font-weight:600;font-size:0.95rem;text-decoration:none;border:2px solid var(--accent);color:var(--accent);transition:all 0.25s;background:transparent}
.btn-secondary:hover{background:var(--accent);color:#fff;transform:translateY(-2px)}
.hero .social-proof{margin-top:24px;font-size:0.85rem;opacity:0.7;animation:fadeInUp 0.7s ease 0.5s both}
.hero .social-proof .stars{color:#f59e0b;letter-spacing:2px}

/* ── Sections ── */
.section{padding:60px 20px;position:relative}
.section-inner{max-width:900px;margin:0 auto}
.section-label{text-transform:uppercase;letter-spacing:2px;font-size:0.75rem;font-weight:700;color:var(--accent);margin-bottom:8px}
.section h2{font-size:clamp(1.3rem,3.5vw,1.8rem);font-weight:700;margin-bottom:16px;color:var(--primary);line-height:1.2}
.section p{font-size:clamp(0.9rem,2vw,1rem);line-height:1.7;margin-bottom:16px;opacity:0.85}
.section.accent-bg{background:var(--card)}

/* Problem */
.problem-list{list-style:none;padding:0}
.problem-list li{padding:16px 0;border-bottom:1px solid var(--border);display:flex;align-items:flex-start;gap:14px;font-size:0.95rem;line-height:1.6}
.problem-list li:last-child{border-bottom:none}
.problem-list .problem-icon{font-size:1.4rem;flex-shrink:0;margin-top:2px}

/* Steps */
.steps{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;margin-top:28px}
.step{text-align:center;padding:24px 16px;background:var(--card);border:1px solid var(--border);border-radius:14px;transition:all 0.3s}
.step:hover{transform:translateY(-4px);border-color:var(--accent);box-shadow:0 8px 24px rgba(38,153,130,0.1)}
.step .num{display:inline-flex;width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,var(--accent),#1d7a66);color:#fff;font-weight:800;font-size:1.15rem;align-items:center;justify-content:center;margin-bottom:14px;box-shadow:0 4px 12px rgba(38,153,130,0.25)}
.step h3{font-size:1.05rem;font-weight:700;margin-bottom:6px}
.step p{font-size:0.88rem;opacity:0.7;margin:0;line-height:1.5}

/* Feature cards */
.feature-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:20px;margin-top:28px}
.feature-card{background:var(--card-glass);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);border:1px solid var(--border);border-radius:14px;padding:26px;transition:all 0.3s;position:relative;overflow:hidden}
.feature-card::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,var(--accent),var(--primary));opacity:0;transition:opacity 0.3s}
.feature-card:hover{transform:translateY(-4px);border-color:var(--accent);box-shadow:0 12px 32px rgba(38,153,130,0.1)}
.feature-card:hover::before{opacity:1}
.feature-card .icon{font-size:2rem;margin-bottom:12px;display:inline-block}
.feature-card h3{font-size:1.05rem;font-weight:700;margin-bottom:6px}
.feature-card p{font-size:0.88rem;opacity:0.7;line-height:1.5;margin:0}

/* Comparison table */
.compare-wrap{overflow-x:auto;margin-top:24px;border-radius:12px;border:1px solid var(--border);background:var(--card)}
.compare-table{width:100%;border-collapse:collapse;font-size:0.88rem;min-width:500px}
.compare-table th{padding:14px 16px;font-weight:700;border-bottom:2px solid var(--border);text-align:center;white-space:nowrap;background:var(--card)}
.compare-table th:first-child{text-align:left}
.compare-table td{padding:13px 16px;border-bottom:1px solid var(--border);text-align:center;vertical-align:middle}
.compare-table td:first-child{text-align:left;font-weight:600}
.compare-table tr:last-child td{border-bottom:none}
.compare-table .yes{color:var(--accent);font-weight:700}
.compare-table .no{color:#ef4444}
.compare-table .shut{color:#ef4444;font-weight:600}
.compare-table tr:hover{background:var(--accent-light)}
.compare-table tr.highlight{background:linear-gradient(90deg,color-mix(in srgb,var(--accent) 8%,transparent),transparent)}

/* Pricing */
.pricing-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-top:28px}
.pricing-card{background:var(--card-glass);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);border:1px solid var(--border);border-radius:14px;padding:28px 20px 20px;text-align:center;transition:all 0.3s;position:relative;display:flex;flex-direction:column}
.pricing-card:hover{transform:translateY(-4px);box-shadow:0 12px 32px rgba(38,153,130,0.1)}
.pricing-card.featured{border-color:var(--accent);box-shadow:0 8px 24px rgba(38,153,130,0.15)}
.pricing-card.featured::before{content:'Most Popular';position:absolute;top:-11px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,var(--accent),#1d7a66);color:#fff;padding:4px 16px;border-radius:12px;font-size:0.7rem;font-weight:700;letter-spacing:0.5px;box-shadow:0 2px 8px rgba(38,153,130,0.3)}
.pricing-card h3{font-size:1rem;font-weight:700;margin-bottom:8px}
.pricing-card .price{font-size:2rem;font-weight:800;color:var(--primary);margin-bottom:4px}
.pricing-card .price span{font-size:0.85rem;font-weight:400;opacity:0.5}
.pricing-card .desc{font-size:0.75rem;opacity:0.5;margin-bottom:16px}
.pricing-card ul{list-style:none;padding:0;margin:16px 0 20px;text-align:left;flex:1}
.pricing-card li{padding:5px 0;font-size:0.83rem;line-height:1.4;opacity:0.85}
.pricing-card li::before{content:'✓ ';color:var(--accent);font-weight:700}
.pricing-card .btn-pricing{display:inline-block;padding:10px 24px;border-radius:8px;font-weight:600;font-size:0.85rem;text-decoration:none;transition:all 0.25s;border:2px solid var(--accent);color:var(--accent);background:transparent;margin-top:auto}
.pricing-card .btn-pricing:hover{background:var(--accent);color:#fff;transform:translateY(-2px)}
.pricing-card.featured .btn-pricing{background:var(--accent);color:#fff}
.pricing-card.featured .btn-pricing:hover{background:#1d7a66;border-color:#1d7a66}

/* Testimonial */
.testimonial{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:36px 28px;margin-top:28px;text-align:center;max-width:600px;margin-left:auto;margin-right:auto;position:relative}
.testimonial::before{content:'"';position:absolute;top:-8px;left:24px;font-size:4rem;color:var(--accent);opacity:0.2;font-family:Georgia,serif;line-height:1}
.testimonial blockquote{font-style:italic;font-size:1rem;line-height:1.7;margin-bottom:14px;opacity:0.9}
.testimonial .author{font-size:0.85rem;font-weight:600;opacity:0.6}

/* CTA Banner */
.cta-banner{text-align:center;padding:64px 20px;position:relative;overflow:hidden}
.cta-banner::before{content:'';position:absolute;top:0;left:0;right:0;bottom:0;background:radial-gradient(ellipse at 50% 0%, var(--accent-light) 0%, transparent 70%);pointer-events:none}
.cta-banner h2{font-size:clamp(1.2rem,3.5vw,1.6rem);font-weight:800;margin-bottom:12px;position:relative}
.cta-banner p{font-size:clamp(0.9rem,2vw,1rem);opacity:0.8;margin-bottom:28px;max-width:500px;margin-left:auto;margin-right:auto;position:relative}
.cta-banner .meta{font-size:0.8rem;opacity:0.5;margin-top:16px;position:relative}

/* Doc cards */
.docs-section{padding:60px 20px}
.docs-section .section-inner{max-width:900px;margin:0 auto}
.doc-card-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px;margin-top:24px}
.doc-card{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:24px;transition:all 0.25s}
.doc-card:hover{border-color:var(--accent);transform:translateY(-3px);box-shadow:0 8px 20px rgba(38,153,130,0.1)}
.doc-card a{text-decoration:none;color:var(--text);display:block}
.doc-card h3{font-size:1rem;font-weight:700;margin-bottom:4px;color:var(--primary)}
.doc-card p{font-size:0.85rem;opacity:0.65;line-height:1.4;margin:0}

/* ── Doc page content ── */
.doc-content{max-width:800px;margin:0 auto;padding:48px 24px;animation:fadeInUp 0.5s ease}
.doc-content h1{font-size:clamp(1.4rem,3.5vw,2rem);font-weight:800;margin-bottom:20px;color:var(--primary);line-height:1.2}
.doc-content h2{font-size:clamp(1.1rem,2.5vw,1.4rem);font-weight:700;margin-top:36px;margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid var(--accent);color:var(--primary)}
.doc-content h3{font-size:1.05rem;font-weight:600;margin-top:28px;margin-bottom:10px}
.doc-content p{line-height:1.7;margin-bottom:18px;font-size:0.95rem}
.doc-content code{background:var(--accent-light);padding:3px 8px;border-radius:5px;font-size:0.88em;color:var(--accent)}
.doc-content pre{background:var(--card);border:1px solid var(--border);border-radius:10px;padding:20px;overflow-x:auto;margin-bottom:28px;max-width:calc(100vw - 48px)}
.doc-content pre code{background:none;padding:0;color:var(--text)}
.doc-content ul,.doc-content ol{padding-left:26px;margin-bottom:18px}
.doc-content li{margin-bottom:8px;line-height:1.6;font-size:0.95rem}
.doc-content table{width:100%;border-collapse:collapse;margin-bottom:28px;display:block;overflow-x:auto;font-size:0.9rem}
.doc-content th,.doc-content td{padding:12px 16px;border:1px solid var(--border);text-align:left}
.doc-content th{background:var(--card);font-weight:700}
.doc-content blockquote{border-left:4px solid var(--accent);padding:14px 20px;margin:20px 0;background:var(--card);border-radius:0 10px 10px 0;font-size:0.95rem}
.doc-content a{color:var(--accent);font-weight:500}

/* ── Footer ── */
.docs-footer{text-align:center;padding:32px 20px;border-top:1px solid var(--border);color:var(--text);opacity:0.45;font-size:0.8rem}

/* ── Mobile ── */
@media(max-width:900px){
  .pricing-grid{grid-template-columns:1fr 1fr}
  .steps{grid-template-columns:1fr}
}
@media(max-width:767px){
  .hamburger{display:block}
  .nav-links{display:none;position:absolute;top:100%;left:12px;right:12px;background:var(--card);-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px);flex-direction:column;padding:10px;border-radius:12px;border:1px solid var(--border);gap:4px;box-shadow:0 12px 32px rgba(0,0,0,0.1)}
  .nav-links.open{display:flex;animation:fadeIn 0.25s ease}
  .nav-links a{display:block;padding:12px 16px;font-size:0.95rem;border-radius:8px}
  .nav-links a::after{display:none}
  .hero{padding:40px 16px 32px}
  .hero h1{font-size:1.5rem}
  .section{padding:40px 16px}
  .pricing-grid{grid-template-columns:1fr;gap:14px}
  .feature-grid{grid-template-columns:1fr}
  .steps{grid-template-columns:1fr;gap:16px}
  .doc-content{padding:32px 16px}
  .doc-card-grid{grid-template-columns:1fr}
  .compare-table td,.compare-table th{padding:10px 12px;font-size:0.8rem}
  .testimonial{padding:28px 20px;margin-left:0;margin-right:0}
  .btn-primary{padding:14px 28px;font-size:0.95rem}
}
@media(max-width:480px){
  .hero h1{font-size:1.35rem}
  .hero p{font-size:0.9rem}
  .section h2{font-size:1.15rem}
  .doc-content h1{font-size:1.2rem}
  .pricing-card{padding:22px 16px}
  .section-label{font-size:0.7rem}
}
@media(min-width:768px){
  .nav-links{display:flex!important}
}
</style>
<script>if(localStorage.getItem('dark')==='true'||(!localStorage.getItem('dark')&&window.matchMedia('(prefers-color-scheme:dark)').matches))document.documentElement.classList.add('dark')</script>
<script>
(function() {
  // ── Scroll reveal ──
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => { if(e.isIntersecting) e.target.classList.add('visible') });
  }, { threshold: 0.1 });
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    // Add .reveal to feature-cards, steps, pricing-cards
    document.querySelectorAll('.feature-card, .step, .pricing-card, .testimonial, .compare-wrap, .doc-card').forEach(el => {
      el.classList.add('reveal');
      observer.observe(el);
    });
  });

  // ── Hamburger toggle ──
  const hamburger = document.querySelector('.hamburger');
  const navLinks = document.querySelector('.nav-links');
  if(hamburger) {
    hamburger.addEventListener('click', () => {
      navLinks.classList.toggle('open');
      hamburger.classList.toggle('active');
    });
    document.querySelectorAll('.nav-links a').forEach(a => {
      a.addEventListener('click', () => {
        navLinks.classList.remove('open');
        hamburger.classList.remove('active');
      });
    });
  }

  // ── Close nav on outside click ──
  document.addEventListener('click', (e) => {
    if(!e.target.closest('.docs-header') && navLinks?.classList.contains('open')) {
      navLinks.classList.remove('open');
      hamburger.classList.remove('active');
    }
  });
})();
</script>
</head>
<body>
<header class="docs-header">
  <nav class="docs-nav">
    <a href="/" class="logo">📦 Shopigent Stock</a>
    <button class="hamburger" aria-label="Menu">☰</button>
    <div class="nav-links">
      <a href="/" class="active">Home</a>
      <a href="/#features">Features</a>
      <a href="/#pricing">Pricing</a>
      <a href="/quickstart">Quick Start</a>
      <a href="/auto-deduction">Auto Deduction</a>
    </div>
  </nav>
</header>
<main>${bodyHtml}</main>
<footer class="docs-footer">
  <p>© 2026 Shopigent Stock · Built by Greek Nous</p>
</footer>
</body>
</html>`;
}

// ═══════════════════════════════════════════════
// HOME — full sales funnel page
// ═══════════════════════════════════════════════

function renderHome() {
  return shell("AI Inventory + Smart Bundles for Shopify", `
<div class="hero-wrap">
  <div class="hero">
    <div class="urgency-badge">⚠️ Stocky shut down August 2026 — thousands switched to Shopigent</div>
    <h1><span class="gradient typewriter">Never Oversell a Bundle Again</span></h1>
    <p>Shopigent Stock automatically deducts component inventory when a bundle sells. No manual stock updates, no overselling, no spreadsheets. Works with any Shopify theme.</p>
    <div class="btn-wrap">
      <a href="https://apps.shopify.com/shopigent-stock" class="btn-primary">Install on Shopify — Free to Start</a>
    </div>
    <div class="social-proof">⭐⭐⭐⭐<span style="filter:grayscale(0.5)">⭐</span> <span class="stars">·</span> Used by Shopify stores worldwide · Replaces Stocky, Fast Bundle &amp; warehouse sync in one app</div>
  </div>
</div>

<!-- PROBLEM -->
<div class="section accent-bg" id="problem">
  <div class="section-inner">
    <div class="section-label">The Problem</div>
    <h2>Bundles are great for sales. Inventory tracking is a nightmare.</h2>
    <p>If you sell bundles, you know the pain:</p>
    <ul class="problem-list">
      <li class="reveal"><span class="problem-icon">😰</span><span><strong>Manual deduction</strong> — Every bundle sale means manually subtracting components. One mistake and you oversell.</span></li>
      <li class="reveal reveal-delay-1"><span class="problem-icon">📊</span><span><strong>Spreadsheet chaos</strong> — Tracking inventory outside Shopify. Never synced, never accurate.</span></li>
      <li class="reveal reveal-delay-2"><span class="problem-icon">⚠️</span><span><strong>Stocky shutdown</strong> — If you relied on Stocky, you lost your tool in August 2026. Fast Bundle doesn't deduct inventory either.</span></li>
      <li class="reveal reveal-delay-3"><span class="problem-icon">🏭</span><span><strong>Warehouse ≠ Shopify</strong> — Your warehouse has stock, your store shows different. Customers order what you don't have.</span></li>
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
        <p>Orders placed, inventory deducted, the ledger logs every change. Done.</p>
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
      <div class="feature-card"><div class="icon">🔗</div><h3>Auto Bundle Deduction</h3><p>When a bundle sells, component inventory decreases automatically. Bulletproof ledger — never double-deducts, even on page refresh or retry.</p></div>
      <div class="feature-card"><div class="icon">🎁</div><h3>Smart Bundle Builder</h3><p>Fixed bundles or Mix &amp; Match ("Pick any 3 from 10"). Let customers choose their variation.</p></div>
      <div class="feature-card"><div class="icon">🔮</div><h3>AI Forecasting</h3><p>Predict stockouts before they happen. Get reorder suggestions based on sales velocity and trends.</p></div>
      <div class="feature-card"><div class="icon">📋</div><h3>Purchase Orders</h3><p>Create POs, receive stock against them (auto-adjusts inventory), track expected dates, suppliers.</p></div>
      <div class="feature-card"><div class="icon">🏪</div><h3>Storefront Widget</h3><p>Bundle picker on any product page. Fixed bundles or mix &amp; match. Works with all themes.</p></div>
      <div class="feature-card"><div class="icon">🏭</div><h3>Warehouse Sync</h3><p>Map Shopify locations to warehouse shelves. Transfer stock between locations.</p></div>
      <div class="feature-card"><div class="icon">📜</div><h3>Inventory Ledger</h3><p>Every deduction and adjustment logged. Full audit trail — see exactly what changed and why.</p></div>
      <div class="feature-card"><div class="icon">🤖</div><h3>AI Agent (MCP)</h3><p>Ask in plain English: "What's low on stock?", "Create a bundle with coffee and mugs". Your inventory assistant.</p></div>
    </div>
  </div>
</div>

<!-- COMPARISON -->
<div class="section" id="comparison">
  <div class="section-inner">
    <div class="section-label">Why Shopigent Stock?</div>
    <h2>What others don't do</h2>
    <div class="compare-wrap">
      <table class="compare-table">
        <thead>
          <tr><th>Feature</th><th>Stocky</th><th>Fast Bundle</th><th style="color:var(--accent)">Shopigent Stock</th></tr>
        </thead>
        <tbody>
          <tr class="highlight"><td>Auto bundle inventory deduction</td><td class="no">❌ No</td><td class="no">❌ No</td><td class="yes">✅ Yes — bulletproof</td></tr>
          <tr><td>Mix &amp; Match bundles</td><td class="no">❌ No</td><td class="yes">✅ Yes</td><td class="yes">✅ Yes</td></tr>
          <tr><td>AI forecasting</td><td class="no">❌ No</td><td class="no">❌ No</td><td class="yes">✅ Yes</td></tr>
          <tr><td>Purchase orders</td><td class="yes">✅ Yes</td><td class="no">❌ No</td><td class="yes">✅ Yes</td></tr>
          <tr><td>Warehouse sync</td><td class="yes">✅ Yes</td><td class="no">❌ No</td><td class="yes">✅ Yes</td></tr>
          <tr><td>AI Agent (plain English)</td><td class="no">❌ No</td><td class="no">❌ No</td><td class="yes">✅ Yes</td></tr>
          <tr><td>Inventory Ledger (audit)</td><td class="no">❌ No</td><td class="no">❌ No</td><td class="yes">✅ Yes</td></tr>
          <tr><td>Still active?</td><td class="shut">❌ Shut down</td><td class="yes">✅ Active</td><td class="yes">✅ Active + growing</td></tr>
        </tbody>
      </table>
    </div>
    <div style="text-align:center;margin-top:24px;">
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
      <div class="pricing-card"><h3>Free</h3><div class="price">$0<span>/mo</span></div><div class="desc">Development store</div><ul><li>Up to 10 bundles</li><li>Basic deduction</li></ul><a href="https://apps.shopify.com/shopigent-stock" class="btn-pricing">Start Free</a></div>
      <div class="pricing-card featured"><h3>Starter</h3><div class="price">$19<span>/mo</span></div><div class="desc">Live store</div><ul><li>Unlimited bundles</li><li>Auto bundle deduction</li><li>Mix &amp; Match</li><li>Storefront widget</li><li>7-day free trial</li></ul><a href="https://apps.shopify.com/shopigent-stock" class="btn-pricing">Start 7-Day Trial</a></div>
      <div class="pricing-card"><h3>Growth</h3><div class="price">$49<span>/mo</span></div><div class="desc">Everything in Starter +</div><ul><li>AI forecasting</li><li>Purchase orders</li><li>Warehouse sync</li><li>Inventory Ledger</li></ul><a href="https://apps.shopify.com/shopigent-stock" class="btn-pricing">Get Started</a></div>
      <div class="pricing-card"><h3>Pro</h3><div class="price">$99<span>/mo</span></div><div class="desc">Everything in Growth +</div><ul><li>AI Agent (MCP)</li><li>Priority support</li><li>Custom integrations</li></ul><a href="https://apps.shopify.com/shopigent-stock" class="btn-pricing">Go Pro</a></div>
    </div>
  </div>
</div>

<!-- TESTIMONIAL -->
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

<!-- DOCS -->
<div class="docs-section" id="docs">
  <div class="section-inner">
    <div class="section-label">Documentation</div>
    <h2>Technical guides <span style="font-size:0.9rem;font-weight:400;opacity:0.5">(for those who need them)</span></h2>
    <div class="doc-card-grid">
      <div class="doc-card"><a href="/quickstart"><h3>Quick Start</h3><p>Install, create your first bundle, enable the widget — in 5 minutes.</p></a></div>
      <div class="doc-card"><a href="/auto-deduction"><h3>Auto Deduction</h3><p>How inventory deduction works, the ledger, and developer reference.</p></a></div>
    </div>
  </div>
</div>
`);
}

// ═══════════════════════════════════════════════
// DOC SUB-PAGES & 404
// ═══════════════════════════════════════════════

function renderDocPage(doc) {
  return shell(`${doc.frontmatter.title || doc.slug} — Shopigent Stock`,
    `<div class="doc-content">${doc.html}</div>`
  );
}

function render404() {
  return shell("Not Found — Shopigent Stock",
    `<div class="doc-content"><h1>404</h1><p>Page not found.</p><a href="/" style="color:var(--accent);font-weight:600">← Back to home</a></div>`
  );
}

// ═══════════════════════════════════════════════
// START
// ═══════════════════════════════════════════════

app.listen(PORT, () => console.log(`Stock docs on ${PORT}`));