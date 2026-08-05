const animeav1Service = require('./src/services/animeav1.service');

async function test() {
  try {
    console.log('Testing popular search...');
    const result = await animeav1Service.searchAnime('', 'animeav1.com', { order: 'popular' });
    console.log('Success:', result.success);
    console.log('Count:', result.data.results.length);
    if (result.data.results.length > 0) {
      console.log('First result:', result.data.results[0].title);
    } else {
      console.log('Results are empty!');
    }
  } catch (err) {
    console.error('Test failed:', err);
  }
}

test();
