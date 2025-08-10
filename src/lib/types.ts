/**
 * Channel layout configuration
 */
export interface ChannelLayout {
  /** Number of channels */
  nbChannels: number;
  /** Channel order */
  order: number;
  /** Channel mask */
  mask: bigint;
}
