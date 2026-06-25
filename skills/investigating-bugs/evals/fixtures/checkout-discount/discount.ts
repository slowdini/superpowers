export type PromoCode = "SAVE20" | "HALFOFF";

const PERCENT_OFF: Record<string, number> = {
  SAVE20: 20,
  HALFOFF: 50,
};

export function lookupPercentOff(code: string | undefined): number {
  if (!code) return 0;
  return PERCENT_OFF[code] ?? 0;
}
