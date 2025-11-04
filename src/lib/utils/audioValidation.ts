/**
 * AudioFileValidator - Centralized audio file validation logic
 *
 * Provides validation for audio files used in transcription services.
 * Handles both File and Blob objects with consistent validation rules.
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export class AudioFileValidator {
  private static readonly MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
  private static readonly SUPPORTED_FORMATS = [
    "audio/flac",
    "audio/mp3",
    "audio/mpeg",
    "audio/mp4",
    "audio/m4a",
    "audio/ogg",
    "audio/wav",
    "audio/webm",
  ];

  /**
   * Validates an audio file or blob
   * @param file - File or Blob to validate
   * @returns ValidationResult with valid status and optional error message
   */
  static validate(file: File | Blob): ValidationResult {
    // Check size
    if (file.size > this.MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `File too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Maximum size: 25MB`,
      };
    }

    // Check format (skip if no type provided)
    if (file.type && !this.isSupportedFormat(file.type)) {
      return {
        valid: false,
        error: `Unsupported audio format: ${file.type}. Supported formats: ${this.SUPPORTED_FORMATS.join(", ")}`,
      };
    }

    return { valid: true };
  }

  /**
   * Checks if the MIME type is supported
   * @param mimeType - MIME type to check
   * @returns true if supported, false otherwise
   */
  private static isSupportedFormat(mimeType: string): boolean {
    return this.SUPPORTED_FORMATS.some(
      (format) => mimeType.startsWith(format) || mimeType.includes(format)
    );
  }

  /**
   * Gets the maximum allowed file size in bytes
   */
  static getMaxFileSize(): number {
    return this.MAX_FILE_SIZE;
  }

  /**
   * Gets the list of supported formats
   */
  static getSupportedFormats(): readonly string[] {
    return this.SUPPORTED_FORMATS;
  }
}
