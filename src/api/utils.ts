/**
 * Parse bitrate string to bigint.
 *
 * Supports suffixes: K (kilo), M (mega), G (giga).
 *
 * Converts human-readable bitrate strings to numeric values.
 *
 * @param str - Bitrate string (e.g., '5M', '192k')
 *
 * @returns Bitrate as bigint
 *
 * @example
 * ```typescript
 * parseBitrate('5M')   // 5000000n
 * parseBitrate('192k') // 192000n
 * parseBitrate('1.5G') // 1500000000n
 * ```
 */
export function parseBitrate(str: string): bigint {
  const match = /^(\d+(?:\.\d+)?)\s*([KMG])?$/i.exec(str);
  if (!match) {
    throw new Error(`Invalid bitrate: ${str}`);
  }

  let value = parseFloat(match[1]);
  const unit = match[2]?.toUpperCase();

  switch (unit) {
    case 'K':
      value *= 1000;
      break;
    case 'M':
      value *= 1000000;
      break;
    case 'G':
      value *= 1000000000;
      break;
  }

  return BigInt(Math.floor(value));
}

// (c) https://github.com/shinyoshiaki/werift-webrtc/tree/develop/packages/rtp

class BitWriter {
  value = 0;

  constructor(private bitLength: number) {}

  set(size: number, startIndex: number, value: number) {
    value &= (1 << size) - 1;
    this.value |= value << (this.bitLength - size - startIndex);

    return this;
  }

  get buffer() {
    const length = Math.ceil(this.bitLength / 8);
    const buf = Buffer.alloc(length);
    buf.writeUIntBE(this.value, 0, length);
    return buf;
  }
}

/**
 * Get a specific bit value from a number.
 *
 * @param bits - The number to extract bits from
 * @param startIndex - The starting bit index (0-based)
 * @param length - The number of bits to extract
 *
 * @returns The extracted bit value
 *
 * @internal
 */
function getBit(bits: number, startIndex: number, length = 1): number {
  let bin = bits.toString(2).split('');
  bin = [...Array(8 - bin.length).fill('0'), ...bin];
  const s = bin.slice(startIndex, startIndex + length).join('');
  const v = Number.parseInt(s, 2);
  return v;
}

export interface Extension {
  id: number;
  payload: Buffer;
}

export const ExtensionProfiles = {
  OneByte: 0xbede, // 48862
  TwoByte: 0x1000, // 4096
} as const;

export type ExtensionProfile = (typeof ExtensionProfiles)[keyof typeof ExtensionProfiles];

const seqNumOffset = 2;
const timestampOffset = 4;
const ssrcOffset = 8;
const csrcOffset = 12;
const csrcSize = 4;

/*
 *  0                   1                   2                   3
 *  0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
 * +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 * |V=2|P|X|  CC   |M|     PT      |       sequence number         |
 * +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 * |                           timestamp                           |
 * +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 * |           synchronization source (SSRC) identifier            |
 * +=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+
 * |            contributing source (CSRC) identifiers             |
 * |                             ....                              |
 * +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 */

export class RtpHeader {
  version = 2;
  padding = false;
  paddingSize = 0;
  extension = false;
  marker = false;
  payloadOffset = 0;
  payloadType = 0;
  sequenceNumber = 0;
  timestamp = 0;
  ssrc = 0;
  csrcLength = 0;
  csrc: number[] = [];
  extensionProfile: ExtensionProfile = ExtensionProfiles.OneByte;
  /** deserialize only */
  extensionLength?: number;
  extensions: Extension[] = [];
  constructor(props: Partial<RtpHeader> = {}) {
    Object.assign(this, props);
  }

  static deSerialize(rawPacket: Buffer) {
    const h = new RtpHeader();
    let currOffset = 0;
    const v_p_x_cc = rawPacket[currOffset++];
    h.version = getBit(v_p_x_cc, 0, 2);
    h.padding = getBit(v_p_x_cc, 2) > 0;
    h.extension = getBit(v_p_x_cc, 3) > 0;
    h.csrcLength = getBit(v_p_x_cc, 4, 4);
    h.csrc = [...Array(h.csrcLength)].map(() => {
      const csrc = rawPacket.readUInt32BE(currOffset);
      currOffset += 4;
      return csrc;
    });
    currOffset += csrcOffset - 1;

    const m_pt = rawPacket[1];
    h.marker = getBit(m_pt, 0) > 0;
    h.payloadType = getBit(m_pt, 1, 7);

    h.sequenceNumber = rawPacket.readUInt16BE(seqNumOffset);
    h.timestamp = rawPacket.readUInt32BE(timestampOffset);
    h.ssrc = rawPacket.readUInt32BE(ssrcOffset);

    for (let i = 0; i < h.csrc.length; i++) {
      const offset = csrcOffset + i * csrcSize;
      h.csrc[i] = rawPacket.subarray(offset).readUInt32BE();
    }
    if (h.extension) {
      h.extensionProfile = rawPacket.subarray(currOffset).readUInt16BE() as ExtensionProfile;
      currOffset += 2;
      const extensionLength = rawPacket.subarray(currOffset).readUInt16BE() * 4;
      h.extensionLength = extensionLength;
      currOffset += 2;

      switch (h.extensionProfile) {
        // RFC 8285 RTP One Byte Header Extension
        case ExtensionProfiles.OneByte:
          {
            const end = currOffset + extensionLength;
            while (currOffset < end) {
              if (rawPacket[currOffset] === 0x00) {
                currOffset++;
                continue;
              }

              const extId = rawPacket[currOffset] >> 4;
              const len = (rawPacket[currOffset] & (rawPacket[currOffset] ^ 0xf0)) + 1; // and not &^
              currOffset++;
              if (extId === 0xf) {
                break;
              }
              const extension: Extension = {
                id: extId,
                payload: rawPacket.subarray(currOffset, currOffset + len),
              };
              h.extensions = [...h.extensions, extension];
              currOffset += len;
            }
          }
          break;
        // RFC 8285 RTP Two Byte Header Extension
        case ExtensionProfiles.TwoByte:
          {
            const end = currOffset + extensionLength;
            while (currOffset < end) {
              if (rawPacket[currOffset] === 0x00) {
                currOffset++;
                continue;
              }
              const extId = rawPacket[currOffset];
              currOffset++;
              const len = rawPacket[currOffset];
              currOffset++;

              const extension: Extension = {
                id: extId,
                payload: rawPacket.subarray(currOffset, currOffset + len),
              };
              h.extensions = [...h.extensions, extension];
              currOffset += len;
            }
          }
          break;
        default:
          {
            const extension: Extension = {
              id: 0,
              payload: rawPacket.subarray(currOffset, currOffset + extensionLength),
            };
            h.extensions = [...h.extensions, extension];
            currOffset += h.extensions[0].payload.length;
          }
          break;
      }
    }
    h.payloadOffset = currOffset;
    if (h.padding) {
      h.paddingSize = rawPacket[rawPacket.length - 1];
    }

    return h;
  }

  get serializeSize() {
    const { csrc, extensionProfile, extensions } = this;

    let size = 12 + csrc.length * csrcSize;

    if (extensions.length > 0 || this.extension === true) {
      let extSize = 4;
      switch (extensionProfile) {
        case ExtensionProfiles.OneByte:
          for (const extension of extensions) {
            extSize += 1 + extension.payload.length;
          }
          break;
        case ExtensionProfiles.TwoByte:
          for (const extension of extensions) {
            extSize += 2 + extension.payload.length;
          }
          break;
        default:
          extSize += extensions[0].payload.length;
      }
      size += Math.floor((extSize + 3) / 4) * 4;
    }

    return size;
  }

  serialize(size: number) {
    const buf = Buffer.alloc(size);
    let offset = 0;

    const v_p_x_cc = new BitWriter(8);
    v_p_x_cc.set(2, 0, this.version);
    if (this.padding) v_p_x_cc.set(1, 2, 1);
    if (this.extensions.length > 0) this.extension = true;
    if (this.extension) v_p_x_cc.set(1, 3, 1);
    v_p_x_cc.set(4, 4, this.csrc.length);
    buf.writeUInt8(v_p_x_cc.value, offset++);

    const m_pt = new BitWriter(8);
    if (this.marker) m_pt.set(1, 0, 1);
    m_pt.set(7, 1, this.payloadType);
    buf.writeUInt8(m_pt.value, offset++);

    buf.writeUInt16BE(this.sequenceNumber, seqNumOffset);
    offset += 2;
    buf.writeUInt32BE(this.timestamp, timestampOffset);
    offset += 4;
    buf.writeUInt32BE(this.ssrc, ssrcOffset);
    offset += 4;

    for (const csrc of this.csrc) {
      buf.writeUInt32BE(csrc, offset);
      offset += 4;
    }

    if (this.extension) {
      const extHeaderPos = offset;
      buf.writeUInt16BE(this.extensionProfile, offset);
      offset += 4;
      const startExtensionsPos = offset;

      switch (this.extensionProfile) {
        case ExtensionProfiles.OneByte:
          for (const extension of this.extensions) {
            buf.writeUInt8((extension.id << 4) | (extension.payload.length - 1), offset++);
            extension.payload.copy(buf, offset);
            offset += extension.payload.length;
          }
          break;
        case ExtensionProfiles.TwoByte:
          for (const extension of this.extensions) {
            buf.writeUInt8(extension.id, offset++);
            buf.writeUInt8(extension.payload.length, offset++);
            extension.payload.copy(buf, offset);
            offset += extension.payload.length;
          }
          break;
        default: {
          const extLen = this.extensions[0].payload.length;
          if (extLen % 4 != 0) {
            throw new Error();
          }
          this.extensions[0].payload.copy(buf, offset);
          offset += extLen;
        }
      }

      const extSize = offset - startExtensionsPos;
      const roundedExtSize = Math.trunc((extSize + 3) / 4) * 4;

      buf.writeUInt16BE(Math.trunc(roundedExtSize / 4), extHeaderPos + 2);
      // padding 4 bytes boundaries
      for (let i = 0; i < roundedExtSize - extSize; i++) {
        buf.writeUInt8(0, offset);
        offset++;
      }
    }
    this.payloadOffset = offset;
    return buf;
  }
}

export class RtpPacket {
  constructor(
    public header: RtpHeader,
    public payload: Buffer,
  ) {}

  get serializeSize() {
    return this.header.serializeSize + this.payload.length;
  }

  clone() {
    return new RtpPacket(new RtpHeader({ ...this.header }), this.payload);
  }

  serialize() {
    let buf = this.header.serialize(this.header.serializeSize + this.payload.length);
    const { payloadOffset } = this.header;
    this.payload.copy(buf, payloadOffset);
    if (this.header.padding) {
      const padding = Buffer.alloc(this.header.paddingSize);
      padding.writeUInt8(this.header.paddingSize, this.header.paddingSize - 1);
      buf = Buffer.concat([buf, padding]);
    }

    return buf;
  }

  static deSerialize(buf: Buffer) {
    const header = RtpHeader.deSerialize(buf);
    const p = new RtpPacket(header, buf.subarray(header.payloadOffset, buf.length - header.paddingSize));
    return p;
  }

  clear() {
    this.payload = null as any;
  }
}
