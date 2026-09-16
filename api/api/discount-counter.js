// Vercel Serverless - Discount Counter for first 30 at $12 then $19
// Uses Vercel KV if available, otherwise in-memory/file fallback (for dev)
// Setup: In Vercel dashboard, add KV database and connect, or use Upstash Redis env

let memoryClaimed = 0; // fallback

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  const TOTAL_SPOTS = 30;
  const DISCOUNT_PRICE = 12;
  const REGULAR_PRICE = 19;
  const COUPON = 'DALIN30';

  try {
    let claimed = 0;

    // Try Vercel KV
    try {
      const { kv } = await import('@vercel/kv');
      const kvClaimed = await kv.get('dalin_discount_claimed');
      claimed = kvClaimed || 0;
      
      if (req.method === 'POST') {
        // Claim a spot (called when user clicks Buy or after payment)
        if (claimed < TOTAL_SPOTS) {
          claimed += 1;
          await kv.set('dalin_discount_claimed', claimed);
        }
      }
    } catch (e) {
      // KV not configured - use memory/file fallback (will reset on redeploy)
      console.log('KV not available, using memory fallback:', e.message);
      claimed = memoryClaimed;
      
      if (req.method === 'POST') {
        if (memoryClaimed < TOTAL_SPOTS) {
          memoryClaimed += 1;
          claimed = memoryClaimed;
        }
      }
    }

    const remaining = Math.max(0, TOTAL_SPOTS - claimed);
    const isDiscountActive = remaining > 0;
    const currentPrice = isDiscountActive ? DISCOUNT_PRICE : REGULAR_PRICE;
    const originalPrice = REGULAR_PRICE;

    return res.status(200).json({
      total: TOTAL_SPOTS,
      claimed,
      remaining,
      active: isDiscountActive,
      currentPrice,
      originalPrice,
      coupon: isDiscountActive ? COUPON : null,
      message: isDiscountActive 
        ? `${remaining} spots left at $${DISCOUNT_PRICE}` 
        : `Discount ended - now $${REGULAR_PRICE}`,
      selarLink: isDiscountActive
        ? `https://selar.com/023cn11520?coupon=${COUPON}`
        : `https://selar.com/023cn11520`
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed', details: String(err), total: TOTAL_SPOTS, claimed: 0, remaining: TOTAL_SPOTS, active: true, currentPrice: DISCOUNT_PRICE });
  }
}
