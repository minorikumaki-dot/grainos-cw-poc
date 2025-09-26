// api/propose.js
async function summarizeIfNeeded({ text, gist }) {
  if (!text || gist) return gist || "";
  if (process.env.MOCK_OPENAI === "1") {
    return "（MOCK）要約：主要な決定点・タスク・期限を3行で整理。";
  }
  const apiKey = process.env.OPENAI_API_KEY;
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "会議・チャットの要点を3〜5行で簡潔に日本語要約してください。箇条書き可。" },
        { role: "user", content: text.slice(0, 8000) }
      ],
      temperature: 0.2
    })
  });
  const j = await r.json();
  return j.choices?.[0]?.message?.content?.trim() || "";
}

export default async function handler(req, res) {
  try {
    const token  = process.env.CHATWORK_TOKEN;
    const roomId = process.env.CHATWORK_ROOM_ID;
    if (!token || !roomId) return res.status(500).json({ ok:false, error:"CHATWORK_* env missing" });

    const q = req.method === "POST" ? await req.json?.() : req.query;
    let { subject = "私", deadline = "—", gist = "", text = "" } = q || {};

    // 要約（任意）
    gist = await summarizeIfNeeded({ text, gist });
    if (!gist) return res.status(400).json({ ok:false, error:"gist か text を渡してください" });

    const id = Date.now().toString();
    const v  = 1;

    const body = [
      `[info][title]合意の確認 #${id} (v${v})[/title]`,
      `主語：${subject}`,
      `期限：${deadline}`,
      `要旨：${gist}`,
      ``,
      `このメッセージに **返信** で「ok」または「保留」または「修正: ...」と送ってください。`,
      `（例：ok / 了解 / ✅ / 保留 / abstain / ⏸ / 修正: 要旨を〇〇に変更）`,
      `[/info]`
    ].join("\n");

    const resp = await fetch(`https://api.chatwork.com/v2/rooms/${roomId}/messages`, {
      method: "POST",
      headers: { "X-ChatWorkToken": token, "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ body })
    });

    if (!resp.ok) return res.status(500).json({ ok:false, error: await resp.text() });
    const posted = await resp.json();
    res.json({ ok:true, id, version:v, message_id: posted?.message_id, subject, deadline, gist });
  } catch (e) {
    res.status(500).json({ ok:false, error: e.message });
  }
}
