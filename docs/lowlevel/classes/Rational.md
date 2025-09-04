[node-av](../globals.md) / Rational

# Class: Rational

Defined in: [src/lib/rational.ts:32](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/rational.ts#L32)

Rational number type for precise fractional representations.

Represents a rational number as a fraction (numerator/denominator).
Used throughout FFmpeg for time bases, aspect ratios, frame rates,
and other fractional values that require exact precision.

## Example

```typescript
import { Rational } from 'node-av';

// Common time bases
const timebase = new Rational(1, 90000); // 90kHz for MPEG-TS
const videoTimebase = new Rational(1, 25); // 25 fps
const audioTimebase = new Rational(1, 48000); // 48kHz audio

// Frame rates
const framerate = new Rational(30, 1);    // 30 fps
const ntscFramerate = new Rational(30000, 1001); // 29.97 fps NTSC
const palFramerate = new Rational(25, 1); // 25 fps PAL

// Aspect ratios
const aspectRatio = new Rational(16, 9); // 16:9
const pixelAspect = new Rational(1, 1); // Square pixels

// Arithmetic operations
const doubled = timebase.mul(new Rational(2, 1));
const inverted = framerate.inv(); // Get frame duration
const sum = framerate.add(new Rational(5, 1)); // Add 5 fps
```

## Constructors

### Constructor

> **new Rational**(`num`, `den`): `Rational`

Defined in: [src/lib/rational.ts:61](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/rational.ts#L61)

Create a new rational number.

Represents the fraction num/den.

#### Parameters

##### num

`number`

Numerator of the fraction

##### den

`number`

Denominator of the fraction (must not be 0)

#### Returns

`Rational`

#### Throws

If denominator is 0

#### Example

```typescript
import { Rational } from 'node-av';

// Create time base for 25 fps video
const timebase = new Rational(1, 25);

// Create NTSC frame rate (29.97 fps)
const ntsc = new Rational(30000, 1001);

// Will throw error
try {
  const invalid = new Rational(1, 0);
} catch (error) {
  console.error('Cannot have zero denominator');
}
```

## Properties

### den

> `readonly` **den**: `number`

Defined in: [src/lib/rational.ts:63](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/rational.ts#L63)

Denominator of the fraction (must not be 0)

***

### num

> `readonly` **num**: `number`

Defined in: [src/lib/rational.ts:62](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/rational.ts#L62)

Numerator of the fraction

## Methods

### add()

> **add**(`other`): `Rational`

Defined in: [src/lib/rational.ts:87](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/rational.ts#L87)

Add two rational numbers.

Performs addition: (a/b) + (c/d) = (ad + bc) / bd

#### Parameters

##### other

`Rational`

The rational number to add

#### Returns

`Rational`

A new Rational representing the sum

#### Example

```typescript
const a = new Rational(1, 2); // 1/2
const b = new Rational(1, 3); // 1/3
const sum = a.add(b); // 5/6
console.log(sum.toString()); // "5/6"
```

***

### div()

> **div**(`other`): `Rational`

Defined in: [src/lib/rational.ts:150](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/rational.ts#L150)

Divide two rational numbers.

Performs division: (a/b) ÷ (c/d) = (ad) / (bc)

#### Parameters

##### other

`Rational`

The rational number to divide by

#### Returns

`Rational`

A new Rational representing the quotient

#### Example

```typescript
const pixels = new Rational(1920, 1); // 1920 pixels width
const aspect = new Rational(16, 9); // 16:9 aspect ratio
const height = pixels.div(aspect); // Calculate height
console.log(height.toDouble()); // 1080
```

***

### equals()

> **equals**(`other`): `boolean`

Defined in: [src/lib/rational.ts:214](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/rational.ts#L214)

Check if this rational equals another.

Compares using cross-multiplication to avoid floating point errors.
Two rationals a/b and c/d are equal if ad = bc.

#### Parameters

##### other

`Rational`

The rational to compare with

#### Returns

`boolean`

true if the rationals are equal, false otherwise

#### Example

```typescript
const a = new Rational(2, 4);
const b = new Rational(1, 2);
const c = new Rational(3, 4);

console.log(a.equals(b)); // true (both are 1/2)
console.log(a.equals(c)); // false
```

***

### inv()

> **inv**(): `Rational`

Defined in: [src/lib/rational.ts:169](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/rational.ts#L169)

Invert the rational number (reciprocal).

Returns the reciprocal: 1/(a/b) = b/a

#### Returns

`Rational`

A new Rational representing the reciprocal

#### Example

```typescript
const framerate = new Rational(25, 1); // 25 fps
const frameDuration = framerate.inv(); // 1/25 seconds per frame
console.log(frameDuration.toString()); // "1/25"
console.log(frameDuration.toDouble()); // 0.04 seconds
```

***

### mul()

> **mul**(`other`): `Rational`

Defined in: [src/lib/rational.ts:129](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/rational.ts#L129)

Multiply two rational numbers.

Performs multiplication: (a/b) × (c/d) = (ac) / (bd)

#### Parameters

##### other

`Rational`

The rational number to multiply by

#### Returns

`Rational`

A new Rational representing the product

#### Example

```typescript
const framerate = new Rational(30, 1); // 30 fps
const duration = new Rational(5, 1); // 5 seconds
const frames = framerate.mul(duration); // 150/1 = 150 frames
console.log(frames.toDouble()); // 150
```

***

### sub()

> **sub**(`other`): `Rational`

Defined in: [src/lib/rational.ts:108](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/rational.ts#L108)

Subtract two rational numbers.

Performs subtraction: (a/b) - (c/d) = (ad - bc) / bd

#### Parameters

##### other

`Rational`

The rational number to subtract

#### Returns

`Rational`

A new Rational representing the difference

#### Example

```typescript
const a = new Rational(3, 4); // 3/4
const b = new Rational(1, 4); // 1/4
const diff = a.sub(b); // 2/4 = 1/2
console.log(diff.toString()); // "2/4"
```

***

### toDouble()

> **toDouble**(): `number`

Defined in: [src/lib/rational.ts:190](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/rational.ts#L190)

Convert rational to floating point number.

Calculates the decimal value: num / den
Note: This may lose precision for some rational values.

#### Returns

`number`

The floating point representation

#### Example

```typescript
const ntsc = new Rational(30000, 1001); // NTSC frame rate
console.log(ntsc.toDouble()); // 29.97002997...

const half = new Rational(1, 2);
console.log(half.toDouble()); // 0.5
```

***

### toString()

> **toString**(): `string`

Defined in: [src/lib/rational.ts:234](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/rational.ts#L234)

Get string representation of the rational.

Returns the rational in "num/den" format.

#### Returns

`string`

String representation as "numerator/denominator"

#### Example

```typescript
const framerate = new Rational(30000, 1001);
console.log(framerate.toString()); // "30000/1001"

const timebase = new Rational(1, 90000);
console.log(`Timebase: ${timebase}`); // "Timebase: 1/90000"
```
