[node-av](../globals.md) / RtpHeader

# Class: RtpHeader

Defined in: [utils.ts:105](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/utils.ts#L105)

## Constructors

### Constructor

> **new RtpHeader**(`props`): `RtpHeader`

Defined in: [utils.ts:122](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/utils.ts#L122)

#### Parameters

##### props

`Partial`\<`RtpHeader`\> = `{}`

#### Returns

`RtpHeader`

## Properties

### csrc

> **csrc**: `number`[] = `[]`

Defined in: [utils.ts:117](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/utils.ts#L117)

***

### csrcLength

> **csrcLength**: `number` = `0`

Defined in: [utils.ts:116](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/utils.ts#L116)

***

### extension

> **extension**: `boolean` = `false`

Defined in: [utils.ts:109](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/utils.ts#L109)

***

### extensionLength?

> `optional` **extensionLength**: `number`

Defined in: [utils.ts:120](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/utils.ts#L120)

deserialize only

***

### extensionProfile

> **extensionProfile**: `ExtensionProfile` = `ExtensionProfiles.OneByte`

Defined in: [utils.ts:118](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/utils.ts#L118)

***

### extensions

> **extensions**: [`Extension`](../interfaces/Extension.md)[] = `[]`

Defined in: [utils.ts:121](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/utils.ts#L121)

***

### marker

> **marker**: `boolean` = `false`

Defined in: [utils.ts:110](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/utils.ts#L110)

***

### padding

> **padding**: `boolean` = `false`

Defined in: [utils.ts:107](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/utils.ts#L107)

***

### paddingSize

> **paddingSize**: `number` = `0`

Defined in: [utils.ts:108](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/utils.ts#L108)

***

### payloadOffset

> **payloadOffset**: `number` = `0`

Defined in: [utils.ts:111](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/utils.ts#L111)

***

### payloadType

> **payloadType**: `number` = `0`

Defined in: [utils.ts:112](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/utils.ts#L112)

***

### sequenceNumber

> **sequenceNumber**: `number` = `0`

Defined in: [utils.ts:113](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/utils.ts#L113)

***

### ssrc

> **ssrc**: `number` = `0`

Defined in: [utils.ts:115](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/utils.ts#L115)

***

### timestamp

> **timestamp**: `number` = `0`

Defined in: [utils.ts:114](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/utils.ts#L114)

***

### version

> **version**: `number` = `2`

Defined in: [utils.ts:106](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/utils.ts#L106)

## Accessors

### serializeSize

#### Get Signature

> **get** **serializeSize**(): `number`

Defined in: [utils.ts:229](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/utils.ts#L229)

##### Returns

`number`

## Methods

### serialize()

> **serialize**(`size`): `Buffer`\<`ArrayBuffer`\>

Defined in: [utils.ts:256](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/utils.ts#L256)

#### Parameters

##### size

`number`

#### Returns

`Buffer`\<`ArrayBuffer`\>

***

### deSerialize()

> `static` **deSerialize**(`rawPacket`): `RtpHeader`

Defined in: [utils.ts:126](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/utils.ts#L126)

#### Parameters

##### rawPacket

`Buffer`

#### Returns

`RtpHeader`
