const puppeteer = require("puppeteer-core");
const chrome = require("@sparticuz/chromium-min");
export const maxDuration = 60;
 
 
async function scrapeHotelData(page, checkin, checkout, adults = 2, child = 0) {
   // Construct the search URL
  const searchUrl = `https://hotelscan.com/en`;


  await Promise.all([
    page.goto(searchUrl, { waitUntil: "domcontentloaded" }),
    page.goto(`https://hotelscan.com/combiner?pos=zz&locale=en&checkin=${checkin}&checkout=${checkout}&rooms=${adults}${child ? child : ''}&mobile=0&loop=3&country=MV&ef=1&geoid=xmmmamtksdxx&toas=hotel%2Cbed_and_breakfast%2Cguest_house%2Cresort&deviceNetwork=4g&deviceCpu=20&deviceMemory=8&limit=25&offset=0z`, { waitUntil: 'networkidle2' })
  ])

  let body = await page.waitForSelector('body');
  let json = await body?.evaluate(el => el.textContent);

  return json

}

 
module.exports = async (req, res) => {
  let browser;
  const checkin = req.params['checkin'] 
  const checkout = req.params['checkout'] 
  const adults = req.params['adults'] 
  const child = req.params['child'] 

  try {
    const executablePath = await chrome.executablePath(
      `https://github.com/Sparticuz/chromium/releases/download/v123.0.1/chromium-v123.0.1-pack.tar`
    );

    browser = await puppeteer.launch({
      args: [
        ...chrome.args,
        '--hide-scrollbars', 
        '--disable-web-security',
      ],
      executablePath: executablePath,
      headless: true,
      ignoreHTTPSErrors: true,
      dumpio: true
    });

    const page = await browser.newPage();

    const ua = await page.evaluate("navigator.userAgent");

    await page.setUserAgent(ua);

    await page.setRequestInterception(true);

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


    const hotels = await scrapeHotelData(page, checkin, checkout, adults, child);

    console.log(JSON.stringify(hotels, null, 2));
    res.status(200).json(data);
  } catch (error) {
    console.log(error);
    res.statusCode = 500;
    res.json({
      body: "Sorry, Something went wrong!",
    });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};
