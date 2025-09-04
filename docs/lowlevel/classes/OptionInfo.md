[node-av](../globals.md) / OptionInfo

# Class: OptionInfo

Defined in: [src/lib/option.ts:88](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/option.ts#L88)

Option information descriptor.

Describes a single option available on an FFmpeg object.
Contains metadata about the option including name, type, default value,
valid range, and documentation. Used to discover and validate options.

Direct mapping to FFmpeg's AVOption.

## Example

```typescript
import { Option } from 'node-av';

// Get option info
const optInfo = Option.find(obj, 'bitrate');
if (optInfo) {
  console.log(`Option: ${optInfo.name}`);
  console.log(`Help: ${optInfo.help}`);
  console.log(`Type: ${optInfo.type}`);
  console.log(`Default: ${optInfo.defaultValue}`);
  console.log(`Range: ${optInfo.min} - ${optInfo.max}`);
}
```

## See

\[AVOption\](https://ffmpeg.org/doxygen/trunk/structAVOption.html)

## Constructors

### Constructor

> **new OptionInfo**(`native`): `OptionInfo`

Defined in: [src/lib/option.ts:95](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/option.ts#L95)

**`Internal`**

#### Parameters

##### native

`NativeOption`

The native option instance

#### Returns

`OptionInfo`

## Accessors

### defaultValue

#### Get Signature

> **get** **defaultValue**(): `unknown`

Defined in: [src/lib/option.ts:140](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/option.ts#L140)

Default value.

The default value for this option.
Type depends on the option type.

Direct mapping to AVOption->default_val.

##### Returns

`unknown`

***

### flags

#### Get Signature

> **get** **flags**(): `AVOptionFlag`

Defined in: [src/lib/option.ts:173](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/option.ts#L173)

Option flags.

Combination of AV_OPT_FLAG_* indicating option properties.

Direct mapping to AVOption->flags.

##### Returns

`AVOptionFlag`

***

### help

#### Get Signature

> **get** **help**(): `null` \| `string`

Defined in: [src/lib/option.ts:117](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/option.ts#L117)

Option help text.

Human-readable description of the option's purpose.

Direct mapping to AVOption->help.

##### Returns

`null` \| `string`

***

### max

#### Get Signature

> **get** **max**(): `number`

Defined in: [src/lib/option.ts:162](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/option.ts#L162)

Maximum value.

Maximum valid value for numeric options.

Direct mapping to AVOption->max.

##### Returns

`number`

***

### min

#### Get Signature

> **get** **min**(): `number`

Defined in: [src/lib/option.ts:151](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/option.ts#L151)

Minimum value.

Minimum valid value for numeric options.

Direct mapping to AVOption->min.

##### Returns

`number`

***

### name

#### Get Signature

> **get** **name**(): `null` \| `string`

Defined in: [src/lib/option.ts:106](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/option.ts#L106)

Option name.

The name used to get/set this option.

Direct mapping to AVOption->name.

##### Returns

`null` \| `string`

***

### type

#### Get Signature

> **get** **type**(): `AVOptionType`

Defined in: [src/lib/option.ts:128](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/option.ts#L128)

Option type.

Data type of the option value (AV_OPT_TYPE_*).

Direct mapping to AVOption->type.

##### Returns

`AVOptionType`

***

### unit

#### Get Signature

> **get** **unit**(): `null` \| `string`

Defined in: [src/lib/option.ts:184](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/option.ts#L184)

Option unit.

Unit string for grouping related options.

Direct mapping to AVOption->unit.

##### Returns

`null` \| `string`

## Methods

### getNative()

> **getNative**(): `NativeOption`

Defined in: [src/lib/option.ts:195](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/lib/option.ts#L195)

**`Internal`**

Get the underlying native Option object.

#### Returns

`NativeOption`

The native Option binding object
