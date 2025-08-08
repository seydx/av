import { bindings } from './binding.js';

/**
 * AVFilter wrapper - represents a filter that can be used in a filter graph
 */
export class Filter {
  private filter: any;

  constructor(filter: any) {
    this.filter = filter;
  }

  /**
   * Find a filter by name
   */
  static findByName(name: string): Filter | null {
    const filter = bindings.Filter.findByName(name);
    return filter ? new Filter(filter) : null;
  }

  /**
   * Get all available filters
   */
  static getAll(): Filter[] {
    return bindings.Filter.getAll().map((f: any) => new Filter(f));
  }

  /**
   * Get filter name
   */
  get name(): string {
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
   */
  get nbInputs(): number {
    return this.filter.nbInputs;
  }

  /**
   * Get number of outputs
   */
  get nbOutputs(): number {
    return this.filter.nbOutputs;
  }

  /**
   * Get native filter object
   */
  get native(): any {
    return this.filter;
  }
}
