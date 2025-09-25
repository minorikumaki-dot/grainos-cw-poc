export default async function handler(req, res) {
  try {
    const { text } = req.method === "POST" ? req.body : { text: req.query.text };
    if (!text) return res.status(400).json({ error: "text is required" });

    const apiKey = process.env.OPENAI_API_KEY;
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "次を3行で日本語要約。" },
          { role: "user", content: text }
        ]
      })
    }).then(r => r.json());

    const summary = r.choices?.[0]?.message?.content?.trim() || "(no result)";
    res.json({ summary });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
