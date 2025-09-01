/**
 * FilterPresets - Pre-defined filter configurations
 *
 * Provides convenient filter string builders for common operations.
 * Includes both software and hardware-accelerated filter presets.
 *
 * Simplifies filter creation with type-safe parameter handling.
 * Supports platform-specific hardware acceleration capabilities.
 *
 * @module api/filter-presets
 */

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
 * Provides common filter building methods that can be overridden.
 */
export abstract class FilterPresetBase {
  /**
   * Scale video to specified dimensions.
   * @returns Filter string or null if not supported
   */
  scale(width: number, height: number, options?: Record<string, any>): string | null {
    const flags = options?.flags;
    const base = `scale=${width}:${height}`;
    return flags ? `${base}:flags=${flags}` : base;
  }

  /**
   * Crop video to specified dimensions.
   */
  crop(width: number, height: number, x = 0, y = 0): string | null {
    return `crop=${width}:${height}:${x}:${y}`;
  }

  /**
   * Change frame rate.
   */
  fps(fps: number): string | null {
    return `fps=${fps}`;
  }

  /**
   * Convert pixel format.
   * Can accept a single format or an array of formats for fallback.
   * Multiple formats will create a chain: format=fmt1,format=fmt2,...
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
   * Rotate video by angle.
   */
  rotate(angle: number): string | null {
    return `rotate=${angle}*PI/180`;
  }

  /**
   * Flip video horizontally.
   */
  hflip(): string | null {
    return 'hflip';
  }

  /**
   * Flip video vertically.
   */
  vflip(): string | null {
    return 'vflip';
  }

  /**
   * Apply fade effect.
   */
  fade(type: 'in' | 'out', start: number, duration: number): string | null {
    return `fade=t=${type}:st=${start}:d=${duration}`;
  }

  /**
   * Overlay one video on another.
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
   * Adjust audio volume.
   */
  volume(factor: number): string | null {
    return `volume=${factor}`;
  }

  /**
   * Convert audio sample format.
   */
  aformat(sampleFormat: string | AVSampleFormat, sampleRate?: number, channelLayout?: string): string | null {
    const formatName = typeof sampleFormat === 'string' ? sampleFormat : (avGetSampleFmtName(sampleFormat) ?? 's16');
    let filter = `aformat=sample_fmts=${formatName}`;
    if (sampleRate) filter += `:sample_rates=${sampleRate}`;
    if (channelLayout) filter += `:channel_layouts=${channelLayout}`;
    return filter;
  }

  /**
   * Change audio tempo without changing pitch.
   */
  atempo(factor: number): string | null {
    return `atempo=${factor}`;
  }

  /**
   * Apply audio fade.
   */
  afade(type: 'in' | 'out', start: number, duration: number): string | null {
    return `afade=t=${type}:st=${start}:d=${duration}`;
  }

  /**
   * Mix multiple audio streams.
   */
  amix(inputs = 2, duration: 'first' | 'longest' | 'shortest' = 'longest'): string | null {
    return `amix=inputs=${inputs}:duration=${duration}`;
  }
}

/**
 * Filter chain builder for composing multiple filters.
 * Allows fluent API for building complex filter graphs.
 */
export class FilterChain {
  private filters: string[] = [];

  /**
   * Add a filter to the chain.
   * @param filter - Filter string or null/undefined (will be skipped)
   */
  add(filter: string | null | undefined): this {
    if (filter) {
      this.filters.push(filter);
    }
    return this;
  }

  /**
   * Add a custom filter string.
   */
  custom(filter: string): this {
    return this.add(filter);
  }

  /**
   * Build the filter chain string.
   * @param separator - Separator between filters (default: ',')
   */
  build(separator = ','): string {
    return this.filters.join(separator);
  }

  /**
   * Get the filter array.
   */
  toArray(): string[] {
    return [...this.filters];
  }
}

/**
 * Base chain builder with common filter methods.
 * @template T The preset type this builder uses
 */
export abstract class ChainBuilderBase<T extends FilterPresetBase> extends FilterChain {
  constructor(protected readonly presets: T) {
    super();
  }

  scale(width: number, height: number, options?: Record<string, any>): this {
    return this.add(this.presets.scale(width, height, options));
  }

  crop(width: number, height: number, x = 0, y = 0): this {
    return this.add(this.presets.crop(width, height, x, y));
  }

  fps(fps: number): this {
    return this.add(this.presets.fps(fps));
  }

  format(pixelFormat: string | AVPixelFormat | (string | AVPixelFormat)[]): this {
    return this.add(this.presets.format(pixelFormat));
  }

  rotate(angle: number): this {
    return this.add(this.presets.rotate(angle));
  }

  hflip(): this {
    return this.add(this.presets.hflip());
  }

  vflip(): this {
    return this.add(this.presets.vflip());
  }

  fade(type: 'in' | 'out', start: number, duration: number): this {
    return this.add(this.presets.fade(type, start, duration));
  }

  overlay(x = 0, y = 0, options?: Record<string, string>): this {
    return this.add(this.presets.overlay(x, y, options));
  }

  volume(factor: number): this {
    return this.add(this.presets.volume(factor));
  }

  aformat(sampleFormat: string | AVSampleFormat, sampleRate?: number, channelLayout?: string): this {
    return this.add(this.presets.aformat(sampleFormat, sampleRate, channelLayout));
  }

  atempo(factor: number): this {
    return this.add(this.presets.atempo(factor));
  }

  afade(type: 'in' | 'out', start: number, duration: number): this {
    return this.add(this.presets.afade(type, start, duration));
  }

  amix(inputs = 2, duration: 'first' | 'longest' | 'shortest' = 'longest'): this {
    return this.add(this.presets.amix(inputs, duration));
  }

  // Hardware-specific methods (only available if presets support them)
  transpose(dir = 0): this {
    if ('transpose' in this.presets) {
      return this.add((this.presets as any).transpose(dir));
    }
    return this.add(null);
  }

  tonemap(options?: Record<string, string>): this {
    if ('tonemap' in this.presets) {
      return this.add((this.presets as any).tonemap(options));
    }
    return this.add(null);
  }

  deinterlace(mode?: string): this {
    if ('deinterlace' in this.presets) {
      return this.add((this.presets as any).deinterlace(mode));
    }
    return this.add(null);
  }

  flip(direction: 'h' | 'v'): this {
    if ('flip' in this.presets) {
      return this.add((this.presets as any).flip(direction));
    }
    // Fallback to hflip/vflip
    return direction === 'h' ? this.hflip() : this.vflip();
  }

  blur(type: 'avg' | 'gaussian' | 'box' = 'avg', radius?: number): this {
    if ('blur' in this.presets) {
      return this.add((this.presets as any).blur(type, radius));
    }
    return this.add(null);
  }

  sharpen(amount?: number): this {
    if ('sharpen' in this.presets) {
      return this.add((this.presets as any).sharpen(amount));
    }
    return this.add(null);
  }

  stack(type: 'h' | 'v' | 'x', inputs = 2): this {
    if ('stack' in this.presets) {
      return this.add((this.presets as any).stack(type, inputs));
    }
    return this.add(null);
  }

  hwupload(): this {
    if ('hwupload' in this.presets) {
      return this.add((this.presets as any).hwupload());
    }
    return this.add('hwupload');
  }

  hwdownload(): this {
    if ('hwdownload' in this.presets) {
      return this.add((this.presets as any).hwdownload());
    }
    return this.add('hwdownload');
  }

  hwmap(derive?: string): this {
    if ('hwmap' in this.presets) {
      return this.add((this.presets as any).hwmap(derive));
    }
    return this.add(derive ? `hwmap=derive_device=${derive}` : 'hwmap');
  }
}

/**
 * Fluent filter chain builder with preset methods.
 */
export class FilterChainBuilder extends ChainBuilderBase<FilterPresets> {
  // Inherits all methods from ChainBuilderBase
}

/**
 * Common filter presets for convenience.
 *
 * Provides pre-defined filter strings for common operations.
 * Can be used with Filter.create() for quick setup.
 *
 * @example
 * ```typescript
 * const filter = await Filter.create(
 *   FilterPresets.scale(1280, 720),
 *   config
 * );
 *
 * // Using chain builder
 * const chain = FilterPresets.chain()
 *   .scale(1920, 1080)
 *   .format('yuv420p')
 *   .custom('unsharp=5:5:1.0')
 *   .build();
 * ```
 */
export class FilterPresets extends FilterPresetBase {
  private static instance = new FilterPresets();

  /**
   * Create a new filter chain builder.
   */
  static chain(): FilterChainBuilder {
    return new FilterChainBuilder(FilterPresets.instance);
  }

  // Static methods that delegate to instance
  static scale(width: number, height: number, flags?: string): string {
    const result = FilterPresets.instance.scale(width, height, { flags });
    return result ?? '';
  }

  static crop(width: number, height: number, x = 0, y = 0): string {
    const result = FilterPresets.instance.crop(width, height, x, y);
    return result ?? '';
  }

  static fps(fps: number): string {
    const result = FilterPresets.instance.fps(fps);
    return result ?? '';
  }

  static format(pixelFormat: string | AVPixelFormat | (string | AVPixelFormat)[]): string {
    const result = FilterPresets.instance.format(pixelFormat);
    return result ?? '';
  }

  static rotate(angle: number): string {
    const result = FilterPresets.instance.rotate(angle);
    return result ?? '';
  }

  static hflip(): string {
    const result = FilterPresets.instance.hflip();
    return result ?? '';
  }

  static vflip(): string {
    const result = FilterPresets.instance.vflip();
    return result ?? '';
  }

  static fade(type: 'in' | 'out', start: number, duration: number): string {
    const result = FilterPresets.instance.fade(type, start, duration);
    return result ?? '';
  }

  static overlay(x = 0, y = 0): string {
    const result = FilterPresets.instance.overlay(x, y);
    return result ?? '';
  }

  static volume(factor: number): string {
    const result = FilterPresets.instance.volume(factor);
    return result ?? '';
  }

  static aformat(sampleFormat: string | AVSampleFormat, sampleRate?: number, channelLayout?: string): string {
    const result = FilterPresets.instance.aformat(sampleFormat, sampleRate, channelLayout);
    return result ?? '';
  }

  static atempo(factor: number): string {
    const result = FilterPresets.instance.atempo(factor);
    return result ?? '';
  }

  static afade(type: 'in' | 'out', start: number, duration: number): string {
    const result = FilterPresets.instance.afade(type, start, duration);
    return result ?? '';
  }

  static amix(inputs = 2, duration: 'first' | 'longest' | 'shortest' = 'longest'): string {
    const result = FilterPresets.instance.amix(inputs, duration);
    return result ?? '';
  }
}

/**
 * Hardware-accelerated filter presets.
 *
 * Provides hardware-specific filter strings for accelerated processing.
 * Created and managed by HardwareContext for type-safe hardware operations.
 *
 * @example
 * ```typescript
 * const hw = await HardwareContext.auto();
 * if (hw) {
 *   // Get hardware-specific scale filter (returns null if unsupported)
 *   const scaleFilter = hw.filterPresets.scale(1920, 1080);
 *
 *   // Build a filter chain (unsupported filters are skipped)
 *   const chain = hw.filterPresets.chain()
 *     .hwupload()
 *     .scale(1920, 1080)
 *     .tonemap()  // Skipped if not supported
 *     .custom('unsharp=5:5:1.0')
 *     .hwdownload()
 *     .build();
 * }
 * ```
 */
export class HardwareFilterPresets extends FilterPresetBase {
  private readonly deviceType: AVHWDeviceType;
  private readonly deviceName: string;
  public readonly support: HardwareFilterSupport;

  /**
   * Create hardware filter presets for a specific device type.
   * @internal Used by HardwareContext
   */
  constructor(deviceType: AVHWDeviceType, deviceName: string | null = null) {
    super();
    this.deviceType = deviceType;
    this.deviceName = deviceName ?? 'unknown';
    this.support = this.getSupport();
  }

  /**
   * Check if a filter name is a hardware-accelerated filter.
   * Uses FFmpeg's AVFILTER_FLAG_HWDEVICE flag to determine if a filter is hardware-accelerated.
   * @param filterName - The filter name to check
   * @returns True if it's a hardware filter, false otherwise
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
   * Create a new hardware filter chain builder.
   */
  chain(): HardwareFilterChainBuilder {
    return new HardwareFilterChainBuilder(this);
  }

  /**
   * Hardware-accelerated scale filter.
   * @returns Filter string or null if not supported
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
      filterName = `scale_${this.deviceName}`;
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
   * Hardware-accelerated overlay filter.
   * @returns Filter string or null if not supported
   */
  override overlay(x = 0, y = 0, options?: Record<string, string>): string | null {
    if (!this.support.overlay) {
      return null;
    }

    // Special handling for RKMPP which uses RGA
    const filterName = this.deviceType === AV_HWDEVICE_TYPE_RKMPP ? 'overlay_rkrga' : `overlay_${this.deviceName}`;

    let filter = `${filterName}=${x}:${y}`;

    if (options) {
      for (const [key, value] of Object.entries(options)) {
        filter += `:${key}=${value}`;
      }
    }

    return filter;
  }

  /**
   * Hardware-accelerated transpose filter.
   * @returns Filter string or null if not supported
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
      filterName = `transpose_${this.deviceName}`;
    }

    return `${filterName}=dir=${dir}`;
  }

  /**
   * Hardware-accelerated tonemap filter.
   * @returns Filter string or null if not supported
   */
  tonemap(options?: Record<string, string>): string | null {
    if (!this.support.tonemap) {
      return null;
    }

    // VideoToolbox uses different filter name
    const filterName = this.deviceType === AV_HWDEVICE_TYPE_VIDEOTOOLBOX ? 'tonemap_videotoolbox' : `tonemap_${this.deviceName}`;

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
   * Hardware-accelerated deinterlace filter.
   * @returns Filter string or null if not supported
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
   * Hardware-accelerated flip filter.
   * @returns Filter string or null if not supported
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
   * Hardware-accelerated blur filter.
   * @returns Filter string or null if not supported
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
   * Hardware-accelerated sharpen filter.
   * @returns Filter string or null if not supported
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
   * Hardware-accelerated stack filters (hstack, vstack, xstack).
   * @returns Filter string or null if not supported
   */
  stack(type: 'h' | 'v' | 'x', inputs = 2): string | null {
    if (!this.support.stack) {
      return null;
    }

    if (this.deviceType === AV_HWDEVICE_TYPE_VAAPI || this.deviceType === AV_HWDEVICE_TYPE_QSV) {
      return `${type}stack_${this.deviceName}=inputs=${inputs}`;
    }

    return null;
  }

  /**
   * Hardware upload filter to transfer frames to GPU.
   */
  hwupload(): string | null {
    if (this.deviceType === AV_HWDEVICE_TYPE_CUDA) {
      return 'hwupload_cuda';
    }
    return 'hwupload';
  }

  /**
   * Hardware download filter to transfer frames from GPU.
   */
  hwdownload(): string | null {
    return 'hwdownload';
  }

  /**
   * Format conversion for hardware frames.
   */
  hwmap(derive?: string): string | null {
    return derive ? `hwmap=derive_device=${derive}` : 'hwmap';
  }

  /**
   * Get capabilities for this hardware type.
   */
  getCapabilities(): HardwareFilterSupport {
    return this.support;
  }

  /**
   * Get supported filters for this hardware type.
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
 * Automatically skips unsupported filters (returns null).
 */
export class HardwareFilterChainBuilder extends ChainBuilderBase<HardwareFilterPresets> {
  // Inherits all methods from ChainBuilderBase
}
