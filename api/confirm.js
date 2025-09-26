export default async function handler(req, res) {
  const body = req.method === "POST" ? req.body : req.query;
  const { subject = "", deadline = "", gist = "" } = body;

  if (!subject || !deadline || !gist) {
    return res.status(400).json({
      ok: false,
      error: "subject, deadline, gist は必須です",
    });
  }

  const card = {
    type: "agreement-card",
    title: "合意の確認",
    fields: [
      { label: "主語", value: subject },
      { label: "期限", value: deadline },
      { label: "要旨", value: gist },
    ],
    actions: [
      { id: "agree", label: "合意する" },
      { id: "abstain", label: "保留(Abstain)" },
    ],
  };

  return res.status(200).json({ ok: true, card });
}
