const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const chromium = require('@sparticuz/chromium');

async function run() {
  const browser = await puppeteer.launch({ 
    headless: true, 
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: process.platform === 'win32' ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' : await chromium.executablePath()
  });
  const page = await browser.newPage();
  
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('api') || url.includes('video') || url.includes('server')) {
      console.log('API Request:', url);
    }
  });

  await page.goto('https://animeflv.net/ver/tensei-shitara-slime-datta-ken-4th-season-1', { waitUntil: 'networkidle2' });
  
  const content = await page.content();
  console.log("videos var exists in DOM?", content.includes('var videos'));
  console.log("MEGA links?", content.includes('mega.nz'));
  
  await browser.close();
}

run().catch(console.error);
