const fs = require('fs');
const path = require('path');
const axios = require('axios');

const etc = {
  timelog: () => new Date().toISOString(),
  countdown: async (ms, message) => {
    console.log(`⏳ ${message} (${ms / 1000}s)`);
    return new Promise(resolve => setTimeout(resolve, ms));
  }
};

function loadWallets(filePath = './data.txt') {
  const raw = fs.readFileSync(path.resolve(filePath), 'utf8');
  return raw
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.includes('|'))
    .map(line => {
      const [walletAddress, captchaToken] = line.split('|');
      return { walletAddress, captchaToken };
    });
}

async function irysFaucet() {
  const wallets = loadWallets();

  const headers = {
    'accept': '*/*',
    'content-type': 'application/json',
    'origin': 'https://irys.xyz',
    'referer': 'https://irys.xyz/faucet',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)...'
  };

  for (const { walletAddress, captchaToken } of wallets) {
    try {
      const faucetUrl = `https://irys.xyz/api/faucet`;
      const payload = {
        captchaToken,
        walletAddress
      };

      const response = await axios.post(faucetUrl, payload, { headers });
      const data = response.data;

      if (data.success === true) {
        console.log(`✅ ${walletAddress} | ${etc.timelog()} | Faucet successfully claimed.`);
      } else {
        console.warn(`⚠️ ${walletAddress} | ${etc.timelog()} | Faucet response: ${JSON.stringify(data)}`);
      }
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status) {
        console.error(`❌ ${walletAddress} | ${etc.timelog()} | Rate limit : ${err.response.data.message}`);
      } else {
        console.error(`❌ ${walletAddress} | ${etc.timelog()} | Error: ${err.message}  : ${JSON.stringify(err.response.data)}`);
      }
    }

    await etc.countdown(10000, "Countdown before next address");
  }
}

irysFaucet();
