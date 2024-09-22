const puppeteer = require("puppeteer-core");
const chrome = require("@sparticuz/chromium-min");

// export const maxDuration = 30;

const express = require("express");
const app = express();
const port = 3000;

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

    const xhrUrl = `https://hotelscan.com/combiner?pos=zz&locale=en&checkin=${checkin}&checkout=${checkout}&rooms=${adults}${child ? child : ""}&mobile=1&loop=1&country=MV&ef=1&geoid=x5p4hmhw6iot&availability=1&deviceNetwork=4g&deviceCpu=20&deviceMemory=8&limit=25&offset=${offset}`;

    await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: "3000" });

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

    const xhrUrl = `https://hotelscan.com/combiner/${hotelid}?pos=zz&locale=en&checkin=${checkin}&checkout=${checkout}&country=MV&rooms=${adults}${child ? child:''}&mobile=1&loop=2&country=MV&ef=1&geoid=x5p4hmhw6iot&deviceNetwork=4g&deviceCpu=20&deviceMemory=8&limit=25&offset=0`;

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

app.get("/api/maldives/hotels", async (req, res) => {
  try {
    const { checkin, checkout, adults, child } = req.query;

    // Construct the URL dynamically as before
    const url = `https://hotelscan.com/combiner?pos=zz&locale=en&checkin=${checkin}&checkout=${checkout}&rooms=${adults}${
      child ? child : ""
    }&mobile=1&loop=1&availability=1&country=MV&ef=1&geoid=x5p4hmhw6iot&toas=hotel%2Cbed_and_breakfast%2Cguest_house%2Cresort&deviceNetwork=4g&deviceCpu=20&deviceMemory=8&limit=25&offset=0`;

    // Function to scrape hotels and check if offers exist in the first record
    const getHotelsData = async () => {
      const hotels = await scrapeHotelsData(checkin, checkout, adults, child);
      
      // Check if the first record has offers
      if (hotels?.data?.records[0]?.offers?.length > 0) {
        return hotels;
      } 
      return null;
    };

    // First scrape attempt
    let hotels = await getHotelsData();

    // Rescrape if no offers are found in the first record
    if (!hotels) {
      console.log("No offers found in the first hotel record, rescraping...");
      hotels = await getHotelsData();
    }

    // Send the result back
    if (hotels) {
      res.json(hotels);  // Return hotels data with valid offers
    } else {
      res.status(404).json({ message: "No offers found after rescraping" });
    }

  } catch (error) {
    // Handle errors
    console.error("Error fetching hotels data:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

app.get("/api/maldives/hotel", async (req, res) => {
  try {
    const { hotelid, checkin, checkout, adults, child } = req.query;
    
    // Function to scrape hotel data and return the response if offers exist
    const getHotelData = async () => {
      const hotel = await scrapeHotelData(hotelid, checkin, checkout, adults, child);
      if (hotel?.data?.records[0]?.offers?.length > 0) {
        return hotel;
      } 
      return null;
    };

    // First scrape attempt
    let hotel = await getHotelData();

    // Rescrape if no offers are found
    if (!hotel) {
      console.log("No offers found, rescraping...");
      hotel = await getHotelData();
    }

    if (hotel) {
      res.json(hotel);  // Return hotel data with offers
    } else {
      res.status(404).json({ message: "No offers found after rescraping" });
    }

  } catch (error) {
    // Handle errors
    console.error("Error fetching hotel data:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }

});


app.get("/", async (req, res) => {
  res.send("hello");
});

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});

 