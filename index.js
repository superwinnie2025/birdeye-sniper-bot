import 'dotenv/config';
import axios from 'axios';
import { FOLLOWED_WALLET, POLL_INTERVAL } from './config.js';
import fs from 'fs';

const RPC_URL = process.env.RPC_URL;
const cacheFile = './cache.json';
let seenTxs = new Set();

if (fs.existsSync(cacheFile)) {
  const raw = fs.readFileSync(cacheFile);
  seenTxs = new Set(JSON.parse(raw));
}

const saveCache = () => {
  fs.writeFileSync(cacheFile, JSON.stringify([...seenTxs]));
};

const getRecentTxs = async () => {
  try {
    const res = await axios.post(RPC_URL, {
      jsonrpc: "2.0",
      id: 1,
      method: "getSignaturesForAddress",
      params: [FOLLOWED_WALLET, { limit: 5 }]
    });

    const signatures = res.data.result || [];

    for (const tx of signatures) {
      if (!seenTxs.has(tx.signature)) {
        seenTxs.add(tx.signature);
        console.log(`[🔥 DETECTED] New tx: ${tx.signature}`);
        // todo: decode and front-run it
      }
    }

    saveCache();
  } catch (err) {
    console.error("[RPC ERROR]", err.message);
  }
};

console.log(`[⏳] Listening for wallet: ${FOLLOWED_WALLET}`);
setInterval(getRecentTxs, POLL_INTERVAL);