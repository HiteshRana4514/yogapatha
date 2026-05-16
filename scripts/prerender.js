import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_PATH = path.join(__dirname, '../dist');

async function prerender() {
  if (!fs.existsSync('./routes.json')) {
    console.error('routes.json not found. Run generate-routes.js first.');
    process.exit(1);
  }

  const routes = JSON.parse(fs.readFileSync('./routes.json', 'utf-8'));
  console.log(`🚀 Starting prerender for ${routes.length} routes...`);

  // Start local server to serve the build folder
  // Port 8085 to avoid conflicts (5432 is often used by databases)
  const server = spawn('npx', ['http-server', DIST_PATH, '-p', '8085', '--proxy', 'http://localhost:8085?'], {
    shell: true
  });

  server.stdout.on('data', (data) => {
    // console.log(`Server: ${data}`);
  });

  // Wait for server to be ready
  await new Promise(resolve => setTimeout(resolve, 5000));

  const browser = await puppeteer.launch({ 
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  for (const route of routes) {
    const url = `http://localhost:8085${route}`;
    console.log(`📄 Prerendering: ${route}`);
    
    try {
      // Visit page
      await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
      
      // Wait for the app to signal readiness
      await page.evaluate(() => {
        return new Promise((resolve) => {
          if (window.prerenderReady) return resolve();
          window.addEventListener('render-event', resolve);
          setTimeout(resolve, 8000); // Increased safety timeout
        });
      });

      const content = await page.content();
      
      // Post-process to fix localhost URLs and production domain
      const processedContent = content
        .replace(/http:\/\/localhost:8085/g, 'https://www.yogapatha.in')
        .replace(/https:\/\/www.yogapatha.in\/\//g, 'https://www.yogapatha.in/');

      // Calculate output path
      const outputDir = route === '/' ? DIST_PATH : path.join(DIST_PATH, route);
      
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      const outputPath = path.join(outputDir, 'index.html');
      fs.writeFileSync(outputPath, processedContent);
      console.log(`✅ Saved: ${route}`);
      
    } catch (err) {
      console.error(`❌ Failed to prerender ${route}:`, err.message);
    }
  }

  console.log('✅ All routes processed.');
  
  await browser.close();
  server.kill('SIGINT');
  process.exit(0);
}

prerender().catch(err => {
  console.error('Prerender fatal error:', err);
  process.exit(1);
});
