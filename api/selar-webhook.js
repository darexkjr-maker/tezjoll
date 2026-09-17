import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  
  // Allow both GET (testing) and POST (Zapier/Selar)
  let claimed = await kv.get('dalin_discount_claimed') || 0;
  
  if (claimed < 30) {
    claimed += 1;
    await kv.set('dalin_discount_claimed', claimed);
  }
  
  return res.status(200).json({ 
    ok: true, 
    claimed, 
    remaining: Math.max(0, 30 - claimed),
    source: 'zapier'
  });
}
