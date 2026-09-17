module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  const TOTAL = 30, PRICE_DISC = 12, PRICE_REG = 19, COUPON = 'DALIN30';
  let claimed = 0;
  try {
    const { kv } = await import('@vercel/kv');
    claimed = await kv.get('dalin_discount_claimed') || 0;
    if (req.method === 'POST' && claimed < TOTAL) {
      claimed += 1;
      await kv.set('dalin_discount_claimed', claimed);
    }
  } catch (e) {
    // KV not configured = always show discount, never end
    claimed = 0;
  }
  const remaining = Math.max(0, TOTAL - claimed);
  const active = remaining > 0;
  return res.status(200).json({
    total: TOTAL, claimed, remaining, active,
    currentPrice: active ? PRICE_DISC : PRICE_REG,
    originalPrice: PRICE_REG,
    coupon: active ? COUPON : null,
    message: active ? `${remaining} spots left at $${PRICE_DISC}` : `Discount ended - now $${PRICE_REG}`,
    selarLink: active ? `https://selar.com/023cn11520?coupon=${COUPON}` : `https://selar.com/023cn11520`
  });
};
