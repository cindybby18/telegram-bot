import test from "node:test";
import assert from "node:assert";

import {
  displayUsdc,
  displayUsdcFormatted,
} from "../src/notifications/amount-display.js";

test("displayUsdc formats zero", () => {
  assert.strictEqual(displayUsdc(0n), "0.00");
});

test("displayUsdc formats whole amounts with min decimals", () => {
  // 12 345.5000000 stroops -> 12,345.50
  assert.strictEqual(displayUsdc(12344500000n), "12,345.50");
});

test("displayUsdc groups large amounts", () => {
  // 1 234 567.8900000 stroops
  assert.strictEqual(displayUsdc(1234567890000n, { minDecimals: 0 }), "1,234,567.89");
});

test("displayUsdc trims trailing zeros down to minDecimals", () => {
  assert.strictEqual(displayUsdc(10000000n, { minDecimals: 0 }), "1");
  assert.strictEqual(displayUsdc(10000000n, { minDecimals: 2 }), "1.00");
});

test("displayUsdc respects maxDecimals", () => {
  // 0.1234567 -> truncated to 2 decimals
  assert.strictEqual(
    displayUsdc(1234567n, { minDecimals: 0, maxDecimals: 2 }),
    "0.12",
  );
});

test("displayUsdc renders sub-cent amounts", () => {
  // 1 stroop = 0.0000001 USDC
  assert.strictEqual(displayUsdc(1n, { minDecimals: 0 }), "0.0000001");
  // With a max cap of 2 decimals the value truncates to zero.
  assert.strictEqual(
    displayUsdc(1n, { minDecimals: 0, maxDecimals: 2 }),
    "0.00",
  );
});

test("displayUsdc handles amounts larger than 2^63", () => {
  const huge = (1n << 64n) + 123456789000000n ; // > 2^63
  assert.strictEqual(
    displayUsdc(huge, { minDecimals: 0 }),
    "18,446,744,073,709,551.613",
  );
});

test("displayUsdc accepts decimal string input", () => {
  assert.strictEqual(displayUsdc("12345678900000", { minDecimals: 0 }), "1,234,567.89");
});

test("displayUsdc handles negative amounts", () => {
  assert.strictEqual(displayUsdc(-1234567890000n, { minDecimals: 0 }), "-1,234.56789");
});

test("displayUsdc rejects invalid input", () => {
  assert.throws(() => displayUsdc("1.5"), TypeError);
  assert.throws(() => displayUsdc("123"), TypeError);
  assert.throws(() => displayUsdc(1.5), TypeError);
});

test("displayUsdc rejects invalid decimal bounds", () => {
  assert.throws(() => displayUsdc(1n, { minDecimals: 3, maxDecimals: 2 }), RangeError);
  assert.throws(() => displayUsdc(1n, { minDecimals: -1 }), RangeError);
});

test("displayUsdcFormatted appends the USDC suffix", () => {
  assert.strictEqual(displayUsdcFormatted(12344500000n), "12,345.50 USDC");
});
