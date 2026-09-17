import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(200).json({ ok: true, note: 'Waiting for POST' });
  
  let claimed = await kv.get('dalin_discount_claimed') || 0;
  if (claimed < 30) {
    claimed += 1;
    await kv.set('dalin_discount_claimed', claimed);
  }
  
  return res.status(200).json({ ok: true, claimed, remaining: Math.max(0, 30-claimed) });
}
