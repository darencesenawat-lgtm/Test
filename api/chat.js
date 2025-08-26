export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const body = req.body || {};
    const messages = Array.isArray(body.messages) ? body.messages : [];
    if (messages.length === 0) return res.status(400).json({ error: 'messages is required' });

    const r = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({ model: 'gpt-4o-mini', input: messages })
    });

    const data = await r.json();
    const text = data?.output_text || (
      Array.isArray(data?.output) ? data.output.flatMap(o => (o.content || []))
        .map(c => (c.text && (c.text.value || c.text)) || '').join('').trim() : ''
    );

    return res.status(200).json({ reply: text || 'No reply.' });
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Server error' });
  }
}
