import { NextRequest, NextResponse } from "next/server";
import { getVehicles, setVehicles, type Vehicle } from "@/src/lib/redis";
import { MAX_VEHICLES, mustEnv } from "@/src/lib/config";

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  if (key !== mustEnv("CRON_SECRET")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const vehicles = await getVehicles();
  return NextResponse.json({ vehicles, limit: MAX_VEHICLES });
}

export async function POST(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  if (key !== mustEnv("CRON_SECRET")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as Partial<Vehicle>;
  const name = body.name?.trim();
  const url = body.url?.trim();

  if (!name || !url) {
    return NextResponse.json({ error: "name and url required" }, { status: 400 });
  }

  const vehicles = await getVehicles();
  const exists = vehicles.some((v) => v.name.toLowerCase() === name.toLowerCase());

  if (!exists && vehicles.length >= MAX_VEHICLES) {
    return NextResponse.json(
      { error: `limit reached (${MAX_VEHICLES}). remove one first.` },
      { status: 400 }
    );
  }

  const next = exists
    ? vehicles.map((v) => (v.name.toLowerCase() === name.toLowerCase() ? { name, url } : v))
    : [...vehicles, { name, url }];

  await setVehicles(next);
  return NextResponse.json({ ok: true, vehicles: next });
}

export async function DELETE(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  if (key !== mustEnv("CRON_SECRET")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const name = req.nextUrl.searchParams.get("name");
  if (!name) {
    return NextResponse.json({ error: "name required" }, { status: 400 });
  }

  const vehicles = await getVehicles();
  const next = vehicles.filter((v) => v.name.toLowerCase() !== name.toLowerCase());
  await setVehicles(next);

  return NextResponse.json({ ok: true, vehicles: next });
}
