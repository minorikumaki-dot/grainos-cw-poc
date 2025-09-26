import OpenAI from "openai";

export default async function handler(req, res) {
  try {
    const { text = "" } = req.method === "POST" ? req.body : req.query;
    if (!text) return res.status(400).json({ ok: false, error: "text is required" });

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const prompt = `以下を3点で要約し、最後に「決定事項」「ToDo(担当/期限)」を出力:
---
${text}
---`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
    });

    const summary = completion.choices?.[0]?.message?.content ?? "";
    return res.status(200).json({ ok: true, summary });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
}
