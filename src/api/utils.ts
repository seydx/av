/**
 * Parse bitrate string to bigint.
 *
 * Supports suffixes: K (kilo), M (mega), G (giga).
 *
 * Converts human-readable bitrate strings to numeric values.
 *
 * @param str - Bitrate string (e.g., '5M', '192k')
 *
 * @returns Bitrate as bigint
 *
 * @example
 * ```typescript
 * parseBitrate('5M')   // 5000000n
 * parseBitrate('192k') // 192000n
 * parseBitrate('1.5G') // 1500000000n
 * ```
 */
export function parseBitrate(str: string): bigint {
  const match = /^(\d+(?:\.\d+)?)\s*([KMG])?$/i.exec(str);
  if (!match) {
    throw new Error(`Invalid bitrate: ${str}`);
  }

  let value = parseFloat(match[1]);
  const unit = match[2]?.toUpperCase();

  switch (unit) {
    case 'K':
      value *= 1000;
      break;
    case 'M':
      value *= 1000000;
      break;
    case 'G':
      value *= 1000000000;
      break;
  }

  return BigInt(Math.floor(value));
}
