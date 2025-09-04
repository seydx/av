[node-av](../globals.md) / LogOptions

# Interface: LogOptions

Defined in: [src/lib/types.ts:63](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/types.ts#L63)

Log callback options for performance tuning.

## Properties

### maxLevel?

> `optional` **maxLevel**: `AVLogLevel`

Defined in: [src/lib/types.ts:69](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/types.ts#L69)

Maximum log level to capture.
Messages above this level are ignored at the C level for maximum performance.
Default: AV_LOG_INFO
