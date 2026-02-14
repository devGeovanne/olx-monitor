import { Redis } from "@upstash/redis";

export const redis = Redis.fromEnv();

export type Vehicle = {
  name: string;
  url: string;
};

const KEY_VEHICLES = "vehicles:list";
const KEY_ROTATION = "vehicles:rotationIndex";

export async function getVehicles(): Promise<Vehicle[]> {
  const v = await redis.get<Vehicle[]>(KEY_VEHICLES);
  return Array.isArray(v) ? v : [];
}

export async function setVehicles(vehicles: Vehicle[]) {
  await redis.set(KEY_VEHICLES, vehicles);
}

export async function getRotationIndex(): Promise<number> {
  const n = await redis.get<number>(KEY_ROTATION);
  return typeof n === "number" && Number.isFinite(n) ? n : 0;
}

export async function setRotationIndex(n: number) {
  await redis.set(KEY_ROTATION, n);
}

function seenKey(vehicleName: string) {
  return `seen:${vehicleName.toLowerCase()}`;
}

export async function wasSeen(vehicleName: string, adId: string): Promise<boolean> {
  const score = await redis.zscore(seenKey(vehicleName), adId);
  return score !== null && score !== undefined;
}

export async function markSeen(vehicleName: string, adId: string, ts: number) {
  await redis.zadd(seenKey(vehicleName), { score: ts, member: adId });
}

export async function pruneSeen(vehicleName: string, olderThanMs: number) {
  const cutoff = Date.now() - olderThanMs;
  await redis.zremrangebyscore(seenKey(vehicleName), 0, cutoff);
}
