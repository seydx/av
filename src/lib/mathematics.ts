/**
 * Mathematics utilities for FFmpeg
 * Provides functions for rescaling timestamps and values
 */

import { Rational } from './rational.js';
import { AV_TIME_BASE } from './constants.js';

/**
 * Rounding modes for rescaling operations
 */
export enum MathRounding {
  ZERO = 0, // Round toward zero
  INF = 1, // Round away from zero
  DOWN = 2, // Round toward -infinity
  UP = 3, // Round toward +infinity
  NEAR_INF = 5, // Round to nearest and halfway cases away from zero
  PASS_MINMAX = 8192, // Flag to pass INT64_MIN/MAX through instead of rescaling
}

/**
 * Mathematics utilities
 */
export class Mathematics {
  /**
   * Rescale a 64-bit integer with rounding
   *
   * Rescales a 64-bit integer by two rational numbers.
   * Equivalent to a * b / c
   *
   * @param a Value to rescale
   * @param b Numerator rational
   * @param c Denominator rational
   * @param rounding Rounding mode (default: NEAR_INF)
   * @returns Rescaled value
   */
  static rescaleQ(a: bigint, b: Rational, c: Rational, rounding: MathRounding = MathRounding.NEAR_INF): bigint {
    // Special cases
    if (c.num === 0 || b.den === 0) {
      throw new Error('Division by zero in rescale');
    }

    // Handle pass-through for min/max values
    if (rounding & MathRounding.PASS_MINMAX) {
      const INT64_MAX = 9223372036854775807n;
      const INT64_MIN = -9223372036854775808n;
      if (a === INT64_MIN || a === INT64_MAX) {
        return a;
      }
    }

    // Calculate: a * b.num * c.den / (b.den * c.num)
    const numerator = a * BigInt(b.num) * BigInt(c.den);
    const denominator = BigInt(b.den) * BigInt(c.num);

    // Apply rounding
    let result: bigint;
    const baseRounding: MathRounding = rounding & ~MathRounding.PASS_MINMAX;

    switch (baseRounding) {
      case MathRounding.ZERO:
        // Round toward zero (truncate)
        result = numerator / denominator;
        break;

      case MathRounding.DOWN:
        // Round toward -infinity
        if (numerator >= 0n || numerator % denominator === 0n) {
          result = numerator / denominator;
        } else {
          result = numerator / denominator - 1n;
        }
        break;

      case MathRounding.UP:
        // Round toward +infinity
        if (numerator <= 0n || numerator % denominator === 0n) {
          result = numerator / denominator;
        } else {
          result = numerator / denominator + 1n;
        }
        break;

      case MathRounding.NEAR_INF:
      case MathRounding.INF:
        // Round to nearest, halfway cases away from zero
        const quotient = numerator / denominator;
        const remainder = numerator % denominator;
        const halfDenom = denominator / 2n;

        if (remainder === 0n) {
          result = quotient;
        } else if (remainder > 0n) {
          result = remainder >= halfDenom ? quotient + 1n : quotient;
        } else {
          result = -remainder >= halfDenom ? quotient - 1n : quotient;
        }
        break;

      default:
        result = numerator / denominator;
    }

    return result;
  }

  /**
   * Rescale a timestamp from one timebase to another
   *
   * @param timestamp Timestamp to rescale
   * @param srcTimebase Source timebase
   * @param dstTimebase Destination timebase
   * @returns Rescaled timestamp
   */
  static rescaleTimestamp(timestamp: bigint, srcTimebase: Rational, dstTimebase: Rational): bigint {
    return Mathematics.rescaleQ(timestamp, srcTimebase, dstTimebase, MathRounding.NEAR_INF);
  }

  /**
   * Compare two timestamps each in its own timebase
   *
   * @param ts1 First timestamp
   * @param tb1 First timebase
   * @param ts2 Second timestamp
   * @param tb2 Second timebase
   * @returns -1 if ts1 < ts2, 0 if equal, 1 if ts1 > ts2
   */
  static compareTimestamps(ts1: bigint, tb1: Rational, ts2: bigint, tb2: Rational): number {
    // Convert to common timebase for comparison
    // ts1 * tb1.num * tb2.den <=> ts2 * tb2.num * tb1.den
    const left = ts1 * BigInt(tb1.num) * BigInt(tb2.den);
    const right = ts2 * BigInt(tb2.num) * BigInt(tb1.den);

    if (left < right) return -1;
    if (left > right) return 1;
    return 0;
  }

  /**
   * Add two rationals
   *
   * @param a First rational
   * @param b Second rational
   * @returns Sum of rationals
   */
  static addRationals(a: Rational, b: Rational): Rational {
    const num = a.num * b.den + b.num * a.den;
    const den = a.den * b.den;
    return new Rational(num, den);
  }

  /**
   * Subtract two rationals
   *
   * @param a First rational
   * @param b Second rational
   * @returns Difference of rationals
   */
  static subtractRationals(a: Rational, b: Rational): Rational {
    const num = a.num * b.den - b.num * a.den;
    const den = a.den * b.den;
    return new Rational(num, den);
  }

  /**
   * Multiply two rationals
   *
   * @param a First rational
   * @param b Second rational
   * @returns Product of rationals
   */
  static multiplyRationals(a: Rational, b: Rational): Rational {
    return new Rational(a.num * b.num, a.den * b.den);
  }

  /**
   * Divide two rationals
   *
   * @param a First rational
   * @param b Second rational
   * @returns Quotient of rationals
   */
  static divideRationals(a: Rational, b: Rational): Rational {
    if (b.num === 0) {
      throw new Error('Division by zero');
    }
    return new Rational(a.num * b.den, a.den * b.num);
  }
}

// Common timebases
export const AV_TIME_BASE_Q = new Rational(1, AV_TIME_BASE);
