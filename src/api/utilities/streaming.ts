/**
 * Streaming Utilities
 *
 * Provides utilities for working with streaming protocols in FFmpeg.
 * Includes SDP generation for RTP/RTSP streaming and helper methods.
 *
 * @module api/utilities/streaming
 */

import { avSdpCreate } from '../../lib/utilities.js';

import type { MediaInput } from '../media-input.js';
import type { MediaOutput } from '../media-output.js';

/**
 * Streaming protocol utilities.
 *
 * Provides static methods for SDP generation, RTP URL building, and
 * network streaming helpers for RTP/RTSP protocols.
 *
 * @example
 * ```typescript
 * import { StreamingUtils, MediaOutput } from 'node-av/api';
 *
 * // Create RTP outputs
 * const videoOutput = await MediaOutput.create('rtp://127.0.0.1:5004');
 * const audioOutput = await MediaOutput.create('rtp://127.0.0.1:5006');
 *
 * // Generate SDP for streaming
 * const sdp = StreamingUtils.createSdp([videoOutput, audioOutput]);
 * if (sdp) {
 *   console.log('SDP for streaming:', sdp);
 *   // Save to .sdp file or serve via RTSP server
 * }
 * ```
 */
export class StreamingUtils {
  /**
   * Create an SDP (Session Description Protocol) string from media inputs/outputs
   *
   * Generates an SDP description for RTP/RTSP streaming from one or more
   * configured media inputs/outputs. The inputs/outputs should be configured with RTP
   * format and have their streams set up before calling this method.
   *
   * @param inouts - Array of MediaInput or MediaOutput objects configured for RTP
   * @returns SDP string if successful, null if failed
   *
   * @example
   * ```typescript
   * // Set up RTP outputs with streams
   * const output1 = await MediaOutput.create('rtp://239.0.0.1:5004');
   * await output1.addVideoStream(encoder1);
   *
   * const output2 = await MediaOutput.create('rtp://239.0.0.1:5006');
   * await output2.addAudioStream(encoder2);
   *
   * // Generate SDP for multicast streaming
   * const sdp = StreamingUtils.createSdp([output1, output2]);
   * if (sdp) {
   *   // Write to file for VLC or other players
   *   await fs.writeFile('stream.sdp', sdp);
   * }
   * ```
   */
  static createSdp(inouts: MediaInput[] | MediaOutput[]): string | null {
    if (!inouts || inouts.length === 0) {
      return null;
    }

    // Extract FormatContext from each MediaOutput
    const contexts = inouts
      .map((inout) => {
        return inout.getFormatContext();
      })
      .filter((ctx) => ctx != null);

    if (contexts.length === 0) {
      return null;
    }

    return avSdpCreate(contexts);
  }

  /**
   * Validate if an output is configured for RTP streaming
   *
   * @param output - MediaOutput to check
   * @returns true if configured for RTP
   *
   * @example
   * ```typescript
   * const output = await MediaOutput.create('rtp://127.0.0.1:5004');
   * if (StreamingUtils.isRtpOutput(output)) {
   *   const sdp = StreamingUtils.createSdpForOutput(output);
   * }
   * ```
   */
  static isRtpOutput(output: MediaOutput): boolean {
    // Check if the output format is RTP
    const formatContext = output.getFormatContext();
    const oformat = formatContext?.oformat;
    if (oformat) {
      const name = oformat.name;
      return name === 'rtp' || name === 'rtp_mpegts';
    }
    return false;
  }

  /**
   * Build RTP URL from components
   *
   * Helper to construct RTP URLs with proper formatting.
   *
   * @param host - IP address or hostname
   * @param port - Port number
   * @param options - Additional options
   * @returns Formatted RTP URL
   *
   * @example
   * ```typescript
   * // Unicast
   * const url1 = StreamingUtils.buildRtpUrl('127.0.0.1', 5004);
   * // 'rtp://127.0.0.1:5004'
   *
   * // Multicast
   * const url2 = StreamingUtils.buildRtpUrl('239.0.0.1', 5004, { ttl: 64 });
   * // 'rtp://239.0.0.1:5004?ttl=64'
   * ```
   */
  static buildRtpUrl(
    host: string,
    port: number,
    options?: {
      ttl?: number; // Time-to-live for multicast
      localrtpport?: number; // Local RTP port
      localrtcpport?: number; // Local RTCP port
      pkt_size?: number; // Packet size
    },
  ): string {
    let url = `rtp://${host}:${port}`;

    if (options && Object.keys(options).length > 0) {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(options)) {
        if (value !== undefined) {
          params.append(key, String(value));
        }
      }
      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    return url;
  }
}
