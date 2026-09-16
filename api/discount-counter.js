let memoryClaimed = 0;

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  const TOTAL = 30;
  const PRICE_DISC = 12;
  const PRICE_REG = 19;
  const COUPON = 'DALIN30';
  let claimed = memoryClaimed;
  if (req.method === 'POST' && memoryClaimed < TOTAL) {
    memoryClaimed += 1;
    claimed = memoryClaimed;
  }
  const remaining = Math.max(0, TOTAL - claimed);
  const active = remaining > 0;
  return res.status(200).json({
    total: TOTAL,
    claimed,
    remaining,
    active,
    currentPrice: active ? PRICE_DISC : PRICE_REG,
    originalPrice: PRICE_REG,
    coupon: active ? COUPON : null,
    message: active ? `${remaining} spots left at $${PRICE_DISC}` : `Discount ended - now $${PRICE_REG}`,
    selarLink: active ? `https://selar.com/023cn11520?coupon=${COUPON}` : `https://selar.com/023cn11520`
  });
};
