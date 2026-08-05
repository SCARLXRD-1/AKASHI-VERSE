const axios = require('axios');
const cheerio = require('cheerio');
axios.get('https://www3.animeflv.net/browse?q=slime').then(r => {
  const $ = cheerio.load(r.data);
  console.log($('.ListAnimes li article').first().html());
});
