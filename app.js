const fetch = require('node-fetch');

module.exports = async (req, res) => {
  const { checkin, checkout, adults, child } = req.query;

  try {
    const searchUrl = `https://hotelscan.com/combiner?pos=zz&locale=en&checkin=${checkin}&checkout=${checkout}&rooms=${adults}${child ? child : ''}&mobile=0&loop=3&country=MV&ef=1&geoid=xmmmamtksdxx&toas=hotel%2Cbed_and_breakfast%2Cguest_house%2Cresort&deviceNetwork=4g&deviceCpu=20&deviceMemory=8&limit=25&offset=0z`;

    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    res.status(200).json(data);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error});
  }
};