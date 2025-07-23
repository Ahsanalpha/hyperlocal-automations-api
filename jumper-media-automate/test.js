import fetch from 'node-fetch';
import { HttpsProxyAgent } from 'https-proxy-agent';

const proxyUrl = new URL('https://colton043711:EEMu3k68DebM@68.225.23.101:13983');
const proxyAgent = new HttpsProxyAgent(proxyUrl);

async function fetchIp() {
  try {
    const response = await fetch('https://ipinfo.io/ip', {
      agent: proxyAgent,
      timeout: 5000
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const ip = await response.text();
    console.log('IP Address:', ip.trim());
  } catch (error) {
    console.error('Fetch failed:', error.message);
  }
}

fetchIp();
