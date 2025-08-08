import { describe, it } from 'node:test';
import assert from 'node:assert';
import { IOContext } from '../src/lib/index.js';
import { AV_IO_FLAG_READ, AV_IO_FLAG_WRITE } from '../src/lib/constants.js';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

describe('IOContext', () => {
  describe('constructor', () => {
    it('should create IOContext instance', () => {
      const ioContext = new IOContext();
      assert.ok(ioContext instanceof IOContext);
      ioContext.close();
    });
  });

  describe('openAsync', () => {
    it('should open a file for writing asynchronously', async () => {
      const tempFile = path.join(os.tmpdir(), `test-${Date.now()}.tmp`);
      const ioContext = new IOContext();

      try {
        await ioContext.openAsync(tempFile, AV_IO_FLAG_WRITE);
        assert.ok(ioContext.getNative());
        
        // Check properties
        assert.strictEqual(ioContext.seekable, true);
        assert.strictEqual(ioContext.eof, false);
        assert.strictEqual(typeof ioContext.pos, 'bigint');
      } finally {
        ioContext.close();
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
        }
      }
    });

    it('should open a file for reading asynchronously', async () => {
      const tempFile = path.join(os.tmpdir(), `test-${Date.now()}.tmp`);
      fs.writeFileSync(tempFile, 'test content');
      const ioContext = new IOContext();

      try {
        await ioContext.openAsync(tempFile, AV_IO_FLAG_READ);
        assert.ok(ioContext.getNative());
        
        // Check properties
        assert.strictEqual(ioContext.seekable, true);
        assert.strictEqual(ioContext.eof, false);
        assert.strictEqual(typeof ioContext.size, 'bigint');
        assert.ok(ioContext.size && ioContext.size > 0n);
      } finally {
        ioContext.close();
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
        }
      }
    });

    it('should reject when opening non-existent file for reading', async () => {
      const ioContext = new IOContext();
      const nonExistentFile = path.join(os.tmpdir(), `non-existent-${Date.now()}.tmp`);

      try {
        await assert.rejects(
          async () => {
            await ioContext.openAsync(nonExistentFile, AV_IO_FLAG_READ);
          },
          (err: Error) => {
            assert.ok(err.message.includes('No such file') || err.message.includes('Failed to open'));
            return true;
          }
        );
      } finally {
        ioContext.close();
      }
    });

    it('should pass options dictionary', async () => {
      const tempFile = path.join(os.tmpdir(), `test-${Date.now()}.tmp`);
      const ioContext = new IOContext();

      try {
        // Test with options (these are just examples, actual options depend on protocol)
        await ioContext.openAsync(tempFile, AV_IO_FLAG_WRITE, {
          'blocksize': '4096'
        });
        assert.ok(ioContext.getNative());
      } finally {
        ioContext.close();
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
        }
      }
    });
  });

  describe('open (sync)', () => {
    it('should open a file synchronously', () => {
      const tempFile = path.join(os.tmpdir(), `test-${Date.now()}.tmp`);
      const ioContext = new IOContext();

      try {
        ioContext.open(tempFile, AV_IO_FLAG_WRITE);
        assert.ok(ioContext.getNative());
        assert.strictEqual(ioContext.seekable, true);
      } finally {
        ioContext.close();
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
        }
      }
    });
  });

  describe('flush', () => {
    it('should flush the IO context', () => {
      const tempFile = path.join(os.tmpdir(), `test-${Date.now()}.tmp`);
      const ioContext = new IOContext();

      try {
        ioContext.open(tempFile, AV_IO_FLAG_WRITE);
        
        // Should not throw
        assert.doesNotThrow(() => {
          ioContext.flush();
        });
      } finally {
        ioContext.close();
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
        }
      }
    });
  });

  describe('close', () => {
    it('should close the IO context', () => {
      const tempFile = path.join(os.tmpdir(), `test-${Date.now()}.tmp`);
      const ioContext = new IOContext();

      ioContext.open(tempFile, AV_IO_FLAG_WRITE);
      assert.ok(ioContext.getNative());
      
      ioContext.close();
      
      // After closing, operations should handle gracefully
      assert.doesNotThrow(() => {
        ioContext.close(); // Double close should not throw
      });

      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    });
  });

  describe('Symbol.dispose', () => {
    it('should support using statement', () => {
      const tempFile = path.join(os.tmpdir(), `test-${Date.now()}.tmp`);

      {
        using ioContext = new IOContext();
        ioContext.open(tempFile, AV_IO_FLAG_WRITE);
        assert.ok(ioContext.getNative());
        // ioContext will be automatically closed when leaving this block
      }

      // Cleanup
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    });
  });

  describe('properties', () => {
    it('should return correct size for existing file', () => {
      const tempFile = path.join(os.tmpdir(), `test-${Date.now()}.tmp`);
      const testContent = 'Hello, World!';
      fs.writeFileSync(tempFile, testContent);

      const ioContext = new IOContext();
      try {
        ioContext.open(tempFile, AV_IO_FLAG_READ);
        
        assert.strictEqual(typeof ioContext.size, 'bigint');
        assert.strictEqual(ioContext.size, BigInt(testContent.length));
      } finally {
        ioContext.close();
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
        }
      }
    });

    it('should track position', () => {
      const tempFile = path.join(os.tmpdir(), `test-${Date.now()}.tmp`);
      
      const ioContext = new IOContext();
      try {
        ioContext.open(tempFile, AV_IO_FLAG_WRITE);
        
        // Initial position should be 0
        assert.strictEqual(ioContext.pos, 0n);
        
        // Note: Actual writing would require additional FFmpeg functions
        // This test just verifies the property exists and returns correct type
      } finally {
        ioContext.close();
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
        }
      }
    });

    it('should return seekable status', () => {
      const tempFile = path.join(os.tmpdir(), `test-${Date.now()}.tmp`);
      
      const ioContext = new IOContext();
      try {
        ioContext.open(tempFile, AV_IO_FLAG_WRITE);
        
        // File IO should be seekable
        assert.strictEqual(ioContext.seekable, true);
      } finally {
        ioContext.close();
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
        }
      }
    });

    it('should return eof status', () => {
      const tempFile = path.join(os.tmpdir(), `test-${Date.now()}.tmp`);
      fs.writeFileSync(tempFile, 'test');
      
      const ioContext = new IOContext();
      try {
        ioContext.open(tempFile, AV_IO_FLAG_READ);
        
        // Initially not at EOF
        assert.strictEqual(ioContext.eof, false);
      } finally {
        ioContext.close();
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
        }
      }
    });
  });
});