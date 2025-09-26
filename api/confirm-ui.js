// api/confirm-ui.js
export default async function handler(req, res) {
  const { subject = "（未設定）", due = "", gist = "", id = Date.now() } = req.query || {};
  const base = process.env.APP_BASE_URL;

  const agreeUrl  = `${base}/api/confirm?action=agree&id=${id}&subject=${encodeURIComponent(subject)}&due=${encodeURIComponent(due)}&gist=${encodeURIComponent(gist)}`;
  const abstainUrl= `${base}/api/confirm?action=abstain&id=${id}&subject=${encodeURIComponent(subject)}&due=${encodeURIComponent(due)}&gist=${encodeURIComponent(gist)}`;

  res.setHeader("Content-Type","text/html; charset=utf-8");
  res.status(200).send(`
<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1">
<title>合意の確認</title>
<style>
body{font-family:system-ui,-apple-system,Segoe UI,Roboto;max-width:640px;margin:24px auto;padding:0 16px;}
.card{border:1px solid #eee;border-radius:12px;padding:16px;box-shadow:0 2px 8px #0001}
h1{font-size:18px;margin:0 0 8px}
.kv{margin:6px 0;color:#444}
.btns{display:flex;gap:12px;margin-top:16px}
a.btn{display:inline-block;padding:10px 14px;border-radius:10px;text-decoration:none}
a.primary{background:#2563eb;color:#fff}
a.ghost{border:1px solid #aaa;color:#333}
small{color:#666}
</style>
<div class="card">
  <h1>合意の確認</h1>
  <div class="kv"><b>主語</b>：${subject}</div>
  <div class="kv"><b>期限</b>：${due || "—"}</div>
  <div class="kv"><b>要旨</b>：${gist}</div>
  <div class="btns">
    <a class="btn primary" href="${agreeUrl}">✅ 合意する</a>
    <a class="btn ghost"   href="${abstainUrl}">⏸ 保留（Abstain）</a>
  </div>
  <p><small>ID: ${id}</small></p>
</div>`);
}
