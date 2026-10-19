import { formatUsdc } from "../stellar/decode.js";

export interface DisplayUsdoptions {
  /** Minimum number of decimal places to keep after trimming trailing zeros. */
  minDecimals?: number;
  /** Maximum number of decimal places to render. */
  maxDecimals?: number;
}

const USDC_DECIMALS = 7;

const DEFAULT_MIN_DECIMALS = 2;
const DEFAULT_MAX_DECIMALS = 7;

/**
 * Format a USDC amount (in stroops, 7 decimals) for human-readable display in
 * notifications. Adds thousands separators to the integer part and trims
 * trailing zeros down to (or up to) the configured decimal bounds.
 *
 * This function never converts the amount to a JavaScript `number`, so it
 * remains exact for very large values (>> 2^63) and sub-cent amounts.
 *
 * @param units - USDC amount in stroops (as bigint or decimal string).
 * @param options - Decimal bounds for the output.
 * @returns The formatted amount without the "USDC" suffix.
 */
export function displayUsdc(
  units: bigint | string,
  options: DisplayUsdcOptions = {},
): string {
  const minDecimals = clampDecimals(
    options.minDecimals ?? DEFAULT_MIN_DECIMALS,
  );
  const maxDecimals = clampDecimals(
    options.maxDecimals ?? DEFAULT_MAX_DECIMALS,
  );

  if (minDecimals > maxDecimals) {
    throw new RangeError(
      `minDecimals (${minDecimals}) must be <= maxDecimals (${maxDecimals})`,
    );
  }

  const value = toBigInt(units);
  const negative = value < 0n;
  const abs = negative ? -value : value;

  const scale = 10n ** BigInt(USDC_DECIMALS);
  const integerPart = abs / scale;
  const fractionPart = abs % scale;

  // Pad the fraction to full 7 digits, then apply the max decimal cap.
  const fullFraction = fractionPart.toString().padStart(USDC_DECIMALS, "0");
  const cappedFraction = fullFraction.slice(0, maxDecimals);

  // Trim trailing zeros but keep at least minDecimals digits.
  let trimmedFraction = cappedFraction.replace(/0+$/, "");
  if (trimmedFraction.length < minDecimals) {
    trimmedFraction = cappedFraction.slice(0, minDecimals);
  }

  const groupedInteger = groupThousands(integerPart.toString());

  const sign = negative ? "-" : "";
  if (trimmedFraction.length > 0) {
    return `${sign}${groupedInteger}.${trimmedFraction}`;
  }
  return `${sign}${groupedInteger}`;
}

/**
 * Format a USDC amount for display and append the "USDC" suffix.
 */
export function displayUsdcFormatted(
  units: bigint | string,
  options: DisplayUsdcOptions = {},
): string {
  return `${displayUsdc(units, options)} USDC`;
}

function clampDecimals(value: number): number {
  if (!Number.isInteger(value) || value < 0) {
    throw new RangeError(`decimal count must be a non-negative integer, got ${value}`);
  }
  if (value > USDC_DECIMALS) {
    return USDC_DECIMALS;
  }
  return value;
}

function toBigInt(units: bigint | string): bigint {
  if (typeof units === "bigint") {
    return units;
  }
  if (typeof units === "string") {
    const trimmed = units.trim();
    if (!/^-?\d+$/.test(trimmed)) {
      throw new TypeError(`invalid USDC units string: ${JSON.stringify(units)}`);
    }
    return BigInt(trimmed);
  }
  throw new TypeError(
    `USDC units must be a bigint or decimal string, got ${typeof units}`,
  );
}

function groupThousands(digits: string): string {
  let out = "";
  for (let i = 0; i < digits.length; i++) {
    if (i > 0 && (i - digits.length) % 3 === 0) {
      out += ",";
    }
    out += digits[i];
  }
  return out;
}
