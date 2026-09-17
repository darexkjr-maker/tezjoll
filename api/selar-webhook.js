// Fixed webhook - only POST from Selar counts, uses KV persistence
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).json({ ok: true, note: 'Waiting for Selar POST' });
  }
  try {
    const { kv } = await import('@vercel/kv');
    const current = await kv.get('dalin_discount_claimed') || 0;
    if (current >= 30) {
      return res.status(200).json({ ok: true, claimed: current, message: 'Already at 30' });
    }
    const newCount = current + 1;
    await kv.set('dalin_discount_claimed', newCount);
    console.log(`Sale #${newCount} via Selar`);
    // Optional email notify
    try {
      if (process.env.RESEND_API_KEY) {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: process.env.FROM_EMAIL || 'Dalin <hello@codebydalin.com>',
            to: process.env.TO_EMAIL || 'hello@codebydalin.com',
            subject: `Sale #${newCount}/30 - ${30-newCount} left at $12`,
            html: `<p>New sale via Selar! Total: ${newCount}/30, Remaining: ${30-newCount}</p>`
          })
        });
      }
    } catch {}
    return res.status(200).json({ ok: true, claimed: newCount, remaining: Math.max(0, 30-newCount) });
  } catch (e) {
    return res.status(200).json({ ok: false, error: 'KV not configured - enable Vercel KV', details: String(e) });
  }
}
