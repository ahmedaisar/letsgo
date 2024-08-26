const puppeteer = require("puppeteer-core");
const pup = require("puppeteer");
const chrome = require("@sparticuz/chromium-min");

async function scrapeHotelData(page, checkin, checkout, adults, child) {
  // Construct the search URL
  const searchUrl = `https://hotelscan.com/en/search?geoid=x5p4hmhw6iot&checkin=${checkin}&checkout=${checkput}&rooms=${adults}${child}`;

  await page.goto(searchUrl, { waitUntil: "domcontentloaded" });

  await page.goto(
    `https://hotelscan.com/combiner?pos=zz&locale=en&checkin=${checkin}&checkout=${checkout}&rooms=${adults}${
      child ? child : ""
    }&mobile=0&loop=3&country=MV&ef=1&geoid=xmmmamtksdxx&toas=hotel%2Cbed_and_breakfast%2Cguest_house%2Cresort&deviceNetwork=4g&deviceCpu=20&deviceMemory=8&limit=25&offset=0z`,
    { waitUntil: "networkidle0" }
  );

  let body = await page.waitForSelector("body");
  let json = await body?.evaluate((el) => el.textContent);

  return json;
}

module.exports = async (req, res) => {
  let browser;
  const { checkin, checkout, adults, child } = req.query;

  try {
    const executablePath = await chrome.executablePath(
      `https://github.com/Sparticuz/chromium/releases/download/v123.0.1/chromium-v123.0.1-pack.tar`
    );

    browser = await puppeteer.launch({
      args: [
        // Example additional command line arguments
        "--disable-software-rasterizer", // Disable the software rasterizer
        "--disable-infobars", // Disable the yellow infobar that appears on the top of the browser
        "--disable-dev-shm-usage", // Disable /dev/shm usage (for systems with low shared memory)
        "--no-sandbox", // Disable the sandbox for running in containerized environments
        "--no-experiments",
        "--disable-client-side-phishing-detection",
        "--disable-sync",
        "--disable-extensions"        
      ],
      executablePath: executablePath,
      headless: false,
      ignoreHTTPSErrors: true,
      dumpio: true,
    });

    const page = await browser.newPage();
    await page.emulate(puppeteer.devices["iPhone 14 Pro Max"]);

    //await page.setUserAgent(ua);

    await page.setRequestInterception(true);

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
    );

    await page.on("request", async (request) => {
      if (
        request.resourceType() === "image" ||
        request.resourceType() === "media" ||
        request.resourceType() === "font"
      ) {
        request.abort();
      } else {
        request.continue();
      }
    });

    const hotels = await scrapeHotelData(
      page,
      checkin,
      checkout,
      adults,
      child
    );

    res.status(200).json(hotels);

    await browser.close();
  } catch (error) {
    console.log(error);
    res.statusCode = 500;
    res.send({ error });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};
