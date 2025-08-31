import assert from 'node:assert';
import { describe, it } from 'node:test';

import { AVSEEK_SET, IOStream } from '../src/index.js';

describe('IOStream', () => {
  describe('create with Buffer', () => {
    it('should create IOContext from Buffer', async () => {
      const buffer = Buffer.from('test data');
      const ioContext = IOStream.create(buffer);

      assert.ok(ioContext, 'Should create IOContext');

      // Test read operation
      const result = await ioContext.read(4);
      assert.ok(Buffer.isBuffer(result), 'Should return a Buffer');
      assert.equal(result.length, 4);
      assert.equal(result.toString(), 'test');

      // Cleanup
      ioContext.freeContext();
    });

    it('should handle seek operations on Buffer', async () => {
      const buffer = Buffer.from('0123456789');
      const ioContext = IOStream.create(buffer);

      // Seek to position 5
      const seekPos = await ioContext.seek(5n, AVSEEK_SET);
      assert.equal(seekPos, 5n);

      // Read from new position
      const result = await ioContext.read(3);
      assert.ok(Buffer.isBuffer(result), 'Should return a Buffer');
      assert.equal(result.length, 3);
      assert.equal(result.toString(), '567');

      ioContext.freeContext();
    });
  });

  describe('create with custom callbacks', () => {
    it('should create IOContext with custom callbacks', async () => {
      const data = Buffer.from('custom data source');
      let position = 0;

      const ioContext = IOStream.create({
        read: (size) => {
          if (position >= data.length) return null;
          const chunk = data.subarray(position, position + size);
          position += chunk.length;
          return chunk;
        },
        seek: (offset, whence) => {
          if (whence === 0)
            position = Number(offset); // AVSEEK_SET
          else if (whence === 1)
            position += Number(offset); // AVSEEK_CUR
          else if (whence === 2) position = data.length + Number(offset); // AVSEEK_END
          return BigInt(position);
        },
      });

      assert.ok(ioContext, 'Should create IOContext');

      // Read data
      const result = await ioContext.read(6);
      assert.ok(Buffer.isBuffer(result), 'Should return a Buffer');
      assert.equal(result.length, 6);
      assert.equal(result.toString(), 'custom');

      // Seek and read again
      await ioContext.seek(7n, AVSEEK_SET);
      const result2 = await ioContext.read(4);
      assert.ok(Buffer.isBuffer(result2), 'Should return a Buffer');
      assert.equal(result2.length, 4);
      assert.equal(result2.toString(), 'data');

      ioContext.freeContext();
    });

    it('should validate callbacks', () => {
      // Should throw for invalid input type
      assert.throws(() => IOStream.create(123 as any), /Invalid input type/);

      // Should throw without read callback (empty object is invalid input)
      assert.throws(() => IOStream.create({} as any), /Invalid input type/);

      // Should throw when read callback is missing - but this is also treated as invalid input
      // because we only check for 'read' property to identify IOInputCallbacks
      const invalidCallbacks = { seek: () => 0n } as any;
      assert.throws(() => IOStream.create(invalidCallbacks), /Invalid input type/);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty Buffer', async () => {
      const buffer = Buffer.alloc(0);
      const ioContext = IOStream.create(buffer);

      const result = await ioContext.read(10);
      // Empty buffer might return error code or empty buffer
      if (Buffer.isBuffer(result)) {
        assert.equal(result.length, 0, 'Should read 0 bytes from empty buffer');
      } else {
        assert.ok(result < 0, 'Should return error code for empty buffer');
      }

      ioContext.freeContext();
    });

    it('should handle EOF correctly', async () => {
      const buffer = Buffer.from('short');
      const ioContext = IOStream.create(buffer);

      // Read all data
      const result = await ioContext.read(10);
      assert.ok(Buffer.isBuffer(result), 'Should return a Buffer');
      assert.equal(result.length, 5);

      // Try to read again (should return error or empty buffer for EOF)
      const result2 = await ioContext.read(10);
      if (Buffer.isBuffer(result2)) {
        assert.equal(result2.length, 0, 'Should return empty buffer at EOF');
      } else {
        assert.ok(result2 < 0, 'Should return error code at EOF');
      }

      ioContext.freeContext();
    });
  });
});
