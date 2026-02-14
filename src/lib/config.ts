export const MAX_VEHICLES = 5;

export function mustEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export const ENV = {
  TELEGRAM_BOT_TOKEN: mustEnv("TELEGRAM_BOT_TOKEN"),
  TELEGRAM_CHAT_ID: mustEnv("TELEGRAM_CHAT_ID"),
  CRON_SECRET: mustEnv("CRON_SECRET"),
};
