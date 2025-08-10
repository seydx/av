/**
 * Field order utilities for FFmpeg
 * Provides interlacing field order definitions and utilities
 */

import { AV_FIELD_BB, AV_FIELD_BT, AV_FIELD_PROGRESSIVE, AV_FIELD_TB, AV_FIELD_TT, AV_FIELD_UNKNOWN } from './constants.js';

import type { AVFieldOrder } from './constants.js';

/**
 * Field Order utilities
 */
export class FieldOrder {
  /**
   * Get field order name
   * @param order Field order
   * @returns Field order name
   */
  static getName(order: AVFieldOrder): string {
    switch (order) {
      case AV_FIELD_UNKNOWN:
        return 'unknown';
      case AV_FIELD_PROGRESSIVE:
        return 'progressive';
      case AV_FIELD_TT:
        return 'top first, top displayed first';
      case AV_FIELD_BB:
        return 'bottom first, bottom displayed first';
      case AV_FIELD_TB:
        return 'top first, bottom displayed first';
      case AV_FIELD_BT:
        return 'bottom first, top displayed first';
      default:
        return 'unknown';
    }
  }

  /**
   * Get short field order name
   * @param order Field order
   * @returns Short field order name
   */
  static getShortName(order: AVFieldOrder): string {
    switch (order) {
      case AV_FIELD_UNKNOWN:
        return 'unknown';
      case AV_FIELD_PROGRESSIVE:
        return 'progressive';
      case AV_FIELD_TT:
        return 'tff';
      case AV_FIELD_BB:
        return 'bff';
      case AV_FIELD_TB:
        return 'tb';
      case AV_FIELD_BT:
        return 'bt';
      default:
        return 'unknown';
    }
  }

  /**
   * Check if field order is progressive (non-interlaced)
   * @param order Field order
   * @returns True if progressive
   */
  static isProgressive(order: AVFieldOrder): boolean {
    return order === AV_FIELD_PROGRESSIVE;
  }

  /**
   * Check if field order is interlaced
   * @param order Field order
   * @returns True if interlaced
   */
  static isInterlaced(order: AVFieldOrder): boolean {
    return order !== AV_FIELD_PROGRESSIVE && order !== AV_FIELD_UNKNOWN;
  }

  /**
   * Check if top field is first
   * @param order Field order
   * @returns True if top field first
   */
  static isTopFieldFirst(order: AVFieldOrder): boolean {
    return order === AV_FIELD_TT || order === AV_FIELD_TB;
  }

  /**
   * Check if bottom field is first
   * @param order Field order
   * @returns True if bottom field first
   */
  static isBottomFieldFirst(order: AVFieldOrder): boolean {
    return order === AV_FIELD_BB || order === AV_FIELD_BT;
  }

  /**
   * Parse field order from string
   * @param str Field order string
   * @returns Field order value
   */
  static fromString(str: string): AVFieldOrder {
    switch (str.toLowerCase()) {
      case 'progressive':
      case 'prog':
      case 'p':
        return AV_FIELD_PROGRESSIVE;
      case 'tff':
      case 'tt':
      case 'top':
        return AV_FIELD_TT;
      case 'bff':
      case 'bb':
      case 'bottom':
        return AV_FIELD_BB;
      case 'tb':
        return AV_FIELD_TB;
      case 'bt':
        return AV_FIELD_BT;
      default:
        return AV_FIELD_UNKNOWN;
    }
  }
}
