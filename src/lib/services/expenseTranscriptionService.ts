import type {
  TranscribeTaskResponseDTO,
  TranscribeTaskStatusDTO,
  TranscriptionErrorDTO,
} from "../../types";

/**
 * Service for handling expense transcription API calls
 *
 * Provides functions for uploading audio files and polling transcription task status.
 */

/**
 * Uploads audio file for transcription processing
 *
 * @param audioBlob - The audio blob to transcribe
 * @param groupId - ID of the group context for transcription
 * @returns Promise resolving to transcription task response
 * @throws Error if upload fails or validation errors occur
 */
export async function uploadAudioForTranscription(
  audioBlob: Blob,
  groupId: string
): Promise<TranscribeTaskResponseDTO> {
  // Validate input parameters
  if (!audioBlob) {
    throw new Error('Audio blob is required');
  }

  if (!groupId) {
    throw new Error('Group ID is required');
  }

  // Validate file size (25MB limit as per API spec)
  const maxSize = 25 * 1024 * 1024; // 25MB
  if (audioBlob.size > maxSize) {
    throw new Error('Audio file too large. Maximum size: 25MB');
  }

  // Validate MIME type
  const validMimeTypes = ['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/wav', 'audio/ogg'];
  if (!validMimeTypes.some(type => audioBlob.type.startsWith(type.split('/')[0]))) {
    throw new Error('Invalid audio format. Supported formats: webm, mp4, mpeg, wav, ogg');
  }

  try {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    formData.append('group_id', groupId);

    const response = await fetch('/api/expenses/transcribe', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      let errorMessage = 'Upload failed';

      if (response.status === 400) {
        errorMessage = 'Invalid request data';
      } else if (response.status === 401) {
        errorMessage = 'Authentication required';
      } else if (response.status === 403) {
        errorMessage = 'Access forbidden';
      } else if (response.status === 413) {
        errorMessage = 'File too large';
      } else if (response.status === 503) {
        errorMessage = 'Transcription service unavailable';
      } else if (response.status >= 500) {
        errorMessage = 'Server error occurred';
      }

      // Try to parse error details from response
      try {
        const errorData = await response.json();
        if (errorData.error?.message) {
          errorMessage = errorData.error.message;
        }
      } catch {
        // Ignore JSON parsing errors
      }

      throw new Error(errorMessage);
    }

    const data: TranscribeTaskResponseDTO = await response.json();
    return data;

  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Unknown upload error occurred');
  }
}

/**
 * Polls the status of a transcription task
 *
 * @param taskId - ID of the transcription task to check
 * @returns Promise resolving to transcription task status
 * @throws Error if polling fails or task not found
 */
export async function getTranscriptionTaskStatus(
  taskId: string
): Promise<TranscribeTaskStatusDTO> {
  // Validate input parameters
  if (!taskId) {
    throw new Error('Task ID is required');
  }

  try {
    const response = await fetch(`/api/expenses/transcribe/${taskId}`);

    if (!response.ok) {
      let errorMessage = 'Failed to get task status';

      if (response.status === 401) {
        errorMessage = 'Authentication required';
      } else if (response.status === 404) {
        errorMessage = 'Transcription task not found';
      } else if (response.status >= 500) {
        errorMessage = 'Server error occurred';
      }

      // Try to parse error details from response
      try {
        const errorData = await response.json();
        if (errorData.error?.message) {
          errorMessage = errorData.error.message;
        }
      } catch {
        // Ignore JSON parsing errors
      }

      throw new Error(errorMessage);
    }

    const data: TranscribeTaskStatusDTO = await response.json();
    return data;

  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Unknown error occurred while checking task status');
  }
}

/**
 * Creates a transcription error object from API error response
 *
 * @param apiError - Error response from API
 * @returns TranscriptionErrorDTO
 */
export function createTranscriptionError(apiError: any): TranscriptionErrorDTO {
  if (apiError?.code && apiError?.message) {
    return {
      code: apiError.code,
      message: apiError.message,
    };
  }

  return {
    code: 'UNKNOWN_ERROR',
    message: apiError?.message || 'Unknown transcription error occurred',
  };
}
