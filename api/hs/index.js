// const puppeteer = require("puppeteer-core");
// const chrome = require("@sparticuz/chromium-min");
// export const maxDuration = 30
 
 
// async function scrapeHotelData(page, checkin, checkout, adults, child) {
//    // Construct the search URL
//   const searchUrl = `https://hotelscan.com/en/search?geoid=x5p4hmhw6iot&checkin=${checkin}&checkout=${checkout}&rooms=${adults}${child ? child : ''}`;
//   await page.goto(searchUrl, { waitUntil: "domcontentloaded" })
//   await page.waitForSelector('body');

//   await page.goto(`https://hotelscan.com/combiner?pos=zz&locale=en&checkin=${checkin}&checkout=${checkout}&rooms=${adults}${child ? child : ''}&mobile=0&loop=3&country=MV&ef=1&geoid=xmmmamtksdxx&toas=hotel%2Cbed_and_breakfast%2Cguest_house%2Cresort&deviceNetwork=4g&deviceCpu=20&deviceMemory=8&limit=25&offset=0z`, { waitUntil: 'networkidle2' })
//   const body = await page.waitForSelector('body');
  
//   let json = await body?.evaluate(el => el.textContent);

//   return json

// }

 
// module.exports = async (req, res) => {
//   let browser;
//   const { checkin, checkout, adults, child } = req.query;
 
//   try {
//     const executablePath = await chrome.executablePath(
//       `https://github.com/Sparticuz/chromium/releases/download/v117.0.0/chromium-v117.0.0-pack.tar`
//     );

//     browser = await puppeteer.launch({
//       args: [...chrome.args, '--hide-scrollbars', '--disable-web-security'],
//       defaultViewport: chrome.defaultViewport,
//       executablePath: executablePath,      
//       headless: chrome.headless,
//       ignoreHTTPSErrors: true,
//       dumpio: true
//     });

//     const page = await browser.newPage();

//     //await page.setUserAgent(ua);

//     await page.setRequestInterception(true);

//     await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36')

//     await page.on("request", async (request) => {
//       if (
//         request.resourceType() === "image" ||
//         request.resourceType() === "media" ||
//         request.resourceType() === "font"
//       ) {
//         request.abort();
//       } else {
//         request.continue();
//       }
//     });


//     const hotels = await scrapeHotelData(page, checkin, checkout, adults, child);
 
//     res.status(200).json(hotels);
//   } catch (error) {
//     console.log(error);
//     res.status(500).json(error);
//   } finally {
//     if (browser) {
//       await browser.close();
//     }
//   }
// };