import { CodecParameters } from './codec-parameters.js';
import { Dictionary } from './dictionary.js';
import { Rational } from './rational.js';

import type { AVDiscard, AVDisposition, AVStreamEventFlag } from '../constants/constants.js';
import type { NativeStream, NativeWrapper } from './native-types.js';
import type { Packet } from './packet.js';

/**
 * Media stream within a format context.
 *
 * Represents a single stream (video, audio, subtitle, etc.) within a media container.
 * Contains stream-specific information including codec parameters, timing information,
 * metadata, and disposition flags. Each stream in a file has a unique index and may
 * contain packets of compressed data.
 *
 * Direct mapping to FFmpeg's AVStream.
 *
 * @example
 * ```typescript
 * import { FormatContext, FFmpegError } from 'node-av';
 * import { AVMEDIA_TYPE_VIDEO, AVMEDIA_TYPE_AUDIO } from 'node-av/constants';
 *
 * // Access streams from format context
 * const formatContext = new FormatContext();
 * await formatContext.openInput('video.mp4');
 *
 * // Iterate through streams
 * for (let i = 0; i < formatContext.nbStreams; i++) {
 *   const stream = formatContext.streams[i];
 *   const codecpar = stream.codecpar;
 *
 *   if (codecpar.codecType === AVMEDIA_TYPE_VIDEO) {
 *     console.log(`Video stream ${stream.index}:`);
 *     console.log(`  Codec: ${codecpar.codecId}`);
 *     console.log(`  Resolution: ${codecpar.width}x${codecpar.height}`);
 *     console.log(`  Frame rate: ${stream.avgFrameRate.num}/${stream.avgFrameRate.den}`);
 *   } else if (codecpar.codecType === AVMEDIA_TYPE_AUDIO) {
 *     console.log(`Audio stream ${stream.index}:`);
 *     console.log(`  Sample rate: ${codecpar.sampleRate} Hz`);
 *     console.log(`  Channels: ${codecpar.channels}`);
 *   }
 * }
 * ```
 *
 * @see [AVStream](https://ffmpeg.org/doxygen/trunk/structAVStream.html) - FFmpeg Doxygen
 * @see {@link FormatContext} For container operations
 * @see {@link CodecParameters} For codec configuration
 */
export class Stream implements NativeWrapper<NativeStream> {
  private native: NativeStream;
  private _codecpar?: CodecParameters; // Cache the wrapped codecpar

  /**
   * @param native - The native stream instance
   *
   * @internal
   */
  constructor(native: NativeStream) {
    this.native = native;
  }

  /**
   * Stream index.
   *
   * Zero-based index of this stream in the format context.
   * Used to identify packets belonging to this stream.
   *
   * Direct mapping to AVStream->index.
   */
  get index(): number {
    return this.native.index;
  }

  /**
   * Stream ID.
   *
   * Format-specific stream identifier.
   * May be used by some formats for internal stream identification.
   *
   * Direct mapping to AVStream->id.
   */
  get id(): number {
    return this.native.id;
  }

  set id(value: number) {
    this.native.id = value;
  }

  /**
   * Codec parameters.
   *
   * Contains essential codec configuration for this stream.
   * Used to initialize decoders and describe stream properties.
   *
   * Direct mapping to AVStream->codecpar.
   */
  get codecpar(): CodecParameters {
    // Return cached wrapper if we already have one
    if (this._codecpar) {
      return this._codecpar;
    }

    // Create and cache the wrapper
    const params = Object.create(CodecParameters.prototype) as CodecParameters;
    (params as any).native = this.native.codecpar;
    this._codecpar = params;
    return params;
  }

  set codecpar(value: CodecParameters) {
    // Copy codec parameters to the stream
    // The native binding handles the copying
    this.native.codecpar = value.getNative();
    // Clear the cache as the underlying parameters have changed
    this._codecpar = undefined;
  }

  /**
   * Stream time base.
   *
   * Unit of time for timestamps in this stream.
   * All timestamps (PTS/DTS) are in units of this time base.
   *
   * Direct mapping to AVStream->time_base.
   */
  get timeBase(): Rational {
    const tb = this.native.timeBase;
    return new Rational(tb.num, tb.den);
  }

  set timeBase(value: Rational) {
    this.native.timeBase = { num: value.num, den: value.den };
  }

  /**
   * Start time.
   *
   * First timestamp of the stream in stream time base units.
   * AV_NOPTS_VALUE if unknown.
   *
   * Direct mapping to AVStream->start_time.
   */
  get startTime(): bigint {
    return this.native.startTime;
  }

  set startTime(value: bigint) {
    this.native.startTime = value;
  }

  /**
   * Stream duration.
   *
   * Total duration in stream time base units.
   * AV_NOPTS_VALUE if unknown.
   *
   * Direct mapping to AVStream->duration.
   */
  get duration(): bigint {
    return this.native.duration;
  }

  set duration(value: bigint) {
    this.native.duration = value;
  }

  /**
   * Number of frames.
   *
   * Total number of frames in this stream.
   * 0 if unknown.
   *
   * Direct mapping to AVStream->nb_frames.
   */
  get nbFrames(): bigint {
    return this.native.nbFrames;
  }

  set nbFrames(value: bigint) {
    this.native.nbFrames = value;
  }

  /**
   * Stream disposition flags.
   *
   * Combination of AV_DISPOSITION_* flags indicating stream properties
   * (e.g., default, forced subtitles, visual impaired, etc.).
   *
   * Direct mapping to AVStream->disposition.
   */
  get disposition(): AVDisposition {
    return this.native.disposition;
  }

  set disposition(value: AVDisposition) {
    this.native.disposition = value;
  }

  /**
   * Discard setting.
   *
   * Indicates which packets can be discarded during demuxing.
   * Used to skip non-essential packets for performance.
   *
   * Direct mapping to AVStream->discard.
   */
  get discard(): AVDiscard {
    return this.native.discard;
  }

  set discard(value: AVDiscard) {
    this.native.discard = value;
  }

  /**
   * Sample aspect ratio.
   *
   * Pixel aspect ratio for video streams.
   * 0/1 if unknown or not applicable.
   *
   * Direct mapping to AVStream->sample_aspect_ratio.
   */
  get sampleAspectRatio(): Rational {
    const sar = this.native.sampleAspectRatio;
    return new Rational(sar.num || 0, sar.den || 1);
  }

  set sampleAspectRatio(value: Rational) {
    this.native.sampleAspectRatio = { num: value.num, den: value.den };
  }

  /**
   * Average frame rate.
   *
   * Average framerate of the stream.
   * 0/1 if unknown or variable frame rate.
   *
   * Direct mapping to AVStream->avg_frame_rate.
   */
  get avgFrameRate(): Rational {
    const fr = this.native.avgFrameRate;
    // Handle 0/0 case (unknown frame rate in FFmpeg)
    if (fr.den === 0) {
      return new Rational(0, 1);
    }
    return new Rational(fr.num, fr.den);
  }

  set avgFrameRate(value: Rational) {
    this.native.avgFrameRate = { num: value.num, den: value.den };
  }

  /**
   * Real frame rate.
   *
   * Real base frame rate of the stream.
   * This is the lowest common multiple of all frame rates in the stream.
   *
   * Direct mapping to AVStream->r_frame_rate.
   */
  get rFrameRate(): Rational {
    const fr = this.native.rFrameRate;
    // Handle 0/0 case (unknown frame rate in FFmpeg)
    if (fr.den === 0) {
      return new Rational(0, 1);
    }
    return new Rational(fr.num, fr.den);
  }

  set rFrameRate(value: Rational) {
    this.native.rFrameRate = { num: value.num, den: value.den };
  }

  /**
   * Stream metadata.
   *
   * Dictionary containing stream-specific metadata
   * (e.g., language, title, encoder settings).
   *
   * Direct mapping to AVStream->metadata.
   */
  get metadata(): Dictionary | null {
    const nativeDict = this.native.metadata;
    if (!nativeDict) {
      return null;
    }
    return Dictionary.fromNative(nativeDict);
  }

  set metadata(value: Dictionary | null) {
    this.native.metadata = value?.getNative() ?? null;
  }

  /**
   * Attached picture.
   *
   * For streams with AV_DISPOSITION_ATTACHED_PIC set,
   * contains the attached picture (e.g., album art).
   *
   * Direct mapping to AVStream->attached_pic.
   */
  get attachedPic(): Packet | null {
    return this.native.attachedPic as unknown as Packet;
  }

  /**
   * Event flags.
   *
   * Flags indicating events that happened to the stream.
   * Used for signaling format changes.
   *
   * Direct mapping to AVStream->event_flags.
   */
  get eventFlags(): AVStreamEventFlag {
    return this.native.eventFlags;
  }

  set eventFlags(value: AVStreamEventFlag) {
    this.native.eventFlags = value;
  }

  /**
   * Get the underlying native Stream object.
   *
   * @returns The native Stream binding object
   *
   * @internal
   */
  getNative(): NativeStream {
    return this.native;
  }
}
