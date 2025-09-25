// trigger deploy
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
          { role: "system", content:
            "入力から『主語(誰が)』『期限(いつまでに)』『要旨(何をする/何が決まった)』を日本語で1カードに整形。欠けている要素は『未確定』と明示。出力はJSONで。keys: subject, deadline, gist"
          },
          { role: "user", content: text }
        ]
      })
    }).then(r => r.json());

    const content = r.choices?.[0]?.message?.content;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(content || JSON.stringify({ subject:"未確定", deadline:"未確定", gist:"未確定" }));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
