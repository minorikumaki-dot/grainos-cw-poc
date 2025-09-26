export default function handler(req, res) {
  const text = req.query.text ?? "";
  res.status(200).json({ ok: true, received: text });
}
