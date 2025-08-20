/**
 * Rational number type for precise fractional representations.
 *
 * Represents a rational number as a fraction (numerator/denominator).
 * Used throughout FFmpeg for time bases, aspect ratios, frame rates,
 * and other fractional values that require exact precision.
 *
 * Direct mapping to FFmpeg's AVRational structure.
 *
 * @example
 * ```typescript
 * import { Rational } from '@seydx/av';
 *
 * // Common time bases
 * const timebase = new Rational(1, 90000); // 90kHz for MPEG-TS
 * const videoTimebase = new Rational(1, 25); // 25 fps
 * const audioTimebase = new Rational(1, 48000); // 48kHz audio
 *
 * // Frame rates
 * const framerate = new Rational(30, 1);    // 30 fps
 * const ntscFramerate = new Rational(30000, 1001); // 29.97 fps NTSC
 * const palFramerate = new Rational(25, 1); // 25 fps PAL
 *
 * // Aspect ratios
 * const aspectRatio = new Rational(16, 9); // 16:9
 * const pixelAspect = new Rational(1, 1); // Square pixels
 *
 * // Arithmetic operations
 * const doubled = timebase.mul(new Rational(2, 1));
 * const inverted = framerate.inv(); // Get frame duration
 * const sum = framerate.add(new Rational(5, 1)); // Add 5 fps
 * ```
 */
export class Rational {
  /**
   * Create a new rational number.
   *
   * Represents the fraction num/den.
   *
   * @param num - Numerator of the fraction
   * @param den - Denominator of the fraction (must not be 0)
   *
   * @throws {Error} If denominator is 0
   *
   * @example
   * ```typescript
   * import { Rational } from '@seydx/av';
   *
   * // Create time base for 25 fps video
   * const timebase = new Rational(1, 25);
   *
   * // Create NTSC frame rate (29.97 fps)
   * const ntsc = new Rational(30000, 1001);
   *
   * // Will throw error
   * try {
   *   const invalid = new Rational(1, 0);
   * } catch (error) {
   *   console.error('Cannot have zero denominator');
   * }
   * ```
   */
  constructor(
    public readonly num: number,
    public readonly den: number,
  ) {
    if (den === 0) {
      throw new Error('Denominator cannot be zero');
    }
  }

  /**
   * Add two rational numbers.
   *
   * Performs addition: (a/b) + (c/d) = (ad + bc) / bd
   *
   * @param other - The rational number to add
   *
   * @returns A new Rational representing the sum
   *
   * @example
   * ```typescript
   * const a = new Rational(1, 2); // 1/2
   * const b = new Rational(1, 3); // 1/3
   * const sum = a.add(b); // 5/6
   * console.log(sum.toString()); // "5/6"
   * ```
   */
  add(other: Rational): Rational {
    return new Rational(this.num * other.den + other.num * this.den, this.den * other.den);
  }

  /**
   * Subtract two rational numbers.
   *
   * Performs subtraction: (a/b) - (c/d) = (ad - bc) / bd
   *
   * @param other - The rational number to subtract
   *
   * @returns A new Rational representing the difference
   *
   * @example
   * ```typescript
   * const a = new Rational(3, 4); // 3/4
   * const b = new Rational(1, 4); // 1/4
   * const diff = a.sub(b); // 2/4 = 1/2
   * console.log(diff.toString()); // "2/4"
   * ```
   */
  sub(other: Rational): Rational {
    return new Rational(this.num * other.den - other.num * this.den, this.den * other.den);
  }

  /**
   * Multiply two rational numbers.
   *
   * Performs multiplication: (a/b) × (c/d) = (ac) / (bd)
   *
   * @param other - The rational number to multiply by
   *
   * @returns A new Rational representing the product
   *
   * @example
   * ```typescript
   * const framerate = new Rational(30, 1); // 30 fps
   * const duration = new Rational(5, 1); // 5 seconds
   * const frames = framerate.mul(duration); // 150/1 = 150 frames
   * console.log(frames.toDouble()); // 150
   * ```
   */
  mul(other: Rational): Rational {
    return new Rational(this.num * other.num, this.den * other.den);
  }

  /**
   * Divide two rational numbers.
   *
   * Performs division: (a/b) ÷ (c/d) = (ad) / (bc)
   *
   * @param other - The rational number to divide by
   *
   * @returns A new Rational representing the quotient
   *
   * @example
   * ```typescript
   * const pixels = new Rational(1920, 1); // 1920 pixels width
   * const aspect = new Rational(16, 9); // 16:9 aspect ratio
   * const height = pixels.div(aspect); // Calculate height
   * console.log(height.toDouble()); // 1080
   * ```
   */
  div(other: Rational): Rational {
    return new Rational(this.num * other.den, this.den * other.num);
  }

  /**
   * Invert the rational number (reciprocal).
   *
   * Returns the reciprocal: 1/(a/b) = b/a
   *
   * @returns A new Rational representing the reciprocal
   *
   * @example
   * ```typescript
   * const framerate = new Rational(25, 1); // 25 fps
   * const frameDuration = framerate.inv(); // 1/25 seconds per frame
   * console.log(frameDuration.toString()); // "1/25"
   * console.log(frameDuration.toDouble()); // 0.04 seconds
   * ```
   */
  inv(): Rational {
    return new Rational(this.den, this.num);
  }

  /**
   * Convert rational to floating point number.
   *
   * Calculates the decimal value: num / den
   * Note: This may lose precision for some rational values.
   *
   * @returns The floating point representation
   *
   * @example
   * ```typescript
   * const ntsc = new Rational(30000, 1001); // NTSC frame rate
   * console.log(ntsc.toDouble()); // 29.97002997...
   *
   * const half = new Rational(1, 2);
   * console.log(half.toDouble()); // 0.5
   * ```
   */
  toDouble(): number {
    return this.num / this.den;
  }

  /**
   * Check if this rational equals another.
   *
   * Compares using cross-multiplication to avoid floating point errors.
   * Two rationals a/b and c/d are equal if ad = bc.
   *
   * @param other - The rational to compare with
   *
   * @returns true if the rationals are equal, false otherwise
   *
   * @example
   * ```typescript
   * const a = new Rational(2, 4);
   * const b = new Rational(1, 2);
   * const c = new Rational(3, 4);
   *
   * console.log(a.equals(b)); // true (both are 1/2)
   * console.log(a.equals(c)); // false
   * ```
   */
  equals(other: Rational): boolean {
    return this.num * other.den === other.num * this.den;
  }

  /**
   * Get string representation of the rational.
   *
   * Returns the rational in "num/den" format.
   *
   * @returns String representation as "numerator/denominator"
   *
   * @example
   * ```typescript
   * const framerate = new Rational(30000, 1001);
   * console.log(framerate.toString()); // "30000/1001"
   *
   * const timebase = new Rational(1, 90000);
   * console.log(`Timebase: ${timebase}`); // "Timebase: 1/90000"
   * ```
   */
  toString(): string {
    return `${this.num}/${this.den}`;
  }
}
