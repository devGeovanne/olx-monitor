import * as cheerio from "cheerio";
import { fetchWithRetry } from "./http";

export type OlxAd = {
  id: string;
  title: string;
  price?: string;
  location?: string;
  details?: string;
  link: string;
};

function extractIdFromUrl(url: string): string | null {
  const m = url.match(/-(\d+)(?:\?|$)/);
  return m?.[1] ?? null;
}

function normalizeLink(href: string): string {
  if (href.startsWith("http")) return href;
  if (href.startsWith("//")) return "https:" + href;
  if (href.startsWith("/")) return "https://www.olx.com.br" + href;
  return href;
}

export async function fetchOlxAds(listUrl: string, maxAds = 30): Promise<OlxAd[]> {
  const res = await fetchWithRetry(listUrl, { timeoutMs: 20000 });
  if (!res.ok) throw new Error(`OLX fetch failed: ${res.status} ${res.statusText}`);

  const html = await res.text();
  const $ = cheerio.load(html);

  const anchors = $('a[href*="df.olx.com.br/"]');

  const ads: OlxAd[] = [];

  anchors.each((_, el) => {
    const href = $(el).attr("href");
    const title = $(el).text().trim();
    if (!href) return;

    const link = normalizeLink(href);
    const id = extractIdFromUrl(link);
    if (!id) return;

    const card = $(el).closest("li, article, div");
    const cardText = card.text().replace(/\s+/g, " ").trim();

    const priceMatch = cardText.match(/R\$\s?[\d.]+(?:,\d{2})?/);
    const price = priceMatch?.[0];

    let location: string | undefined;
    const locMatch =
      cardText.match(/Brasília[^|•]{0,60}/i) ||
      cardText.match(/[A-Za-zÀ-ÿ\s]+,\s?[A-Za-zÀ-ÿ\s()]+/);

    if (locMatch) location = locMatch[0].trim();

    const detailParts: string[] = [];
    const km =
      cardText.match(/\b\d{1,3}(?:\.\d{3})+\s?km\b/i) ||
      cardText.match(/\b\d{2,6}\s?km\b/i);
    if (km) detailParts.push(km[0]);

    const change = cardText.match(/\bManual\b|\bAutomático\b/i);
    if (change) detailParts.push(change[0]);

    const fuel = cardText.match(/\bFlex\b|\bGasolina\b|\bÁlcool\b|\bDiesel\b/i);
    if (fuel) detailParts.push(fuel[0]);

    const details = detailParts.length ? detailParts.join(" · ") : undefined;

    if (!title || title.length < 6) return;

    ads.push({ id, title, price, location, details, link });
  });

  const uniq = new Map<string, OlxAd>();
  for (const ad of ads) {
    if (!uniq.has(ad.id)) uniq.set(ad.id, ad);
  }

  return Array.from(uniq.values()).slice(0, maxAds);
}
