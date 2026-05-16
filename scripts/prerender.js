import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_PATH = path.join(__dirname, '../dist');

async function injectMetaTags() {
  if (!fs.existsSync('./routes.json')) {
    console.error('routes.json not found. Run generate-routes.js first.');
    process.exit(1);
  }

  const routes = JSON.parse(fs.readFileSync('./routes.json', 'utf-8'));
  console.log(`🚀 Injecting meta tags into ${routes.length} routes...`);

  // We read the base index.html that Vite just built
  const baseIndexPath = path.join(DIST_PATH, 'index.html');
  if (!fs.existsSync(baseIndexPath)) {
    console.error('dist/index.html not found. Make sure "vite build" runs before this script.');
    process.exit(1);
  }
  
  const baseHtml = fs.readFileSync(baseIndexPath, 'utf-8');

  for (const routeObj of routes) {
    const { route, meta } = routeObj;
    console.log(`📄 Processing: ${route}`);
    
    try {
      const url = `https://www.yogapatha.in${route === '/' ? '' : route}`;
      
      // We do a simple string replacement for the meta tags
      let newHtml = baseHtml;
      
      // First, completely remove the basic head elements we want to replace to avoid duplicates
      newHtml = newHtml.replace(/<title>.*?<\/title>/g, '');
      newHtml = newHtml.replace(/<meta name="description" content=".*?"\s*\/>/g, '');
      
      // We will inject our new meta tags right before the closing </head>
      const metaTags = `
        <title>${meta.title}</title>
        <meta name="description" content="${meta.description?.replace(/"/g, '&quot;')}" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="${url}" />
        <meta property="og:title" content="${meta.title?.replace(/"/g, '&quot;')}" />
        <meta property="og:description" content="${meta.description?.replace(/"/g, '&quot;')}" />
        <meta property="og:image" content="${meta.image}" />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="${url}" />
        <meta name="twitter:title" content="${meta.title?.replace(/"/g, '&quot;')}" />
        <meta name="twitter:description" content="${meta.description?.replace(/"/g, '&quot;')}" />
        <meta name="twitter:image" content="${meta.image}" />
        
        <link rel="canonical" href="${url}" />
      `;

      newHtml = newHtml.replace('</head>', `${metaTags}\n</head>`);
      
      // Calculate output path
      const outputDir = route === '/' ? DIST_PATH : path.join(DIST_PATH, route);
      
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      const outputPath = path.join(outputDir, 'index.html');
      fs.writeFileSync(outputPath, newHtml);
      console.log(`✅ Saved: ${route}`);
      
    } catch (err) {
      console.error(`❌ Failed to process ${route}:`, err.message);
    }
  }

  console.log('✅ All routes processed successfully.');
  process.exit(0);
}

injectMetaTags().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
