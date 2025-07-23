// script.js
const puppeteer = require('puppeteer');

async function fetchProxiesList () {
    return fetch('https://xktx-zdsw-4yq2.n7.xano.io/api:5DOVr_Qd/getAllActiveProxiesForScraping').then((response) => {
        return response.json();
    }).then((response) => {
        console.log("All proxies:::", response)
        return response;
    }).catch((error) => {console.log("Failed to fetch proxies list:::",error);return []})
}




(async () => {

  const proxiesList = await fetchProxiesList();
  const selectedValidProxy = proxiesList.find((proxy) => {
    return (!proxy.inuse && !proxy.tmpDisabled && proxy.online)
  })
  // Extracted from your proxy object
  const proxyHostPort = selectedValidProxy.ipport; // from "ipport"
  const proxyUsername = selectedValidProxy.username;   // from "username"
  const proxyPassword = selectedValidProxy.password; // from "password"

  // Launch Puppeteer with proxy
  const browser = await puppeteer.launch({
    headless: false,
    args: [
      '--no-sandbox',
      `--proxy-server=http://${proxyHostPort}`
    ]
  });

  const page = await browser.newPage();

//   Authenticate with proxy
  await page.authenticate({
    username: proxyUsername,
    password: proxyPassword,
  });

  // Optional: Custom headers
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  );

  // Go to target website
  await page.goto('https://ipinfo.io/ip', { waitUntil: 'networkidle2' });

  // Confirm result
  const title = await page.title();
  console.log(`Page title: ${title}`);

  await new Promise(resolve => setTimeout(resolve, 5000));
  await browser.close();
})();