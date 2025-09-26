// api/summarize-and-post.js
import { cwPost } from "./_cw";

export default async function handler(req, res) {
  try {
    const text = (req.method === "POST") ? (await req.json?.()?.text ?? "") : (req.query?.text ?? "");
    if (!text) return res.status(400).json({ ok:false, error:"text is required" });

    // ---- 1) 要約（MOCKモードあり）
    let summaryBlock;
    if (process.env.MOCK_OPENAI === "1") {
      summaryBlock = {
        summary: "（MOCK）要約：ポイント3つに整理 / 決定事項 / ToDo抽出",
        decisions: ["（MOCK）決定A","（MOCK）決定B"],
        todos: [{who:"Aさん", due:"10/15", gist:"（MOCK）ドキュメント化"}]
      };
    } else {
      // 既存 /api/summary のロジックを直書き or fetch で再利用でもOK
      const completion = await fetch(`${process.env.APP_BASE_URL}/api/summary?text=${encodeURIComponent(text)}`);
      const js = await completion.json();
      if (!js.ok) throw new Error(js.error || "summary failed");
      summaryBlock = js; // { ok:true, summary:"..." } 想定
    }

    // ---- 2) 合意カードのリンクを作る
    const subject = summaryBlock.todos?.[0]?.who || "私";
    const due     = summaryBlock.todos?.[0]?.due || "";
    const gist    = summaryBlock.todos?.[0]?.gist || "要旨未設定";
    const confirmUi = `${process.env.APP_BASE_URL}/api/confirm-ui?subject=${encodeURIComponent(subject)}&due=${encodeURIComponent(due)}&gist=${encodeURIComponent(gist)}`;

    // ---- 3) Chatworkに投稿（リンクボタン方式）
    const body = `[info][title]要約[/title]${summaryBlock.summary || "（要約）"}
[hr]合意の確認 → [link=${confirmUi}]こちらを開く[/link][/info]`;

    const posted = await cwPost(body);
    return res.status(200).json({ ok:true, posted, confirmUi, preview: body });

  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok:false, error:String(e?.message || e) });
  }
}
