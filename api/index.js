const puppeteer = require("puppeteer-core");
const chrome = require("@sparticuz/chromium-min");
// export const maxDuration = 30;

const express = require("express");
const app = express();
const port = 3000;

async function scrapeHotelData(checkin, checkout, adults, child) {
    
  let browser
  let json

  try {
    const executablePath = await chrome.executablePath(
      `https://github.com/Sparticuz/chromium/releases/download/v123.0.0/chromium-v123.0.0-pack.tar`
    );

    browser = await puppeteer.launch({
      args: [...chrome.args, "--hide-scrollbars", "--disable-web-security", "--no-sandbox"],
      defaultViewport: {
        width: 375,
        height: 667,
        isMobile: true,
      },
      executablePath: executablePath,
      headless: true,
      ignoreHTTPSErrors: true,
      dumpio: true,
    });

    const page = await browser.newPage();


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

    const searchUrl = `https://hotelscan.com/en/search?geoid=x5p4hmhw6iot&checkin=${checkin}&checkout=${checkout}&rooms=${adults}${child ? child : ""}&toas=hotel,resort,guest_house&stars=5,4,3`

    await page.goto(searchUrl, { waitUntil: "load" });

    await page.goto(
      `https://hotelscan.com/combiner?pos=zz&locale=en&checkin=${checkin}&checkout=${checkout}&rooms=${adults}${child ? child : ""}&mobile=0&loop=3&country=MV&ef=1&geoid=xmmmamtksdxx&toas=hotel%2Cbed_and_breakfast%2Cguest_house%2Cresort&deviceNetwork=4g&deviceCpu=20&deviceMemory=8&limit=25&offset=0`,
      { waitUntil: "networkidle0" }
    );

    // await page.on("response", async (response) => {
    //   if (
    //     response.url().includes('https://hotelscan.com/combiner')
    //   ) {
    //     console.log("received, awaiting log...");
    //     data = await response.json();
    //   }
    // });
    const body = await page.waitForSelector("body");

    let json = await body?.evaluate((el) => el.textContent);

    return json;
    
  } catch (error) {
    console.log(error);    
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

app.get("/api/hotels", async (req, res) => {

  const { checkin, checkout, adults, child } = req.query;

  const hotels = await scrapeHotelData(
    checkin,
    checkout,
    adults,
    child
  );

  res.json(hotels);
});

app.get("/", async (req, res) => { res.send("hello")})

app.listen(port, () => {
  console.log(`App listening on port ${port}`)
})

// module.exports = async (req, res) => {
//   let browser;
//   const { checkin, checkout, adults, child } = req.query;
// };
