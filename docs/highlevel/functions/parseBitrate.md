[node-av](../globals.md) / parseBitrate

# Function: parseBitrate()

> **parseBitrate**(`str`): `bigint`

Defined in: [utils.ts:19](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/utils.ts#L19)

Parse bitrate string to bigint.

Supports suffixes: K (kilo), M (mega), G (giga).

Converts human-readable bitrate strings to numeric values.

## Parameters

### str

`string`

Bitrate string (e.g., '5M', '192k')

## Returns

`bigint`

Bitrate as bigint

## Example

```typescript
parseBitrate('5M')   // 5000000n
parseBitrate('192k') // 192000n
parseBitrate('1.5G') // 1500000000n
```
