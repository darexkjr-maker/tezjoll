import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  const secret = req.query.secret;
  if (secret !== 'dalin123') {
    return res.status(401).json({ error: 'Use ?secret=dalin123&set=7' });
  }
  if (req.query.set === undefined) {
    const current = await kv.get('dalin_discount_claimed') || 0;
    return res.status(200).json({ current, remaining: Math.max(0, 30-current), usage: 'Add &set=NUMBER' });
  }
  const num = parseInt(req.query.set, 10);
  if (isNaN(num) || num < 0 || num > 30) return res.status(400).json({ error: 'set 0-30' });
  await kv.set('dalin_discount_claimed', num);
  return res.status(200).json({ ok: true, claimed: num, remaining: Math.max(0, 30-num) });
}
