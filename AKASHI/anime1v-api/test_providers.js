const axios = require('axios');
async function run() {
  const providers = ['animeav1', 'animeflv', 'tioanime', 'hentaila', 'jkanime', 'monoschinos'];
  for (const p of providers) {
    try {
      const { data } = await axios.get(`http://localhost:3000/api/v1/anime/search?domain=${p}&q=slime`);
      const r = data.data.results[0];
      if (r) {
        console.log(p, '-> score:', r.score, 'status:', r.status);
      } else {
        console.log(p, '-> no results');
      }
    } catch(e) {
      console.log(p, '-> error');
    }
  }
}
run();
