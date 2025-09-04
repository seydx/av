[node-av](../globals.md) / avTs2TimeStr

# Function: avTs2TimeStr()

> **avTs2TimeStr**(`ts`, `timeBase`): `string`

Defined in: [src/lib/utilities.ts:401](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/utilities.ts#L401)

Convert timestamp to time string.

Converts a timestamp to a time string using the specified time base.

Direct mapping to av_ts2timestr().

## Parameters

### ts

Timestamp value

`null` | `number` | `bigint`

### timeBase

Time base for conversion

`null` | [`IRational`](../interfaces/IRational.md)

## Returns

`string`

Time string representation

## Example

```typescript
const timeStr = avTs2TimeStr(90000n, { num: 1, den: 90000 }); // Returns "1.000000"
const nopts = avTs2TimeStr(null, { num: 1, den: 1000 });      // Returns "NOPTS"
```
