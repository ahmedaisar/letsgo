const puppeteer = require("puppeteer-core");
const chrome = require("@sparticuz/chromium-min");
const cors = require('cors');


// export const maxDuration = 30;

const express = require("express");
const app = express();
const port = 3000;

app.use(cors());

async function scrapeHotelsData(checkin, checkout, adults, child, offset = 0) {
  let browser;
  let hotels;

  try {
    const executablePath = await chrome.executablePath(
      `https://github.com/Sparticuz/chromium/releases/download/v123.0.0/chromium-v123.0.0-pack.tar`
    );

    browser = await puppeteer.launch({
      args: [
        ...chrome.args,
        "--user-agent=Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1",
        "--disable-gpu",
        "--disable-dev-shm-usage",
        "--disable-setuid-sandbox",
        "--no-first-run",
        "--no-sandbox",
        "--no-zygote",
      ],
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

    // const ua = await page.evaluate("navigator.userAgent");

    // await page.setUserAgent(ua);

    // await page.setUserAgent(
    //   "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
    // );

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

    const searchUrl = `https://hotelscan.com/en/search?geoid=x5p4hmhw6iot&checkin=${checkin}&checkout=${checkout}&rooms=${adults}${child ? child : ""}&toas=hotel,resort,guest_house&stars=5,4,3`;

    const xhrUrl = `https://hotelscan.com/combiner?pos=zz&locale=en&checkin=${checkin}&checkout=${checkout}&rooms=${adults}${child ? child : ""}&mobile=1&availability=1&country=MV&ef=1&geoid=x5p4hmhw6iot&toas=hotel%2Cresort%2Cguest_house&stars=5%2C4%2C3&deviceNetwork=4g&deviceCpu=20&deviceMemory=8&limit=25&offset=${offset}`;

    await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: "3000" });

    await page.goto(xhrUrl, { waitUntil: "networkidle0" });

    await page.goto(xhrUrl, { waitUntil: "networkidle0" });

    const body = await page.waitForSelector("body");

    hotels = await body?.evaluate((el) => el.textContent);

    return hotels;
  } catch (error) {
    console.log(error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

async function scrapeHotelData(hotelid, checkin, checkout, adults, child) {
  let browser;
  let hotels;

  try {
    const executablePath = await chrome.executablePath(
      `https://github.com/Sparticuz/chromium/releases/download/v123.0.0/chromium-v123.0.0-pack.tar`
    );

    browser = await puppeteer.launch({
      args: [
        ...chrome.args,
        "--user-agent=Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1",
        "--disable-gpu",
        "--disable-dev-shm-usage",
        "--disable-setuid-sandbox",
        "--no-first-run",
        "--no-sandbox",
        "--no-zygote",
      ],
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

    // const ua = await page.evaluate("navigator.userAgent");

    // await page.setUserAgent(ua);

    // await page.setUserAgent(
    //   "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
    // );

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

    const searchUrl = `https://hotelscan.com/en/search?geoid=x5p4hmhw6iot&checkin=${checkin}&checkout=${checkout}&rooms=${adults}${child ? child : ""}&toas=hotel,resort,guest_house&stars=5,4,3`;

    await page.goto(searchUrl, { waitUntil: "domcontentloaded" });

    const xhrUrl = `https://hotelscan.com/combiner/${hotelid}?pos=zz&locale=en&checkin=${checkin}&checkout=${checkout}&country=MV&rooms=${adults}${child ? child:''}&mobile=1&ef=1&availability=1&deviceNetwork=4g&deviceCpu=20&deviceMemory=8`;

    await page.goto(xhrUrl, { waitUntil: "networkidle0" });


    const body = await page.waitForSelector("body");

    hotels = await body?.evaluate((el) => el.textContent);

    return hotels;
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
  let hotels

  hotels = await scrapeHotelsData(checkin, checkout, adults, child);

  if (hotels?.data?.records[0]?.offers?.length > 0){
    return res.json(JSON.parse(hotels));
  }else{
    hotels = await scrapeHotelsData(checkin, checkout, adults, child);
  }
  
  res.json(JSON.parse(hotels));
});

app.get("/api/hotel", async (req, res) => {
  const { hotelid, checkin, checkout, adults, child } = req.query;
  let hotels

  hotels = await scrapeHotelData(hotelid, checkin, checkout, adults, child);

  if (hotels?.data?.records[0]?.offers?.length > 0){
    return res.json(JSON.parse(hotels));
  }else{
    hotels = await scrapeHotelData(hotelid, checkin, checkout, adults, child);
  }
  
  res.json(JSON.parse(hotels));
});



app.get("/", async (req, res) => {
  res.send("hello");
});

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});

 