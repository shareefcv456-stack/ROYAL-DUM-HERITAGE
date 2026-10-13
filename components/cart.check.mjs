// Run: npm run check. Totals and the order message, the parts of the shop that handle money.
import assert from "node:assert/strict";
import { ADDONS, COMBOS, DISHES, comboPrice, inr, orderMessage, pinStatus, totals } from "./cart.js";

const chicken = DISHES.find((d) => d.id === "chicken");
const raita = ADDONS.find((d) => d.id === "raita");
const t = totals({ chicken: 2, raita: 3, nope: 4 });
assert.equal(t.count, 5, "unknown ids are ignored");
assert.equal(t.total, 2 * chicken.price + 3 * raita.price);
assert.deepEqual(totals({}), { count: 0, total: 0, lines: [] });

const msg = orderMessage({ ref: "RDH-TEST", ...t, fulfil: "delivery", details: { name: "A", phone: "9999999999", address: "1 Road", landmark: "", notes: "", pin: "673001" } });
assert.match(msg, /2 × Chicken Dum Biriyani/);
assert.ok(msg.includes(`Items total: ${inr(t.total)}`) && msg.includes("Delivery fee: to be confirmed"));
assert.match(msg, /Delivery to: 1 Road, PIN 673001/);
assert.equal(pinStatus("67300"), "bad");
assert.equal(pinStatus("abc123"), "bad");
assert.equal(pinStatus(" 673001 "), "ok", "no areas listed → any valid PIN");
assert.doesNotMatch(orderMessage({ ref: "R", ...t, fulfil: "pickup", details: { name: "A", phone: "1" } }), /Delivery to/);
// A combo without a set price costs exactly the sum of its items (no invented discount).
const family = COMBOS.find((c) => c.id === "family");
assert.equal(comboPrice(family), totals(family.items).total);
assert.equal(comboPrice({ ...family, price: 999 }), 999);
console.log("cart ok");
