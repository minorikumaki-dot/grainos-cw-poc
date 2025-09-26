// api/_cw.js
export async function cwPost(message, roomId = process.env.CHATWORK_ROOM_ID) {
  const token = process.env.CHATWORK_TOKEN;
  if (!token || !roomId) {
    console.error("CHATWORK_TOKEN/ROOM_ID missing");
    return { ok: false, error: "Chatwork env missing" };
  }
  const url = `https://api.chatwork.com/v2/rooms/${roomId}/messages`;
  const body = new URLSearchParams({ body: message });
  const res = await fetch(url, {
    method: "POST",
    headers: { "X-ChatWorkToken": token, "Content-Type": "application/x-www-form-urlencoded" },
    body
  });
  if (!res.ok) {
    const txt = await res.text();
    console.error("Chatwork error:", res.status, txt);
    return { ok: false, status: res.status, error: txt };
  }
  return { ok: true, result: await res.json() };
}
