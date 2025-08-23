import { bindings } from './binding.js';
import { BitStreamFilter } from './bitstream-filter.js';
import { CodecParameters } from './codec-parameters.js';
import { OptionMember } from './option.js';
import { Rational } from './rational.js';

import type { NativeBitStreamFilterContext, NativeWrapper } from './native-types.js';
import type { Packet } from './packet.js';

/**
 * Bitstream filter context for processing packets.
 *
 * Manages the state for bitstream filtering operations.
 * Processes packets through a bitstream filter without decoding.
 * Supports packet-by-packet filtering with internal buffering.
 *
 * Direct mapping to FFmpeg's AVBSFContext.
 *
 * @example
 * ```typescript
 * import { BitStreamFilter, BitStreamFilterContext, Packet, FFmpegError } from '@seydx/av';
 * import { AVERROR_EOF, AVERROR } from '@seydx/av/constants';
 *
 * // Create and initialize filter context
 * const filter = BitStreamFilter.getByName('h264_mp4toannexb');
 * const ctx = new BitStreamFilterContext();
 *
 * // Allocate and configure
 * let ret = ctx.alloc(filter);
 * FFmpegError.throwIfError(ret, 'alloc');
 *
 * // Copy input parameters from stream to BSF context
 * stream.codecpar.copy(ctx.inputCodecParameters);
 * ctx.inputTimeBase = stream.timeBase;
 *
 * // Initialize filter
 * ret = ctx.init();
 * FFmpegError.throwIfError(ret, 'init');
 *
 * // Process packets
 * while (hasMorePackets) {
 *   const inputPacket = getNextPacket();
 *
 *   // Send packet to filter
 *   ret = await ctx.sendPacket(inputPacket);
 *   FFmpegError.throwIfError(ret, 'sendPacket');
 *
 *   // Receive filtered packets
 *   while (true) {
 *     const outputPacket = new Packet();
 *     const result = await ctx.receivePacket(outputPacket);
 *
 *     if (result.eagain || result.eof) break;
 *     FFmpegError.throwIfError(result.ret || result, 'receivePacket');
 *
 *     // Process filtered packet
 *     processPacket(outputPacket);
 *     outputPacket.unref();
 *   }
 * }
 *
 * // Send EOF
 * await ctx.sendPacket(null);
 *
 * // Drain remaining packets
 * while (true) {
 *   const outputPacket = new Packet();
 *   const result = await ctx.receivePacket(outputPacket);
 *   if (result.eof) break;
 *   // Process remaining packets
 * }
 *
 * // Cleanup
 * ctx.free();
 * ```
 */
export class BitStreamFilterContext extends OptionMember<NativeBitStreamFilterContext> implements Disposable, NativeWrapper<NativeBitStreamFilterContext> {
  private _filter?: BitStreamFilter; // Cache for filter wrapper

  /**
   * Create a new bitstream filter context.
   *
   * The context is uninitialized - you must call alloc() and init() before use.
   * No FFmpeg resources are allocated until initialization.
   *
   * Direct wrapper around AVBSFContext.
   *
   * @example
   * ```typescript
   * const ctx = new BitStreamFilterContext();
   * ctx.alloc(filter);
   * ctx.init();
   * // Context is now ready for filtering
   * ```
   */
  constructor() {
    super(new bindings.BitStreamFilterContext());
  }

  /**
   * Check if the context is initialized.
   *
   * Returns true if init() has been called successfully.
   *
   * @returns True if initialized, false otherwise
   */
  get isInitialized(): boolean {
    return this.native.isInitialized();
  }

  /**
   * Input codec parameters (read-only reference, mutable contents).
   *
   * Returns a reference to the BSF context's internal codec parameters.
   * While you cannot replace this object (no setter), you can modify its contents
   * or use it as a destination for copy operations.
   *
   * You must configure these parameters before calling init().
   *
   * Maps to AVBSFContext->par_in.
   *
   * @example
   * ```typescript
   * // Copy parameters from input stream to BSF context
   * if (ctx.inputCodecParameters) {
   *   stream.codecpar.copy(ctx.inputCodecParameters);
   *
   *   // Or set individual properties
   *   ctx.inputCodecParameters.codecType = AVMEDIA_TYPE_VIDEO;
   *   ctx.inputCodecParameters.codecId = AV_CODEC_ID_H264;
   * }
   * ```
   */
  get inputCodecParameters(): CodecParameters | null {
    // The native binding returns a CodecParameters object created with the constructor
    // It's the native object itself, not a TypeScript wrapper
    const nativeParams = this.native.inputCodecParameters;
    if (!nativeParams) {
      return null;
    }
    // Wrap it in our TypeScript class
    const wrapper = Object.create(CodecParameters.prototype) as CodecParameters;
    (wrapper as any).native = nativeParams;
    return wrapper;
  }

  /**
   * Output codec parameters (read-only reference, read-only contents).
   *
   * Returns a reference to the BSF context's output codec parameters.
   * These are automatically configured by the filter during init().
   * You should not modify these parameters.
   *
   * Maps to AVBSFContext->par_out.
   *
   * @example
   * ```typescript
   * // After initialization, read the output parameters
   * console.log(`Output codec: ${ctx.outputCodecParameters?.codecId}`);
   *
   * // Use them to configure downstream components
   * if (ctx.outputCodecParameters) {
   *   ctx.outputCodecParameters.copy(nextStream.codecpar);
   * }
   * ```
   */
  get outputCodecParameters(): CodecParameters | null {
    // The native binding returns a CodecParameters object created with the constructor
    // It's the native object itself, not a TypeScript wrapper
    const nativeParams = this.native.outputCodecParameters;
    if (!nativeParams) {
      return null;
    }
    // Wrap it in our TypeScript class
    const wrapper = Object.create(CodecParameters.prototype) as CodecParameters;
    (wrapper as any).native = nativeParams;
    return wrapper;
  }

  /**
   * Input time base.
   *
   * Time base for input packet timestamps.
   * Must be set before calling init().
   *
   * Maps to AVBSFContext->time_base_in.
   *
   * @example
   * ```typescript
   * ctx.inputTimeBase = new Rational(1, 1000); // 1ms time base
   * ```
   */
  get inputTimeBase(): Rational {
    const tb = this.native.inputTimeBase;
    return new Rational(tb.num, tb.den);
  }

  set inputTimeBase(value: Rational) {
    this.native.inputTimeBase = { num: value.num, den: value.den };
  }

  /**
   * Output time base.
   *
   * Time base for output packet timestamps.
   * Set by the filter during init().
   *
   * Maps to AVBSFContext->time_base_out.
   *
   * @example
   * ```typescript
   * // After initialization
   * console.log(`Output time base: ${ctx.outputTimeBase.num}/${ctx.outputTimeBase.den}`);
   * ```
   */
  get outputTimeBase(): Rational | null {
    const tb = this.native.outputTimeBase;
    if (!tb) return null;
    return new Rational(tb.num, tb.den);
  }

  /**
   * The bitstream filter being used.
   *
   * Reference to the filter this context was allocated with.
   *
   * Maps to AVBSFContext->filter.
   *
   * @example
   * ```typescript
   * console.log(`Using filter: ${ctx.filter?.name}`);
   * ```
   */
  get filter(): BitStreamFilter | null {
    if (!this._filter) {
      const native = this.native.filter;
      if (!native) {
        return null;
      }
      this._filter = new BitStreamFilter(native);
    }
    return this._filter;
  }

  /**
   * Allocate the bitstream filter context.
   *
   * Allocates the context for the specified filter.
   * Must be called before any other operations.
   * After allocation, configure input parameters before calling init().
   *
   * Calls av_bsf_alloc() internally.
   *
   * @param filter - The bitstream filter to use
   * @returns 0 on success, negative error code on failure
   *
   * @example
   * ```typescript
   * const filter = BitStreamFilter.getByName('h264_mp4toannexb');
   * const ctx = new BitStreamFilterContext();
   * const ret = ctx.alloc(filter);
   * FFmpegError.throwIfError(ret, 'alloc');
   * ```
   */
  alloc(filter: BitStreamFilter): number {
    return this.native.alloc(filter.getNative());
  }

  /**
   * Initialize the bitstream filter context.
   *
   * Prepares the filter for use after parameters have been set.
   * Sets up output parameters based on input and filter configuration.
   * Must be called after alloc() and parameter configuration.
   *
   * Calls av_bsf_init() internally.
   *
   * @returns 0 on success, negative error code on failure
   *
   * @example
   * ```typescript
   * // After allocation and parameter setup
   * const ret = ctx.init();
   * FFmpegError.throwIfError(ret, 'init');
   * ```
   */
  init(): number {
    return this.native.init();
  }

  /**
   * Free the bitstream filter context.
   *
   * Releases all resources associated with the context.
   * The context cannot be used after calling this method.
   *
   * Calls av_bsf_free() internally.
   *
   * @example
   * ```typescript
   * ctx.free();
   * // Context is now freed and unusable
   * ```
   */
  free(): void {
    this.native.free();
    this._filter = undefined;
  }

  /**
   * Flush the bitstream filter.
   *
   * Resets the internal filter state.
   * Should be called when seeking or switching streams.
   *
   * Calls av_bsf_flush() internally.
   *
   * @example
   * ```typescript
   * // When seeking
   * ctx.flush();
   * // Filter is reset and ready for new packets
   * ```
   */
  flush(): void {
    this.native.flush();
  }

  /**
   * Send a packet to the filter.
   *
   * Submits a packet for filtering.
   * The filter takes ownership of the packet.
   * Pass null to signal end of stream.
   *
   * After sending a packet, call receivePacket() repeatedly
   * until it returns EAGAIN or EOF.
   *
   * Calls av_bsf_send_packet() internally.
   *
   * @param packet - Packet to filter, or null for EOF
   * @returns Promise resolving to 0 on success, error code on failure
   *
   * @example
   * ```typescript
   * // Send packet
   * const ret = await ctx.sendPacket(inputPacket);
   * if (ret < 0 && ret !== AVERROR_EAGAIN) {
   *   throw new Error('Failed to send packet');
   * }
   *
   * // Send EOF
   * await ctx.sendPacket(null);
   * ```
   */
  async sendPacket(packet: Packet | null): Promise<number> {
    return await this.native.sendPacket(packet ? packet.getNative() : null);
  }

  /**
   * Receive a filtered packet.
   *
   * Gets a filtered packet from the filter.
   * Must be called repeatedly after sendPacket() until EAGAIN or EOF.
   * One input packet may produce multiple output packets.
   *
   * Calls av_bsf_receive_packet() internally.
   *
   * @param packet - Packet to receive filtered data into
   * @returns Promise resolving to 0 on success, negative error code on failure
   *
   * @example
   * ```typescript
   * import { AVERROR_EAGAIN, AVERROR_EOF } from '@seydx/av/constants';
   *
   * const packet = new Packet();
   * const ret = await ctx.receivePacket(packet);
   *
   * if (ret === AVERROR_EAGAIN) {
   *   // Need to send more packets
   * } else if (ret === AVERROR_EOF) {
   *   // No more packets
   * } else if (ret < 0) {
   *   // Error occurred
   * } else {
   *   // Got a packet successfully
   *   processPacket(packet);
   * }
   * ```
   */
  async receivePacket(packet: Packet): Promise<number> {
    return await this.native.receivePacket(packet.getNative());
  }

  /**
   * Get the underlying native object.
   *
   * For advanced use cases that need direct access to the native bindings.
   *
   * @returns Native BitStreamFilterContext object
   * @internal
   */
  getNative(): NativeBitStreamFilterContext {
    return this.native;
  }

  /**
   * Dispose of the context resources.
   *
   * Automatically called when using the `using` statement.
   * Frees all associated FFmpeg resources.
   *
   * @example
   * ```typescript
   * {
   *   using ctx = new BitStreamFilterContext();
   *   ctx.alloc(filter);
   *   // ... use context
   * } // Automatically freed when leaving scope
   * ```
   */
  [Symbol.dispose](): void {
    this.native[Symbol.dispose]();
  }
}
