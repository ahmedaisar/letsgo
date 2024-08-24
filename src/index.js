const fastify = require('fastify')({ logger: true });
const puppeteer = require('puppeteer-core');
const chrome = require('@sparticuz/chromium');

// WebSocket plugin
fastify.register(require('@fastify/websocket'));

// Configure Chromium
chrome.setHeadlessMode = true;
chrome.setGraphicsMode = false;

// Login function (unchanged)
async function loginToWebsite(page) {
  await page.goto('https://agent.letsgomaldives.com/login/', { waitUntil: 'networkidle0' });

  // Wait for the CSRF token to be available
  await page.waitForSelector('input[name="csrfmiddlewaretoken"]');

  // Get the CSRF token
  const csrfToken = await page.$eval('input[name="csrfmiddlewaretoken"]', el => el.value);

  // Fill in the login form
  await page.type('input[name="useremail"]', 'aiman@bubbleholidays.co');
  await page.type('input[name="userpassword"]', '123QWEasd!');

  // Submit the form
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle0' }),
    page.evaluate((csrfToken) => {
      const form = document.querySelector('form');
      const csrfInput = document.createElement('input');
      csrfInput.type = 'hidden';
      csrfInput.name = 'csrfmiddlewaretoken';
      csrfInput.value = csrfToken;
      form.appendChild(csrfInput);
      form.submit();
    }, csrfToken)
  ]);

  // Check if login was successful
  const url = page.url();
  if (url.includes('login')) {
    throw new Error('Login failed');
  }
}

// Search function (unchanged)
async function performSearch(page) {
  await page.goto('https://agent.letsgomaldives.com/hotel-search/', { waitUntil: 'networkidle0' });

  // Wait for the CSRF token to be available
  await page.waitForSelector('input[name="csrfmiddlewaretoken"]');

  // Get the CSRF token
  const csrfToken = await page.$eval('input[name="csrfmiddlewaretoken"]', el => el.value);

  // Construct the search URL
  const searchUrl = `https://agent.letsgomaldives.com/hotel-search/?csrfmiddlewaretoken=${csrfToken}&request_with=&request_value=&resort_slug=&country_slug=&features=&stars=&price_from=&price_to=&currency=USD&rate_code=7ZV5P&part_number=1&search_type=&travellers_ages=25-25&main_country_id=&hotel_ids=&resort_ids=&feature_ids=&stars_ids=&meal_plan=&hotel_sort=&hotel_limit=&hotels_list_view=&fast=&destination=&date_start=07.09.2024&date_end=14.09.2024&adults=2&childs=0&guests=ST&nationality=228&any_resort=on&any_star=on&any_hotel=on`;

  // Navigate to the search URL
  await page.goto(searchUrl, { waitUntil: 'networkidle0' });
}

// Scrape function (unchanged)
async function scrapeHotelData(page) {
  return await page.evaluate(() => {
    const hotels = [];
    const rows = document.querySelectorAll('.hotel-list-item-wrapper');

    rows.forEach(row => {
      const hotel = {
        checkIn: row.querySelector('td:nth-child(1)').textContent.trim(),
        nights: row.querySelector('td:nth-child(2)').textContent.trim(),
        name: row.querySelector('.hotel-card__title-link-td-name').textContent.trim(),
        location: row.querySelector('.hotel-card__location-link--resort').textContent.trim(),
        roomType: row.querySelector('td:nth-child(4)').textContent.trim(),
        mealPlan: row.querySelector('td:nth-child(5)').textContent.trim(),
        availability: row.querySelector('td:nth-child(6)').textContent.trim(),
        price: row.querySelector('.hotel-card__price').textContent.trim(),
        currency: row.querySelector('.hotel-card__price-currency').textContent.trim()
      };
      hotels.push(hotel);
    });

    return hotels;
  });
}

// WebSocket route for scraping
fastify.get('/scrape', { websocket: true }, (connection, req) => {
  connection.socket.on('message', async (message) => {
    try {
      const browser = await puppeteer.launch({
        args: chrome.args,
        defaultViewport: chrome.defaultViewport,
        executablePath: await chrome.executablePath(),
        headless: chrome.headless,
        ignoreHTTPSErrors: true,
      });
      const page = await browser.newPage();      
      await loginToWebsite(page);
      await page.waitForSelector('.content-container-wrapper', { timeout: 30000 });
      await performSearch(page);      
      await page.waitForSelector('.hotel-list-item-wrapper', { timeout: 30000 });
      const hotelData = await scrapeHotelData(page);

      connection.socket.send(JSON.stringify(hotelData));
      await browser.close();
    } catch (error) {
      connection.socket.send(JSON.stringify({ error: error.message }));
    }
  });
});

// Start the server
const start = async () => {
  try {
    await fastify.listen({ port: process.env.PORT || 3000, host: '0.0.0.0' });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();

module.exports = fastify;