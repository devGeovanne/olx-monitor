import { Redis } from "@upstash/redis";

export type Vehicle = {
  name: string;
  url: string;
};

// cria o client só quando usar (evita build quebrar se env faltou)
let _redis: Redis | null = null;
function getRedis() {
  if (!_redis) _redis = Redis.fromEnv();
  return _redis;
}

const KEY_VEHICLES = "vehicles:list";
const KEY_ROTATION = "vehicles:rotationIndex";

export async function getVehicles(): Promise<Vehicle[]> {
  const v = await getRedis().get<Vehicle[]>(KEY_VEHICLES);
  return Array.isArray(v) ? v : [];
}

export async function setVehicles(vehicles: Vehicle[]) {
  await getRedis().set(KEY_VEHICLES, vehicles);
}

export async function getRotationIndex(): Promise<number> {
  const n = await getRedis().get<number>(KEY_ROTATION);
  return typeof n === "number" && Number.isFinite(n) ? n : 0;
}

export async function setRotationIndex(n: number) {
  await getRedis().set(KEY_ROTATION, n);
}

function seenKey(vehicleName: string) {
  return `seen:${vehicleName.toLowerCase()}`;
}

export async function wasSeen(vehicleName: string, adId: string): Promise<boolean> {
  const score = await getRedis().zscore(seenKey(vehicleName), adId);
  return score !== null && score !== undefined;
}

export async function markSeen(vehicleName: string, adId: string, ts: number) {
  await getRedis().zadd(seenKey(vehicleName), { score: ts, member: adId });
}

export async function pruneSeen(vehicleName: string, olderThanMs: number) {
  const cutoff = Date.now() - olderThanMs;
  await getRedis().zremrangebyscore(seenKey(vehicleName), 0, cutoff);
}
