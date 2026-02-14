import { NextRequest, NextResponse } from "next/server";
import { mustEnv } from "@/src/lib/config";
import {
  getVehicles,
  getRotationIndex,
  setRotationIndex,
  wasSeen,
  markSeen,
  pruneSeen,
} from "@/src/lib/redis";
import { fetchOlxAds } from "@/src/lib/olxParser";
import { sendTelegramAds } from "@/src/lib/telegram";

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  const mode = req.nextUrl.searchParams.get("mode") ?? "rotate";

  if (key !== mustEnv("CRON_SECRET")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const vehicles = await getVehicles();

    if (!vehicles.length) {
      return NextResponse.json(
        {
          ok: true,
          message:
            "Nenhum veículo cadastrado. Use /api/vehicles (POST) para cadastrar (limite 5).",
        },
        { status: 200 }
      );
    }

    const targets =
      mode === "all"
        ? vehicles
        : [vehicles[(await getRotationIndex()) % vehicles.length]];

    if (mode !== "all") {
      const idx = await getRotationIndex();
      await setRotationIndex((idx + 1) % vehicles.length);
    }

    const results: any[] = [];

    for (const v of targets) {
      await pruneSeen(v.name, 14 * 24 * 60 * 60 * 1000);

      const ads = await fetchOlxAds(v.url, 30);

      const newAds = [];
      for (const ad of ads) {
        if (!(await wasSeen(v.name, ad.id))) {
          newAds.push(ad);
        }
      }

      const now = Date.now();
      for (const ad of newAds) {
        await markSeen(v.name, ad.id, now);
      }

      if (newAds.length) {
        await sendTelegramAds(v.name, newAds);
      }

      results.push({ vehicle: v.name, found: ads.length, new: newAds.length });
    }

    return NextResponse.json({ ok: true, mode, results }, { status: 200 });
  } catch (err: any) {
    console.error("check error", err);
    return NextResponse.json(
      { ok: false, error: err?.message ?? "unknown error" },
      { status: 500 }
    );
  }
}
