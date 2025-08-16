/**
 * FFmpeg Channel Layout Constants
 * Auto-generated from FFmpeg headers
 * DO NOT EDIT MANUALLY
 */

import type { ChannelLayout } from './types.js';

// Channel masks (for legacy API)
export const AV_CH_FRONT_LEFT = 0x1n;
export const AV_CH_FRONT_RIGHT = 0x2n;
export const AV_CH_FRONT_CENTER = 0x4n;
export const AV_CH_LOW_FREQUENCY = 0x8n;
export const AV_CH_BACK_LEFT = 0x10n;
export const AV_CH_BACK_RIGHT = 0x20n;
export const AV_CH_BACK_CENTER = 0x100n;
export const AV_CH_SIDE_LEFT = 0x200n;
export const AV_CH_SIDE_RIGHT = 0x400n;

// Channel layouts
export const AV_CH_LAYOUT_MONO = 0x4n;
export const AV_CH_LAYOUT_STEREO = 0x3n;
export const AV_CH_LAYOUT_2POINT1 = 0xbn;
export const AV_CH_LAYOUT_SURROUND = 0x7n;
export const AV_CH_LAYOUT_3POINT1 = 0xfn;
export const AV_CH_LAYOUT_4POINT0 = 0x107n;
export const AV_CH_LAYOUT_4POINT1 = 0x10fn;
export const AV_CH_LAYOUT_QUAD = 0x33n;
export const AV_CH_LAYOUT_5POINT0 = 0x607n;
export const AV_CH_LAYOUT_5POINT1 = 0x60fn;
export const AV_CH_LAYOUT_5POINT0_BACK = 0x37n;
export const AV_CH_LAYOUT_5POINT1_BACK = 0x3fn;
export const AV_CH_LAYOUT_6POINT0 = 0x707n;
export const AV_CH_LAYOUT_6POINT0_FRONT = 0x6c3n;
export const AV_CH_LAYOUT_6POINT1 = 0x70fn;
export const AV_CH_LAYOUT_7POINT0 = 0x637n;
export const AV_CH_LAYOUT_7POINT1 = 0x63fn;
export const AV_CH_LAYOUT_OCTAGONAL = 0x737n;

// Modern AVChannelLayout structures as ChannelLayout objects
// order: 1 = AV_CHANNEL_ORDER_NATIVE
export const AV_CHANNEL_LAYOUT_MONO: ChannelLayout = { order: 1, nbChannels: 1, mask: 0x4n };
export const AV_CHANNEL_LAYOUT_STEREO: ChannelLayout = { order: 1, nbChannels: 2, mask: 0x3n };
export const AV_CHANNEL_LAYOUT_2POINT1: ChannelLayout = { order: 1, nbChannels: 3, mask: 0xbn };
export const AV_CHANNEL_LAYOUT_SURROUND: ChannelLayout = { order: 1, nbChannels: 3, mask: 0x7n };
export const AV_CHANNEL_LAYOUT_3POINT1: ChannelLayout = { order: 1, nbChannels: 4, mask: 0xfn };
export const AV_CHANNEL_LAYOUT_4POINT0: ChannelLayout = { order: 1, nbChannels: 4, mask: 0x107n };
export const AV_CHANNEL_LAYOUT_4POINT1: ChannelLayout = { order: 1, nbChannels: 5, mask: 0x10fn };
export const AV_CHANNEL_LAYOUT_QUAD: ChannelLayout = { order: 1, nbChannels: 4, mask: 0x33n };
export const AV_CHANNEL_LAYOUT_5POINT0: ChannelLayout = { order: 1, nbChannels: 5, mask: 0x607n };
export const AV_CHANNEL_LAYOUT_5POINT1: ChannelLayout = { order: 1, nbChannels: 6, mask: 0x60fn };
export const AV_CHANNEL_LAYOUT_5POINT0_BACK: ChannelLayout = { order: 1, nbChannels: 5, mask: 0x37n };
export const AV_CHANNEL_LAYOUT_5POINT1_BACK: ChannelLayout = { order: 1, nbChannels: 6, mask: 0x3fn };
export const AV_CHANNEL_LAYOUT_6POINT0: ChannelLayout = { order: 1, nbChannels: 6, mask: 0x707n };
export const AV_CHANNEL_LAYOUT_6POINT0_FRONT: ChannelLayout = { order: 1, nbChannels: 6, mask: 0x6c3n };
export const AV_CHANNEL_LAYOUT_6POINT1: ChannelLayout = { order: 1, nbChannels: 7, mask: 0x70fn };
export const AV_CHANNEL_LAYOUT_7POINT0: ChannelLayout = { order: 1, nbChannels: 7, mask: 0x637n };
export const AV_CHANNEL_LAYOUT_7POINT1: ChannelLayout = { order: 1, nbChannels: 8, mask: 0x63fn };
export const AV_CHANNEL_LAYOUT_OCTAGONAL: ChannelLayout = { order: 1, nbChannels: 8, mask: 0x737n };
