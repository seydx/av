import assert from 'node:assert';
import { Readable, Transform, Writable } from 'node:stream';
import { describe, it } from 'node:test';
import { IOStream } from '../src/api/index.js';
import { AV_SEEK_SET } from '../src/lib/constants.js';

describe('IOStream', () => {
  describe('fromBuffer', () => {
    it('should create IOContext from Buffer', async () => {
      const buffer = Buffer.from('test data');
      const ioContext = IOStream.fromBuffer(buffer);

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
      const ioContext = IOStream.fromBuffer(buffer);

      // Seek to position 5
      const seekPos = await ioContext.seek(5n, AV_SEEK_SET);
      assert.equal(seekPos, 5n);

      // Read from new position
      const result = await ioContext.read(3);
      assert.ok(Buffer.isBuffer(result), 'Should return a Buffer');
      assert.equal(result.length, 3);
      assert.equal(result.toString(), '567');

      ioContext.freeContext();
    });
  });

  describe('fromReadable', () => {
    it('should create IOContext from Readable stream', async () => {
      const readable = Readable.from([Buffer.from('hello'), Buffer.from(' '), Buffer.from('world')]);
      const ioContext = await IOStream.fromReadable(readable);

      assert.ok(ioContext, 'Should create IOContext');

      const result = await ioContext.read(5);
      assert.ok(Buffer.isBuffer(result), 'Should return a Buffer');
      assert.equal(result.length, 5);
      assert.equal(result.toString(), 'hello');

      ioContext.freeContext();
    });
  });

  describe('fromWritable', () => {
    it('should create IOContext from Writable stream', async () => {
      const chunks: Buffer[] = [];
      const writable = new Writable({
        write(chunk, _encoding, callback) {
          chunks.push(chunk);
          callback();
        },
      });

      const ioContext = IOStream.fromWritable(writable);
      assert.ok(ioContext, 'Should create IOContext');

      // Write data
      const data = Buffer.from('test output');
      await ioContext.write(data);
      // Write returns void, not bytes written

      // Note: Write to stream happens asynchronously via callbacks
      // We can't check chunks immediately

      ioContext.freeContext();
    });
  });

  describe('fromTransform', () => {
    it('should create IOContext from Transform stream for writing', async () => {
      const transformed: Buffer[] = [];
      const transform = new Transform({
        transform(chunk, _encoding, callback) {
          // Convert to uppercase
          const upper = chunk.toString().toUpperCase();
          transformed.push(Buffer.from(upper));
          callback(null, chunk);
        },
      });

      const ioContext = await IOStream.fromTransform(transform, 'write');
      assert.ok(ioContext, 'Should create IOContext');

      // Write data
      const data = Buffer.from('hello');
      await ioContext.write(data);
      // Write returns void, not bytes written

      // Note: Transform happens asynchronously via callbacks
      // We can't check transformed immediately

      ioContext.freeContext();
    });
  });

  describe('create', () => {
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
            position = Number(offset); // SEEK_SET
          else if (whence === 1)
            position += Number(offset); // SEEK_CUR
          else if (whence === 2) position = data.length + Number(offset); // SEEK_END
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
      await ioContext.seek(7n, AV_SEEK_SET);
      const result2 = await ioContext.read(4);
      assert.ok(Buffer.isBuffer(result2), 'Should return a Buffer');
      assert.equal(result2.length, 4);
      assert.equal(result2.toString(), 'data');

      ioContext.freeContext();
    });

    it('should validate callbacks', () => {
      // Should throw for read mode without read callback
      assert.throws(() => IOStream.create({}, 8192, 0), /Read callback is required/);

      // Should throw for write mode without write callback
      assert.throws(() => IOStream.create({}, 8192, 1), /Write callback is required/);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty Buffer', async () => {
      const buffer = Buffer.alloc(0);
      const ioContext = IOStream.fromBuffer(buffer);

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
      const ioContext = IOStream.fromBuffer(buffer);

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
