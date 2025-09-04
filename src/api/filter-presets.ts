import {
  AV_HWDEVICE_TYPE_CUDA,
  AV_HWDEVICE_TYPE_D3D11VA,
  AV_HWDEVICE_TYPE_D3D12VA,
  AV_HWDEVICE_TYPE_DRM,
  AV_HWDEVICE_TYPE_DXVA2,
  AV_HWDEVICE_TYPE_MEDIACODEC,
  AV_HWDEVICE_TYPE_OPENCL,
  AV_HWDEVICE_TYPE_QSV,
  AV_HWDEVICE_TYPE_RKMPP,
  AV_HWDEVICE_TYPE_VAAPI,
  AV_HWDEVICE_TYPE_VDPAU,
  AV_HWDEVICE_TYPE_VIDEOTOOLBOX,
  AV_HWDEVICE_TYPE_VULKAN,
  AVFILTER_FLAG_HWDEVICE,
} from '../constants/constants.js';
import { Filter } from '../lib/filter.js';
import { avGetPixFmtName, avGetSampleFmtName } from '../lib/utilities.js';

import type { AVHWDeviceType, AVPixelFormat, AVSampleFormat } from '../constants/constants.js';

/**
 * Hardware filter capabilities for different platforms.
 * Maps hardware types to their supported filter operations.
 * Each capability indicates whether a specific filter operation is supported
 * by the hardware acceleration type.
 *
 * @description
 * Support varies significantly between hardware types:
 * - CUDA: Comprehensive filter support with NPP integration
 * - VAAPI: Good Linux support with Intel/AMD GPUs
 * - QSV: Intel Quick Sync with basic filtering
 * - VideoToolbox: macOS/iOS with CoreImage filters
 * - Vulkan: Cross-platform with growing filter support
 * - OpenCL: Cross-platform compute-based filtering
 */
export interface HardwareFilterSupport {
  scale: boolean;
  overlay: boolean;
  transpose: boolean;
  tonemap: boolean;
  deinterlace: boolean;
  denoise: boolean;
  flip: boolean;
  blur: boolean;
  sharpen: boolean;
  chromakey: boolean;
  colorspace: boolean;
  pad: boolean;
  stack: boolean; // hstack, vstack, xstack
}

/**
 * Base class for filter preset implementations.
 * Provides common filter building methods that can be overridden by hardware-specific implementations.
 *
 * This class defines the standard filter operations available in FFmpeg,
 * with each method returning a filter string that can be used in a filter graph.
 * Hardware-specific implementations may override these methods to use optimized
 * hardware filters instead of software implementations.
 *
 * @example
 * ```typescript
 * class CustomPresets extends FilterPresetBase {
 *   override scale(width: number, height: number): string | null {
 *     return `custom_scale=${width}:${height}`;
 *   }
 * }
 * ```
 */
export abstract class FilterPresetBase {
  /**
   * Creates a scale filter string.
   *
   * @param width - Target width in pixels
   * @param height - Target height in pixels
   * @param options - Additional scaling options (e.g., flags for algorithm)
   * @returns Filter string or null if not supported
   *
   * @see {@link https://ffmpeg.org/ffmpeg-filters.html#scale | FFmpeg scale filter}
   */
  scale(width: number, height: number, options?: Record<string, any>): string | null {
    const flags = options?.flags;
    const base = `scale=${width}:${height}`;
    return flags ? `${base}:flags=${flags}` : base;
  }

  /**
   * Creates a crop filter string.
   *
   * @param width - Width of the cropped area
   * @param height - Height of the cropped area
   * @param x - X coordinate of top-left corner (default: 0)
   * @param y - Y coordinate of top-left corner (default: 0)
   * @returns Filter string or null if not supported
   *
   * @see {@link https://ffmpeg.org/ffmpeg-filters.html#crop | FFmpeg crop filter}
   */
  crop(width: number, height: number, x = 0, y = 0): string | null {
    return `crop=${width}:${height}:${x}:${y}`;
  }

  /**
   * Creates an FPS filter string to change frame rate.
   *
   * @param fps - Target frames per second
   * @returns Filter string or null if not supported
   *
   * @see {@link https://ffmpeg.org/ffmpeg-filters.html#fps | FFmpeg fps filter}
   */
  fps(fps: number): string | null {
    return `fps=${fps}`;
  }

  /**
   * Creates a format filter string to convert pixel format.
   *
   * @param pixelFormat - Target pixel format(s) - can be string, AVPixelFormat enum, or array
   * @returns Filter string or null if not supported
   *
   * @example
   * ```typescript
   * // Single format
   * presets.format('yuv420p');
   * presets.format(AV_PIX_FMT_YUV420P);
   *
   * // Multiple formats (creates a chain)
   * presets.format(['yuv420p', 'rgb24']);
   * ```
   *
   * @see {@link https://ffmpeg.org/ffmpeg-filters.html#format | FFmpeg format filter}
   */
  format(pixelFormat: string | AVPixelFormat | (string | AVPixelFormat)[]): string | null {
    if (Array.isArray(pixelFormat)) {
      // Create a chain of format filters
      const formats = pixelFormat.map((fmt) => {
        const formatName = typeof fmt === 'string' ? fmt : (avGetPixFmtName(fmt) ?? 'yuv420p');
        return `format=${formatName}`;
      });
      return formats.join(',');
    }

    const formatName = typeof pixelFormat === 'string' ? pixelFormat : (avGetPixFmtName(pixelFormat) ?? 'yuv420p');
    return `format=${formatName}`;
  }

  /**
   * Creates a rotate filter string.
   *
   * @param angle - Rotation angle in degrees
   * @returns Filter string or null if not supported
   *
   * @see {@link https://ffmpeg.org/ffmpeg-filters.html#rotate | FFmpeg rotate filter}
   */
  rotate(angle: number): string | null {
    return `rotate=${angle}*PI/180`;
  }

  /**
   * Creates a horizontal flip filter string.
   *
   * @returns Filter string or null if not supported
   *
   * @see {@link https://ffmpeg.org/ffmpeg-filters.html#hflip | FFmpeg hflip filter}
   */
  hflip(): string | null {
    return 'hflip';
  }

  /**
   * Creates a vertical flip filter string.
   *
   * @returns Filter string or null if not supported
   *
   * @see {@link https://ffmpeg.org/ffmpeg-filters.html#vflip | FFmpeg vflip filter}
   */
  vflip(): string | null {
    return 'vflip';
  }

  /**
   * Creates a fade filter string for video.
   *
   * @param type - Fade type ('in' or 'out')
   * @param start - Start time in seconds
   * @param duration - Fade duration in seconds
   * @returns Filter string or null if not supported
   *
   * @see {@link https://ffmpeg.org/ffmpeg-filters.html#fade | FFmpeg fade filter}
   */
  fade(type: 'in' | 'out', start: number, duration: number): string | null {
    return `fade=t=${type}:st=${start}:d=${duration}`;
  }

  /**
   * Creates an overlay filter string to composite two video streams.
   *
   * @param x - X position for overlay (default: 0)
   * @param y - Y position for overlay (default: 0)
   * @param options - Additional overlay options
   * @returns Filter string or null if not supported
   *
   * @example
   * ```typescript
   * // Basic overlay at position
   * presets.overlay(100, 50);
   *
   * // With additional options
   * presets.overlay(0, 0, { format: 'yuv420' });
   * ```
   *
   * @see {@link https://ffmpeg.org/ffmpeg-filters.html#overlay | FFmpeg overlay filter}
   */
  overlay(x = 0, y = 0, options?: Record<string, string>): string | null {
    let filter = `overlay=${x}:${y}`;
    if (options) {
      for (const [key, value] of Object.entries(options)) {
        filter += `:${key}=${value}`;
      }
    }
    return filter;
  }

  /**
   * Creates a volume filter string for audio.
   *
   * @param factor - Volume multiplication factor (1.0 = unchanged, 2.0 = double)
   * @returns Filter string or null if not supported
   *
   * @see {@link https://ffmpeg.org/ffmpeg-filters.html#volume | FFmpeg volume filter}
   */
  volume(factor: number): string | null {
    return `volume=${factor}`;
  }

  /**
   * Creates an audio format filter string.
   *
   * @param sampleFormat - Target sample format (e.g., 's16', 'fltp')
   * @param sampleRate - Target sample rate in Hz (optional)
   * @param channelLayout - Target channel layout (optional)
   * @returns Filter string or null if not supported
   *
   * @example
   * ```typescript
   * // Change sample format only
   * presets.aformat('s16');
   *
   * // Change format and sample rate
   * presets.aformat('fltp', 48000);
   *
   * // Full conversion
   * presets.aformat('s16', 44100, 'stereo');
   * ```
   *
   * @see {@link https://ffmpeg.org/ffmpeg-filters.html#aformat | FFmpeg aformat filter}
   */
  aformat(sampleFormat: string | AVSampleFormat, sampleRate?: number, channelLayout?: string): string | null {
    const formatName = typeof sampleFormat === 'string' ? sampleFormat : (avGetSampleFmtName(sampleFormat) ?? 's16');
    let filter = `aformat=sample_fmts=${formatName}`;
    if (sampleRate) filter += `:sample_rates=${sampleRate}`;
    if (channelLayout) filter += `:channel_layouts=${channelLayout}`;
    return filter;
  }

  /**
   * Creates an atempo filter string to change audio playback speed.
   *
   * @param factor - Tempo factor (0.5 = half speed, 2.0 = double speed)
   * @returns Filter string or null if not supported
   *
   * @description
   * Factor must be between 0.5 and 2.0. For larger changes, chain multiple atempo filters.
   *
   * @see {@link https://ffmpeg.org/ffmpeg-filters.html#atempo | FFmpeg atempo filter}
   */
  atempo(factor: number): string | null {
    return `atempo=${factor}`;
  }

  /**
   * Creates an audio fade filter string.
   *
   * @param type - Fade type ('in' or 'out')
   * @param start - Start time in seconds
   * @param duration - Fade duration in seconds
   * @returns Filter string or null if not supported
   *
   * @see {@link https://ffmpeg.org/ffmpeg-filters.html#afade | FFmpeg afade filter}
   */
  afade(type: 'in' | 'out', start: number, duration: number): string | null {
    return `afade=t=${type}:st=${start}:d=${duration}`;
  }

  /**
   * Creates an amix filter string to mix multiple audio streams.
   *
   * @param inputs - Number of input streams to mix (default: 2)
   * @param duration - How to determine output duration (default: 'longest')
   * @returns Filter string or null if not supported
   *
   * @see {@link https://ffmpeg.org/ffmpeg-filters.html#amix | FFmpeg amix filter}
   */
  amix(inputs = 2, duration: 'first' | 'longest' | 'shortest' = 'longest'): string | null {
    return `amix=inputs=${inputs}:duration=${duration}`;
  }
}

/**
 * Filter chain builder for composing multiple filters.
 * Allows fluent API for building complex filter graphs by chaining filter operations.
 *
 * @example
 * ```typescript
 * const chain = new FilterChain()
 *   .add('scale=1920:1080')
 *   .add('fps=30')
 *   .custom('rotate=45*PI/180')
 *   .build();
 * // Result: "scale=1920:1080,fps=30,rotate=45*PI/180"
 * ```
 */
export class FilterChain {
  private filters: string[] = [];

  /**
   * Adds a filter to the chain.
   *
   * @param filter - Filter string to add (ignored if null/undefined)
   * @returns This instance for chaining
   */
  add(filter: string | null | undefined): this {
    if (filter) {
      this.filters.push(filter);
    }
    return this;
  }

  /**
   * Adds a custom filter string to the chain.
   *
   * @param filter - Custom filter string
   * @returns This instance for chaining
   */
  custom(filter: string): this {
    return this.add(filter);
  }

  /**
   * Builds the final filter string.
   *
   * @param separator - Separator between filters (default: ',')
   * @returns Combined filter string
   */
  build(separator = ','): string {
    return this.filters.join(separator);
  }

  /**
   * Returns the filters as an array.
   *
   * @returns Array of filter strings
   */
  toArray(): string[] {
    return [...this.filters];
  }
}

/**
 * Base chain builder with common filter methods.
 * Provides a fluent API for building filter chains using preset methods.
 *
 * @template T The preset type this builder uses
 *
 * @example
 * ```typescript
 * const chain = new ChainBuilderBase(presets)
 *   .scale(1920, 1080)
 *   .fps(30)
 *   .fade('in', 0, 2)
 *   .build();
 * ```
 */
export abstract class ChainBuilderBase<T extends FilterPresetBase> extends FilterChain {
  /**
   * @param presets - The filter presets to use
   * @internal
   */
  constructor(protected readonly presets: T) {
    super();
  }

  /**
   * Adds a scale filter to the chain.
   *
   * @param width - Target width
   * @param height - Target height
   * @param options - Additional scaling options
   * @returns This instance for chaining
   *
   * @see {@link FilterPresetBase.scale}
   */
  scale(width: number, height: number, options?: Record<string, any>): this {
    return this.add(this.presets.scale(width, height, options));
  }

  /**
   * Adds a crop filter to the chain.
   *
   * @param width - Crop width
   * @param height - Crop height
   * @param x - X position (default: 0)
   * @param y - Y position (default: 0)
   * @returns This instance for chaining
   *
   * @see {@link FilterPresetBase.crop}
   */
  crop(width: number, height: number, x = 0, y = 0): this {
    return this.add(this.presets.crop(width, height, x, y));
  }

  /**
   * Adds an FPS filter to the chain.
   *
   * @param fps - Target frame rate
   * @returns This instance for chaining
   *
   * @see {@link FilterPresetBase.fps}
   */
  fps(fps: number): this {
    return this.add(this.presets.fps(fps));
  }

  /**
   * Adds a format filter to the chain.
   *
   * @param pixelFormat - Target pixel format(s)
   * @returns This instance for chaining
   *
   * @see {@link FilterPresetBase.format}
   */
  format(pixelFormat: string | AVPixelFormat | (string | AVPixelFormat)[]): this {
    return this.add(this.presets.format(pixelFormat));
  }

  /**
   * Adds a rotate filter to the chain.
   *
   * @param angle - Rotation angle in degrees
   * @returns This instance for chaining
   *
   * @see {@link FilterPresetBase.rotate}
   */
  rotate(angle: number): this {
    return this.add(this.presets.rotate(angle));
  }

  /**
   * Adds a horizontal flip filter to the chain.
   *
   * @returns This instance for chaining
   *
   * @see {@link FilterPresetBase.hflip}
   */
  hflip(): this {
    return this.add(this.presets.hflip());
  }

  /**
   * Adds a vertical flip filter to the chain.
   *
   * @returns This instance for chaining
   *
   * @see {@link FilterPresetBase.vflip}
   */
  vflip(): this {
    return this.add(this.presets.vflip());
  }

  /**
   * Adds a fade filter to the chain.
   *
   * @param type - Fade type ('in' or 'out')
   * @param start - Start time in seconds
   * @param duration - Fade duration in seconds
   * @returns This instance for chaining
   *
   * @see {@link FilterPresetBase.fade}
   */
  fade(type: 'in' | 'out', start: number, duration: number): this {
    return this.add(this.presets.fade(type, start, duration));
  }

  /**
   * Adds an overlay filter to the chain.
   *
   * @param x - X position (default: 0)
   * @param y - Y position (default: 0)
   * @param options - Additional overlay options
   * @returns This instance for chaining
   *
   * @see {@link FilterPresetBase.overlay}
   */
  overlay(x = 0, y = 0, options?: Record<string, string>): this {
    return this.add(this.presets.overlay(x, y, options));
  }

  /**
   * Adds a volume filter to the chain.
   *
   * @param factor - Volume factor
   * @returns This instance for chaining
   *
   * @see {@link FilterPresetBase.volume}
   */
  volume(factor: number): this {
    return this.add(this.presets.volume(factor));
  }

  /**
   * Adds an audio format filter to the chain.
   *
   * @param sampleFormat - Target sample format
   * @param sampleRate - Target sample rate (optional)
   * @param channelLayout - Target channel layout (optional)
   * @returns This instance for chaining
   *
   * @see {@link FilterPresetBase.aformat}
   */
  aformat(sampleFormat: string | AVSampleFormat, sampleRate?: number, channelLayout?: string): this {
    return this.add(this.presets.aformat(sampleFormat, sampleRate, channelLayout));
  }

  /**
   * Adds an atempo filter to the chain.
   *
   * @param factor - Tempo factor (0.5 to 2.0)
   * @returns This instance for chaining
   *
   * @see {@link FilterPresetBase.atempo}
   */
  atempo(factor: number): this {
    return this.add(this.presets.atempo(factor));
  }

  /**
   * Adds an audio fade filter to the chain.
   *
   * @param type - Fade type ('in' or 'out')
   * @param start - Start time in seconds
   * @param duration - Fade duration in seconds
   * @returns This instance for chaining
   *
   * @see {@link FilterPresetBase.afade}
   */
  afade(type: 'in' | 'out', start: number, duration: number): this {
    return this.add(this.presets.afade(type, start, duration));
  }

  /**
   * Adds an amix filter to the chain.
   *
   * @param inputs - Number of inputs (default: 2)
   * @param duration - Duration mode (default: 'longest')
   * @returns This instance for chaining
   *
   * @see {@link FilterPresetBase.amix}
   */
  amix(inputs = 2, duration: 'first' | 'longest' | 'shortest' = 'longest'): this {
    return this.add(this.presets.amix(inputs, duration));
  }

  /**
   * Adds a transpose filter to the chain (hardware-specific).
   *
   * @param dir - Transpose direction (default: 0)
   * @returns This instance for chaining
   *
   * @description Only available for hardware presets that support transpose
   */
  transpose(dir = 0): this {
    if ('transpose' in this.presets) {
      return this.add((this.presets as any).transpose(dir));
    }
    return this.add(null);
  }

  /**
   * Adds a tonemap filter to the chain (hardware-specific).
   *
   * @param options - Tonemapping options
   * @returns This instance for chaining
   *
   * @description Only available for hardware presets that support tonemapping
   */
  tonemap(options?: Record<string, string>): this {
    if ('tonemap' in this.presets) {
      return this.add((this.presets as any).tonemap(options));
    }
    return this.add(null);
  }

  /**
   * Adds a deinterlace filter to the chain (hardware-specific).
   *
   * @param mode - Deinterlace mode (optional)
   * @returns This instance for chaining
   *
   * @description Only available for hardware presets that support deinterlacing
   */
  deinterlace(mode?: string): this {
    if ('deinterlace' in this.presets) {
      return this.add((this.presets as any).deinterlace(mode));
    }
    return this.add(null);
  }

  /**
   * Adds a flip filter to the chain (hardware-specific).
   *
   * @param direction - Flip direction ('h' or 'v')
   * @returns This instance for chaining
   *
   * @description Falls back to hflip/vflip if hardware flip not available
   */
  flip(direction: 'h' | 'v'): this {
    if ('flip' in this.presets) {
      return this.add((this.presets as any).flip(direction));
    }
    // Fallback to hflip/vflip
    return direction === 'h' ? this.hflip() : this.vflip();
  }

  /**
   * Adds a blur filter to the chain (hardware-specific).
   *
   * @param type - Blur type (default: 'avg')
   * @param radius - Blur radius (optional)
   * @returns This instance for chaining
   *
   * @description Only available for hardware presets that support blur
   */
  blur(type: 'avg' | 'gaussian' | 'box' = 'avg', radius?: number): this {
    if ('blur' in this.presets) {
      return this.add((this.presets as any).blur(type, radius));
    }
    return this.add(null);
  }

  /**
   * Adds a sharpen filter to the chain (hardware-specific).
   *
   * @param amount - Sharpen amount (optional)
   * @returns This instance for chaining
   *
   * @description Only available for hardware presets that support sharpening
   */
  sharpen(amount?: number): this {
    if ('sharpen' in this.presets) {
      return this.add((this.presets as any).sharpen(amount));
    }
    return this.add(null);
  }

  /**
   * Adds a stack filter to the chain (hardware-specific).
   *
   * @param type - Stack type ('h' for horizontal, 'v' for vertical, 'x' for grid)
   * @param inputs - Number of inputs (default: 2)
   * @returns This instance for chaining
   *
   * @description Only available for hardware presets that support stacking
   */
  stack(type: 'h' | 'v' | 'x', inputs = 2): this {
    if ('stack' in this.presets) {
      return this.add((this.presets as any).stack(type, inputs));
    }
    return this.add(null);
  }

  /**
   * Adds a hwupload filter to upload frames to hardware.
   *
   * @returns This instance for chaining
   */
  hwupload(): this {
    if ('hwupload' in this.presets) {
      return this.add((this.presets as any).hwupload());
    }
    return this.add('hwupload');
  }

  /**
   * Adds a hwdownload filter to download frames from hardware.
   *
   * @returns This instance for chaining
   */
  hwdownload(): this {
    if ('hwdownload' in this.presets) {
      return this.add((this.presets as any).hwdownload());
    }
    return this.add('hwdownload');
  }

  /**
   * Adds a hwmap filter to map frames between hardware devices.
   *
   * @param derive - Device to derive from (optional)
   * @returns This instance for chaining
   */
  hwmap(derive?: string): this {
    if ('hwmap' in this.presets) {
      return this.add((this.presets as any).hwmap(derive));
    }
    return this.add(derive ? `hwmap=derive_device=${derive}` : 'hwmap');
  }
}

/**
 * Fluent filter chain builder with preset methods.
 * Provides a convenient API for building filter chains using standard presets.
 *
 * @example
 * ```typescript
 * const filter = FilterPresets.chain()
 *   .scale(1920, 1080)
 *   .fps(30)
 *   .fade('in', 0, 2)
 *   .format('yuv420p')
 *   .build();
 * ```
 */
export class FilterChainBuilder extends ChainBuilderBase<FilterPresets> {
  // Inherits all methods from ChainBuilderBase
}

/**
 * Standard filter presets for software filtering.
 * Provides static methods for creating common filter strings and
 * a chain builder for composing complex filter graphs.
 *
 * @example
 * ```typescript
 * // Static methods for individual filters
 * const scaleFilter = FilterPresets.scale(1920, 1080);
 * const fpsFilter = FilterPresets.fps(30);
 *
 * // Chain builder for complex graphs
 * const chain = FilterPresets.chain()
 *   .scale(1920, 1080)
 *   .fps(30)
 *   .fade('in', 0, 2)
 *   .build();
 * ```
 */
export class FilterPresets extends FilterPresetBase {
  private static instance = new FilterPresets();

  /**
   * Creates a new filter chain builder.
   *
   * @returns A new FilterChainBuilder instance
   *
   * @example
   * ```typescript
   * const filter = FilterPresets.chain()
   *   .scale(1280, 720)
   *   .fps(30)
   *   .build();
   * ```
   */
  static chain(): FilterChainBuilder {
    return new FilterChainBuilder(FilterPresets.instance);
  }

  /**
   * Creates a scale filter string.
   *
   * @param width - Target width
   * @param height - Target height
   * @param flags - Scaling algorithm flags (optional)
   * @returns Scale filter string
   */
  static scale(width: number, height: number, flags?: string): string {
    const result = FilterPresets.instance.scale(width, height, { flags });
    return result ?? '';
  }

  /**
   * Creates a crop filter string.
   *
   * @param width - Crop width
   * @param height - Crop height
   * @param x - X position (default: 0)
   * @param y - Y position (default: 0)
   * @returns Crop filter string
   */
  static crop(width: number, height: number, x = 0, y = 0): string {
    const result = FilterPresets.instance.crop(width, height, x, y);
    return result ?? '';
  }

  /**
   * Creates an FPS filter string.
   *
   * @param fps - Target frame rate
   * @returns FPS filter string
   */
  static fps(fps: number): string {
    const result = FilterPresets.instance.fps(fps);
    return result ?? '';
  }

  /**
   * Creates a format filter string.
   *
   * @param pixelFormat - Target pixel format(s)
   * @returns Format filter string
   */
  static format(pixelFormat: string | AVPixelFormat | (string | AVPixelFormat)[]): string {
    const result = FilterPresets.instance.format(pixelFormat);
    return result ?? '';
  }

  /**
   * Creates a rotate filter string.
   *
   * @param angle - Rotation angle in degrees
   * @returns Rotate filter string
   */
  static rotate(angle: number): string {
    const result = FilterPresets.instance.rotate(angle);
    return result ?? '';
  }

  /**
   * Creates a horizontal flip filter string.
   *
   * @returns Horizontal flip filter string
   */
  static hflip(): string {
    const result = FilterPresets.instance.hflip();
    return result ?? '';
  }

  /**
   * Creates a vertical flip filter string.
   *
   * @returns Vertical flip filter string
   */
  static vflip(): string {
    const result = FilterPresets.instance.vflip();
    return result ?? '';
  }

  /**
   * Creates a fade filter string.
   *
   * @param type - Fade type ('in' or 'out')
   * @param start - Start time in seconds
   * @param duration - Fade duration in seconds
   * @returns Fade filter string
   */
  static fade(type: 'in' | 'out', start: number, duration: number): string {
    const result = FilterPresets.instance.fade(type, start, duration);
    return result ?? '';
  }

  /**
   * Creates an overlay filter string.
   *
   * @param x - X position (default: 0)
   * @param y - Y position (default: 0)
   * @returns Overlay filter string
   */
  static overlay(x = 0, y = 0): string {
    const result = FilterPresets.instance.overlay(x, y);
    return result ?? '';
  }

  /**
   * Creates a volume filter string.
   *
   * @param factor - Volume multiplication factor
   * @returns Volume filter string
   */
  static volume(factor: number): string {
    const result = FilterPresets.instance.volume(factor);
    return result ?? '';
  }

  /**
   * Creates an audio format filter string.
   *
   * @param sampleFormat - Target sample format
   * @param sampleRate - Target sample rate (optional)
   * @param channelLayout - Target channel layout (optional)
   * @returns Audio format filter string
   */
  static aformat(sampleFormat: string | AVSampleFormat, sampleRate?: number, channelLayout?: string): string {
    const result = FilterPresets.instance.aformat(sampleFormat, sampleRate, channelLayout);
    return result ?? '';
  }

  /**
   * Creates an atempo filter string.
   *
   * @param factor - Tempo factor (0.5 to 2.0)
   * @returns Atempo filter string
   */
  static atempo(factor: number): string {
    const result = FilterPresets.instance.atempo(factor);
    return result ?? '';
  }

  /**
   * Creates an audio fade filter string.
   *
   * @param type - Fade type ('in' or 'out')
   * @param start - Start time in seconds
   * @param duration - Fade duration in seconds
   * @returns Audio fade filter string
   */
  static afade(type: 'in' | 'out', start: number, duration: number): string {
    const result = FilterPresets.instance.afade(type, start, duration);
    return result ?? '';
  }

  /**
   * Creates an amix filter string.
   *
   * @param inputs - Number of inputs (default: 2)
   * @param duration - Duration mode (default: 'longest')
   * @returns Amix filter string
   */
  static amix(inputs = 2, duration: 'first' | 'longest' | 'shortest' = 'longest'): string {
    const result = FilterPresets.instance.amix(inputs, duration);
    return result ?? '';
  }
}

/**
 * Hardware-accelerated filter presets.
 * Provides optimized filter implementations for specific hardware types,
 * with automatic fallback when operations aren't supported.
 *
 * @example
 * ```typescript
 * // Create hardware presets for CUDA
 * const hw = new HardwareFilterPresets(AV_HWDEVICE_TYPE_CUDA, 'cuda');
 *
 * // Check capabilities
 * if (hw.support.scale) {
 *   const scaleFilter = hw.scale(1920, 1080);
 * }
 *
 * // Use chain builder
 * const chain = hw.chain()
 *   .hwupload()
 *   .scale(1920, 1080)
 *   .tonemap()
 *   .hwdownload()
 *   .build();
 * ```
 */
export class HardwareFilterPresets extends FilterPresetBase {
  private readonly deviceType: AVHWDeviceType;
  private readonly deviceTypeName: string;
  public readonly support: HardwareFilterSupport;

  /**
   * @param deviceType - Hardware device type enum
   * @param deviceTypeName - Hardware device type name (e.g., 'cuda', 'vaapi')
   */
  constructor(deviceType: AVHWDeviceType, deviceTypeName: string) {
    super();
    this.deviceType = deviceType;
    this.deviceTypeName = deviceTypeName;
    this.support = this.getSupport();
  }

  /**
   * Checks if a filter is hardware-accelerated.
   *
   * @param filterName - Name of the filter to check
   * @returns True if the filter uses hardware acceleration
   *
   * @example
   * ```typescript
   * if (HardwareFilterPresets.isHardwareFilter('scale_cuda')) {
   *   console.log('Hardware accelerated scaling');
   * }
   * ```
   */
  static isHardwareFilter(filterName: string): boolean {
    const filter = Filter.getByName(filterName);
    if (!filter) {
      return false;
    }

    // Check if filter has hardware device flag
    return (filter.flags & AVFILTER_FLAG_HWDEVICE) !== 0;
  }

  /**
   * Creates a hardware filter chain builder.
   *
   * @returns A new HardwareFilterChainBuilder instance
   *
   * @example
   * ```typescript
   * const filter = hw.chain()
   *   .hwupload()
   *   .scale(1920, 1080)
   *   .hwdownload()
   *   .build();
   * ```
   */
  chain(): HardwareFilterChainBuilder {
    return new HardwareFilterChainBuilder(this);
  }

  /**
   * Creates a hardware-accelerated scale filter.
   *
   * @param width - Target width
   * @param height - Target height
   * @param options - Hardware-specific scaling options
   * @returns Hardware scale filter string or null if not supported
   *
   * @description
   * Different hardware types use different scale filters:
   * - CUDA: scale_cuda or scale_npp (with npp option)
   * - VAAPI: scale_vaapi
   * - QSV: scale_qsv
   * - VideoToolbox: scale_vt
   * - RKMPP: scale_rkrga
   *
   * @see {@link https://ffmpeg.org/ffmpeg-filters.html#scale_005fcuda | FFmpeg scale_cuda filter}
   */
  override scale(width: number, height: number, options?: Record<string, any>): string | null {
    if (!this.support.scale) {
      return null;
    }

    // Special handling for different hardware scalers
    let filterName: string;
    if (this.deviceType === AV_HWDEVICE_TYPE_CUDA && options?.npp) {
      filterName = 'scale_npp';
    } else if (this.deviceType === AV_HWDEVICE_TYPE_RKMPP) {
      filterName = 'scale_rkrga'; // RKMPP uses RGA for scaling
    } else if (this.deviceType === AV_HWDEVICE_TYPE_VIDEOTOOLBOX) {
      filterName = 'scale_vt'; // VideoToolbox uses scale_vt
    } else {
      filterName = `scale_${this.deviceTypeName}`;
    }

    let filter = `${filterName}=${width}:${height}`;

    if (options) {
      for (const [key, value] of Object.entries(options)) {
        if (key !== 'npp') {
          // Skip our special npp flag
          filter += `:${key}=${value}`;
        }
      }
    }

    return filter;
  }

  /**
   * Creates a hardware-accelerated overlay filter.
   *
   * @param x - X position (default: 0)
   * @param y - Y position (default: 0)
   * @param options - Hardware-specific overlay options
   * @returns Hardware overlay filter string or null if not supported
   *
   * @see {@link https://ffmpeg.org/ffmpeg-filters.html#overlay_005fcuda | FFmpeg overlay_cuda filter}
   */
  override overlay(x = 0, y = 0, options?: Record<string, string>): string | null {
    if (!this.support.overlay) {
      return null;
    }

    // Special handling for RKMPP which uses RGA
    const filterName = this.deviceType === AV_HWDEVICE_TYPE_RKMPP ? 'overlay_rkrga' : `overlay_${this.deviceTypeName}`;

    let filter = `${filterName}=${x}:${y}`;

    if (options) {
      for (const [key, value] of Object.entries(options)) {
        filter += `:${key}=${value}`;
      }
    }

    return filter;
  }

  /**
   * Creates a hardware-accelerated transpose filter.
   *
   * @param dir - Transpose direction (default: 0)
   * @returns Hardware transpose filter string or null if not supported
   *
   * @description
   * Direction values:
   * - 0: 90 degrees counter-clockwise and vertical flip
   * - 1: 90 degrees clockwise
   * - 2: 90 degrees counter-clockwise
   * - 3: 90 degrees clockwise and vertical flip
   */
  transpose(dir = 0): string | null {
    if (!this.support.transpose) {
      return null;
    }

    // Special handling for different hardware transpose implementations
    let filterName: string;
    if (this.deviceType === AV_HWDEVICE_TYPE_CUDA) {
      filterName = 'transpose_cuda'; // Uses transpose_cuda from patch, not NPP
    } else if (this.deviceType === AV_HWDEVICE_TYPE_VIDEOTOOLBOX) {
      filterName = 'transpose_vt'; // CoreImage-based transpose
    } else {
      filterName = `transpose_${this.deviceTypeName}`;
    }

    return `${filterName}=dir=${dir}`;
  }

  /**
   * Creates a hardware-accelerated tonemap filter.
   *
   * @param options - Tonemapping options (algorithm, parameters)
   * @returns Hardware tonemap filter string or null if not supported
   *
   * @description
   * Used for HDR to SDR conversion with hardware acceleration.
   */
  tonemap(options?: Record<string, string>): string | null {
    if (!this.support.tonemap) {
      return null;
    }

    // VideoToolbox uses different filter name
    const filterName = this.deviceType === AV_HWDEVICE_TYPE_VIDEOTOOLBOX ? 'tonemap_videotoolbox' : `tonemap_${this.deviceTypeName}`;

    let filter = filterName;

    if (options) {
      const opts = Object.entries(options)
        .map(([k, v]) => `${k}=${v}`)
        .join(':');
      filter += `=${opts}`;
    }

    return filter;
  }

  /**
   * Creates a hardware-accelerated deinterlace filter.
   *
   * @param mode - Deinterlacing mode (optional)
   * @returns Hardware deinterlace filter string or null if not supported
   *
   * @description
   * Different hardware types use different deinterlacers:
   * - CUDA: yadif_cuda
   * - VAAPI: deinterlace_vaapi
   * - QSV: deinterlace_qsv
   * - Vulkan: bwdif_vulkan
   * - VideoToolbox: yadif_videotoolbox
   */
  deinterlace(mode?: string): string | null {
    if (!this.support.deinterlace) {
      return null;
    }

    switch (this.deviceType) {
      case AV_HWDEVICE_TYPE_CUDA:
        return mode ? `yadif_cuda=mode=${mode}` : 'yadif_cuda';
      case AV_HWDEVICE_TYPE_VAAPI:
        return mode ? `deinterlace_vaapi=mode=${mode}` : 'deinterlace_vaapi';
      case AV_HWDEVICE_TYPE_QSV:
        return mode ? `deinterlace_qsv=mode=${mode}` : 'deinterlace_qsv';
      case AV_HWDEVICE_TYPE_VULKAN:
        return mode ? `bwdif_vulkan=mode=${mode}` : 'bwdif_vulkan';
      case AV_HWDEVICE_TYPE_VIDEOTOOLBOX:
        return mode ? `yadif_videotoolbox=mode=${mode}` : 'yadif_videotoolbox';
      default:
        return null;
    }
  }

  /**
   * Creates a hardware-accelerated flip filter.
   *
   * @param direction - Flip direction ('h' for horizontal, 'v' for vertical)
   * @returns Hardware flip filter string or null if not supported
   *
   * @description
   * Currently only Vulkan supports hardware flip filters.
   */
  flip(direction: 'h' | 'v'): string | null {
    if (!this.support.flip) {
      return null;
    }

    if (this.deviceType === AV_HWDEVICE_TYPE_VULKAN) {
      return direction === 'h' ? 'hflip_vulkan' : 'vflip_vulkan';
    }

    return null;
  }

  /**
   * Creates a hardware-accelerated blur filter.
   *
   * @param type - Blur type ('avg', 'gaussian', or 'box', default: 'avg')
   * @param radius - Blur radius (optional)
   * @returns Hardware blur filter string or null if not supported
   *
   * @description
   * Different hardware types support different blur filters:
   * - CUDA: bilateral_cuda
   * - Vulkan: avgblur_vulkan, gblur_vulkan
   * - OpenCL: avgblur_opencl, boxblur_opencl
   */
  blur(type: 'avg' | 'gaussian' | 'box' = 'avg', radius?: number): string | null {
    if (!this.support.blur) {
      return null;
    }

    switch (this.deviceType) {
      case AV_HWDEVICE_TYPE_CUDA:
        return radius ? `bilateral_cuda=sigmaS=${radius}` : 'bilateral_cuda';
      case AV_HWDEVICE_TYPE_VULKAN:
        return type === 'gaussian' ? (radius ? `gblur_vulkan=sigma=${radius}` : 'gblur_vulkan') : radius ? `avgblur_vulkan=sizeX=${radius}` : 'avgblur_vulkan';
      case AV_HWDEVICE_TYPE_OPENCL:
        return type === 'box' ? (radius ? `boxblur_opencl=luma_radius=${radius}` : 'boxblur_opencl') : radius ? `avgblur_opencl=sizeX=${radius}` : 'avgblur_opencl';
      default:
        return null;
    }
  }

  /**
   * Creates a hardware-accelerated sharpen filter.
   *
   * @param amount - Sharpening amount (optional)
   * @returns Hardware sharpen filter string or null if not supported
   *
   * @description
   * Hardware sharpening support:
   * - VAAPI: sharpness_vaapi
   * - OpenCL: unsharp_opencl
   * - CUDA: sharpen_npp (NPP-based)
   */
  sharpen(amount?: number): string | null {
    if (!this.support.sharpen) {
      return null;
    }

    switch (this.deviceType) {
      case AV_HWDEVICE_TYPE_VAAPI:
        return amount ? `sharpness_vaapi=sharpness=${amount}` : 'sharpness_vaapi';
      case AV_HWDEVICE_TYPE_OPENCL:
        return amount ? `unsharp_opencl=amount=${amount}` : 'unsharp_opencl';
      case AV_HWDEVICE_TYPE_CUDA:
        // CUDA uses NPP for sharpening
        return 'sharpen_npp';
      default:
        return null;
    }
  }

  /**
   * Creates a hardware-accelerated stack filter.
   *
   * @param type - Stack type ('h' for horizontal, 'v' for vertical, 'x' for grid)
   * @param inputs - Number of inputs to stack (default: 2)
   * @returns Hardware stack filter string or null if not supported
   *
   * @description
   * Only VAAPI and QSV support hardware stacking.
   */
  stack(type: 'h' | 'v' | 'x', inputs = 2): string | null {
    if (!this.support.stack) {
      return null;
    }

    if (this.deviceType === AV_HWDEVICE_TYPE_VAAPI || this.deviceType === AV_HWDEVICE_TYPE_QSV) {
      return `${type}stack_${this.deviceTypeName}=inputs=${inputs}`;
    }

    return null;
  }

  /**
   * Creates a hwupload filter to upload frames to hardware memory.
   *
   * @returns Hardware upload filter string
   *
   * @description
   * CUDA uses hwupload_cuda, others use generic hwupload.
   *
   * @see {@link https://ffmpeg.org/ffmpeg-filters.html#hwupload | FFmpeg hwupload filter}
   */
  hwupload(): string | null {
    if (this.deviceType === AV_HWDEVICE_TYPE_CUDA) {
      return 'hwupload_cuda';
    }
    return 'hwupload';
  }

  /**
   * Creates a hwdownload filter to download frames from hardware memory.
   *
   * @returns Hardware download filter string
   *
   * @see {@link https://ffmpeg.org/ffmpeg-filters.html#hwdownload | FFmpeg hwdownload filter}
   */
  hwdownload(): string | null {
    return 'hwdownload';
  }

  /**
   * Creates a hwmap filter to map frames between hardware devices.
   *
   * @param derive - Device to derive from (optional)
   * @returns Hardware map filter string
   *
   * @see {@link https://ffmpeg.org/ffmpeg-filters.html#hwmap | FFmpeg hwmap filter}
   */
  hwmap(derive?: string): string | null {
    return derive ? `hwmap=derive_device=${derive}` : 'hwmap';
  }

  /**
   * Gets the filter capabilities for this hardware type.
   *
   * @returns Object describing which filters are supported
   *
   * @example
   * ```typescript
   * const caps = hw.getCapabilities();
   * if (caps.scale && caps.overlay) {
   *   console.log('Hardware supports scaling and overlay');
   * }
   * ```
   */
  getCapabilities(): HardwareFilterSupport {
    return this.support;
  }

  /**
   * Determines filter support for the hardware type.
   *
   * @returns Hardware filter support configuration
   *
   * @internal
   */
  private getSupport(): HardwareFilterSupport {
    switch (this.deviceType) {
      case AV_HWDEVICE_TYPE_CUDA:
        return {
          scale: true, // scale_cuda
          overlay: true, // overlay_cuda
          transpose: true, // transpose_cuda (patch 0054)
          tonemap: true, // tonemap_cuda (patch 0004)
          deinterlace: true, // bwdif_cuda, yadif_cuda
          denoise: false,
          flip: false,
          blur: true, // bilateral_cuda
          sharpen: false, // Uses NPP
          chromakey: true, // chromakey_cuda
          colorspace: true, // colorspace_cuda
          pad: false,
          stack: false,
        };

      case AV_HWDEVICE_TYPE_VAAPI:
        return {
          scale: true, // scale_vaapi
          overlay: true, // overlay_vaapi
          transpose: true, // transpose_vaapi
          tonemap: true, // tonemap_vaapi
          deinterlace: true, // deinterlace_vaapi
          denoise: true, // denoise_vaapi
          flip: false,
          blur: false,
          sharpen: true, // sharpness_vaapi
          chromakey: false,
          colorspace: false,
          pad: true, // pad_vaapi
          stack: true, // hstack_vaapi, vstack_vaapi, xstack_vaapi
        };

      case AV_HWDEVICE_TYPE_QSV:
        return {
          scale: true, // scale_qsv
          overlay: true, // overlay_qsv
          transpose: false,
          tonemap: false,
          deinterlace: true, // deinterlace_qsv
          denoise: false,
          flip: false,
          blur: false,
          sharpen: false,
          chromakey: false,
          colorspace: false,
          pad: false,
          stack: true, // hstack_qsv, vstack_qsv, xstack_qsv
        };

      case AV_HWDEVICE_TYPE_VULKAN:
        return {
          scale: true, // scale_vulkan
          overlay: true, // overlay_vulkan
          transpose: true, // transpose_vulkan
          tonemap: false,
          deinterlace: true, // bwdif_vulkan
          denoise: false,
          flip: true, // flip_vulkan, hflip_vulkan, vflip_vulkan
          blur: true, // avgblur_vulkan, gblur_vulkan
          sharpen: false,
          chromakey: false,
          colorspace: false,
          pad: false,
          stack: false,
        };

      case AV_HWDEVICE_TYPE_OPENCL:
        return {
          scale: true, // scale_opencl (patch 0006)
          overlay: true, // overlay_opencl (+ PGS support patch 0008)
          transpose: true, // transpose_opencl
          tonemap: true, // tonemap_opencl (enhanced in patch 0007)
          deinterlace: false,
          denoise: false,
          flip: false,
          blur: true, // avgblur_opencl, boxblur_opencl
          sharpen: true, // unsharp_opencl
          chromakey: true, // colorkey_opencl
          colorspace: false,
          pad: true, // pad_opencl
          stack: false,
        };

      case AV_HWDEVICE_TYPE_VIDEOTOOLBOX:
        return {
          scale: true, // scale_vt (patch 0047 adds format option)
          overlay: true, // overlay_videotoolbox (patch 0048)
          transpose: true, // transpose_vt (patch 0049, CoreImage based)
          tonemap: true, // tonemap_videotoolbox (patch 0050)
          deinterlace: true, // yadif_videotoolbox
          denoise: false,
          flip: false,
          blur: false,
          sharpen: false,
          chromakey: false,
          colorspace: false,
          pad: false,
          stack: false,
        };

      case AV_HWDEVICE_TYPE_MEDIACODEC:
        // MediaCodec is Android's hardware acceleration - mainly for decode/encode
        return {
          scale: false,
          overlay: false,
          transpose: false,
          tonemap: false,
          deinterlace: false,
          denoise: false,
          flip: false,
          blur: false,
          sharpen: false,
          chromakey: false,
          colorspace: false,
          pad: false,
          stack: false,
        };

      case AV_HWDEVICE_TYPE_RKMPP: // Rockchip - has RGA filters via patch 0046
        // Note: RKMPP uses separate RKRGA (Rockchip 2D Raster Graphic Acceleration)
        // for filtering operations, configured with --enable-rkrga
        return {
          scale: true, // scale_rkrga (patch 0046)
          overlay: true, // overlay_rkrga (patch 0046)
          transpose: false,
          tonemap: false,
          deinterlace: false,
          denoise: false,
          flip: false,
          blur: false,
          sharpen: false,
          chromakey: false,
          colorspace: false,
          pad: false,
          stack: false,
        };

      // These hardware types don't have dedicated filters - they're mainly for decode/encode
      case AV_HWDEVICE_TYPE_VDPAU: // Decode-only, deprecated in favor of VAAPI
      case AV_HWDEVICE_TYPE_DXVA2: // Windows decode-only
      case AV_HWDEVICE_TYPE_D3D11VA: // Windows decode-only
      case AV_HWDEVICE_TYPE_D3D12VA: // Has HEVC encoder but no filters
      case AV_HWDEVICE_TYPE_DRM: // Linux DRM buffer sharing, not processing
        return {
          scale: false,
          overlay: false,
          transpose: false,
          tonemap: false,
          deinterlace: false,
          denoise: false,
          flip: false,
          blur: false,
          sharpen: false,
          chromakey: false,
          colorspace: false,
          pad: false,
          stack: false,
        };

      default:
        // Unknown hardware - no support
        // NPP is not a separate hardware type, it's CUDA-based
        // We handle it through CUDA with special filter names
        return {
          scale: false,
          overlay: false,
          transpose: false,
          tonemap: false,
          deinterlace: false,
          denoise: false,
          flip: false,
          blur: false,
          sharpen: false,
          chromakey: false,
          colorspace: false,
          pad: false,
          stack: false,
        };
    }
  }
}

/**
 * Hardware filter chain builder with fluent API.
 * Automatically skips unsupported filters (returns null) allowing graceful fallback.
 *
 * @example
 * ```typescript
 * const hw = new HardwareFilterPresets(AV_HWDEVICE_TYPE_CUDA, 'cuda');
 * const chain = hw.chain()
 *   .hwupload()
 *   .scale(1920, 1080)
 *   .tonemap()  // Skipped if not supported
 *   .hwdownload()
 *   .build();
 * ```
 */
export class HardwareFilterChainBuilder extends ChainBuilderBase<HardwareFilterPresets> {
  // Inherits all methods from ChainBuilderBase
}
