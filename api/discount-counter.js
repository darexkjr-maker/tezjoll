import { kv } from '@vercel/kv';
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  const TOTAL = 30;
  let claimed = await kv.get('dalin_discount_claimed') || 0;
  if (req.method === 'POST' && claimed < TOTAL) {
    claimed += 1;
    await kv.set('dalin_discount_claimed', claimed);
  }
  const remaining = Math.max(0, TOTAL - claimed);
  const active = remaining > 0;
  return res.status(200).json({
    total: TOTAL, claimed, remaining, active,
    currentPrice: active ? 12 : 19,
    coupon: active ? 'DALIN30' : null,
    selarLink: active ? 'https://selar.com/023cn11520?coupon=DALIN30' : 'https://selar.com/023cn11520'
  });
}
