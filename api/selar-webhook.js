let memoryClaimed = 0;
module.exports = async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  memoryClaimed += 1;
  return res.status(200).json({ ok: true, claimed: memoryClaimed, remaining: Math.max(0, 30-memoryClaimed) });
};
