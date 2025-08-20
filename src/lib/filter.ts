import { bindings } from './binding.js';
import { AV_MEDIA_TYPE_AUDIO, AV_MEDIA_TYPE_VIDEO } from './constants.js';

import type { NativeFilter, NativeWrapper } from './native-types.js';
import type { FilterPad } from './types.js';

/**
 * Filter definition for media processing.
 *
 * Represents a static filter definition (immutable template).
 * Defines the filter's capabilities, inputs, outputs, and properties.
 * Actual filtering operations are performed through FilterContext instances.
 *
 * Direct mapping to FFmpeg's AVFilter.
 *
 * @example
 * ```typescript
 * import { Filter } from '@seydx/av';
 *
 * // Find a filter by name
 * const scaleFilter = Filter.getByName('scale');
 * if (!scaleFilter) throw new Error('Scale filter not found');
 *
 * // Check filter properties
 * console.log(`Filter: ${scaleFilter.name}`);
 * console.log(`Description: ${scaleFilter.description}`);
 * console.log(`Inputs: ${scaleFilter.inputs.length}`);
 * console.log(`Outputs: ${scaleFilter.outputs.length}`);
 *
 * // Get all video filters
 * const allFilters = Filter.getList();
 * const videoFilters = allFilters.filter(f => f.isVideo());
 * console.log(`Found ${videoFilters.length} video filters`);
 * ```
 */
export class Filter implements NativeWrapper<NativeFilter> {
  private native: NativeFilter;

  /**
   * Constructor is internal - use static factory methods.
   *
   * Filters are global immutable objects managed by FFmpeg.
   * Use the static factory methods to obtain filter instances.
   *
   * @internal
   *
   * @param native - Native AVFilter to wrap
   *
   * @example
   * ```typescript
   * import { Filter } from '@seydx/av';
   *
   * // Don't use constructor directly
   * // const filter = new Filter(); // Wrong
   *
   * // Use static factory methods instead
   * const filter = Filter.getByName('scale'); // Correct
   * const filters = Filter.getList(); // Correct
   * ```
   */
  constructor(native: NativeFilter) {
    this.native = native;
  }

  /**
   * Find a filter by name.
   *
   * Searches for a filter by its exact name.
   * Returns the filter definition if found.
   *
   * Direct mapping to avfilter_get_by_name()
   *
   * @param name - Filter name (e.g., "scale", "overlay", "volume")
   *
   * @returns The filter if found, null otherwise
   *
   * @example
   * ```typescript
   * import { Filter } from '@seydx/av';
   *
   * // Find the scale filter
   * const scaleFilter = Filter.getByName('scale');
   * if (!scaleFilter) {
   *   throw new Error('Scale filter not available');
   * }
   *
   * // Find audio volume filter
   * const volumeFilter = Filter.getByName('volume');
   * if (!volumeFilter) {
   *   throw new Error('Volume filter not available');
   * }
   * ```
   *
   * @see {@link getList} To get all available filters
   */
  static getByName(name: string): Filter | null {
    const native = bindings.Filter.getByName(name);
    return native ? new Filter(native) : null;
  }

  /**
   * Get list of all available filters.
   *
   * Returns all registered filters in the system.
   * Internally uses avfilter_iterate() to collect all filters.
   *
   * Direct mapping to avfilter_iterate()
   *
   * @returns Array of all registered filters
   *
   * @example
   * ```typescript
   * import { Filter } from '@seydx/av';
   *
   * // Get all video filters
   * const allFilters = Filter.getList();
   * const videoFilters = allFilters.filter(f => f.isVideo());
   * console.log(`Found ${videoFilters.length} video filters`);
   *
   * // Find all source filters
   * const sourceFilters = allFilters.filter(f => f.isSource());
   * sourceFilters.forEach(f => {
   *   console.log(`Source filter: ${f.name}`);
   * });
   * ```
   *
   * @see {@link getByName} To find a specific filter
   */
  static getList(): Filter[] {
    const natives = bindings.Filter.getList();
    return natives.map((native) => new Filter(native));
  }

  /**
   * Filter name.
   *
   * Direct mapping to AVFilter->name
   *
   * The short name of the filter (e.g., "scale", "overlay", "volume").
   */
  get name(): string | null {
    return this.native.name;
  }

  /**
   * Filter description.
   *
   * Direct mapping to AVFilter->description
   *
   * Human-readable description of what the filter does.
   */
  get description(): string | null {
    return this.native.description;
  }

  /**
   * Input pads.
   *
   * Direct mapping to AVFilter->inputs
   *
   * Array of input connection points for the filter.
   * Empty array for source filters.
   */
  get inputs(): FilterPad[] {
    return this.native.inputs;
  }

  /**
   * Output pads.
   *
   * Direct mapping to AVFilter->outputs
   *
   * Array of output connection points for the filter.
   * Empty array for sink filters.
   */
  get outputs(): FilterPad[] {
    return this.native.outputs;
  }

  /**
   * Filter flags.
   *
   * Direct mapping to AVFilter->flags
   *
   * Bitwise flags indicating filter capabilities (AVFILTER_FLAG_*).
   */
  get flags(): number {
    return this.native.flags;
  }

  /**
   * Check if this is a source filter.
   *
   * Source filters have no inputs and generate data.
   *
   * @returns true if the filter has no input pads, false otherwise
   *
   * @example
   * ```typescript
   * const filter = Filter.getByName('buffer');
   * if (filter && filter.isSource()) {
   *   console.log('This is a source filter');
   * }
   * ```
   */
  isSource(): boolean {
    return this.inputs.length === 0;
  }

  /**
   * Check if this is a sink filter.
   *
   * Sink filters have no outputs and consume data.
   *
   * @returns true if the filter has no output pads, false otherwise
   *
   * @example
   * ```typescript
   * const filter = Filter.getByName('buffersink');
   * if (filter && filter.isSink()) {
   *   console.log('This is a sink filter');
   * }
   * ```
   */
  isSink(): boolean {
    return this.outputs.length === 0;
  }

  /**
   * Check if this is a video filter.
   *
   * Checks if any input or output pad handles video data.
   *
   * @returns true if the filter processes video data, false otherwise
   *
   * @example
   * ```typescript
   * const filter = Filter.getByName('scale');
   * if (filter && filter.isVideo()) {
   *   console.log('This filter processes video');
   * }
   * ```
   */
  isVideo(): boolean {
    return this.inputs.some((i) => i.type === AV_MEDIA_TYPE_VIDEO) || this.outputs.some((o) => o.type === AV_MEDIA_TYPE_VIDEO);
  }

  /**
   * Check if this is an audio filter.
   *
   * Checks if any input or output pad handles audio data.
   *
   * @returns true if the filter processes audio data, false otherwise
   *
   * @example
   * ```typescript
   * const filter = Filter.getByName('volume');
   * if (filter && filter.isAudio()) {
   *   console.log('This filter processes audio');
   * }
   * ```
   */
  isAudio(): boolean {
    return this.inputs.some((i) => i.type === AV_MEDIA_TYPE_AUDIO) || this.outputs.some((o) => o.type === AV_MEDIA_TYPE_AUDIO);
  }

  /**
   * Get the native FFmpeg AVFilter pointer.
   *
   * @internal For use by other wrapper classes
   * @returns The underlying native filter object
   */
  getNative(): NativeFilter {
    return this.native;
  }
}
