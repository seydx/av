/**
 * Chroma location utilities for FFmpeg
 * Provides chroma sample location definitions
 */

import {
  type AVChromaLocation,
  AV_CHROMA_LOCATION_BOTTOM,
  AV_CHROMA_LOCATION_BOTTOMLEFT,
  AV_CHROMA_LOCATION_CENTER,
  AV_CHROMA_LOCATION_LEFT,
  AV_CHROMA_LOCATION_NB,
  AV_CHROMA_LOCATION_TOP,
  AV_CHROMA_LOCATION_TOPLEFT,
  AV_CHROMA_LOCATION_UNSPECIFIED,
} from './constants.js';

/**
 * Chroma location utilities
 */
export class ChromaLocation {
  /**
   * Get chroma location name
   * @param location Chroma location
   * @returns Chroma location name
   */
  static getName(location: AVChromaLocation): string {
    switch (location) {
      case AV_CHROMA_LOCATION_UNSPECIFIED:
        return 'unspecified';
      case AV_CHROMA_LOCATION_LEFT:
        return 'left';
      case AV_CHROMA_LOCATION_CENTER:
        return 'center';
      case AV_CHROMA_LOCATION_TOPLEFT:
        return 'topleft';
      case AV_CHROMA_LOCATION_TOP:
        return 'top';
      case AV_CHROMA_LOCATION_BOTTOMLEFT:
        return 'bottomleft';
      case AV_CHROMA_LOCATION_BOTTOM:
        return 'bottom';
      case AV_CHROMA_LOCATION_NB:
        return 'nb';
      default:
        return 'unknown';
    }
  }

  /**
   * Get description of chroma location
   * @param location Chroma location
   * @returns Chroma location description
   */
  static getDescription(location: AVChromaLocation): string {
    switch (location) {
      case AV_CHROMA_LOCATION_UNSPECIFIED:
        return 'Unspecified (MPEG-1/JPEG/H.261)';
      case AV_CHROMA_LOCATION_LEFT:
        return 'Left (MPEG-2/MPEG-4 4:2:0)';
      case AV_CHROMA_LOCATION_CENTER:
        return 'Center (MPEG-1 4:2:0)';
      case AV_CHROMA_LOCATION_TOPLEFT:
        return 'Top-left (ITU-R 601/DV 4:1:1)';
      case AV_CHROMA_LOCATION_TOP:
        return 'Top';
      case AV_CHROMA_LOCATION_BOTTOMLEFT:
        return 'Bottom-left';
      case AV_CHROMA_LOCATION_BOTTOM:
        return 'Bottom';
      default:
        return 'Unknown chroma location';
    }
  }

  /**
   * Check if chroma location is unspecified
   * @param location Chroma location
   * @returns True if unspecified
   */
  static isUnspecified(location: AVChromaLocation): boolean {
    return location === AV_CHROMA_LOCATION_UNSPECIFIED;
  }

  /**
   * Check if chroma location is cosited (same position as luma)
   * @param location Chroma location
   * @returns True if cosited
   */
  static isCosited(location: AVChromaLocation): boolean {
    return location === AV_CHROMA_LOCATION_TOPLEFT || location === AV_CHROMA_LOCATION_LEFT;
  }

  /**
   * Check if chroma location is centered
   * @param location Chroma location
   * @returns True if centered
   */
  static isCentered(location: AVChromaLocation): boolean {
    return location === AV_CHROMA_LOCATION_CENTER;
  }

  /**
   * Parse chroma location from string
   * @param str Chroma location string
   * @returns Chroma location value
   */
  static fromString(str: string): AVChromaLocation {
    switch (str.toLowerCase()) {
      case 'unspecified':
      case 'unknown':
        return AV_CHROMA_LOCATION_UNSPECIFIED;
      case 'left':
      case 'mpeg2':
        return AV_CHROMA_LOCATION_LEFT;
      case 'center':
      case 'mpeg1':
        return AV_CHROMA_LOCATION_CENTER;
      case 'topleft':
      case 'dv':
        return AV_CHROMA_LOCATION_TOPLEFT;
      case 'top':
        return AV_CHROMA_LOCATION_TOP;
      case 'bottomleft':
        return AV_CHROMA_LOCATION_BOTTOMLEFT;
      case 'bottom':
        return AV_CHROMA_LOCATION_BOTTOM;
      default:
        return AV_CHROMA_LOCATION_UNSPECIFIED;
    }
  }

  /**
   * Get the count of chroma locations
   * @returns Number of chroma locations
   */
  static getCount(): number {
    return AV_CHROMA_LOCATION_NB;
  }
}
