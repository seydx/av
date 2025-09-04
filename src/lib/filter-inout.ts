import { bindings } from './binding.js';
import { FilterContext } from './filter-context.js';

import type { NativeFilterInOut, NativeWrapper } from './native-types.js';

/**
 * Filter input/output linked list structure for filter graph parsing.
 *
 * Represents a linked list of labeled filter pads used during filter graph
 * configuration. Each node contains a filter context, pad index, and optional
 * label for connecting filters together. Used internally by avfilter_graph_parse()
 * to track unlinked filter pads during graph construction.
 *
 * Direct mapping to FFmpeg's AVFilterInOut.
 *
 * @example
 * ```typescript
 * import { FilterInOut, FilterContext, FFmpegError } from 'node-av';
 *
 * // Create a linked list of filter inputs/outputs
 * const inputs = FilterInOut.createList([
 *   { name: 'in', filterCtx: bufferSrc, padIdx: 0 },
 *   { name: 'overlay', filterCtx: overlay, padIdx: 1 }
 * ]);
 *
 * // Parse filter graph with labeled connections
 * const ret = graph.parse(filterString, inputs, outputs);
 * FFmpegError.throwIfError(ret, 'parse');
 *
 * // Manual creation and linking
 * const inout = new FilterInOut();
 * inout.alloc();
 * inout.name = 'input';
 * inout.filterCtx = sourceFilter;
 * inout.padIdx = 0;
 * ```
 *
 * @see [AVFilterInOut](https://ffmpeg.org/doxygen/trunk/structAVFilterInOut.html) - FFmpeg Doxygen
 * @see {@link FilterGraph} For parsing filter descriptions
 * @see {@link FilterContext} For filter instances
 */
export class FilterInOut implements Disposable, NativeWrapper<NativeFilterInOut> {
  private native: NativeFilterInOut;

  constructor() {
    this.native = new bindings.FilterInOut();
  }

  /**
   * Create a linked list of filter inputs/outputs.
   *
   * Convenience method to build a linked list structure from an array
   * of filter specifications. Each item becomes a node in the list.
   *
   * @param items - Array of filter input/output specifications
   * @returns Head of the linked list, or null if items is empty
   *
   * @example
   * ```typescript
   * // Create inputs for a filter graph
   * const inputs = FilterInOut.createList([
   *   { name: 'video_in', filterCtx: videoBuffer, padIdx: 0 },
   *   { name: 'audio_in', filterCtx: audioBuffer, padIdx: 0 }
   * ]);
   *
   * // Create outputs
   * const outputs = FilterInOut.createList([
   *   { name: 'video_out', filterCtx: videoSink, padIdx: 0 },
   *   { name: 'audio_out', filterCtx: audioSink, padIdx: 0 }
   * ]);
   * ```
   *
   * @see {@link alloc} For manual node creation
   */
  static createList(
    items: {
      name: string;
      filterCtx: FilterContext;
      padIdx: number;
    }[],
  ): FilterInOut | null {
    if (items.length === 0) return null;

    let head: FilterInOut | null = null;
    let current: FilterInOut | null = null;

    for (const item of items) {
      const inout = new FilterInOut();
      inout.alloc();
      inout.name = item.name;
      inout.filterCtx = item.filterCtx;
      inout.padIdx = item.padIdx;

      if (!head) {
        head = inout;
        current = inout;
      } else if (current) {
        current.next = inout;
        current = inout;
      }
    }

    return head;
  }

  /**
   * Label name for this filter pad.
   *
   * Used to reference this connection point in filter graph strings.
   * For example, "[in]" or "[video_out]".
   *
   * Direct mapping to AVFilterInOut->name.
   */
  get name(): string | null {
    return this.native.name;
  }

  set name(value: string | null) {
    this.native.name = value;
  }

  /**
   * Filter context this pad belongs to.
   *
   * Reference to the filter instance containing this pad.
   *
   * Direct mapping to AVFilterInOut->filter_ctx.
   */
  get filterCtx(): FilterContext | null {
    const native = this.native.filterCtx;
    return native ? new FilterContext(native) : null;
  }

  set filterCtx(value: FilterContext | null) {
    this.native.filterCtx = value ? value.getNative() : null;
  }

  /**
   * Pad index within the filter.
   *
   * Index of the input or output pad in the filter context.
   * 0 for the first pad, 1 for the second, etc.
   *
   * Direct mapping to AVFilterInOut->pad_idx.
   */
  get padIdx(): number {
    return this.native.padIdx;
  }

  set padIdx(value: number) {
    this.native.padIdx = value;
  }

  /**
   * Next node in the linked list.
   *
   * Reference to the next FilterInOut in the chain, or null for the last node.
   *
   * Direct mapping to AVFilterInOut->next.
   */
  get next(): FilterInOut | null {
    const native = this.native.next;
    if (!native) {
      return null;
    }

    const filterInOut = Object.create(FilterInOut.prototype) as FilterInOut;
    (filterInOut as any).native = native;
    return filterInOut;
  }

  set next(value: FilterInOut | null) {
    this.native.next = value ? value.getNative() : null;
  }

  /**
   * Allocate a FilterInOut structure.
   *
   * Allocates memory for the structure. Must be called before using
   * a manually created instance.
   *
   * Direct mapping to avfilter_inout_alloc().
   *
   * @throws {Error} If allocation fails (ENOMEM)
   *
   * @example
   * ```typescript
   * const inout = new FilterInOut();
   * inout.alloc();
   * inout.name = 'input';
   * inout.filterCtx = bufferSource;
   * inout.padIdx = 0;
   * ```
   *
   * @see {@link free} To deallocate
   * @see {@link createList} For automatic allocation
   */
  alloc(): void {
    this.native.alloc();
  }

  /**
   * Free the FilterInOut structure.
   *
   * Deallocates the structure and breaks the chain if part of a linked list.
   * Only frees this node, not the entire list.
   *
   * Direct mapping to avfilter_inout_free().
   *
   * @example
   * ```typescript
   * inout.free();
   * // Structure is now invalid
   * ```
   *
   * @see {@link alloc} To allocate
   * @see {@link Symbol.dispose} For automatic cleanup
   */
  free(): void {
    this.native.free();
  }

  /**
   * Count nodes in the linked list.
   *
   * Counts the total number of nodes starting from this node
   * and following the next pointers.
   *
   * @returns Number of nodes in the list (including this one)
   *
   * @example
   * ```typescript
   * const list = FilterInOut.createList([
   *   { name: 'in1', filterCtx: filter1, padIdx: 0 },
   *   { name: 'in2', filterCtx: filter2, padIdx: 0 },
   *   { name: 'in3', filterCtx: filter3, padIdx: 0 }
   * ]);
   *
   * console.log(`List has ${list.count()} nodes`); // 3
   * ```
   */
  count(): number {
    let count = 1;
    let current: FilterInOut | null = this.next;

    while (current) {
      count++;
      current = current.next;
    }

    return count;
  }

  /**
   * Get the underlying native FilterInOut object.
   *
   * @returns The native FilterInOut binding object
   *
   * @internal
   */
  getNative(): NativeFilterInOut {
    return this.native;
  }

  /**
   * Dispose of the FilterInOut structure.
   *
   * Implements the Disposable interface for automatic cleanup.
   * Equivalent to calling free().
   *
   * @example
   * ```typescript
   * {
   *   using inout = new FilterInOut();
   *   inout.alloc();
   *   inout.name = 'test';
   *   // Use inout...
   * } // Automatically freed when leaving scope
   * ```
   */
  [Symbol.dispose](): void {
    this.native[Symbol.dispose]();
  }
}
