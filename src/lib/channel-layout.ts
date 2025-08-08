/**
 * Channel layout utilities for FFmpeg
 * Provides audio channel layout definitions and helpers
 */

/**
 * Common channel layouts
 * These are commonly used channel configurations in audio processing
 */
export class ChannelLayoutUtils {
  /**
   * Get channel count for common layout names
   * @param layout Layout name
   * @returns Number of channels or 0 if unknown
   */
  static getChannelCount(layout: string): number {
    switch (layout.toLowerCase()) {
      case 'mono':
        return 1;
      case 'stereo':
        return 2;
      case '2.1':
      case '2point1':
        return 3;
      case '3.0':
      case 'surround':
        return 3;
      case '3.1':
      case '3point1':
        return 4;
      case '4.0':
      case '4point0':
      case 'quad':
        return 4;
      case '4.1':
      case '4point1':
        return 5;
      case '5.0':
      case '5point0':
        return 5;
      case '5.1':
      case '5point1':
        return 6;
      case '6.0':
      case '6point0':
      case 'hexagonal':
        return 6;
      case '6.1':
      case '6point1':
        return 7;
      case '7.0':
      case '7point0':
        return 7;
      case '7.1':
      case '7point1':
        return 8;
      case '7.1.2':
      case '7point1point2':
        return 10;
      case '7.1.4':
      case '7point1point4':
        return 12;
      case '22.2':
      case '22point2':
        return 24;
      case 'octagonal':
        return 8;
      case 'hexadecagonal':
        return 16;
      default:
        return 0;
    }
  }

  /**
   * Get layout name from channel count
   * @param channels Number of channels
   * @returns Common layout name or custom string
   */
  static getLayoutName(channels: number): string {
    switch (channels) {
      case 1:
        return 'mono';
      case 2:
        return 'stereo';
      case 3:
        return '2.1';
      case 4:
        return '4.0';
      case 5:
        return '5.0';
      case 6:
        return '5.1';
      case 7:
        return '6.1';
      case 8:
        return '7.1';
      default:
        return `${channels}ch`;
    }
  }

  /**
   * Check if layout is mono
   * @param layout Layout name or channel count
   * @returns True if mono
   */
  static isMono(layout: string | number): boolean {
    if (typeof layout === 'number') {
      return layout === 1;
    }
    return layout.toLowerCase() === 'mono';
  }

  /**
   * Check if layout is stereo
   * @param layout Layout name or channel count
   * @returns True if stereo
   */
  static isStereo(layout: string | number): boolean {
    if (typeof layout === 'number') {
      return layout === 2;
    }
    return layout.toLowerCase() === 'stereo';
  }

  /**
   * Check if layout has subwoofer/LFE channel
   * @param layout Layout name
   * @returns True if has LFE
   */
  static hasLFE(layout: string): boolean {
    const lower = layout.toLowerCase();
    return lower.includes('.1') || lower.includes('point1') || lower.includes('.2') || lower.includes('point2') || lower.includes('.4') || lower.includes('point4');
  }

  /**
   * Check if layout is surround sound
   * @param layout Layout name or channel count
   * @returns True if surround
   */
  static isSurround(layout: string | number): boolean {
    if (typeof layout === 'number') {
      return layout > 2;
    }
    const count = this.getChannelCount(layout);
    return count > 2;
  }

  /**
   * Get human-readable description for layout
   * @param layout Layout name
   * @returns Description string
   */
  static getDescription(layout: string): string {
    switch (layout.toLowerCase()) {
      case 'mono':
        return 'Mono (1 channel)';
      case 'stereo':
        return 'Stereo (2 channels: L, R)';
      case '2.1':
      case '2point1':
        return '2.1 (3 channels: L, R, LFE)';
      case '3.0':
      case 'surround':
        return '3.0 Surround (3 channels: L, R, C)';
      case '3.1':
      case '3point1':
        return '3.1 Surround (4 channels: L, R, C, LFE)';
      case '4.0':
      case '4point0':
      case 'quad':
        return '4.0 Quad (4 channels: L, R, SL, SR)';
      case '4.1':
      case '4point1':
        return '4.1 Surround (5 channels: L, R, C, LFE, BC)';
      case '5.0':
      case '5point0':
        return '5.0 Surround (5 channels: L, R, C, SL, SR)';
      case '5.1':
      case '5point1':
        return '5.1 Surround (6 channels: L, R, C, LFE, SL, SR)';
      case '6.0':
      case '6point0':
        return '6.0 Surround (6 channels: L, R, C, BC, SL, SR)';
      case '6.1':
      case '6point1':
        return '6.1 Surround (7 channels: L, R, C, LFE, BC, SL, SR)';
      case '7.0':
      case '7point0':
        return '7.0 Surround (7 channels: L, R, C, SL, SR, BL, BR)';
      case '7.1':
      case '7point1':
        return '7.1 Surround (8 channels: L, R, C, LFE, SL, SR, BL, BR)';
      case '7.1.2':
      case '7point1point2':
        return '7.1.2 Atmos (10 channels with 2 height speakers)';
      case '7.1.4':
      case '7point1point4':
        return '7.1.4 Atmos (12 channels with 4 height speakers)';
      case '22.2':
      case '22point2':
        return '22.2 (24 channels for ultra-high-definition audio)';
      default:
        const count = this.getChannelCount(layout);
        if (count > 0) {
          return `${layout} (${count} channels)`;
        }
        return layout;
    }
  }

  /**
   * Convert layout to FFmpeg channel layout string
   * @param layout Layout name
   * @returns FFmpeg layout string
   */
  static toFFmpegString(layout: string): string {
    switch (layout.toLowerCase()) {
      case 'mono':
        return 'mono';
      case 'stereo':
        return 'stereo';
      case '2.1':
      case '2point1':
        return '2.1';
      case '3.0':
      case 'surround':
        return '3.0';
      case '3.1':
      case '3point1':
        return '3.1';
      case '4.0':
      case '4point0':
        return '4.0';
      case 'quad':
        return 'quad';
      case '4.1':
      case '4point1':
        return '4.1';
      case '5.0':
      case '5point0':
        return '5.0';
      case '5.1':
      case '5point1':
        return '5.1';
      case '6.0':
      case '6point0':
        return '6.0';
      case '6.1':
      case '6point1':
        return '6.1';
      case '7.0':
      case '7point0':
        return '7.0';
      case '7.1':
      case '7point1':
        return '7.1';
      default:
        return layout;
    }
  }

  /**
   * Parse channel layout from various formats
   * @param input Layout string, channel count, or mask
   * @returns Normalized layout name
   */
  static parse(input: string | number): string {
    if (typeof input === 'number') {
      return this.getLayoutName(input);
    }

    // Try to match common patterns
    const lower = input.toLowerCase().trim();

    // Handle "X channels" format
    const channelMatch = /(\d+)\s*ch(?:annels?)?/.exec(lower);
    if (channelMatch) {
      const count = parseInt(channelMatch[1], 10);
      return this.getLayoutName(count);
    }

    // Handle "X.Y" format
    const dotMatch = /(\d+)\.(\d+)/.exec(lower);
    if (dotMatch) {
      return `${dotMatch[1]}.${dotMatch[2]}`;
    }

    // Try to get channel count and convert
    const count = this.getChannelCount(lower);
    if (count > 0) {
      return lower;
    }

    return input;
  }
}
