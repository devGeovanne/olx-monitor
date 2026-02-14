import { mustEnv } from "./config";
import type { OlxAd } from "./olxParser";

function escapeHtml(s: string) {
  return s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

export async function sendTelegramAds(vehicleName: string, ads: OlxAd[]) {
  if (!ads.length) return;

  // Lê env aqui dentro pra não quebrar build
  const TELEGRAM_BOT_TOKEN = mustEnv("TELEGRAM_BOT_TOKEN");
  const TELEGRAM_CHAT_ID = mustEnv("TELEGRAM_CHAT_ID");

  const MAX_PER_RUN = 5;
  const slice = ads.slice(0, MAX_PER_RUN);

  const lines: string[] = [];
  lines.push(`<b>Novos anúncios: ${escapeHtml(vehicleName)}</b>`);
  lines.push("");

  for (const ad of slice) {
    lines.push(`<b>${escapeHtml(ad.title)}</b>`);
    if (ad.price) lines.push(`💰 ${escapeHtml(ad.price)}`);
    if (ad.location) lines.push(`📍 ${escapeHtml(ad.location)}`);
    if (ad.details) lines.push(`ℹ️ ${escapeHtml(ad.details)}`);
    lines.push(`<a href="${escapeHtml(ad.link)}">🔗 Abrir anúncio</a>`);
    lines.push("");
  }

  if (ads.length > MAX_PER_RUN) {
    lines.push(`(+${ads.length - MAX_PER_RUN} anúncios novos não mostrados para evitar spam)`);
  }

  const text = lines.join("\n");
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Telegram send failed: ${res.status} ${res.statusText} ${body}`);
  }
}
