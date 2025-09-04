[node-av](../globals.md) / Log

# Class: Log

Defined in: [src/lib/log.ts:50](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/log.ts#L50)

FFmpeg logging control and configuration.

Provides control over FFmpeg's internal logging system.
Allows setting log levels, custom callbacks, and formatting options.
Essential for debugging, monitoring, and error tracking in FFmpeg operations.

Direct mapping to FFmpeg's logging API.

## Example

```typescript
import { Log } from 'node-av';
import { AV_LOG_ERROR, AV_LOG_WARNING, AV_LOG_INFO, AV_LOG_DEBUG } from 'node-av/constants';

// Set log level
Log.setLevel(AV_LOG_WARNING); // Only show warnings and errors

// Get current log level
const level = Log.getLevel();
console.log(`Current log level: ${level}`);

// Custom log callback
Log.setCallback((level, message) => {
  if (level <= AV_LOG_ERROR) {
    console.error(`FFmpeg Error: ${message}`);
  } else if (level <= AV_LOG_WARNING) {
    console.warn(`FFmpeg Warning: ${message}`);
  } else {
    console.log(`FFmpeg: ${message}`);
  }
}, {
  printPrefix: true,
  skipRepeated: true
});

// Log a custom message
Log.log(AV_LOG_INFO, 'Custom log message');

// Reset to default callback
Log.resetCallback();
```

## See

\[av\_log\](https://ffmpeg.org/doxygen/trunk/group\_\_lavu\_\_log.html)

## Constructors

### Constructor

> **new Log**(): `Log`

#### Returns

`Log`

## Methods

### getLevel()

> `static` **getLevel**(): `AVLogLevel`

Defined in: [src/lib/log.ts:94](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/log.ts#L94)

Get current log level.

Returns the current minimum log level setting.

Direct mapping to av_log_get_level().

#### Returns

`AVLogLevel`

Current log level

#### Example

```typescript
const level = Log.getLevel();
if (level <= AV_LOG_WARNING) {
  console.log('Logging warnings and above');
}
```

#### See

[setLevel](#setlevel) To change log level

***

### log()

> `static` **log**(`level`, `message`): `void`

Defined in: [src/lib/log.ts:118](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/log.ts#L118)

Log a message.

Sends a log message through FFmpeg's logging system.
The message will be processed according to current settings.

Direct mapping to av_log().

#### Parameters

##### level

`AVLogLevel`

Log level for this message

##### message

`string`

Message to log

#### Returns

`void`

#### Example

```typescript
import { AV_LOG_ERROR, AV_LOG_WARNING, AV_LOG_INFO } from 'node-av/constants';

Log.log(AV_LOG_ERROR, 'Critical error occurred');
Log.log(AV_LOG_WARNING, 'Non-fatal warning');
Log.log(AV_LOG_INFO, 'Processing started');
```

***

### resetCallback()

> `static` **resetCallback**(): `void`

Defined in: [src/lib/log.ts:185](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/log.ts#L185)

Reset to default log callback.

Restores the default FFmpeg logging behavior.
Removes any custom callback previously set.

Direct mapping to av_log_set_callback() with default handler.

#### Returns

`void`

#### Example

```typescript
// After using custom callback
Log.resetCallback();
// Now using default FFmpeg logging
```

#### See

[setCallback](#setcallback) To set custom callback

***

### setCallback()

> `static` **setCallback**(`callback`, `options?`): `void`

Defined in: [src/lib/log.ts:160](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/log.ts#L160)

Set custom log callback.

Installs a custom callback to handle FFmpeg log messages.
Allows redirecting logs to custom handlers or loggers.

Direct mapping to av_log_set_callback().

#### Parameters

##### callback

Function to handle log messages, or null to remove

`null` | (`level`, `message`) => `void`

##### options?

[`LogOptions`](../interfaces/LogOptions.md)

Additional logging options

#### Returns

`void`

#### Example

```typescript
import { AV_LOG_ERROR, AV_LOG_WARNING } from 'node-av/constants';

// Set custom callback with options
Log.setCallback((level, message) => {
  const timestamp = new Date().toISOString();

  if (level <= AV_LOG_ERROR) {
    console.error(`[${timestamp}] ERROR: ${message}`);
  } else if (level <= AV_LOG_WARNING) {
    console.warn(`[${timestamp}] WARN: ${message}`);
  } else {
    console.log(`[${timestamp}] INFO: ${message}`);
  }
}, {
  printPrefix: true,    // Include context prefix
  skipRepeated: true,   // Skip repeated messages
  level: AV_LOG_WARNING // Filter level
});

// Remove custom callback
Log.setCallback(null);
```

#### See

[resetCallback](#resetcallback) To restore default

***

### setLevel()

> `static` **setLevel**(`level`): `void`

Defined in: [src/lib/log.ts:71](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/log.ts#L71)

Set global log level.

Sets the minimum log level for FFmpeg messages.
Messages below this level will be suppressed.

Direct mapping to av_log_set_level().

#### Parameters

##### level

`AVLogLevel`

Minimum log level to display

#### Returns

`void`

#### Example

```typescript
import { AV_LOG_QUIET, AV_LOG_ERROR, AV_LOG_WARNING, AV_LOG_INFO } from 'node-av/constants';

Log.setLevel(AV_LOG_QUIET);   // Disable all logging
Log.setLevel(AV_LOG_ERROR);   // Only errors
Log.setLevel(AV_LOG_WARNING); // Errors and warnings
Log.setLevel(AV_LOG_INFO);    // Errors, warnings, and info
```
