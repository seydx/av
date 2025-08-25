import { CodecParameters } from './codec-parameters.js';
import { Dictionary } from './dictionary.js';
import { Rational } from './rational.js';

import type { AVDiscard, AVDisposition, AVStreamEventFlag } from './constants.js';
import type { NativeStream, NativeWrapper } from './native-types.js';
import type { Packet } from './packet.js';

/**
 * Stream information within a media container.
 *
 * Represents a single stream (video, audio, subtitle, etc.) within a media file.
 * Streams are created and managed by FormatContext and contain all the metadata
 * and parameters needed to decode or encode the stream. Each stream has its own
 * timebase, codec parameters, and metadata.
 *
 * Direct mapping to FFmpeg's AVStream.
 *
 * @example
 * ```typescript
 * import { FormatContext, FFmpegError } from 'node-av';
 * import { AVMEDIA_TYPE_VIDEO, AVMEDIA_TYPE_AUDIO } from 'node-av/constants';
 *
 * // Streams are obtained from FormatContext
 * const formatContext = new FormatContext();
 * const ret = await formatContext.openInput('video.mp4', null, null);
 * FFmpegError.throwIfError(ret, 'openInput');
 *
 * const infoRet = await formatContext.findStreamInfo(null);
 * FFmpegError.throwIfError(infoRet, 'findStreamInfo');
 *
 * // Access streams
 * const streams = formatContext.streams;
 * for (const stream of streams) {
 *   console.log(`Stream ${stream.index}: ${stream.codecpar.codecType}`);
 *   console.log(`Time base: ${stream.timeBase.num}/${stream.timeBase.den}`);
 *
 *   // Direct access to codec parameters
 *   const codecpar = stream.codecpar;
 *   if (codecpar.codecType === AVMEDIA_TYPE_VIDEO) {
 *     console.log(`Video: ${codecpar.width}x${codecpar.height}`);
 *   } else if (codecpar.codecType === AVMEDIA_TYPE_AUDIO) {
 *     console.log(`Audio: ${codecpar.sampleRate}Hz ${codecpar.channels} channels`);
 *   }
 * }
 * ```
 *
 * @see {@link FormatContext} For creating and managing streams
 * @see {@link CodecParameters} For codec-specific stream parameters
 */
export class Stream implements NativeWrapper<NativeStream> {
  private native: NativeStream;
  private _codecpar?: CodecParameters; // Cache the wrapped codecpar

  /**
   * Constructor is internal - use FormatContext to create streams.
   *
   * Streams are created and managed by FormatContext.
   * For demuxing, streams are created automatically when opening input.
   * For muxing, use formatContext.newStream() to create streams.
   *
   * @internal
   *
   * @param native - Native AVStream to wrap
   *
   * @example
   * ```typescript
   * // Don't create streams directly
   * // const stream = new Stream(); // Wrong
   *
   * // For demuxing: streams are created automatically
   * const streams = formatContext.streams; // Correct
   *
   * // For muxing: use newStream
   * const stream = formatContext.newStream(null); // Correct
   * ```
   */
  constructor(native: NativeStream) {
    this.native = native;
  }

  /**
   * Stream index in the format context.
   *
   * Zero-based index of this stream in the format context's stream array.
   * This is the index used to identify the stream in packets.
   *
   * Direct mapping to AVStream->index
   *
   * @readonly
   *
   * @example
   * ```typescript
   * // Find video stream index
   * const videoStreamIndex = streams.findIndex(
   *   s => s.codecpar.codecType === AVMEDIA_TYPE_VIDEO
   * );
   *
   * // Check packet's stream
   * if (packet.streamIndex === videoStreamIndex) {
   *   // This packet belongs to the video stream
   * }
   * ```
   */
  get index(): number {
    return this.native.index;
  }

  /**
   * Format-specific stream ID.
   *
   * Stream ID as defined by the container format.
   * Different from index - this is format-specific.
   *
   * Direct mapping to AVStream->id
   *
   * - decoding: Set by libavformat
   * - encoding: Set by the user, replaced by libavformat if left unset
   */
  get id(): number {
    return this.native.id;
  }

  set id(value: number) {
    this.native.id = value;
  }

  /**
   * Codec parameters associated with this stream.
   *
   * Contains all the parameters needed to set up a codec for this stream,
   * including codec ID, dimensions for video, sample rate for audio, etc.
   *
   * Direct mapping to AVStream->codecpar
   *
   * - demuxing: Filled by libavformat on stream creation or in findStreamInfo()
   * - muxing: Must be filled by the caller before writeHeader()
   *
   * @example
   * ```typescript
   * // For video stream
   * stream.codecpar.codecType = AVMEDIA_TYPE_VIDEO;
   * stream.codecpar.codecId = AV_CODEC_ID_H264;
   * stream.codecpar.width = 1920;
   * stream.codecpar.height = 1080;
   *
   * // For audio stream
   * stream.codecpar.codecType = AVMEDIA_TYPE_AUDIO;
   * stream.codecpar.codecId = AV_CODEC_ID_AAC;
   * stream.codecpar.sampleRate = 48000;
   * stream.codecpar.channels = 2;
   * ```
   *
   * @see {@link CodecParameters} For detailed parameter documentation
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
   * Time base for this stream.
   *
   * The fundamental unit of time (in seconds) in terms of which frame
   * timestamps are represented. For example, a time base of 1/25 means
   * each time unit is 1/25 of a second (40ms).
   *
   * Direct mapping to AVStream->time_base
   *
   * - decoding: Set by libavformat
   * - encoding: May be set before writeHeader() as a hint to the muxer.
   *             The muxer will overwrite with the actual timebase used.
   *
   * @example
   * ```typescript
   * import { Rational } from 'node-av';
   *
   * // Common time bases
   * stream.timeBase = new Rational(1, 90000); // 90kHz (MPEG-TS)
   * stream.timeBase = new Rational(1, 1000); // milliseconds
   * stream.timeBase = new Rational(1, 25); // 25 fps video
   *
   * // Convert PTS to seconds
   * const pts = 45000n;
   * const seconds = Number(pts) * stream.timeBase.toDouble();
   * ```
   *
   * @see {@link Rational} For time base representation
   */
  get timeBase(): Rational {
    const tb = this.native.timeBase;
    return new Rational(tb.num, tb.den);
  }

  set timeBase(value: Rational) {
    this.native.timeBase = { num: value.num, den: value.den };
  }

  /**
   * Decoding: pts of the first frame of the stream in presentation order, in stream time base.
   *
   * Direct mapping to AVStream->start_time
   *
   * Only set this if you are absolutely 100% sure that the value you set
   * it to really is the pts of the first frame.
   * This may be undefined (AV_NOPTS_VALUE).
   *
   * @note The ASF header does NOT contain a correct start_time the ASF
   * demuxer must NOT set this.
   */
  get startTime(): bigint {
    return this.native.startTime;
  }

  set startTime(value: bigint) {
    this.native.startTime = value;
  }

  /**
   * Decoding: duration of the stream, in stream time base.
   *
   * Direct mapping to AVStream->duration
   *
   * If a source file does not specify a duration, but does specify
   * a bitrate, this value will be estimated from bitrate and file size.
   *
   * Encoding: May be set by the caller before avformat_write_header() to
   * provide a hint to the muxer about the estimated duration.
   */
  get duration(): bigint {
    return this.native.duration;
  }

  set duration(value: bigint) {
    this.native.duration = value;
  }

  /**
   * Number of frames in this stream if known or 0.
   *
   * Direct mapping to AVStream->nb_frames
   */
  get nbFrames(): bigint {
    return this.native.nbFrames;
  }

  set nbFrames(value: bigint) {
    this.native.nbFrames = value;
  }

  /**
   * Stream disposition - a combination of AV_DISPOSITION_* flags.
   *
   * Direct mapping to AVStream->disposition
   *
   * - demuxing: set by libavformat when creating the stream or in
   *             avformat_find_stream_info().
   * - muxing: may be set by the caller before avformat_write_header().
   *
   * Common flags:
   * - AV_DISPOSITION_DEFAULT: default track
   * - AV_DISPOSITION_ATTACHED_PIC: stream is an attached picture (album art)
   * - AV_DISPOSITION_CAPTIONS: stream contains captions
   * - AV_DISPOSITION_DESCRIPTIONS: stream contains descriptions
   * - AV_DISPOSITION_METADATA: stream contains metadata
   */
  get disposition(): AVDisposition {
    return this.native.disposition;
  }

  set disposition(value: AVDisposition) {
    this.native.disposition = value;
  }

  /**
   * Selects which packets can be discarded at will and do not need to be demuxed.
   *
   * Direct mapping to AVStream->discard
   *
   * - AVDISCARD_NONE: discard nothing
   * - AVDISCARD_DEFAULT: discard useless packets like 0 size packets in avi
   * - AVDISCARD_NONREF: discard all non reference
   * - AVDISCARD_BIDIR: discard all bidirectional frames
   * - AVDISCARD_NONINTRA: discard all non intra frames
   * - AVDISCARD_NONKEY: discard all frames except keyframes
   * - AVDISCARD_ALL: discard all
   */
  get discard(): AVDiscard {
    return this.native.discard;
  }

  set discard(value: AVDiscard) {
    this.native.discard = value;
  }

  /**
   * Sample aspect ratio (0 if unknown).
   *
   * Direct mapping to AVStream->sample_aspect_ratio
   *
   * This is the width of a pixel divided by the height of the pixel.
   * - encoding: Set by user.
   * - decoding: Set by libavformat.
   */
  get sampleAspectRatio(): Rational {
    const sar = this.native.sampleAspectRatio;
    return new Rational(sar.num || 0, sar.den || 1);
  }

  set sampleAspectRatio(value: Rational) {
    this.native.sampleAspectRatio = { num: value.num, den: value.den };
  }

  /**
   * Average framerate.
   *
   * Direct mapping to AVStream->avg_frame_rate
   *
   * - demuxing: May be set by libavformat when creating the stream or in
   *             avformat_find_stream_info().
   * - muxing: May be set by the caller before avformat_write_header().
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
   * Real base framerate of the stream.
   *
   * Direct mapping to AVStream->r_frame_rate
   *
   * This is the lowest framerate with which all timestamps can be
   * represented accurately (it is the least common multiple of all
   * framerates in the stream). Note, this value is just a guess!
   * For example, if the time base is 1/90000 and all frames have either
   * approximately 3600 or 1800 timer ticks, then r_frame_rate will be 50/1.
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
   * Metadata dictionary for this stream.
   *
   * Direct mapping to AVStream->metadata
   *
   * Contains key-value pairs of metadata.
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
   * For streams with AV_DISPOSITION_ATTACHED_PIC disposition, this packet
   * will contain the attached picture (e.g., album art).
   *
   * Direct mapping to AVStream->attached_pic
   *
   * - decoding: set by libavformat, must not be modified by the caller.
   * - encoding: unused
   * @readonly
   */
  get attachedPic(): Packet | null {
    return this.native.attachedPic as unknown as Packet;
  }

  /**
   * Flags indicating events happening on the stream, a combination of
   * AVSTREAM_EVENT_FLAG_*.
   *
   * Direct mapping to AVStream->event_flags
   *
   * - demuxing: may be set by the demuxer in avformat_open_input(),
   *   avformat_find_stream_info() and av_read_frame(). Flags must be cleared
   *   by the user once the event has been handled.
   * - muxing: may be set by the user after avformat_write_header() to
   *   indicate a user-triggered event. The muxer will clear the flags for
   *   events it has handled in av_[interleaved]_write_frame().
   *
   * Flags:
   * - AVSTREAM_EVENT_FLAG_METADATA_UPDATED: metadata was updated
   * - AVSTREAM_EVENT_FLAG_NEW_PACKETS: new packets were read for this stream
   */
  get eventFlags(): AVStreamEventFlag {
    return this.native.eventFlags;
  }

  set eventFlags(value: AVStreamEventFlag) {
    this.native.eventFlags = value;
  }

  /**
   * Get the native FFmpeg AVStream pointer.
   *
   * @internal For use by other wrapper classes
   * @returns The underlying native stream object
   */
  getNative(): NativeStream {
    return this.native;
  }
}
