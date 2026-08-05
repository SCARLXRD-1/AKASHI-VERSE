const axios = require("axios");
const cheerio = require("cheerio");
const vm = require("node:vm");
const { URL } = require("node:url");
const { ApiError } = require("../utils/api-error");

let puppeteerBrowser = null;

async function getPuppeteerBrowser() {
  if (!puppeteerBrowser || !puppeteerBrowser.isConnected()) {
    if (puppeteerBrowser) {
      try { await puppeteerBrowser.close(); } catch (e) {}
    }
    const puppeteerCore = require("puppeteer-core");
    const { addExtra } = require("puppeteer-extra");
    const puppeteer = addExtra(puppeteerCore);
    const StealthPlugin = require("puppeteer-extra-plugin-stealth");
    puppeteer.use(StealthPlugin());
    const chromium = require("@sparticuz/chromium");

    const options = {
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      headless: true,
      ignoreHTTPSErrors: true,
    };

    if (process.env.PUPPETEER_EXECUTABLE_PATH) {
      options.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
    } else {
      options.executablePath = await chromium.executablePath();
    }

    // Set puppeteer-core as the executable for puppeteer-extra
    puppeteerBrowser = await puppeteer.launch({ ...options, executablePath: options.executablePath });
  }
  return puppeteerBrowser;
}

async function fetchHtmlWithPuppeteer(url) {
  const browser = await getPuppeteerBrowser();
  const page = await browser.newPage();
  
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
  );
  
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
  
  // Wait for protection to resolve
  let retries = 0;
  while (retries < 10) {
    const content = await page.content();
    const $ = cheerio.load(content);
    const title = $("title").text();
    const bodyText = $("body").text().trim();
    
    // If we have actual content (not just protection), break
    if (title && !title.includes("animeflv") && !title.includes("Checking")) break;
    if (bodyText.length > 500) break;
    
    await new Promise(r => setTimeout(r, 2000));
    retries++;
  }
  
  const content = await page.content();
  await page.close();
  
  return content;
}

const DEFAULT_DOMAIN = "www3.animeflv.net";

const HTTP_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
};

async function fetchHtml(url) {
  try {
    const timeout = Number(process.env.REQUEST_TIMEOUT_MS || 15000);
    const response = await axios.get(url, {
      timeout,
      headers: HTTP_HEADERS,
      maxRedirects: 5,
      validateStatus: (status) => status >= 200 && status < 400,
    });
    
    // Check if it's a Cloudflare challenge despite returning 200 OK
    const html = response.data;
    if (typeof html === 'string') {
      if (html.includes('Just a moment...') || html.includes('Cloudflare') || html.includes('Ray ID:')) {
        throw new Error('Cloudflare challenge detected');
      }
    }
    return html;
  } catch (error) {
    // If regular fetch fails, try with puppeteer
    try {
      console.log("fetchHtml: trying with puppeteer for", url);
      return await fetchHtmlWithPuppeteer(url);
    } catch (puppeteerError) {
      throw new ApiError(500, "No se pudo obtener contenido desde AnimeFLV", puppeteerError.message);
    }
  }
}

function resolveAbsoluteUrl(urlCandidate, domain = DEFAULT_DOMAIN) {
  if (!urlCandidate || typeof urlCandidate !== "string") {
    return null;
  }

  try {
    const base = `https://${domain}`;
    return new URL(urlCandidate, base).toString();
  } catch (_error) {
    return null;
  }
}

function normalizeInputUrl(urlCandidate, domain = DEFAULT_DOMAIN) {
  const normalized = resolveAbsoluteUrl(urlCandidate, domain);
  if (!normalized) {
    throw new ApiError(400, "URL invalida");
  }
  return normalized;
}

function parseNumber(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  const converted = Number(value);
  return Number.isFinite(converted) ? converted : null;
}

function parseEpisodeNumberFromUrl(url) {
  try {
    const pathname = new URL(url).pathname;
    const segments = pathname.split("/").filter(Boolean);
    const lastSegment = segments[segments.length - 1] || "";
    const number = Number(lastSegment.match(/(\d+)(?:\D*)$/)?.[1]);
    return Number.isFinite(number) ? number : null;
  } catch (_error) {
    return null;
  }
}

function normalizeToken(value) {
  return (value || "")
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

function normalizeServerName(serverName, url) {
  if (serverName && typeof serverName === "string") {
    const token = normalizeToken(serverName);
    if (token) {
      return { name: serverName.trim(), token };
    }
  }

  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return {
      name: host,
      token: normalizeToken(host),
    };
  } catch (_error) {
    return { name: "Unknown", token: "unknown" };
  }
}

function pushDeduped(target, link) {
  if (!link || !link.url) {
    return;
  }

  if (target.some((item) => item.url === link.url)) {
    return;
  }

  target.push(link);
}

function buildExcludedTokens(includeMega, excludeServersRaw) {
  const excluded = new Set();

  const raw = typeof excludeServersRaw === "string" ? excludeServersRaw : "";
  for (const part of raw.split(",")) {
    const token = normalizeToken(part);
    if (token) {
      excluded.add(token);
    }
  }

  if (!includeMega) {
    excluded.add("mega");
  }

  return excluded;
}

function filterLinksByServers(links, excludedTokens) {
  return links.filter((link) => {
    const token = normalizeToken(link.token || link.server);
    if (!token) {
      return true;
    }

    if (excludedTokens.has(token)) {
      return false;
    }

    if (token.includes("mega") && excludedTokens.has("mega")) {
      return false;
    }

    return true;
  });
}

function sanitizeLinksForResponse(links) {
  return links.map((link) => {
    const result = {
      server: link.server,
      url: link.url,
    };

    if (link.quality) {
      result.quality = link.quality;
    }

    return result;
  });
}

function extractBalancedSection(text, startIndex, openChar, closeChar) {
  let depth = 0;
  let activeQuote = "";
  let escaped = false;

  for (let index = startIndex; index < text.length; index += 1) {
    const character = text[index];

    if (activeQuote) {
      if (escaped) {
        escaped = false;
        continue;
      }

      if (character === "\\") {
        escaped = true;
        continue;
      }

      if (character === activeQuote) {
        activeQuote = "";
      }
      continue;
    }

    if (character === '"' || character === "'" || character === "`") {
      activeQuote = character;
      continue;
    }

    if (character === openChar) {
      depth += 1;
    }

    if (character === closeChar) {
      depth -= 1;
      if (depth === 0) {
        return text.slice(startIndex, index + 1);
      }
    }
  }

  return null;
}

function safeEvaluate(expression) {
  try {
    const context = Object.create(null);
    return vm.runInNewContext(expression, context, {
      timeout: 1000,
      displayErrors: false,
    });
  } catch (_error) {
    return null;
  }
}

function extractVarLiteral(html, varName) {
  const marker = `var ${varName}`;
  const startIndex = html.indexOf(marker);
  if (startIndex === -1) {
    return null;
  }

  const equalsIndex = html.indexOf("=", startIndex);
  if (equalsIndex === -1) {
    return null;
  }

  const slice = html.slice(equalsIndex + 1);
  const firstBracketIndex = slice.search(/[\[{]/);
  if (firstBracketIndex === -1) {
    return null;
  }

  const openChar = slice[firstBracketIndex];
  const closeChar = openChar === "{" ? "}" : "]";
  return extractBalancedSection(slice, firstBracketIndex, openChar, closeChar);
}

function normalizeVariantKey(value) {
  const normalized = normalizeToken(value);
  if (!normalized) {
    return "SUB";
  }

  if (normalized.includes("sub") || normalized.includes("jap") || normalized.includes("jp")) {
    return "SUB";
  }

  return "DUB";
}

function tryDecodeBase64(value) {
  if (!value || typeof value !== "string") {
    return null;
  }

  try {
    if (/^[A-Za-z0-9+/=]+$/.test(value) && value.length > 10) {
      const decoded = Buffer.from(value, "base64").toString("utf8");
      if (decoded.startsWith("http://") || decoded.startsWith("https://")) {
        return decoded;
      }
    }
  } catch (_e) {
    // Ignore decode errors
  }
  return null;
}

function decodeUrlEscapes(value) {
  if (!value || typeof value !== "string") {
    return value;
  }

  return value
    .replace(/\\u0026/g, "&")
    .replace(/\\u003A/g, ":")
    .replace(/\\u002F/g, "/")
    .replace(/&amp;/g, "&");
}

function buildLinkRecord(serverName, url, quality) {
  if (!url) {
    return null;
  }

  const server = normalizeServerName(serverName, url);
  return {
    server: server.name,
    token: server.token,
    url,
    quality: quality || null,
  };
}

function parseSearchResultsFromHtml(html, domain) {
  const $ = cheerio.load(html);
  const results = [];

  $("article.Anime, .ListAnimes li article").each((_, element) => {
    const card = $(element);
    const link = card.find("a[href^='/anime/']").first().attr("href") || card.find("a").first().attr("href");
    const title = card.find("h3.Title").first().text().trim() || card.find("img").attr("alt") || null;
    const image = card.find("img").first().attr("src") || card.find("img").first().attr("data-src") || null;

    if (!link || !title) {
      return;
    }

    const slug = link.split("/").filter(Boolean).pop() || null;

    // Resolve image - AnimeFLV images are always on animeflv.net
    const imgDomain = "www3.animeflv.net";
    const rawImg = card.find("img").first().attr("src") ||
                   card.find("img").first().attr("data-src") ||
                   card.find("img").first().attr("data-lazy-src") || null;

    const rawScore = card.find(".Vts").first().text().trim() || null;
    const score = rawScore && parseFloat(rawScore) > 0 ? rawScore : null;

    results.push({
      id: null,
      title,
      slug,
      url: resolveAbsoluteUrl(link, domain),
      image: rawImg ? resolveAbsoluteUrl(rawImg, imgDomain) : null,
      backdrop: null,
      type: card.find(".Type").first().text().trim() || null,
      score,
      status: null,
      year: null,
    });
  });

  return results;
}

function parseAnimeInfoFromHtml(html, domain) {
  const $ = cheerio.load(html);

  const imgDomain = "www3.animeflv.net";
  const rawImage =
    $(".AnimeCover img").attr("src") ||
    $(".AnimeCover img").attr("data-src") ||
    $(".cover img").attr("src") ||
    $(".cover img").attr("data-src") ||
    $("aside img").first().attr("src") ||
    $("article img").first().attr("src") ||
    $('img[src*="/uploads/animes"]').first().attr("src") ||
    null;
  const image = rawImage ? resolveAbsoluteUrl(rawImage, imgDomain) : null;

  // Backdrop from Banner background-image
  let backdrop = null;
  const bannerStyle = $(".Banner").attr("style") || "";
  const bgMatch = bannerStyle.match(/url\(['"]?([^'"]+)['"]?\)/);
  if (bgMatch) {
    backdrop = resolveAbsoluteUrl(bgMatch[1], imgDomain);
  }

  const title = $("h1.Title, h1").first().text().trim() || null;
  const description = $(".Description p, .Description, .Anime-Description").first().text().trim() || null;

  const genres = [];
  $(".Nvgnrs a").each((_, link) => {
    const name = $(link).text().trim();
    if (!name) return;
    genres.push({
      id: null,
      name,
      slug: name.toLowerCase().replace(/\s+/g, "-"),
      malId: null,
    });
  });

  let status = null;
  let year = null;
  let score = null;
  let titleJapanese = null;

  // --- STATUS extraction: use .AnmStts class (most reliable for AnimeFLV) ---
  // On AnimeFLV: class "A" = En emisión (airing), class "B" = Finalizado (completed)
  const sttsEl = $(".AnmStts").first();
  if (sttsEl.length) {
    const sttsClass = sttsEl.attr("class") || "";
    const sttsTxt = sttsEl.text().trim().toLowerCase();
    // Text-based detection first (most reliable)
    if (sttsTxt.includes("finalizado") || sttsTxt.includes("finished") || sttsTxt.includes("complete")) {
      status = "Finalizado";
    } else if (sttsTxt.includes("emisi") || sttsTxt.includes("airing") || sttsTxt.includes("on air")) {
      status = "En emisión";
    } else if (sttsTxt.includes("proximamente") || sttsTxt.includes("upcoming")) {
      status = "Próximamente";
    } else {
      // Class-based fallback: "A" = En emisión, "B" = Finalizado
      const classes = sttsClass.split(/\s+/);
      if (classes.includes("A")) status = "En emisión";
      else if (classes.includes("B")) status = "Finalizado";
      else status = sttsEl.text().trim();
    }
  }
  // Fallback: look inside info container
  if (!status) {
    $(".SidebarA p, .SidebarA span").each((_, el) => {
      const t = $(el).text().trim().toLowerCase();
      if (t.includes("finalizado")) { status = "Finalizado"; return false; }
      if (t.includes("emisi")) { status = "En emisión"; return false; }
    });
  }

  // --- YEAR extraction: only from info table, NOT from scripts/analytics ---
  // AnimeFLV puts year info in rows like: <span>Año:</span><span>2013</span>
  // or in <a href="/browse?year=1999">1999</a> inside the info container.
  const infoZone = $(".SidebarA, .AnimeInfo, .Ficha .Container");

  // Try anchor tags that are year links
  infoZone.find("a[href*='year=']").each((_, el) => {
    const href = $(el).attr("href") || "";
    const m = href.match(/year=(\d{4})/);
    if (m) { year = m[1]; return false; }
  });

  // Try rows with label "Año" or "Emitido"
  if (!year) {
    infoZone.find("p, li, span").each((_, el) => {
      const txt = $(el).text().trim();
      const m = txt.match(/(?:Año|Emitido|Temporada)[^\d]*(\d{4})/i);
      if (m) { year = m[1]; return false; }
    });
  }

  // Try anchor tags inside info zone that look like bare years
  if (!year) {
    infoZone.find("a").each((_, el) => {
      const txt = $(el).text().trim();
      if (/^\d{4}$/.test(txt) && parseInt(txt) >= 1960 && parseInt(txt) <= 2030) {
        year = txt;
        return false;
      }
    });
  }

  // --- SCORE --- try multiple selectors AnimeFLV uses
  score = score ||
    $("#votes_prmd").first().text().trim() ||
    $("#vtprmd").first().text().trim() ||
    $(".vtprmd").first().text().trim() ||
    $(".score, .Score, [itemprop='ratingValue']").first().text().trim() ||
    null;
  // Clean score to be a decimal number string, discard 0 values
  if (score) {
    const scoreMatch = score.match(/([0-9]+(?:\.[0-9]+)?)/); 
    const scoreNum = scoreMatch ? parseFloat(scoreMatch[1]) : 0;
    score = scoreNum > 0 ? String(scoreNum) : null;
  }

  if (year) {
    const m = year.match(/\d{4}/);
    if (m) year = m[0];
  }

  // Japanese title
  titleJapanese = $("h2.TitleAlt, .title-alt, .TitleAlt, h3.AltTitle").first().text().trim() || null;
  if (!titleJapanese) {
    // Look for spans with Japanese chars
    $("span.TxtAlt").each((_, el) => {
       const txt = $(el).text().trim();
       if (/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/.test(txt)) {
          titleJapanese = txt;
          return false;
       }
    });
  }

  const relatedAnimes = [];
  $(".ListAnmRel li").each((_, el) => {
    const link = $(el).find("a");
    if (link.length > 0) {
      const relTitle = link.text().trim();
      const href = link.attr("href");
      const relationRaw = $(el).contents().filter(function() { return this.nodeType === 3; }).text().trim();
      const relation = relationRaw.replace(/^\(|\)$/g, "").trim();
      if (relTitle && href) {
        relatedAnimes.push({ title: relTitle, url: resolveAbsoluteUrl(href, domain), relation });
      }
    }
  });

  return {
    title,
    description,
    image,
    genres,
    relatedAnimes,
    type: $(".Type").first().text().trim() || "TV Anime",
    score,
    year,
    // If status couldn't be detected, leave it null rather than wrongly defaulting to Finalizado
    status: status || null,
    titleJapanese,
    backdrop: backdrop || image,
  };
}

function parseEpisodesFromHtml(html, domain, slug) {
  const $ = cheerio.load(html);
  const episodes = [];

  $("a[href^='/ver/'], a[href*='/ver/']").each((_, element) => {
    const link = $(element).attr("href");
    if (!link) {
      return;
    }

    const url = resolveAbsoluteUrl(link, domain);
    const number = parseEpisodeNumberFromUrl(url);
    if (!number) {
      return;
    }

    if (episodes.some((ep) => ep.url === url)) {
      return;
    }

    episodes.push({
      id: null,
      number,
      title: `Episodio ${number}`,
      url,
    });
  });

  return episodes;
}

function parseEpisodeListFromScript(html, domain, slug) {
  const episodesLiteral = extractVarLiteral(html, "episodes");
  if (!episodesLiteral) {
    return [];
  }

  const list = safeEvaluate(`(${episodesLiteral})`);
  if (!Array.isArray(list)) {
    return [];
  }

  const resolvedSlug = slug || null;
  return list
    .map((entry) => {
      if (!Array.isArray(entry) || entry.length === 0) {
        return null;
      }

      const number = parseNumber(entry[0]);
      if (!number && number !== 0) {
        return null;
      }

      const episodeSlug = resolvedSlug ? `${resolvedSlug}-${number}` : null;
      const url = episodeSlug ? `https://${domain}/ver/${episodeSlug}` : null;

      return {
        id: entry[1] ?? null,
        number,
        title: `Episodio ${number}`,
        url,
      };
    })
    .filter((episode) => episode && episode.url)
    .sort((a, b) => a.number - b.number);
}

function parseVideoSources(html) {
  const videosLiteral = extractVarLiteral(html, "videos");
  if (!videosLiteral) {
    return null;
  }

  let parsed = safeEvaluate(`(${videosLiteral})`);
  if (!parsed || typeof parsed !== "object") {
    return null;
  }

  for (const [key, entries] of Object.entries(parsed)) {
    if (!Array.isArray(entries)) {
      continue;
    }

    for (const entry of entries) {
      if (!entry || typeof entry !== "object") {
        continue;
      }

      for (const urlField of ["code", "url", "embed", "file"]) {
        if (entry[urlField] && typeof entry[urlField] === "string") {
          const decoded = tryDecodeBase64(entry[urlField]);
          if (decoded) {
            entry[urlField] = decoded;
          } else {
            entry[urlField] = decodeUrlEscapes(entry[urlField]);
          }
        }
      }
    }
  }

  return parsed;
}

function parseDownloadRows(html, domain) {
  const $ = cheerio.load(html);
  const rows = [];

  $("table tbody tr").each((_, element) => {
    const cells = $(element).find("td");
    const server = $(cells[0]).text().trim() || null;
    const format = $(cells[1]).text().trim() || null;
    const variant = $(cells[2]).text().trim() || null;
    const url = $(element).find("a").attr("href") || null;

    if (!url) {
      return;
    }

    rows.push({
      server,
      format,
      variant,
      url: resolveAbsoluteUrl(url, domain),
    });
  });

  return rows;
}

async function searchAnime(query, domainCandidate, filters = {}) {
  const cleanQuery = (query || "").toString().trim();
  const domain = (domainCandidate || DEFAULT_DOMAIN || "www4.animeflv.net").toString().trim();
  
  // Normalize filter values to what AnimeFLV browse accepts
  const STATUS_MAP = { on_air: "1", airing: "1", complete: "2", completed: "2", upcoming: "3" };
  const TYPE_MAP   = { tv: "tv", movie: "movie", ova: "ova", special: "special" };
  const normalizedStatus = filters.status ? (STATUS_MAP[filters.status] || filters.status) : null;
  const normalizedType   = filters.category ? (TYPE_MAP[filters.category] || filters.category) : null;

  let searchUrl = `https://${domain}/browse?`;
  if (cleanQuery)         searchUrl += `q=${encodeURIComponent(cleanQuery)}&`;
  if (filters.page)       searchUrl += `page=${filters.page}&`;
  if (normalizedType)     searchUrl += `type[]=${encodeURIComponent(normalizedType)}&`;
  if (normalizedStatus)   searchUrl += `status[]=${encodeURIComponent(normalizedStatus)}&`;
  if (filters.year)       searchUrl += `year[]=${encodeURIComponent(filters.year)}&`;
  if (filters.order && filters.order !== 'default') searchUrl += `order=${encodeURIComponent(filters.order)}&`;
  const html = await fetchHtml(searchUrl);

  const results = parseSearchResultsFromHtml(html, domain);

  return {
    success: true,
    data: {
      query: cleanQuery,
      results,
      count: results.length,
    },
    source: "animeflv",
  };
}

async function getAnimeInfo(urlCandidate) {
  const normalizedUrl = normalizeInputUrl(urlCandidate);
  const parsed = new URL(normalizedUrl);
  const domain = parsed.hostname || DEFAULT_DOMAIN;
  const segments = parsed.pathname.split("/").filter(Boolean);

  let slug = segments[1] || "";
  if (segments[0] === "ver") {
    const rawSlug = segments[1] || "";
    slug = rawSlug.replace(/-\d+$/, "");
  }

  if (segments[0] === "anime") {
    slug = segments[1] || "";
  }

  if (!slug) {
    throw new ApiError(400, "URL invalida");
  }

  const baseUrl = `https://${domain}/anime/${slug}`;
  const html = await fetchHtml(baseUrl);

  const info = parseAnimeInfoFromHtml(html, domain);
  let episodes = parseEpisodesFromHtml(html, domain, slug);

  if (episodes.length === 0) {
    episodes = parseEpisodeListFromScript(html, domain, slug);
  }

  return {
    success: true,
    data: {
      id: slug,
      title: info.title,
      titleJapanese: info.titleJapanese,
      description: info.description,
      image: info.image,
      backdrop: info.backdrop || info.image,
      status: info.status,
      type: info.type || null,
      year: info.year,
      score: info.score,
      url: normalizedUrl,
      totalEpisodes: episodes.length,
      genres: info.genres || [],
      relatedAnimes: info.relatedAnimes || [],
      episodes,
    },
    source: "animeflv",
  };
}

async function getEpisodeLinks(urlCandidate, includeMegaRaw, excludeServersRaw) {
  const normalizedUrl = normalizeInputUrl(urlCandidate);
  const domain = new URL(normalizedUrl).hostname || DEFAULT_DOMAIN;
  const includeMega = String(includeMegaRaw).toLowerCase() === "true";
  const excludedTokens = buildExcludedTokens(includeMega, excludeServersRaw);

  const html = await fetchHtml(normalizedUrl);

  const streamLinks = { SUB: [], DUB: [] };
  const downloadLinks = { SUB: [], DUB: [] };

  const videoSources = parseVideoSources(html);
  if (videoSources && typeof videoSources === "object") {
    for (const [key, entries] of Object.entries(videoSources)) {
      const variant = normalizeVariantKey(key);
      if (!Array.isArray(entries)) {
        continue;
      }

      for (const entry of entries) {
        if (!entry) {
          continue;
        }

        const url = entry.code || entry.url || entry.embed || entry.file || null;
        const serverName = entry.title || entry.server || "Unknown";
        const link = buildLinkRecord(serverName, url, null);
        if (link) {
          pushDeduped(streamLinks[variant], link);
        }
      }
    }
  }

  const downloadRows = parseDownloadRows(html, domain);
  for (const row of downloadRows) {
    const variant = normalizeVariantKey(row.variant);
    const link = buildLinkRecord(row.server || "Download", row.url, row.format || null);
    if (link) {
      pushDeduped(downloadLinks[variant], link);
    }
  }

  const filteredStreamSub = filterLinksByServers(streamLinks.SUB, excludedTokens);
  const filteredStreamDub = filterLinksByServers(streamLinks.DUB, excludedTokens);
  const filteredDownloadSub = filterLinksByServers(downloadLinks.SUB, excludedTokens);
  const filteredDownloadDub = filterLinksByServers(downloadLinks.DUB, excludedTokens);

  const episodeNumber = parseEpisodeNumberFromUrl(normalizedUrl);
  const title = cheerio.load(html)("h1").first().text().trim() || null;

  return {
    success: true,
    data: {
      id: null,
      episode: episodeNumber,
      title: title || `Episodio ${episodeNumber || "?"}`,
      season: null,
      variants: {
        SUB: filteredStreamSub.length > 0 || filteredDownloadSub.length > 0 ? 1 : 0,
        DUB: filteredStreamDub.length > 0 || filteredDownloadDub.length > 0 ? 1 : 0,
      },
      publishedAt: null,
      servers: {
        sub: sanitizeLinksForResponse(filteredStreamSub),
        dub: sanitizeLinksForResponse(filteredStreamDub),
      },
      streamLinks: {
        SUB: sanitizeLinksForResponse(filteredStreamSub),
        DUB: sanitizeLinksForResponse(filteredStreamDub),
      },
      downloadLinks: {
        SUB: sanitizeLinksForResponse(filteredDownloadSub),
        DUB: sanitizeLinksForResponse(filteredDownloadDub),
      },
    },
    source: "animeflv",
  };
}

async function getHome(domainCandidate) {
  const domain = (domainCandidate || DEFAULT_DOMAIN || "www4.animeflv.net").toString().trim();
  const html = await fetchHtml(`https://${domain}/`);
  const $ = cheerio.load(html);
  
  const latestEpisodes = [];
  $(".ListEpisodios li a").each((_, element) => {
    const el = $(element);
    const link = el.attr("href");
    if (!link) return;
    
    const title = el.find(".Title").text().trim();
    const episodeNum = el.find(".Capi").text().trim();
    const image = el.find("img").attr("src") || el.find("img").attr("data-src") || "";
    
    const animeSlug = link.replace("/ver/", "").replace(/-\d+$/, "");
    
    latestEpisodes.push({
      title: title,
      episode: episodeNum,
      image: resolveAbsoluteUrl(image, domain),
      url: resolveAbsoluteUrl(`/anime/${animeSlug}`, domain),
      watchUrl: resolveAbsoluteUrl(link, domain),
    });
  });

  const schedule = [];
  $(".ListSdbr li a").each((_, element) => {
    const el = $(element);
    const link = el.attr("href");
    if (!link) return;
    
    const type = el.removeClass("Button").attr("class")?.trim() || "Anime";
    const title = el.text().trim();
    schedule.push({
      title,
      type,
      url: resolveAbsoluteUrl(link, domain)
    });
  });

  return {
    success: true,
    data: { latestEpisodes, schedule },
    source: "animeflv"
  };
}

module.exports = {
  id: "animeflv",
  searchAnime,
  getAnimeInfo,
  getEpisodeLinks,
  getHome,
  getPuppeteerBrowser,
  fetchHtmlWithPuppeteer,
};
