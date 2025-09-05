import { bindings } from '../../lib/binding.js';

import type { AVRounding } from '../../constants/constants.js';
import type { IRational } from '../../lib/types.js';

/**
 * Timestamp and time base utilities.
 *
 * Provides static methods for converting, rescaling, and comparing timestamps.
 * These utilities are essential for working with different time bases in
 * multimedia streams.
 *
 * @example
 * ```typescript
 * import { TimestampUtils } from 'node-av';
 * import { AV_ROUND_NEAR_INF } from 'node-av/constants';
 *
 * // Convert timestamp to string representations
 * const pts = 450000n;
 * console.log(TimestampUtils.toString(pts));                    // "450000"
 *
 * const timebase = { num: 1, den: 90000 };
 * console.log(TimestampUtils.toTimeString(pts, timebase));      // "5.000000"
 *
 * // Rescale between time bases
 * const srcTb = { num: 1, den: 90000 };
 * const dstTb = { num: 1, den: 1000 };
 * const rescaled = TimestampUtils.rescale(pts, srcTb, dstTb);
 * console.log(rescaled);                                         // 5000n
 * ```
 */
export class TimestampUtils {
  // Private constructor to prevent instantiation
  private constructor() {}

  /**
   * Convert timestamp to string.
   *
   * Converts a timestamp value to its string representation.
   * Handles special values like AV_NOPTS_VALUE.
   * Direct mapping to av_ts2str()
   *
   * @param ts - Timestamp value (bigint or number), or null
   * @returns String representation
   *
   * @example
   * ```typescript
   * import { TimestampUtils } from 'node-av';
   * import { AV_NOPTS_VALUE } from 'node-av/constants';
   *
   * console.log(TimestampUtils.toString(12345n));        // "12345"
   * console.log(TimestampUtils.toString(AV_NOPTS_VALUE)); // "NOPTS"
   * console.log(TimestampUtils.toString(null));          // "NOPTS"
   * ```
   */
  static toString(ts: bigint | number | null): string {
    return bindings.avTs2Str(ts);
  }

  /**
   * Convert timestamp to time string.
   *
   * Converts a timestamp to a time string in seconds using the provided time base.
   * Direct mapping to av_ts2timestr()
   *
   * @param ts - Timestamp value
   * @param timeBase - Time base for conversion
   * @returns Time string in seconds with decimal places
   *
   * @example
   * ```typescript
   * import { TimestampUtils } from 'node-av';
   *
   * const pts = 450000n;
   * const timebase = { num: 1, den: 90000 }; // 90kHz
   *
   * console.log(TimestampUtils.toTimeString(pts, timebase));     // "5.000000"
   * console.log(TimestampUtils.toTimeString(90000n, timebase));  // "1.000000"
   * ```
   */
  static toTimeString(ts: bigint | number | null, timeBase: IRational): string {
    return bindings.avTs2TimeStr(ts, timeBase);
  }

  /**
   * Compare timestamps from different time bases.
   *
   * Compares two timestamps that may have different time bases.
   * Direct mapping to av_compare_ts()
   *
   * @param tsA - First timestamp
   * @param tbA - Time base of first timestamp
   * @param tsB - Second timestamp
   * @param tbB - Time base of second timestamp
   * @returns -1 if tsA < tsB, 0 if equal, 1 if tsA > tsB
   *
   * @example
   * ```typescript
   * import { TimestampUtils } from 'node-av';
   *
   * // Compare timestamps from different time bases
   * const pts1 = 90000n;
   * const tb1 = { num: 1, den: 90000 };  // 1 second in 90kHz
   *
   * const pts2 = 1000n;
   * const tb2 = { num: 1, den: 1000 };   // 1 second in 1kHz
   *
   * const result = TimestampUtils.compare(pts1, tb1, pts2, tb2);
   * console.log(result); // 0 (equal - both represent 1 second)
   * ```
   */
  static compare(tsA: bigint | number | null, tbA: IRational, tsB: bigint | number | null, tbB: IRational): number {
    return bindings.avCompareTs(tsA, tbA, tsB, tbB);
  }

  /**
   * Rescale timestamp from one time base to another.
   *
   * Converts a timestamp from source time base to destination time base.
   * Uses AV_ROUND_NEAR_INF rounding.
   * Direct mapping to av_rescale_q()
   *
   * @param a - Timestamp to rescale
   * @param bq - Source time base
   * @param cq - Destination time base
   * @returns Rescaled timestamp
   *
   * @example
   * ```typescript
   * import { TimestampUtils } from 'node-av';
   *
   * // Convert from 90kHz to milliseconds
   * const pts = 450000n;
   * const srcTb = { num: 1, den: 90000 };
   * const dstTb = { num: 1, den: 1000 };
   *
   * const rescaled = TimestampUtils.rescale(pts, srcTb, dstTb);
   * console.log(rescaled); // 5000n (5000 milliseconds = 5 seconds)
   * ```
   */
  static rescale(a: bigint | number | null, bq: IRational, cq: IRational): bigint {
    return bindings.avRescaleQ(a, bq, cq);
  }

  /**
   * Rescale with specified rounding.
   *
   * Rescales a value with explicit rounding mode.
   * More general than rescale() as it doesn't use time bases.
   * Direct mapping to av_rescale_rnd()
   *
   * @param a - Value to rescale
   * @param b - Multiplier
   * @param c - Divisor
   * @param rnd - Rounding mode
   * @returns Rescaled value: a * b / c
   *
   * @example
   * ```typescript
   * import { TimestampUtils } from 'node-av';
   * import { AV_ROUND_UP, AV_ROUND_DOWN } from 'node-av/constants';
   *
   * // Scale with different rounding modes
   * const value = 100n;
   * const mul = 3n;
   * const div = 7n;
   *
   * const roundUp = TimestampUtils.rescaleRounded(value, mul, div, AV_ROUND_UP);
   * const roundDown = TimestampUtils.rescaleRounded(value, mul, div, AV_ROUND_DOWN);
   *
   * console.log(roundUp);   // 43n (rounds up)
   * console.log(roundDown); // 42n (rounds down)
   * ```
   */
  static rescaleRounded(a: bigint | number, b: bigint | number, c: bigint | number, rnd: AVRounding): bigint {
    return bindings.avRescaleRnd(a, b, c, rnd);
  }

  /**
   * Sleep for specified microseconds.
   *
   * Sleeps for the specified number of microseconds.
   * Direct mapping to av_usleep()
   *
   * @param usec - Microseconds to sleep
   *
   * @example
   * ```typescript
   * import { TimestampUtils } from 'node-av';
   *
   * // Sleep for 100 milliseconds
   * TimestampUtils.sleep(100000);
   *
   * // Sleep for 1 second
   * TimestampUtils.sleep(1000000);
   * ```
   */
  static sleep(usec: number): void {
    bindings.avUsleep(usec);
  }
}
