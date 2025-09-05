import { bindings } from '../../lib/binding.js';

import type { ChannelLayout } from '../../lib/types.js';

/**
 * Audio channel layout utilities.
 *
 * Provides static methods for describing and working with audio channel layouts.
 * Channel layouts define the arrangement and meaning of audio channels in
 * multi-channel audio.
 *
 * @example
 * ```typescript
 * import { ChannelLayoutUtils } from 'node-av';
 * import { AV_CHANNEL_ORDER_NATIVE } from 'node-av/constants';
 *
 * // Describe a stereo layout
 * const stereo: ChannelLayout = {
 *   order: AV_CHANNEL_ORDER_NATIVE,
 *   nb_channels: 2,
 *   u: { mask: 0x3n } // FL | FR
 * };
 *
 * const description = ChannelLayoutUtils.describe(stereo);
 * console.log(description); // "stereo"
 *
 * // Describe a 5.1 layout
 * const surround: ChannelLayout = {
 *   order: AV_CHANNEL_ORDER_NATIVE,
 *   nb_channels: 6,
 *   u: { mask: 0x3Fn } // FL | FR | FC | LFE | BL | BR
 * };
 *
 * console.log(ChannelLayoutUtils.describe(surround)); // "5.1"
 * ```
 */
export class ChannelLayoutUtils {
  // Private constructor to prevent instantiation
  private constructor() {}

  /**
   * Get string description of channel layout.
   *
   * Returns a human-readable string describing the channel layout.
   * Direct mapping to av_channel_layout_describe()
   *
   * @param channelLayout - Channel layout to describe
   * @returns String description, or null on error
   *
   * @example
   * ```typescript
   * import { ChannelLayoutUtils } from 'node-av';
   * import { AV_CHANNEL_ORDER_NATIVE, AV_CHANNEL_ORDER_CUSTOM } from 'node-av/constants';
   *
   * // Standard layouts
   * const mono: ChannelLayout = {
   *   order: AV_CHANNEL_ORDER_NATIVE,
   *   nb_channels: 1,
   *   u: { mask: 0x4n } // FC
   * };
   * console.log(ChannelLayoutUtils.describe(mono)); // "mono"
   *
   * const stereo: ChannelLayout = {
   *   order: AV_CHANNEL_ORDER_NATIVE,
   *   nb_channels: 2,
   *   u: { mask: 0x3n } // FL | FR
   * };
   * console.log(ChannelLayoutUtils.describe(stereo)); // "stereo"
   *
   * // Custom layout
   * const custom: ChannelLayout = {
   *   order: AV_CHANNEL_ORDER_CUSTOM,
   *   nb_channels: 3,
   *   u: { map: null }
   * };
   * console.log(ChannelLayoutUtils.describe(custom)); // "3 channels"
   * ```
   */
  static describe(channelLayout: Partial<ChannelLayout>): string | null {
    return bindings.avChannelLayoutDescribe(channelLayout);
  }
}
