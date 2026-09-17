let memoryLeads = [];
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method === 'GET') {
    try {
      const { kv } = await import('@vercel/kv');
      const leads = await kv.get('dalin_free_chapter_leads') || [];
      return res.status(200).json({ count: leads.length, ok: true });
    } catch {
      return res.status(200).json({ count: memoryLeads.length, ok: true });
    }
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { name, email, whatsapp } = req.body || {};
  if (!name || !email || !whatsapp) return res.status(400).json({ error: 'Required' });
  const lead = { name: name.trim(), email: email.trim().toLowerCase(), whatsapp: whatsapp.trim(), timestamp: new Date().toISOString() };
  try {
    const { kv } = await import('@vercel/kv');
    const existing = await kv.get('dalin_free_chapter_leads') || [];
    existing.push(lead);
    await kv.set('dalin_free_chapter_leads', existing);
  } catch { memoryLeads.push(lead); }
  return res.status(200).json({ ok: true, unlocked: true });
};
