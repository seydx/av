[node-av](../globals.md) / TimestampUtils

# Class: TimestampUtils

Defined in: [utilities/timestamp.ts:41](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/utilities/timestamp.ts#L41)

Timestamp and time base utilities.

Provides static methods for converting, rescaling, and comparing timestamps.
These utilities are essential for working with different time bases in
multimedia streams.

## Example

```typescript
import { TimestampUtils } from 'node-av';
import { AV_ROUND_NEAR_INF } from 'node-av/constants';

// Convert timestamp to string representations
const pts = 450000n;
console.log(TimestampUtils.toString(pts));                    // "450000"

const timebase = { num: 1, den: 90000 };
console.log(TimestampUtils.toTimeString(pts, timebase));      // "5.000000"

// Rescale between time bases
const srcTb = { num: 1, den: 90000 };
const dstTb = { num: 1, den: 1000 };
const rescaled = TimestampUtils.rescale(pts, srcTb, dstTb);
console.log(rescaled);                                         // 5000n
```

## Methods

### compare()

> `static` **compare**(`tsA`, `tbA`, `tsB`, `tbB`): `number`

Defined in: [utilities/timestamp.ts:121](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/utilities/timestamp.ts#L121)

Compare timestamps from different time bases.

Compares two timestamps that may have different time bases.
Direct mapping to av_compare_ts()

#### Parameters

##### tsA

First timestamp

`null` | `number` | `bigint`

##### tbA

`IRational`

Time base of first timestamp

##### tsB

Second timestamp

`null` | `number` | `bigint`

##### tbB

`IRational`

Time base of second timestamp

#### Returns

`number`

-1 if tsA < tsB, 0 if equal, 1 if tsA > tsB

#### Example

```typescript
import { TimestampUtils } from 'node-av';

// Compare timestamps from different time bases
const pts1 = 90000n;
const tb1 = { num: 1, den: 90000 };  // 1 second in 90kHz

const pts2 = 1000n;
const tb2 = { num: 1, den: 1000 };   // 1 second in 1kHz

const result = TimestampUtils.compare(pts1, tb1, pts2, tb2);
console.log(result); // 0 (equal - both represent 1 second)
```

***

### rescale()

> `static` **rescale**(`a`, `bq`, `cq`): `bigint`

Defined in: [utilities/timestamp.ts:150](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/utilities/timestamp.ts#L150)

Rescale timestamp from one time base to another.

Converts a timestamp from source time base to destination time base.
Uses AV_ROUND_NEAR_INF rounding.
Direct mapping to av_rescale_q()

#### Parameters

##### a

Timestamp to rescale

`null` | `number` | `bigint`

##### bq

`IRational`

Source time base

##### cq

`IRational`

Destination time base

#### Returns

`bigint`

Rescaled timestamp

#### Example

```typescript
import { TimestampUtils } from 'node-av';

// Convert from 90kHz to milliseconds
const pts = 450000n;
const srcTb = { num: 1, den: 90000 };
const dstTb = { num: 1, den: 1000 };

const rescaled = TimestampUtils.rescale(pts, srcTb, dstTb);
console.log(rescaled); // 5000n (5000 milliseconds = 5 seconds)
```

***

### rescaleRounded()

> `static` **rescaleRounded**(`a`, `b`, `c`, `rnd`): `bigint`

Defined in: [utilities/timestamp.ts:184](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/utilities/timestamp.ts#L184)

Rescale with specified rounding.

Rescales a value with explicit rounding mode.
More general than rescale() as it doesn't use time bases.
Direct mapping to av_rescale_rnd()

#### Parameters

##### a

Value to rescale

`number` | `bigint`

##### b

Multiplier

`number` | `bigint`

##### c

Divisor

`number` | `bigint`

##### rnd

`AVRounding`

Rounding mode

#### Returns

`bigint`

Rescaled value: a * b / c

#### Example

```typescript
import { TimestampUtils } from 'node-av';
import { AV_ROUND_UP, AV_ROUND_DOWN } from 'node-av/constants';

// Scale with different rounding modes
const value = 100n;
const mul = 3n;
const div = 7n;

const roundUp = TimestampUtils.rescaleRounded(value, mul, div, AV_ROUND_UP);
const roundDown = TimestampUtils.rescaleRounded(value, mul, div, AV_ROUND_DOWN);

console.log(roundUp);   // 43n (rounds up)
console.log(roundDown); // 42n (rounds down)
```

***

### sleep()

> `static` **sleep**(`usec`): `void`

Defined in: [utilities/timestamp.ts:207](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/utilities/timestamp.ts#L207)

Sleep for specified microseconds.

Sleeps for the specified number of microseconds.
Direct mapping to av_usleep()

#### Parameters

##### usec

`number`

Microseconds to sleep

#### Returns

`void`

#### Example

```typescript
import { TimestampUtils } from 'node-av';

// Sleep for 100 milliseconds
TimestampUtils.sleep(100000);

// Sleep for 1 second
TimestampUtils.sleep(1000000);
```

***

### toString()

> `static` **toString**(`ts`): `string`

Defined in: [utilities/timestamp.ts:65](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/utilities/timestamp.ts#L65)

Convert timestamp to string.

Converts a timestamp value to its string representation.
Handles special values like AV_NOPTS_VALUE.
Direct mapping to av_ts2str()

#### Parameters

##### ts

Timestamp value (bigint or number), or null

`null` | `number` | `bigint`

#### Returns

`string`

String representation

#### Example

```typescript
import { TimestampUtils } from 'node-av';
import { AV_NOPTS_VALUE } from 'node-av/constants';

console.log(TimestampUtils.toString(12345n));        // "12345"
console.log(TimestampUtils.toString(AV_NOPTS_VALUE)); // "NOPTS"
console.log(TimestampUtils.toString(null));          // "NOPTS"
```

***

### toTimeString()

> `static` **toTimeString**(`ts`, `timeBase`): `string`

Defined in: [utilities/timestamp.ts:90](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/utilities/timestamp.ts#L90)

Convert timestamp to time string.

Converts a timestamp to a time string in seconds using the provided time base.
Direct mapping to av_ts2timestr()

#### Parameters

##### ts

Timestamp value

`null` | `number` | `bigint`

##### timeBase

`IRational`

Time base for conversion

#### Returns

`string`

Time string in seconds with decimal places

#### Example

```typescript
import { TimestampUtils } from 'node-av';

const pts = 450000n;
const timebase = { num: 1, den: 90000 }; // 90kHz

console.log(TimestampUtils.toTimeString(pts, timebase));     // "5.000000"
console.log(TimestampUtils.toTimeString(90000n, timebase));  // "1.000000"
```
