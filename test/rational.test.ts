import assert from 'node:assert';
import { describe, it } from 'node:test';

import { Rational } from '../src/lib/index.js';

describe('Rational', () => {
  describe('Constructor', () => {
    it('should create a rational number', () => {
      const r = new Rational(1, 2);
      assert.equal(r.num, 1);
      assert.equal(r.den, 2);
    });

    it('should create negative rationals', () => {
      const r1 = new Rational(-1, 2);
      assert.equal(r1.num, -1);
      assert.equal(r1.den, 2);

      const r2 = new Rational(1, -2);
      assert.equal(r2.num, 1);
      assert.equal(r2.den, -2);

      const r3 = new Rational(-1, -2);
      assert.equal(r3.num, -1);
      assert.equal(r3.den, -2);
    });

    it('should throw error for zero denominator', () => {
      assert.throws(
        () => {
          new Rational(1, 0);
        },
        {
          name: 'Error',
          message: 'Denominator cannot be zero',
        },
      );
    });

    it('should handle zero numerator', () => {
      const r = new Rational(0, 1);
      assert.equal(r.num, 0);
      assert.equal(r.den, 1);
      assert.equal(r.toDouble(), 0);
    });

    it('should handle large numbers', () => {
      const r = new Rational(1000000, 1001);
      assert.equal(r.num, 1000000);
      assert.equal(r.den, 1001);
    });
  });

  describe('Arithmetic Operations', () => {
    describe('Addition', () => {
      it('should add two rationals with same denominator', () => {
        const r1 = new Rational(1, 3);
        const r2 = new Rational(1, 3);
        const result = r1.add(r2);
        assert.equal(result.num, 6); // (1*3 + 1*3) = 6
        assert.equal(result.den, 9); // 3*3 = 9
        // Simplified would be 2/3
      });

      it('should add two rationals with different denominators', () => {
        const r1 = new Rational(1, 2);
        const r2 = new Rational(1, 3);
        const result = r1.add(r2);
        assert.equal(result.num, 5); // (1*3 + 1*2) = 5
        assert.equal(result.den, 6); // 2*3 = 6
      });

      it('should add positive and negative rationals', () => {
        const r1 = new Rational(1, 2);
        const r2 = new Rational(-1, 3);
        const result = r1.add(r2);
        assert.equal(result.num, 1); // (1*3 + (-1)*2) = 1
        assert.equal(result.den, 6); // 2*3 = 6
      });

      it('should handle adding zero', () => {
        const r1 = new Rational(3, 4);
        const r2 = new Rational(0, 1);
        const result = r1.add(r2);
        assert.equal(result.num, 3); // (3*1 + 0*4) = 3
        assert.equal(result.den, 4); // 4*1 = 4
      });
    });

    describe('Subtraction', () => {
      it('should subtract two rationals with same denominator', () => {
        const r1 = new Rational(2, 3);
        const r2 = new Rational(1, 3);
        const result = r1.sub(r2);
        assert.equal(result.num, 3); // (2*3 - 1*3) = 3
        assert.equal(result.den, 9); // 3*3 = 9
        // Simplified would be 1/3
      });

      it('should subtract two rationals with different denominators', () => {
        const r1 = new Rational(1, 2);
        const r2 = new Rational(1, 3);
        const result = r1.sub(r2);
        assert.equal(result.num, 1); // (1*3 - 1*2) = 1
        assert.equal(result.den, 6); // 2*3 = 6
      });

      it('should handle negative results', () => {
        const r1 = new Rational(1, 3);
        const r2 = new Rational(1, 2);
        const result = r1.sub(r2);
        assert.equal(result.num, -1); // (1*2 - 1*3) = -1
        assert.equal(result.den, 6);  // 3*2 = 6
      });

      it('should handle subtracting zero', () => {
        const r1 = new Rational(3, 4);
        const r2 = new Rational(0, 1);
        const result = r1.sub(r2);
        assert.equal(result.num, 3); // (3*1 - 0*4) = 3
        assert.equal(result.den, 4); // 4*1 = 4
      });
    });

    describe('Multiplication', () => {
      it('should multiply two rationals', () => {
        const r1 = new Rational(2, 3);
        const r2 = new Rational(3, 4);
        const result = r1.mul(r2);
        assert.equal(result.num, 6); // 2*3 = 6
        assert.equal(result.den, 12); // 3*4 = 12
        // Simplified would be 1/2
      });

      it('should handle multiplication by 1', () => {
        const r1 = new Rational(5, 7);
        const r2 = new Rational(1, 1);
        const result = r1.mul(r2);
        assert.equal(result.num, 5);
        assert.equal(result.den, 7);
      });

      it('should handle multiplication by zero', () => {
        const r1 = new Rational(5, 7);
        const r2 = new Rational(0, 1);
        const result = r1.mul(r2);
        assert.equal(result.num, 0);
        assert.equal(result.den, 7);
      });

      it('should handle negative multiplication', () => {
        const r1 = new Rational(-2, 3);
        const r2 = new Rational(3, 4);
        const result = r1.mul(r2);
        assert.equal(result.num, -6);
        assert.equal(result.den, 12);
      });
    });

    describe('Division', () => {
      it('should divide two rationals', () => {
        const r1 = new Rational(2, 3);
        const r2 = new Rational(3, 4);
        const result = r1.div(r2);
        assert.equal(result.num, 8); // 2*4 = 8
        assert.equal(result.den, 9); // 3*3 = 9
      });

      it('should handle division by 1', () => {
        const r1 = new Rational(5, 7);
        const r2 = new Rational(1, 1);
        const result = r1.div(r2);
        assert.equal(result.num, 5);
        assert.equal(result.den, 7);
      });

      it('should handle division resulting in integer', () => {
        const r1 = new Rational(6, 2);
        const r2 = new Rational(3, 1);
        const result = r1.div(r2);
        assert.equal(result.num, 6); // 6*1 = 6
        assert.equal(result.den, 6); // 2*3 = 6
        // Simplified would be 1/1
      });

      it('should handle negative division', () => {
        const r1 = new Rational(-2, 3);
        const r2 = new Rational(4, 5);
        const result = r1.div(r2);
        assert.equal(result.num, -10); // -2*5 = -10
        assert.equal(result.den, 12);  // 3*4 = 12
      });

      it('should throw when dividing by zero', () => {
        const r1 = new Rational(1, 2);
        const r2 = new Rational(0, 1);
        assert.throws(
          () => {
            r1.div(r2);
          },
          {
            name: 'Error',
            message: 'Denominator cannot be zero',
          },
        );
      });
    });

    describe('Inversion', () => {
      it('should invert a rational', () => {
        const r = new Rational(2, 3);
        const result = r.inv();
        assert.equal(result.num, 3);
        assert.equal(result.den, 2);
      });

      it('should handle inverting 1/1', () => {
        const r = new Rational(1, 1);
        const result = r.inv();
        assert.equal(result.num, 1);
        assert.equal(result.den, 1);
      });

      it('should handle negative inversion', () => {
        const r = new Rational(-2, 3);
        const result = r.inv();
        assert.equal(result.num, 3);
        assert.equal(result.den, -2);
      });

      it('should throw when inverting zero', () => {
        const r = new Rational(0, 1);
        assert.throws(
          () => {
            r.inv();
          },
          {
            name: 'Error',
            message: 'Denominator cannot be zero',
          },
        );
      });
    });
  });

  describe('Conversion', () => {
    it('should convert to double', () => {
      const r1 = new Rational(1, 2);
      assert.equal(r1.toDouble(), 0.5);

      const r2 = new Rational(3, 4);
      assert.equal(r2.toDouble(), 0.75);

      const r3 = new Rational(1, 3);
      assert.ok(Math.abs(r3.toDouble() - 0.333333) < 0.000001);

      const r4 = new Rational(-1, 2);
      assert.equal(r4.toDouble(), -0.5);
    });

    it('should handle zero conversion', () => {
      const r = new Rational(0, 1);
      assert.equal(r.toDouble(), 0);
    });

    it('should handle integer conversion', () => {
      const r = new Rational(10, 2);
      assert.equal(r.toDouble(), 5);
    });

    it('should convert to string', () => {
      const r1 = new Rational(1, 2);
      assert.equal(r1.toString(), '1/2');

      const r2 = new Rational(-3, 4);
      assert.equal(r2.toString(), '-3/4');

      const r3 = new Rational(0, 1);
      assert.equal(r3.toString(), '0/1');

      const r4 = new Rational(10, 1);
      assert.equal(r4.toString(), '10/1');
    });
  });

  describe('Comparison', () => {
    it('should compare equal rationals', () => {
      const r1 = new Rational(1, 2);
      const r2 = new Rational(1, 2);
      assert.ok(r1.equals(r2));
    });

    it('should compare equivalent rationals', () => {
      const r1 = new Rational(1, 2);
      const r2 = new Rational(2, 4);
      assert.ok(r1.equals(r2));

      const r3 = new Rational(3, 6);
      assert.ok(r1.equals(r3));
    });

    it('should compare unequal rationals', () => {
      const r1 = new Rational(1, 2);
      const r2 = new Rational(1, 3);
      assert.ok(!r1.equals(r2));

      const r3 = new Rational(2, 3);
      assert.ok(!r1.equals(r3));
    });

    it('should handle negative comparisons', () => {
      const r1 = new Rational(-1, 2);
      const r2 = new Rational(1, -2);
      assert.ok(r1.equals(r2));

      const r3 = new Rational(-1, -2);
      const r4 = new Rational(1, 2);
      assert.ok(r3.equals(r4));
    });

    it('should handle zero comparisons', () => {
      const r1 = new Rational(0, 1);
      const r2 = new Rational(0, 5);
      assert.ok(r1.equals(r2));

      const r3 = new Rational(1, 5);
      assert.ok(!r1.equals(r3));
    });
  });

  describe('Common Use Cases', () => {
    it('should handle common video time bases', () => {
      // 90kHz time base (common for MPEG)
      const tb90k = new Rational(1, 90000);
      assert.equal(tb90k.toDouble(), 1 / 90000);

      // 1kHz time base (common for audio)
      const tb1k = new Rational(1, 1000);
      assert.equal(tb1k.toDouble(), 0.001);

      // Microsecond time base
      const tbMicro = new Rational(1, 1000000);
      assert.equal(tbMicro.toDouble(), 0.000001);
    });

    it('should handle common frame rates', () => {
      // 24 fps (film)
      const fps24 = new Rational(24, 1);
      assert.equal(fps24.toDouble(), 24);

      // 25 fps (PAL)
      const fps25 = new Rational(25, 1);
      assert.equal(fps25.toDouble(), 25);

      // 30 fps (NTSC)
      const fps30 = new Rational(30, 1);
      assert.equal(fps30.toDouble(), 30);

      // 29.97 fps (NTSC drop-frame)
      const fps2997 = new Rational(30000, 1001);
      assert.ok(Math.abs(fps2997.toDouble() - 29.97) < 0.01);

      // 23.976 fps (film to NTSC)
      const fps23976 = new Rational(24000, 1001);
      assert.ok(Math.abs(fps23976.toDouble() - 23.976) < 0.001);

      // 59.94 fps (double NTSC)
      const fps5994 = new Rational(60000, 1001);
      assert.ok(Math.abs(fps5994.toDouble() - 59.94) < 0.01);
    });

    it('should handle aspect ratios', () => {
      // 16:9 (widescreen)
      const ar169 = new Rational(16, 9);
      assert.ok(Math.abs(ar169.toDouble() - 1.7777) < 0.001);

      // 4:3 (standard)
      const ar43 = new Rational(4, 3);
      assert.ok(Math.abs(ar43.toDouble() - 1.3333) < 0.001);

      // 21:9 (ultrawide)
      const ar219 = new Rational(21, 9);
      assert.ok(Math.abs(ar219.toDouble() - 2.3333) < 0.001);
    });

    it('should handle sample aspect ratios', () => {
      // Square pixels
      const sar11 = new Rational(1, 1);
      assert.equal(sar11.toDouble(), 1);

      // PAL 4:3
      const sarPal43 = new Rational(12, 11);
      assert.ok(Math.abs(sarPal43.toDouble() - 1.0909) < 0.001);

      // NTSC 4:3
      const sarNtsc43 = new Rational(10, 11);
      assert.ok(Math.abs(sarNtsc43.toDouble() - 0.9090) < 0.001);
    });

    it('should calculate frame duration from frame rate', () => {
      // 30 fps -> frame duration
      const fps30 = new Rational(30, 1);
      const frameDuration = fps30.inv();
      assert.equal(frameDuration.num, 1);
      assert.equal(frameDuration.den, 30);
      assert.ok(Math.abs(frameDuration.toDouble() - 0.0333) < 0.001);

      // 29.97 fps -> frame duration
      const fps2997 = new Rational(30000, 1001);
      const frameDuration2997 = fps2997.inv();
      assert.equal(frameDuration2997.num, 1001);
      assert.equal(frameDuration2997.den, 30000);
      assert.ok(Math.abs(frameDuration2997.toDouble() - 0.0334) < 0.001);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large numbers', () => {
      const r1 = new Rational(2147483647, 1); // Max 32-bit int
      const r2 = new Rational(1, 2147483647);
      
      assert.equal(r1.num, 2147483647);
      assert.equal(r2.den, 2147483647);
    });

    it('should handle operations that might overflow', () => {
      const r1 = new Rational(1000000, 1);
      const r2 = new Rational(1000000, 1);
      const result = r1.mul(r2);
      assert.equal(result.num, 1000000000000);
      assert.equal(result.den, 1);
    });

    it('should maintain precision', () => {
      const r1 = new Rational(1, 3);
      const r2 = new Rational(1, 7);
      const result = r1.add(r2);
      
      // Should be exactly (7 + 3) / 21 = 10/21
      assert.equal(result.num, 10);
      assert.equal(result.den, 21);
      
      // Cross-multiply to verify without floating point
      assert.equal(result.num * 21, 10 * result.den);
    });
  });
});