const axios = require('axios');
const vm = require('vm');

function extractVarLiteral(text, varName) {
  const marker = `var ${varName}`;
  const startIndex = text.indexOf(marker);
  if (startIndex === -1) return null;
  
  let start = startIndex + marker.length;
  while (start < text.length && text[start] !== '=' && text[start] !== ' ' && text[start] !== '{' && text[start] !== '[') start++;
  while (start < text.length && (text[start] === ' ' || text[start] === '=')) start++;
  
  let openChar = text[start];
  if (openChar !== '{' && openChar !== '[') return null;
  let closeChar = openChar === '{' ? '}' : ']';
  
  let depth = 0;
  let activeQuote = '';
  let escaped = false;
  
  for (let index = start; index < text.length; index++) {
    const character = text[index];
    if (activeQuote) {
      if (escaped) { escaped = false; continue; }
      if (character === '\\') { escaped = true; continue; }
      if (character === activeQuote) { activeQuote = ''; }
      continue;
    }
    if (character === '"' || character === "'" || character === "`") { activeQuote = character; continue; }
    if (character === openChar) depth++;
    if (character === closeChar) {
      depth--;
      if (depth === 0) return text.slice(start, index + 1);
    }
  }
  return null;
}

function safeEvaluate(expression) {
  try {
    const context = Object.create(null);
    return vm.runInNewContext(expression, context, { timeout: 1000, displayErrors: true });
  } catch (_error) {
    console.error("Eval Error:", _error.message);
    return null;
  }
}

const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8'
};

axios.get('https://animeflv.net/ver/tensei-shitara-slime-datta-ken-4th-season-1', { headers })
  .then(r => {
    const html = r.data;
    const lit = extractVarLiteral(html, 'videos');
    console.log('LITERAL EXTRACTED:', lit ? lit.substring(0, 100) : null);
    if (lit) {
      const parsed = safeEvaluate(`(${lit})`);
      console.log('PARSED:', parsed ? Object.keys(parsed) : null);
    }
  }).catch(e => console.error(e));
