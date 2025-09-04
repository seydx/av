[node-av](../globals.md) / avUsleep

# Function: avUsleep()

> **avUsleep**(`usec`): `void`

Defined in: [src/lib/utilities.ts:522](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/utilities.ts#L522)

Sleep for microseconds.

Suspends execution for the specified number of microseconds.

Direct mapping to av_usleep().

## Parameters

### usec

`number`

Microseconds to sleep

## Returns

`void`

## Example

```typescript
avUsleep(1000000); // Sleep for 1 second
avUsleep(16667);   // Sleep for ~16.67ms (60fps frame time)
```
