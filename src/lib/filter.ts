import { bindings } from './binding.js';

import type { NativeFilter, NativeWrapper } from './native-types.js';

/**
 * FFmpeg filter for audio/video processing
 *
 * Represents a filter type that can be instantiated in a FilterGraph.
 * Filters are the building blocks for complex audio/video processing pipelines.
 *
 * @example
 * ```typescript
 * // Find a filter by name
 * const scaleFilter = Filter.findByName('scale');
 * if (scaleFilter) {
 *   // Use in a filter graph
 *   const graph = new FilterGraph();
 *   const context = graph.createFilter(scaleFilter, 'scaler', '320:240');
 * }
 *
 * // List all available filters
 * const filters = Filter.getAll();
 * console.log(`Available filters: ${filters.length}`);
 * ```
 */
export class Filter implements NativeWrapper<NativeFilter> {
  private filter: NativeFilter; // Native filter binding

  // ==================== Constructor ====================

  /**
   * Create a Filter wrapper
   * @param filter Native filter object
   * @internal
   */
  constructor(filter: NativeFilter) {
    this.filter = filter;
  }

  // ==================== Static Methods ====================

  /**
   * Find a filter by name
   * @param name Filter name (e.g., 'scale', 'overlay', 'format')
   * @returns Filter instance or null if not found
   * @example
   * ```typescript
   * const filter = Filter.findByName('scale');
   * ```
   */
  static findByName(name: string): Filter | null {
    const filter = bindings.Filter.findByName(name);
    return filter ? new Filter(filter) : null;
  }

  /**
   * Get all available filters
   * @returns Array of all registered filters
   * @example
   * ```typescript
   * const filters = Filter.getAll();
   * for (const filter of filters) {
   *   console.log(`${filter.name}: ${filter.description}`);
   * }
   * ```
   */
  static getAll(): Filter[] {
    try {
      const natives = bindings.Filter.getAll();
      return natives.map((native) => new Filter(native));
    } catch (error) {
      console.warn('Failed to get all filters:', error);
      return [];
    }
  }

  // ==================== Getters/Setters ====================

  /**
   * Get filter name
   */
  get name(): string | null {
    return this.filter.name;
  }

  /**
   * Get filter description
   */
  get description(): string | null {
    return this.filter.description;
  }

  /**
   * Get filter flags
   */
  get flags(): number {
    return this.filter.flags;
  }

  /**
   * Get number of inputs
   * @returns Number of input pads this filter has
   */
  get nbInputs(): number {
    return this.filter.nbInputs;
  }

  /**
   * Get number of outputs
   * @returns Number of output pads this filter has
   */
  get nbOutputs(): number {
    return this.filter.nbOutputs;
  }

  // ==================== Internal Methods ====================

  /**
   * Get native filter object for internal use
   * @internal
   */
  getNative(): NativeFilter {
    return this.filter;
  }
}

/**
 * Common filter names for convenience
 */
export const FilterNames = {
  // Video filters
  SCALE: 'scale',
  CROP: 'crop',
  PAD: 'pad',
  OVERLAY: 'overlay',
  FORMAT: 'format',
  FPS: 'fps',
  ROTATE: 'rotate',
  FLIP: 'hflip',
  VFLIP: 'vflip',
  TRANSPOSE: 'transpose',
  SETPTS: 'setpts',
  FADE: 'fade',
  DRAWTEXT: 'drawtext',
  DEINTERLACE: 'yadif',

  // Audio filters
  VOLUME: 'volume',
  AMERGE: 'amerge',
  AMIX: 'amix',
  AFORMAT: 'aformat',
  ARESAMPLE: 'aresample',
  ATEMPO: 'atempo',
  ADELAY: 'adelay',
  AECHO: 'aecho',
  AFADE: 'afade',
  HIGHPASS: 'highpass',
  LOWPASS: 'lowpass',

  // Source/Sink filters
  BUFFER: 'buffer',
  BUFFERSINK: 'buffersink',
  ABUFFER: 'abuffer',
  ABUFFERSINK: 'abuffersink',

  // Special filters
  NULLSRC: 'nullsrc',
  NULLSINK: 'nullsink',
  SPLIT: 'split',
  ASPLIT: 'asplit',
} as const;
