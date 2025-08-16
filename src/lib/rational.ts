/**
 * Rational number type (fraction) for time bases, aspect ratios, frame rates
 *
 * Direct mapping to FFmpeg's AVRational.
 * Used throughout FFmpeg for precise fractional representations.
 *
 * @example
 * ```typescript
 * // Common time bases
 * const timebase = new Rational(1, 90000); // 90kHz
 * const framerate = new Rational(30, 1);    // 30 fps
 *
 * // Arithmetic operations
 * const doubled = timebase.mul(new Rational(2, 1));
 * const inverted = framerate.inv();
 * ```
 */
export class Rational {
  /**
   * Create a new rational number
   * @param num Numerator
   * @param den Denominator (must not be 0)
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
   * Add two rationals
   */
  add(other: Rational): Rational {
    return new Rational(this.num * other.den + other.num * this.den, this.den * other.den);
  }

  /**
   * Subtract two rationals
   */
  sub(other: Rational): Rational {
    return new Rational(this.num * other.den - other.num * this.den, this.den * other.den);
  }

  /**
   * Multiply two rationals
   */
  mul(other: Rational): Rational {
    return new Rational(this.num * other.num, this.den * other.den);
  }

  /**
   * Divide two rationals
   */
  div(other: Rational): Rational {
    return new Rational(this.num * other.den, this.den * other.num);
  }

  /**
   * Invert the rational (reciprocal)
   */
  inv(): Rational {
    return new Rational(this.den, this.num);
  }

  /**
   * Convert to floating point
   */
  toDouble(): number {
    return this.num / this.den;
  }

  /**
   * Compare if equal to another rational
   */
  equals(other: Rational): boolean {
    return this.num * other.den === other.num * this.den;
  }

  /**
   * Get string representation
   */
  toString(): string {
    return `${this.num}/${this.den}`;
  }
}
