import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  const secret = req.query.secret;
  const setValue = req.query.set;

  if (secret !== 'dalin123') {
    return res.status(401).json({ error: 'Unauthorized. Use ?secret=dalin123&set=7' });
  }

  if (req.query.set === undefined) {
    const current = await kv.get('dalin_discount_claimed') || 0;
    return res.status(200).json({ 
      current,
      remaining: Math.max(0, 30 - current),
      usage: 'Add &set=NUMBER. Example: ?secret=dalin123&set=7 for 23 left'
    });
  }

  const num = parseInt(setValue, 10);
  if (isNaN(num) || num < 0 || num > 30) {
    return res.status(400).json({ error: 'set must be 0-30' });
  }

  await kv.set('dalin_discount_claimed', num);
  const remaining = Math.max(0, 30 - num);

  return res.status(200).json({ 
    ok: true,
    claimed: num,
    remaining,
    active: remaining > 0,
    message: `${remaining} left at $12`
  });
}
