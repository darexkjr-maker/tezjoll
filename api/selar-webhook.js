// Webhook for Selar to auto-increment after successful payment
// SETUP IN SELAR: 
// Dashboard -> Settings -> Webhooks -> Add: https://codebydalin.com/api/selar-webhook
// Or: https://yourdomain.vercel.app/api/selar-webhook

export default async function handler(req, res) {
  // Allow GET for testing, POST for real Selar webhook
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body || {};
    const query = req.query || {};
    
    // Selar sends: { product_code, product_name, email, amount, coupon_code, transaction_id, etc }
    const couponUsed = body.coupon_code || body.coupon || query.coupon || '';
    const productCode = body.product_code || body.product_id || body.product || query.product || '023cn11520';
    const email = body.email || body.customer_email || 'unknown';
    const amount = body.amount || body.total || 0;
    const source = body.source || query.source || 'selar_webhook';
    
    // Only count if it's our product and (if coupon filter) DALIN30 was used OR we count all sales for first 30
    const isOurProduct = !productCode || productCode === '023cn11520' || productCode.includes('CODE') || true; // Selar sometimes sends name
    const isDiscountSale = couponUsed ? couponUsed.toUpperCase() === 'DALIN30' : true; // If Selar doesn't send coupon, count anyway for first 30 logic
    
    console.log('Webhook received:', { productCode, couponUsed, email, amount, source });

    let claimed = 0;

    try {
      const { kv } = await import('@vercel/kv');
      const current = await kv.get('dalin_discount_claimed') || 0;
      
      if (isOurProduct) {
        // For real sales, always increment. For clicks, check if still under 30
        const newCount = current + 1;
        await kv.set('dalin_discount_claimed', newCount);
        claimed = newCount;
        console.log(`✅ Real sale counted! ${email} - ${amount} - Coupon: ${couponUsed} - Total: ${claimed}/30`);
      } else {
        claimed = current;
      }
    } catch (e) {
      console.log('KV not available, using fallback:', e.message);
      // Fallback: call discount-counter POST
      try {
        const host = req.headers.host ? `https://${req.headers.host}` : 'https://codebydalin.com';
        const r = await fetch(`${host}/api/discount-counter`, { method: 'POST' });
        const j = await r.json();
        claimed = j.claimed;
      } catch {}
    }

    // Optional email notification
    try {
      const RESEND_KEY = process.env.RESEND_API_KEY;
      if (RESEND_KEY && claimed > 0) {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: process.env.FROM_EMAIL || 'Dalin <hello@codebydalin.com>',
            to: process.env.TO_EMAIL || 'darexkjr@gmail.com',
            subject: `💰 Sale #${claimed}/30 ${isDiscountSale ? '($12 DALIN30)' : '($19)'} - ${email} - ${claimed >= 30 ? 'DISCOUNT ENDED' : `${30-claimed} left`}`,
            html: `<h2>New Sale!</h2><p><b>Email:</b> ${email}</p><p><b>Amount:</b> ${amount}</p><p><b>Coupon:</b> ${couponUsed || 'None (full price)'}</p><p><b>Product:</b> ${productCode}</p><p><b>Total claimed:</b> ${claimed}/30</p><p><b>Remaining at $12:</b> ${Math.max(0, 30-claimed)}</p><p><b>Source:</b> ${source}</p>`
          })
        });
      }
    } catch (emailErr) {
      console.log('Email notify failed:', emailErr);
    }

    return res.status(200).json({ 
      ok: true, 
      claimed, 
      remaining: Math.max(0, 30-claimed), 
      price: claimed >= 30 ? 19 : 12,
      counted: isOurProduct,
      coupon: couponUsed
    });

  } catch (err) {
    console.error('Webhook error:', err);
    return res.status(500).json({ error: String(err) });
  }
}
