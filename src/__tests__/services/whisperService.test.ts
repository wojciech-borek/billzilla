import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  WhisperService,
  WhisperConfigurationError,
  InvalidAudioFileError,
  WhisperApiError,
  WhisperNetworkError,
  InvalidTranscriptionError,
} from "../../lib/services/whisperService";
import type { WhisperTranscriptionResponse } from "../../types";

// Helper functions for common test patterns
const createTestAudioBlob = (type = "audio/wav", size = 1024 * 1024) => {
  const blob = new Blob(["test audio data"], { type });
  Object.defineProperty(blob, "size", { value: size });
  return blob;
};

const setupServiceWithApiKey = (apiKey = "test-api-key") => {
  (import.meta.env as Record<string, unknown>).OPENAI_API_KEY = apiKey;
  return new WhisperService();
};

const mockFetchResponse = (response: Response) => {
  (global.fetch as vi.MockedFunction<typeof fetch>).mockResolvedValueOnce(response);
};

const createMockApiErrorResponse = (status = 400, message = "Bad Request") => ({
  ok: false,
  status,
  statusText: "Bad Request",
  json: () => Promise.resolve({ error: { message } }),
});

const createMockSuccessResponse = (data: any) => ({
  ok: true,
  json: () => Promise.resolve(data),
});

// Mock environment variables
const originalEnv = { ...import.meta.env };

describe("WhisperService", () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
    vi.restoreAllMocks();

    // Reset environment variables
    (import.meta.env as any).OPENAI_API_KEY = originalEnv.OPENAI_API_KEY;
  });

  afterEach(() => {
    // Restore original environment after each test
    (import.meta.env as any).OPENAI_API_KEY = originalEnv.OPENAI_API_KEY;
  });

  describe("Constructor", () => {
    it("should initialize successfully when API key provided in config", () => {
      // Arrange
      const config = { apiKey: "test-api-key" };
      (import.meta.env as any).OPENAI_API_KEY = undefined;

      // Act
      const service = new WhisperService(config);

      // Assert
      expect(service).toBeInstanceOf(WhisperService);
    });

    it("should initialize successfully when API key provided in environment", () => {
      // Arrange
      const config = {};
      (import.meta.env as any).OPENAI_API_KEY = "env-api-key";

      // Act
      const service = new WhisperService(config);

      // Assert
      expect(service).toBeInstanceOf(WhisperService);
    });

    it("should throw WhisperConfigurationError when no API key available", () => {
      // Arrange
      const config = {};
      const originalApiKey = (import.meta.env as any).OPENAI_API_KEY;
      delete (import.meta.env as any).OPENAI_API_KEY;

      try {
        // Act & Assert
        expect(() => {
          new WhisperService(config);
        }).toThrow(WhisperConfigurationError);

        expect(() => {
          new WhisperService(config);
        }).toThrow("OPENAI_API_KEY is not set in environment variables.");
      } finally {
        // Cleanup
        (import.meta.env as any).OPENAI_API_KEY = originalApiKey;
      }
    });
  });

  describe("Audio Validation", () => {
    let service: WhisperService;

    beforeEach(() => {
      service = setupServiceWithApiKey();
    });

    it("should pass validation when audio file valid", () => {
      // Arrange
      const audioBlob = createTestAudioBlob();

      // Act & Assert
      expect(() => {
        (service as any).validateAudioFile(audioBlob);
      }).not.toThrow();
    });

    it("should throw InvalidAudioFileError when file too large", () => {
      // Arrange
      const audioBlob = createTestAudioBlob("audio/wav", 30 * 1024 * 1024); // 30MB

      // Act & Assert
      expect(() => {
        (service as any).validateAudioFile(audioBlob);
      }).toThrow(InvalidAudioFileError);
      expect(() => {
        (service as any).validateAudioFile(audioBlob);
      }).toThrow(/Audio file too large.*25MB.*30\.00MB/);
    });

    it("should throw InvalidAudioFileError when unsupported format", () => {
      // Arrange
      const audioBlob = createTestAudioBlob("audio/aac");

      // Act & Assert
      expect(() => {
        (service as any).validateAudioFile(audioBlob);
      }).toThrow(InvalidAudioFileError);
      expect(() => {
        (service as any).validateAudioFile(audioBlob);
      }).toThrow(/Unsupported audio format.*audio\/aac/);
    });

    it("should pass validation when supported format variations", () => {
      // Arrange
      const supportedFormats = ["audio/mpeg", "audio/mp3", "audio/wav;codecs=opus"];

      // Act & Assert
      supportedFormats.forEach((format) => {
        const result = (service as any).isSupportedFormat(format);
        expect(result).toBe(true);
      });
    });
  });

  describe("Data Preparation", () => {
    let service: WhisperService;

    beforeEach(() => {
      service = setupServiceWithApiKey();
    });

    it("should create correct FormData with basic params", () => {
      // Arrange
      const audioBlob = createTestAudioBlob();
      const params = { audioBlob };

      // Act
      const formData = (service as any).prepareFormData(params);

      // Assert
      expect(formData).toBeInstanceOf(FormData);
      expect(formData.get("file")).toBeInstanceOf(Blob);
      expect(formData.get("model")).toBe("whisper-1");
      expect(formData.get("response_format")).toBe("json");
    });

    it("should include optional language parameter when provided", () => {
      // Arrange
      const audioBlob = createTestAudioBlob();
      const params = { audioBlob, language: "pl" };

      // Act
      const formData = (service as any).prepareFormData(params);

      // Assert
      expect(formData.get("language")).toBe("pl");
    });

    it("should include optional prompt parameter when provided", () => {
      // Arrange
      const audioBlob = createTestAudioBlob();
      const params = { audioBlob, prompt: "Transkrypcja paragonu fiskalnego" };

      // Act
      const formData = (service as any).prepareFormData(params);

      // Assert
      expect(formData.get("prompt")).toBe("Transkrypcja paragonu fiskalnego");
    });

    it("should use correct file extension for different formats", () => {
      // Arrange
      const testCases = [
        { mimeType: "audio/mp3", expectedExtension: "mp3" },
        { mimeType: "audio/wav", expectedExtension: "wav" },
        { mimeType: "audio/ogg", expectedExtension: "ogg" },
        { mimeType: "audio/mpeg", expectedExtension: "mp3" },
        { mimeType: "audio/flac", expectedExtension: "flac" },
        { mimeType: "unknown/format", expectedExtension: "webm" }, // Default case
      ];

      // Act & Assert
      testCases.forEach(({ mimeType, expectedExtension }) => {
        const result = (service as any).getFileExtension(mimeType);
        expect(result).toBe(expectedExtension);
      });
    });
  });

  describe("API Requests", () => {
    let service: WhisperService;

    beforeEach(() => {
      service = setupServiceWithApiKey();
      // Mock fetch globally
      global.fetch = vi.fn();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("should return successful response when api call succeeds", async () => {
      // Arrange
      const mockResponse = {
        text: "Hello world",
        language: "en",
        duration: 2.5,
      };
      const formData = new FormData();

      mockFetchResponse(createMockSuccessResponse(mockResponse));

      // Act
      const result = await (service as any).makeApiRequest(formData);

      // Assert
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.openai.com/v1/audio/transcriptions",
        expect.objectContaining({
          method: "POST",
          headers: {
            Authorization: "Bearer test-api-key",
          },
          body: formData,
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it("should throw WhisperApiError when api returns error status", async () => {
      // Arrange
      const formData = new FormData();
      const errorMessage = "Bad Request: Invalid file format";

      // Test error type
      mockFetchResponse(createMockApiErrorResponse(400, errorMessage));
      await expect((service as any).makeApiRequest(formData)).rejects.toThrow(WhisperApiError);

      // Test error message
      mockFetchResponse(createMockApiErrorResponse(400, errorMessage));
      await expect((service as any).makeApiRequest(formData)).rejects.toThrow(errorMessage);

      // Test error properties
      mockFetchResponse(createMockApiErrorResponse(400, errorMessage));
      try {
        await (service as any).makeApiRequest(formData);
      } catch (error) {
        expect(error).toBeInstanceOf(WhisperApiError);
        expect((error as any).status).toBe(400);
        expect((error as any).apiMessage).toBe(errorMessage);
      }
    });

    it("should throw WhisperNetworkError when fetch fails", async () => {
      // Arrange
      const formData = new FormData();
      const networkError = new Error("Network request failed");

      // Test error type
      (global.fetch as any).mockRejectedValueOnce(networkError);
      await expect((service as any).makeApiRequest(formData)).rejects.toThrow(WhisperNetworkError);

      // Test error message
      (global.fetch as any).mockRejectedValueOnce(networkError);
      await expect((service as any).makeApiRequest(formData)).rejects.toThrow(
        "Failed to connect to OpenAI Whisper API: Network request failed"
      );
    });
  });

  describe("Response Parsing", () => {
    let service: WhisperService;

    beforeEach(() => {
      service = setupServiceWithApiKey();
    });

    it("should return valid TranscriptionResult when response complete", () => {
      // Arrange
      const apiResponse: WhisperTranscriptionResponse = {
        text: "Hello world, this is a test transcription",
        language: "pl",
        duration: 3.45,
      };

      // Act
      const result = (service as any).parseTranscriptionResponse(apiResponse);

      // Assert
      expect(result).toEqual({
        text: "Hello world, this is a test transcription",
        language: "pl",
        duration: 3.45,
      });
      expect(result).toHaveProperty("text");
      expect(result).toHaveProperty("language");
      expect(result).toHaveProperty("duration");
    });

    it("should throw InvalidTranscriptionError when text missing", () => {
      // Arrange
      const apiResponse: Partial<WhisperTranscriptionResponse> = {
        language: "pl",
        duration: 3.45,
        // Missing text field
      };

      // Act & Assert
      expect(() => {
        (service as any).parseTranscriptionResponse(apiResponse);
      }).toThrow(InvalidTranscriptionError);
      expect(() => {
        (service as any).parseTranscriptionResponse(apiResponse);
      }).toThrow("Invalid API response: missing or invalid text field");
    });

    it("should throw InvalidTranscriptionError when text empty after trim", () => {
      // Arrange
      const apiResponse: WhisperTranscriptionResponse = {
        text: "   \n\t  ", // Only whitespace characters
        language: "pl",
        duration: 3.45,
      };

      // Act & Assert
      expect(() => {
        (service as any).parseTranscriptionResponse(apiResponse);
      }).toThrow(InvalidTranscriptionError);
      expect(() => {
        (service as any).parseTranscriptionResponse(apiResponse);
      }).toThrow("Transcription resulted in empty text");
    });
  });

  describe("Main Method - transcribeAudio", () => {
    let service: WhisperService;

    beforeEach(() => {
      service = setupServiceWithApiKey();
    });

    it("should return transcription successfully when all steps succeed", async () => {
      // Arrange
      const audioBlob = createTestAudioBlob();
      const params = { audioBlob };
      const mockResponse = {
        text: "Test transcription",
        language: "pl",
        duration: 2.5,
      };

      // Mock all internal methods
      vi.spyOn(service as any, "validateAudioFile").mockImplementation(() => undefined);
      vi.spyOn(service as any, "prepareFormData").mockReturnValue(new FormData());
      vi.spyOn(service as any, "makeApiRequest").mockResolvedValue(mockResponse);
      vi.spyOn(service as any, "parseTranscriptionResponse").mockReturnValue(mockResponse);

      // Act
      const result = await service.transcribeAudio(params);

      // Assert
      expect(result).toEqual(mockResponse);
      expect((service as any).validateAudioFile).toHaveBeenCalledWith(audioBlob);
      expect((service as any).prepareFormData).toHaveBeenCalledWith(params);
      expect((service as any).makeApiRequest).toHaveBeenCalled();
      expect((service as any).parseTranscriptionResponse).toHaveBeenCalledWith(mockResponse);
    });

    it("should rethrow InvalidAudioFileError from validation", async () => {
      // Arrange
      const audioBlob = createTestAudioBlob();
      const params = { audioBlob };
      const validationError = new InvalidAudioFileError("File too large");

      // Test error type
      vi.spyOn(service as any, "validateAudioFile").mockImplementation(() => {
        throw validationError;
      });
      await expect(service.transcribeAudio(params)).rejects.toThrow(InvalidAudioFileError);

      // Test error message
      const service2 = setupServiceWithApiKey();
      vi.spyOn(service2 as any, "validateAudioFile").mockImplementation(() => {
        throw validationError;
      });
      await expect(service2.transcribeAudio(params)).rejects.toThrow("File too large");
    });

    it("should rethrow WhisperApiError from api request", async () => {
      // Arrange
      const audioBlob = createTestAudioBlob();
      const params = { audioBlob };
      const apiError = new WhisperApiError(400, "Bad Request");

      // Test error type
      vi.spyOn(service as any, "validateAudioFile").mockImplementation(() => undefined);
      vi.spyOn(service as any, "prepareFormData").mockReturnValue(new FormData());
      vi.spyOn(service as any, "makeApiRequest").mockRejectedValue(apiError);
      await expect(service.transcribeAudio(params)).rejects.toThrow(WhisperApiError);

      // Test error message
      const service2 = setupServiceWithApiKey();
      vi.spyOn(service2 as any, "validateAudioFile").mockImplementation(() => undefined);
      vi.spyOn(service2 as any, "prepareFormData").mockReturnValue(new FormData());
      vi.spyOn(service2 as any, "makeApiRequest").mockRejectedValue(apiError);
      await expect(service2.transcribeAudio(params)).rejects.toThrow("Bad Request");
    });

    it("should wrap unexpected errors in generic Error", async () => {
      // Arrange
      const audioBlob = createTestAudioBlob();
      const params = { audioBlob };
      const unexpectedError = "String error";

      // Test error type
      vi.spyOn(service as any, "validateAudioFile").mockImplementation(() => {
        throw unexpectedError;
      });
      await expect(service.transcribeAudio(params)).rejects.toThrow(Error);

      // Test error message
      const service2 = setupServiceWithApiKey();
      vi.spyOn(service2 as any, "validateAudioFile").mockImplementation(() => {
        throw unexpectedError;
      });
      await expect(service2.transcribeAudio(params)).rejects.toThrow(
        "Unexpected error in WhisperService: String error"
      );
    });
  });

  describe("Error Classes", () => {
    it("should create WhisperConfigurationError with message", () => {
      // Arrange & Act
      const error = new WhisperConfigurationError("Test config error");

      // Assert
      expect(error).toBeInstanceOf(WhisperConfigurationError);
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe("Test config error");
      expect(error.name).toBe("WhisperConfigurationError");
    });

    it("should create WhisperApiError with status and message", () => {
      // Arrange & Act
      const error = new WhisperApiError(400, "Bad Request Error");

      // Assert
      expect(error).toBeInstanceOf(WhisperApiError);
      expect(error).toBeInstanceOf(Error);
      expect(error.status).toBe(400);
      expect(error.apiMessage).toBe("Bad Request Error");
      expect(error.message).toBe("OpenAI Whisper API Error (400): Bad Request Error");
      expect(error.name).toBe("WhisperApiError");
    });

    it("should create WhisperNetworkError with message", () => {
      // Arrange & Act
      const error = new WhisperNetworkError("Network timeout");

      // Assert
      expect(error).toBeInstanceOf(WhisperNetworkError);
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe("Network timeout");
      expect(error.name).toBe("WhisperNetworkError");
    });

    it("should create InvalidAudioFileError with message", () => {
      // Arrange & Act
      const error = new InvalidAudioFileError("Unsupported format");

      // Assert
      expect(error).toBeInstanceOf(InvalidAudioFileError);
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe("Unsupported format");
      expect(error.name).toBe("InvalidAudioFileError");
    });

    it("should create InvalidTranscriptionError with message", () => {
      // Arrange & Act
      const error = new InvalidTranscriptionError("Empty transcription");

      // Assert
      expect(error).toBeInstanceOf(InvalidTranscriptionError);
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe("Empty transcription");
      expect(error.name).toBe("InvalidTranscriptionError");
    });
  });
});
