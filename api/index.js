const puppeteer = require("puppeteer-core");
const chrome = require("@sparticuz/chromium-min");

// export const maxDuration = 30;

const express = require("express");
const app = express();
const port = 3000;

async function scrapeHotelData(checkin, checkout, adults, child) {
  let browser;

  try {
    const executablePath = await chrome.executablePath(
      `https://github.com/Sparticuz/chromium/releases/download/v123.0.0/chromium-v123.0.0-pack.tar`
    );

    browser = await puppeteer.launch({
      args: [
        ...chrome.args,
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

    const searchUrl = `https://hotelscan.com/en/search?geoid=x5p4hmhw6iot&checkin=${checkin}&checkout=${checkout}&rooms=${adults}${
      child ? child : ""
    }&toas=hotel,resort,guest_house&stars=5,4,3`;

    await page.goto(searchUrl, { waitUntil: "load" });

    await page.goto(
      `https://hotelscan.com/combiner?pos=zz&locale=en&checkin=${checkin}&checkout=${checkout}&rooms=${adults}${
        child ? child : ""
      }&mobile=1&loop=10&availability=1&country=MV&ef=1&geoid=x5p4hmhw6iot&toas=hotel%2Cbed_and_breakfast%2Cguest_house%2Cresort&deviceNetwork=4g&deviceCpu=20&deviceMemory=8&limit=25&offset=0`,
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

  const url = `https://hotelscan.com/combiner?pos=zz&locale=en&checkin=${checkin}&checkout=${checkout}&rooms=${adults}${
    child ? child : ""
  }&mobile=1&loop=10&availability=1&country=MV&ef=1&geoid=x5p4hmhw6iot&toas=hotel%2Cbed_and_breakfast%2Cguest_house%2Cresort&deviceNetwork=4g&deviceCpu=20&deviceMemory=8&limit=25&offset=0`;

  const hotels = await scrapeHotelData(checkin, checkout, adults, child);

  console.log(url);

  res.json(JSON.parse(hotels));
});

async function login(page) {
  // Login
  await page.goto("https://agent.letsgomaldives.com/login-page/", {
    waitUntil: "networkidle2",
  });
  await page.waitForSelector('input[name="useremail"]');
  await page.$eval(
    'input[name="useremail"]',
    (el) => (el.value = "aiman@bubbleholidays.co")
  );
  await page.$eval(
    'input[name="userpassword"]',
    (el) => (el.value = "123QWEasd!")
  );
  await Promise.all([
    page.$eval('button[type="submit"]', (el) => el.click()),
    page.waitForNavigation({ waitUntil: "networkidle2" }),
  ]);
}

async function performSearch(page) {
  // Wait for the CSRF token to be available
  await page.waitForSelector('input[name="csrfmiddlewaretoken"]');

  // Get the CSRF token
  const csrfToken = await page.$eval(
    'input[name="csrfmiddlewaretoken"]',
    (el) => el.value
  );

  // Construct the search URL
  const searchUrl = `https://agent.letsgomaldives.com/hotel-search/?csrfmiddlewaretoken=${csrfToken}&request_with=country_id&request_value=228&resort_slug=&country_slug=&features=&stars=5%7C4&price_from=&price_to=&currency=USD&rate_code=7ZV5P&part_number=1&search_type=&travellers_ages=25-25&main_country_id=&hotel_ids=&resort_ids=&feature_ids=&stars_ids=5%2C4&meal_plan=&hotel_sort=&hotel_limit=&hotels_list_view=&fast=&destination=Maldives&date_start=16.10.2024&date_end=19.10.2024&adults=2&childs=0&guests=ST&nationality=413&any_resort=on&any_hotel=on`;

  await Promise.all([
    page.goto(searchUrl, { waitUntil: "domcontentloaded" }),
    page.waitForNavigation({ waitUntil: "domcontentloaded" }),
  ]);
}

async function scrapeLetsgoData(itemCount = 10) {
  let browser;

  try {
    const executablePath = await chrome.executablePath(
      `https://github.com/Sparticuz/chromium/releases/download/v123.0.0/chromium-v123.0.0-pack.tar`
    );

    browser = await puppeteer.launch({
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

    await login(page);
    await performSearch(page);
    await page.waitForSelector(".hotel-list-item-wrapper");
    await page.waitForNavigation({ waitUntil: "domcontentloaded" })
    await page.evaluate((itemCount) => {
      return new Promise((resolve) => {
        const hotels = [];
        const rows = document.querySelectorAll(".hotel-list-item-wrapper");
        rows.forEach((row, index) => {
          if (
            index < itemCount &&
            !hotels.some(
              (h) =>
                h.name ===
                row
                  .querySelector(".hotel-card__title-link-td-name")
                  .textContent.trim()
            )
          ) {
            const hotel = {
              checkIn: row
                .querySelector("td:nth-child(1)")
                .textContent.trim(),
              nights: row.querySelector("td:nth-child(2)").textContent.trim(),
              name: row
                .querySelector(".hotel-card__title-link-td-name")
                .textContent.trim(),
              location: row
                .querySelector(".hotel-card__location-link--resort")
                .textContent.trim(),
              roomType: row
                .querySelector("td:nth-child(4)")
                .textContent.trim(),
              mealPlan: row
                .querySelector("td:nth-child(5)")
                .textContent.trim(),
              availability: row
                .querySelector("td:nth-child(6)")
                .textContent.trim(),
              price: row
                .querySelector(".hotel-card__price")
                .textContent.trim(),
              currency: row
                .querySelector(".hotel-card__price-currency")
                .textContent.trim(),
            };
            hotels.push(hotel);
          }
        });
        if (hotels.length >= itemCount) {
          resolve(hotels);
        }
      });
    }, itemCount);

    return hotels;
  } catch (error) {
    console.log(error);
    return error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

app.get("/api/lg", async (req, res) => {
  const data = await scrapeLetsgoData(10);

  res.status(200).json(JSON.parse(data));
});

app.get("/", async (req, res) => {
  res.send("hello");
});

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});

// module.exports = async (req, res) => {
//   let browser;
//   const { checkin, checkout, adults, child } = req.query;
// };
