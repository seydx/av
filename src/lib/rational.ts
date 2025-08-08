/**
 * Represents a rational number (fraction) as used by FFmpeg
 * Maps to AVRational in FFmpeg
 */
export class Rational {
  constructor(
    public num = 0,
    public den = 1,
  ) {}

  /**
   * Convert to floating point
   */
  toFloat(): number {
    if (this.num === 0 || this.den === 0) {
      return 0;
    }
    return this.num / this.den;
  }

  /**
   * Get string representation
   */
  toString(): string {
    if (this.num === 0 || this.den === 0) {
      return '0';
    }
    return `${this.num}/${this.den}`;
  }

  /**
   * Invert the rational (swap numerator and denominator)
   */
  invert(): Rational {
    return new Rational(this.den, this.num);
  }

  /**
   * Compare with another rational
   */
  equals(other: Rational): boolean {
    return this.num * other.den === this.den * other.num;
  }

  /**
   * Create from floating point value
   */
  static fromFloat(value: number, maxDen = 1000000): Rational {
    if (value === 0) {
      return new Rational(0, 1);
    }

    const sign = value < 0 ? -1 : 1;
    value = Math.abs(value);

    let bestNum = 0;
    let bestDen = 1;
    let bestError = Math.abs(value);

    for (let den = 1; den <= maxDen; den++) {
      const num = Math.round(value * den);
      const error = Math.abs(value - num / den);

      if (error < bestError) {
        bestError = error;
        bestNum = num;
        bestDen = den;

        if (error === 0) break;
      }
    }

    return new Rational(sign * bestNum, bestDen);
  }

  /**
   * Common frame rates
   */
  static readonly FRAMERATE_23_976 = new Rational(24000, 1001);
  static readonly FRAMERATE_24 = new Rational(24, 1);
  static readonly FRAMERATE_25 = new Rational(25, 1);
  static readonly FRAMERATE_29_97 = new Rational(30000, 1001);
  static readonly FRAMERATE_30 = new Rational(30, 1);
  static readonly FRAMERATE_50 = new Rational(50, 1);
  static readonly FRAMERATE_59_94 = new Rational(60000, 1001);
  static readonly FRAMERATE_60 = new Rational(60, 1);

  /**
   * Common time bases
   */
  static readonly TIMEBASE_MICROSECONDS = new Rational(1, 1000000);
  static readonly TIMEBASE_MILLISECONDS = new Rational(1, 1000);
  static readonly TIMEBASE_SECONDS = new Rational(1, 1);
}
