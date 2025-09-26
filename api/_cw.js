// api/_cw.js
export const config = { api: { bodyParser: true } };

const AGREE  = ["ok","了解","はい","承認","agree","合意","✅","👍","+1","y"];
const ABSTAIN= ["保留","abstain","⏸","△","hold"];

function hit(text, arr){ const t=(text||"").toLowerCase(); return arr.some(w=>t.includes(w.toLowerCase())); }

// 「合意の確認 #1234567890123 (v2)」から ID と version を抜く
function pickIdVer(s) {
  const m = (s||"").match(/合意の確認\s*#(\d{10,})\s*\(v(\d+)\)/);
  return m ? { id:m[1], v: parseInt(m[2],10) } : null;
}

// 引用部からフィールド抽出（主語/期限/要旨）
function pickFieldsFromQuote(qt) {
  const get = (label) => (qt.match(new RegExp(`${label}：([\\s\\S]*?)\\n`))||[])[1]?.trim();
  return {
    subject: get("主語") || "私",
    deadline: get("期限") || "—",
    gist: get("要旨") || ""
  };
}

// Chatwork投稿
async function cwPost(body) {
  const token  = process.env.CHATWORK_TOKEN;
  const roomId = process.env.CHATWORK_ROOM_ID;
  const resp = await fetch(`https://api.chatwork.com/v2/rooms/${roomId}/messages`, {
    method: "POST",
    headers: { "X-ChatWorkToken": token, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ body })
  });
  return resp.ok ? resp.json() : Promise.reject(new Error(await resp.text()));
}

export default async function handler(req, res) {
  try {
    // 簡易トークン検証（Webhook設定で同じ値を入れておく）
    const expected = process.env.CW_WEBHOOK_TOKEN;
    const got = req.headers["x-chatworkwebhooktoken"];
    if (expected && got !== expected) return res.status(401).json({ ok:false, error:"invalid token" });

    // ChatworkのWebhook payload はプランで差異あり ⇒ 汎用的に拾う
    const p = req.body || {};
    const text  = p.webhook_event?.body?.message || p.body?.message || p.message || p.body || "";
    const quote = p.webhook_event?.body?.quoted_message || p.quoted_message || text;
    const who   = p.webhook_event?.account?.name || p.account?.name || "（不明なユーザー）";

    if (!text) return res.json({ ok:true, skipped:true });

    // 紐づけ（ID, version）
    const idver = pickIdVer(quote) || pickIdVer(text);
    if (!idver) return res.json({ ok:true, skipped:true });

    // 判定：合意／保留／修正
    const isAgree   = hit(text, AGREE);
    const isAbstain = hit(text, ABSTAIN);
    const isEdit    = /^ *(修正|fix)\s*[:：]/i.test(text);

    if (!isAgree && !isAbstain && !isEdit) {
      return res.json({ ok:true, skipped:true });
    }

    if (isAgree || isAbstain) {
      const msg = (isAgree)
        ? `✅ ${who} が合意しました（#${idver.id} v${idver.v}）`
        : `⏸ ${who} が保留しました（#${idver.id} v${idver.v}）`;
      await cwPost(msg);
      return res.json({ ok:true, id:idver.id, version:idver.v, decision: isAgree ? "agree" : "abstain" });
    }

    // ✏️手直し：引用から subject / deadline を引き継ぎ、要旨だけ差し替え
    const fields = pickFieldsFromQuote(quote);
    const newGist = text.replace(/^ *(修正|fix)\s*[:：]/i, "").trim();
    if (!newGist) return res.json({ ok:false, error:"修正内容が空です" });

    const nv = idver.v + 1;
    const body = [
      `[info][title]合意の確認 #${idver.id} (v${nv})[/title]`,
      `主語：${fields.subject}`,
      `期限：${fields.deadline}`,
      `要旨：${newGist}`,
      ``,
      `このメッセージに **返信** で「ok」または「保留」または「修正: ...」と送ってください。`,
      `[/info]`
    ].join("\n");

    await cwPost(`✏️ ${who} が修正案を投稿しました（#${idver.id} v${nv}）`);
    await cwPost(body);

    return res.json({ ok:true, id:idver.id, version:nv, edited_by: who, gist:newGist });
  } catch (e) {
    return res.status(500).json({ ok:false, error: e.message });
  }
}
