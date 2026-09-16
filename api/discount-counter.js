let memoryClaimed = 0;

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  const TOTAL_SPOTS = 30;
  const DISCOUNT_PRICE = 12;
  const REGULAR_PRICE = 19;
  const COUPON = 'DALIN30';
  let claimed = memoryClaimed;
  if (req.method === 'POST' && memoryClaimed < TOTAL_SPOTS) {
    memoryClaimed += 1;
    claimed = memoryClaimed;
  }
  const remaining = Math.max(0, TOTAL_SPOTS - claimed);
  const isDiscountActive = remaining > 0;
  const currentPrice = isDiscountActive ? DISCOUNT_PRICE : REGULAR_PRICE;
  return res.status(200).json({
    total: TOTAL_SPOTS,
    claimed,
    remaining,
    active: isDiscountActive,
    currentPrice,
    originalPrice: REGULAR_PRICE,
    coupon: isDiscountActive ? COUPON : null,
    message: isDiscountActive ? `${remaining} spots left at $${DISCOUNT_PRICE}` : `Discount ended - now $${REGULAR_PRICE}`,
    selarLink: isDiscountActive ? `https://selar.com/023cn11520?coupon=${COUPON}` : `https://selar.com/023cn11520`
  });
};
