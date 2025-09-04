[node-av](../globals.md) / avTs2Str

# Function: avTs2Str()

> **avTs2Str**(`ts`): `string`

Defined in: [src/lib/utilities.ts:380](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/utilities.ts#L380)

Convert timestamp to string.

Converts a timestamp to a string representation.

Direct mapping to av_ts2str().

## Parameters

### ts

Timestamp value

`null` | `number` | `bigint`

## Returns

`string`

String representation

## Example

```typescript
const str1 = avTs2Str(1234567n);  // Returns "1234567"
const str2 = avTs2Str(null);      // Returns "NOPTS"
```
