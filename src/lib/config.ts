export const MAX_VEHICLES = 5;

/**
 * Lê env sem estourar no BUILD.
 * Só vai dar erro quando uma rota for chamada.
 */
export function mustEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

/**
 * Use esta função dentro de handlers/funções (não no topo do arquivo).
 */
export function getEnv() {
  return {
    TELEGRAM_BOT_TOKEN: mustEnv("TELEGRAM_BOT_TOKEN"),
    TELEGRAM_CHAT_ID: mustEnv("TELEGRAM_CHAT_ID"),
    CRON_SECRET: mustEnv("CRON_SECRET"),
  };
}
