import assert from 'node:assert';
import { test } from 'node:test';
import {
  setLogLevel,
  getLogLevel,
  setLogCallback,
  getLogLevelName,
  AV_LOG_QUIET,
  AV_LOG_PANIC,
  AV_LOG_FATAL,
  AV_LOG_ERROR,
  AV_LOG_WARNING,
  AV_LOG_INFO,
  AV_LOG_VERBOSE,
  AV_LOG_DEBUG,
  AV_LOG_TRACE,
  FormatContext,
} from '../src/lib/index.js';

test('FFmpeg Logging', async (t) => {
  await t.test('should set and get log level', () => {
    // Test setting different log levels
    setLogLevel(AV_LOG_DEBUG);
    assert.strictEqual(getLogLevel(), AV_LOG_DEBUG);
    
    setLogLevel(AV_LOG_ERROR);
    assert.strictEqual(getLogLevel(), AV_LOG_ERROR);
    
    setLogLevel(AV_LOG_INFO);
    assert.strictEqual(getLogLevel(), AV_LOG_INFO);
    
    // Reset to default
    setLogLevel(AV_LOG_ERROR);
  });

  await t.test('should get correct log level names', () => {
    assert.strictEqual(getLogLevelName(AV_LOG_QUIET), 'QUIET');
    assert.strictEqual(getLogLevelName(AV_LOG_PANIC), 'PANIC');
    assert.strictEqual(getLogLevelName(AV_LOG_FATAL), 'FATAL');
    assert.strictEqual(getLogLevelName(AV_LOG_ERROR), 'ERROR');
    assert.strictEqual(getLogLevelName(AV_LOG_WARNING), 'WARNING');
    assert.strictEqual(getLogLevelName(AV_LOG_INFO), 'INFO');
    assert.strictEqual(getLogLevelName(AV_LOG_VERBOSE), 'VERBOSE');
    assert.strictEqual(getLogLevelName(AV_LOG_DEBUG), 'DEBUG');
    assert.strictEqual(getLogLevelName(AV_LOG_TRACE), 'TRACE');
    
    // Test edge cases
    assert.strictEqual(getLogLevelName(-100), 'QUIET');
    assert.strictEqual(getLogLevelName(100), 'TRACE');
  });

  await t.test('should set and remove log callback', async () => {
    const messages: Array<{ level: number; message: string }> = [];
    
    // Set callback to capture messages
    setLogCallback((level, message) => {
      messages.push({ level, message });
    });
    
    // Set log level to debug to capture more messages
    const originalLevel = getLogLevel();
    setLogLevel(AV_LOG_DEBUG);
    
    // Trigger some FFmpeg operations that will generate log messages
    const formatContext = new FormatContext();
    // Try to open a non-existent file - this should generate error logs
    await formatContext.openInputAsync('non-existent-file.mp4').catch(() => {
      // Expected to fail
    });
    
    // Small delay to allow log messages to be processed
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Check that we received some log messages
    assert.ok(messages.length > 0, 'Should have received log messages');
    
    // Verify message structure
    const firstMessage = messages[0];
    assert.ok(typeof firstMessage.level === 'number', 'Level should be a number');
    assert.ok(typeof firstMessage.message === 'string', 'Message should be a string');
    
    // Remove callback
    setLogCallback(null);
    
    // Clear messages array
    messages.length = 0;
    
    // Trigger another operation
    const formatContext2 = new FormatContext();
    await formatContext2.openInputAsync('another-non-existent-file.mp4').catch(() => {
      // Expected to fail
    });
    
    // Small delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Should not receive any more messages
    assert.strictEqual(messages.length, 0, 'Should not receive messages after removing callback');
    
    // Restore original log level
    setLogLevel(originalLevel);
  });

  await t.test('should handle callback errors gracefully', async () => {
    let errorCount = 0;
    
    // Set a callback that throws an error
    setLogCallback(() => {
      errorCount++;
      throw new Error('Callback error');
    });
    
    // This should not crash the process
    const originalLevel = getLogLevel();
    setLogLevel(AV_LOG_DEBUG);
    
    // Trigger a log message
    const formatContext = new FormatContext();
    // This will fail but should not crash due to callback error
    await formatContext.openInputAsync('non-existent-file.mp4').catch(() => {
      // Expected to fail, ignore the error
    });
    
    // Wait for callbacks to be processed
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // The callback should have been called (even though it threw an error)
    assert.ok(errorCount > 0, 'Callback was called even though it threw an error');
    
    // If we reach here, the error was handled gracefully
    assert.ok(true, 'Callback error was handled gracefully');
    
    // Clean up
    setLogCallback(null);
    setLogLevel(originalLevel);
  });

  await t.test('should work with different log levels', async () => {
    const messages: Array<{ level: number; message: string }> = [];
    
    setLogCallback((level, message) => {
      messages.push({ level, message });
    });
    
    // Test with ERROR level - should only get error messages
    setLogLevel(AV_LOG_ERROR);
    messages.length = 0;
    
    const formatContext1 = new FormatContext();
    await formatContext1.openInputAsync('non-existent-file.mp4').catch(() => {
      // Expected to fail
    });
    
    await new Promise(resolve => setTimeout(resolve, 100));
    const errorCount = messages.length;
    
    // Test with VERBOSE level - should get more messages
    setLogLevel(AV_LOG_VERBOSE);
    messages.length = 0;
    
    // Create a valid operation that will produce more log messages
    const formatContext2 = new FormatContext();
    await formatContext2.openInputAsync('testdata/video.mp4');
    await formatContext2.findStreamInfoAsync();
    formatContext2.closeInput();
    
    await new Promise(resolve => setTimeout(resolve, 100));
    const verboseCount = messages.length;
    
    // When opening a valid file with verbose logging, we should get some messages
    assert.ok(
      verboseCount > 0 || errorCount > 0,
      `Should have received at least some log messages (error: ${errorCount}, verbose: ${verboseCount})`
    );
    
    // Clean up
    setLogCallback(null);
    setLogLevel(AV_LOG_ERROR);
  });

  await t.test('should handle concurrent callbacks', async () => {
    let callbackCount = 0;
    
    setLogCallback(() => {
      callbackCount++;
    });
    
    setLogLevel(AV_LOG_DEBUG);
    
    // Trigger multiple operations concurrently
    const promises = [];
    for (let i = 0; i < 5; i++) {
      promises.push(
        (async () => {
          const formatContext = new FormatContext();
          await formatContext.openInputAsync(`non-existent-${i}.mp4`).catch(() => {
            // Expected to fail
          });
        })()
      );
    }
    
    await Promise.all(promises);
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Should have received multiple callbacks
    assert.ok(callbackCount > 0, 'Should have received callbacks from concurrent operations');
    
    // Clean up
    setLogCallback(null);
    setLogLevel(AV_LOG_ERROR);
  });

  await t.test('should format log messages correctly', async () => {
    const messages: string[] = [];
    
    setLogCallback((level, message) => {
      const levelName = getLogLevelName(level);
      messages.push(`[${levelName}] ${message}`);
    });
    
    setLogLevel(AV_LOG_DEBUG);
    
    // Trigger some operations
    const formatContext = new FormatContext();
    await formatContext.openInputAsync('test-file.mp4').catch(() => {
      // Expected to fail
    });
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Check message formatting
    if (messages.length > 0) {
      const formattedMessage = messages[0];
      assert.ok(formattedMessage.startsWith('['), 'Message should start with log level');
      assert.ok(formattedMessage.includes(']'), 'Message should have closing bracket');
    }
    
    // Clean up
    setLogCallback(null);
    setLogLevel(AV_LOG_ERROR);
  });
});