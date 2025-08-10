/**
 * Channel layout configuration
 */
export interface ChannelLayout {
  /** Number of channels */
  nbChannels: number;
  /** Channel order (optional, defaults to native) */
  order?: number;
  /** Channel mask */
  mask: bigint;
}
