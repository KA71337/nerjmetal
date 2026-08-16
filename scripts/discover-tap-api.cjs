const fs = require('node:fs');

(async () => {
  const html = fs.readFileSync('shop-debug.html', 'utf8');
  const sources = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map((match) => new URL(match[1], 'https://tap.az').href);
  fs.mkdirSync('tmp-chunks', { recursive: true });
  for (const [index, url] of sources.entries()) {
    const text = await fetch(url).then((response) => response.text());
    fs.writeFileSync(`tmp-chunks/${index}.js`, text);
    if (text.includes('71745:') || text.includes('ShopAds')) {
      console.log(index, url, text.length, text.indexOf('71745:'), text.indexOf('ShopAds'));
    }
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
