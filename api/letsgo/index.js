const puppeteer = require('puppeteer-core');
const chrome = require('@sparticuz/chromium-min');


async function login(page){
  // Login
  await page.goto('https://agent.letsgomaldives.com/login-page/', { waitUntil: 'load' });
  await page.waitForSelector('input[name="useremail"]');
  await page.$eval('input[name="useremail"]', el => el.value = 'aiman@bubbleholidays.co');
  await page.$eval('input[name="userpassword"]', el => el.value = '123QWEasd!');
  await Promise.all([
    page.$eval('button[type="submit"]', el => el.click()),
    page.waitForNavigation({ waitUntil: 'domcontentloaded' })
  ]);

}

async function performSearch(page) {

  // Wait for the CSRF token to be available
  await page.waitForSelector('input[name="csrfmiddlewaretoken"]');

  // Get the CSRF token
  const csrfToken = await page.$eval('input[name="csrfmiddlewaretoken"]', el => el.value);

  // Construct the search URL
  const searchUrl = `https://agent.letsgomaldives.com/hotel-search/?csrfmiddlewaretoken=${csrfToken}&request_with=country_id&request_value=228&resort_slug=&country_slug=&features=&stars=5%7C4&price_from=&price_to=&currency=USD&rate_code=7ZV5P&part_number=1&search_type=&travellers_ages=25-25&main_country_id=&hotel_ids=&resort_ids=&feature_ids=&stars_ids=5%2C4&meal_plan=&hotel_sort=&hotel_limit=&hotels_list_view=&fast=&destination=Maldives&date_start=16.10.2024&date_end=19.10.2024&adults=2&childs=0&guests=ST&nationality=413&any_resort=on&any_hotel=on`;


  await Promise.all([
    page.goto(searchUrl, { waitUntil: 'domcontentloaded' }),
    page.waitForNavigation({ waitUntil: 'domcontentloaded' })
  ]);

}

async function scrapeHotelData(page, itemCount = 15) {
  return await page.evaluate((itemCount) => {
    return new Promise((resolve) => {
      const hotels = [];
      const intervalId = setInterval(() => {
        const rows = document.querySelectorAll('.hotel-list-item-wrapper');
        rows.forEach((row, index) => {
          if (index < itemCount && !hotels.some(h => h.name === row.querySelector('.hotel-card__title-link-td-name').textContent.trim())) {
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
          }
        });
        if (hotels.length >= itemCount) {
          clearInterval(intervalId);
          resolve(hotels);
        }
      }, 3000); // Check every second
    });
  }, itemCount);
}

async function scraper() {
  // const browser = await puppeteer.launch({    
  //   executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  //   headless: false,
  //   defaultViewport: null
  // });
  
}

(async () => {
  let browser

  try {
    const executablePath = await chrome.executablePath(
      `https://github.com/Sparticuz/chromium/releases/download/v123.0.1/chromium-v123.0.1-pack.tar`
     );
     
     browser = await puppeteer.launch({
       executablePath: executablePath,
       headless: false,
     });
       const page = await browser.newPage();
 
       const ua = await page.evaluate('navigator.userAgent');
 
       await page.setUserAgent(ua)
       
       await page.setRequestInterception(true)
 
       await page.on ( 'request', async request => {
           if ( request.resourceType () === 'image' || request.resourceType () === 'media' || request.resourceType () === 'font' ) {
               request.abort ()
           } else {
               request.continue ()
           }
       })
    
    await login(page)
    await performSearch(page)
    await page.waitForSelector('.hotel-list-item-wrapper');
    await scrapeHotelData(page, 10)
    const hotels = await scrapeHotelData(page);
    console.log(JSON.stringify(hotels, null, 2));
   
    return { success: true, message: 'Search completed', hotels };

  } catch (error) {
    console.error('Error:', error);
    return { success: false, message: error.message };
  } finally {
    await browser.close();
  }
})();