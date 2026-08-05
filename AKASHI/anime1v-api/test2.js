const axios = require('axios');
const cheerio = require('cheerio');
const headers = { 
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36', 
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8', 
  'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8' 
};
axios.get('https://animeflv.net/ver/tensei-shitara-slime-datta-ken-4th-season-1', { headers })
  .then(r => { 
    const html = r.data; 
    const $ = cheerio.load(html); 
    $('script[src]').each((i, el) => { 
      console.log($(el).attr('src'));
    });
    // Check if there are AJAX endpoints in the text
    console.log("Has ajax? ", html.includes('$.ajax'));
    console.log("Has fetch? ", html.includes('fetch('));
  });
