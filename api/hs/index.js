const puppeteer = require("puppeteer-core");
const chrome = require("@sparticuz/chromium-min");

export const maxDuration = 30
 
 
module.exports = async (req, res) => {
  let browser = null;
  const { checkin, checkout, adults, child } = req.query;

  const executablePath = await chrome.executablePath(
    `https://github.com/Sparticuz/chromium/releases/download/v123.0.1/chromium-v123.0.1-pack.tar`
  );

  try {
    browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: chrome.defaultViewport,
      executablePath: executablePath,
      headless: true,
    });

    const page = await browser.newPage();
    await page.setRequestInterception(true);
    await page.on('request', (request) => {
      if (['image', 'stylesheet', 'font'].includes(request.resourceType())) {
        request.abort();
      } else {
        request.continue();
      }
    });

    // Your scraping logic here
    const searchUrl = `https://hotelscan.com/combiner?pos=zz&locale=en&checkin=${checkin}&checkout=${checkout}&rooms=${adults}${child ? child : ''}&mobile=0&loop=3&country=MV&ef=1&geoid=xmmmamtksdxx&toas=hotel%2Cbed_and_breakfast%2Cguest_house%2Cresort&deviceNetwork=4g&deviceCpu=20&deviceMemory=8&limit=25&offset=0z`;
    await page.goto(searchUrl, { waitUntil: 'networkidle2' });

    const json = await page.evaluate(() => document.body.textContent);

    res.status(200).json(JSON.parse(json));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error});
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }
};