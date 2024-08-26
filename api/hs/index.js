const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium-min");

export const maxDuration = 30;

module.exports = async (req, res) => {
  let browser;
  const { checkin, checkout, adults, child } = req.query;

  chromium.setHeadlessMode = true;

  const executablePath = await chromium.executablePath(
    `https://github.com/Sparticuz/chromium/releases/download/v116.0.0/chromium-v116.0.0-pack.tar`
  );

  try {
    browser = await puppeteer.launch({
      args: [...chromium.args, "--hide-scrollbars", "--disable-web-security"],
      executablePath: executablePath,
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();

    // Your scraping logic here
    const searchUrl = `https://hotelscan.com/combiner?pos=zz&locale=en&checkin=${checkin}&checkout=${checkout}&rooms=${adults}${
      child ? child : ""
    }&mobile=0&loop=3&country=MV&ef=1&geoid=xmmmamtksdxx&toas=hotel%2Cbed_and_breakfast%2Cguest_house%2Cresort&deviceNetwork=4g&deviceCpu=20&deviceMemory=8&limit=25&offset=0z`;
    await page.goto(searchUrl, { waitUntil: "networkidle2" });

    const json = await page.evaluate(() => document.body.textContent);
    res.status(200).json(JSON.parse(json));
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};
