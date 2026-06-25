import { amountDueCents, savingsLine } from "./checkout";

// A $50.00 cart checking out with the SAVE20 promo code.
const subtotalCents = 5000;

console.log("amountDueCents:", amountDueCents(subtotalCents, "SAVE20"));
console.log("savingsLine:", savingsLine(subtotalCents, "SAVE20"));
