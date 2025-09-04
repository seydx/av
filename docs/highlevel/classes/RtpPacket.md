[node-av](../globals.md) / RtpPacket

# Class: RtpPacket

Defined in: [utils.ts:332](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/utils.ts#L332)

## Constructors

### Constructor

> **new RtpPacket**(`header`, `payload`): `RtpPacket`

Defined in: [utils.ts:333](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/utils.ts#L333)

#### Parameters

##### header

[`RtpHeader`](RtpHeader.md)

##### payload

`Buffer`

#### Returns

`RtpPacket`

## Properties

### header

> **header**: [`RtpHeader`](RtpHeader.md)

Defined in: [utils.ts:334](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/utils.ts#L334)

***

### payload

> **payload**: `Buffer`

Defined in: [utils.ts:335](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/utils.ts#L335)

## Accessors

### serializeSize

#### Get Signature

> **get** **serializeSize**(): `number`

Defined in: [utils.ts:338](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/utils.ts#L338)

##### Returns

`number`

## Methods

### clear()

> **clear**(): `void`

Defined in: [utils.ts:365](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/utils.ts#L365)

#### Returns

`void`

***

### clone()

> **clone**(): `RtpPacket`

Defined in: [utils.ts:342](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/utils.ts#L342)

#### Returns

`RtpPacket`

***

### serialize()

> **serialize**(): `Buffer`\<`ArrayBuffer`\>

Defined in: [utils.ts:346](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/utils.ts#L346)

#### Returns

`Buffer`\<`ArrayBuffer`\>

***

### deSerialize()

> `static` **deSerialize**(`buf`): `RtpPacket`

Defined in: [utils.ts:359](https://github.com/seydx/av/blob/f8631fc881b394300b1479f511d55cf1c370a87f/src/api/utils.ts#L359)

#### Parameters

##### buf

`Buffer`

#### Returns

`RtpPacket`
