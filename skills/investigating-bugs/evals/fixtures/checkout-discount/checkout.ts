import { lookupPercentOff } from "./discount";

// Returns the amount the customer still owes, in cents, after any promo code.
export function amountDueCents(subtotalCents: number, code?: string): number {
  const percentOff = lookupPercentOff(code);
  const discountCents = subtotalCents * percentOff;
  return subtotalCents - discountCents;
}

// Receipt line shown to the customer summarising what the promo saved them.
export function savingsLine(subtotalCents: number, code?: string): string {
  const percentOff = lookupPercentOff(code);
  const savedCents = subtotalCents * percentOff;
  return `You saved $${(savedCents / 100).toFixed(2)}`;
}
