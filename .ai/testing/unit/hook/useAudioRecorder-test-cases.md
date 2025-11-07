# Test Cases for useAudioRecorder Hook

## Initial State Tests

### UT-USE_AUDIO_RECORDER-001

**Nazwa testu**: should_initialize_with_default_state_when_hook_is_created  
**Moduł / funkcja**: useAudioRecorder - initial state  
**Cel testu**: Verify hook initializes with correct default state  
**Wejście / dane testowe**: No input parameters  
**Setup / izolacja**: Render hook in test environment, mock navigator.mediaDevices  
**Kroki testowe (Arrange → Act → Assert)**:

1. Arrange: Create hook instance with default setup
2. Act: Access hook return values immediately
3. Assert: Check isRecording=false, duration=0, audioBlob=null, error=null  
   **Oczekiwany rezultat**: Hook returns correct initial state values  
   **Priorytet**: High  
   **Edge cases**: N/A  
   **Notatki / uwagi**: Base test for ensuring proper initialization

### UT-USE_AUDIO_RECORDER-002

**Nazwa testu**: should_expose_all_required_methods_and_state_properties  
**Moduł / funkcja**: useAudioRecorder - hook interface  
**Cel testu**: Verify hook exposes all expected methods and state properties  
**Wejście / dane testowe**: No input parameters  
**Setup / izolacja**: Render hook and inspect returned object  
**Kroki testowe (Arrange → Act → Assert)**:

1. Arrange: Create hook instance
2. Act: Destructure all return values
3. Assert: Verify presence of isRecording, duration, audioBlob, error, startRecording, stopRecording, cancelRecording, reset  
   **Oczekiwany rezultat**: All expected properties and methods are available  
   **Priorytet**: High  
   **Edge cases**: N/A  
   **Notatki / uwagi**: Ensures API contract is maintained

## startRecording Success Path Tests

### UT-USE_AUDIO_RECORDER-003

**Nazwa testu**: should_successfully_start_recording_when_permissions_granted  
**Moduł / funkcja**: useAudioRecorder - startRecording success  
**Cel testu**: Verify successful recording start with proper permissions  
**Wejście / dane testowe**: Mock stream object, mock MediaRecorder  
**Setup / izolacja**: Mock navigator.mediaDevices.getUserMedia, MediaRecorder constructor and methods  
**Kroki testowe (Arrange → Act → Assert)**:

1. Arrange: Setup mocks for successful permission grant and MediaRecorder creation
2. Act: Call startRecording()
3. Assert: Verify isRecording=true, duration=0, audioBlob=null, error=null, MediaRecorder.start called  
   **Oczekiwany rezultat**: Recording starts successfully, state updates correctly  
   **Priorytet**: High  
   **Edge cases**: N/A  
   **Notatki / uwagi**: Core functionality test

### UT-USE_AUDIO_RECORDER-004

**Nazwa testu**: should_configure_media_recorder_with_correct_audio_constraints  
**Moduł / funkcja**: useAudioRecorder - startRecording configuration  
**Cel testu**: Verify MediaRecorder is created with proper audio settings  
**Wejście / dane testowe**: Mock stream, MediaRecorder constructor spy  
**Setup / izolacja**: Mock getUserMedia with audio constraints  
**Kroki testowe (Arrange → Act → Assert)**:

1. Arrange: Setup MediaRecorder constructor mock
2. Act: Call startRecording()
3. Assert: Verify MediaRecorder created with echoCancellation=true, noiseSuppression=true, autoGainControl=true  
   **Oczekiwany rezultat**: Audio constraints are properly applied  
   **Priorytet**: Medium  
   **Edge cases**: N/A  
   **Notatki / uwagi**: Ensures audio quality settings are correct

### UT-USE_AUDIO_RECORDER-005

**Nazwa testu**: should_prefer_webm_format_when_supported  
**Moduł / funkcja**: useAudioRecorder - startRecording mimeType  
**Cel testu**: Verify correct mimeType selection for MediaRecorder  
**Wejście / dane testowe**: Mock MediaRecorder.isTypeSupported  
**Setup / izolacja**: Mock isTypeSupported to return true for webm, false for mp4  
**Kroki testowe (Arrange → Act → Assert)**:

1. Arrange: Setup isTypeSupported mock for webm support
2. Act: Call startRecording()
3. Assert: Verify MediaRecorder created with mimeType="audio/webm"  
   **Oczekiwany rezultat**: Preferred format is selected when available  
   **Priorytet**: Medium  
   **Edge cases**: Browser fallback to mp4  
   **Notatki / uwagi**: Tests format selection logic

### UT-USE_AUDIO_RECORDER-006

**Nazwa testu**: should_start_duration_timer_when_recording_begins  
**Moduł / funkcja**: useAudioRecorder - startRecording timer  
**Cel testu**: Verify duration timer starts and increments properly  
**Wejście / dane testowe**: Mock timers  
**Setup / izolacja**: Mock setInterval, advance timers in test  
**Kroki testowe (Arrange → Act → Assert)**:

1. Arrange: Setup timer mocks and successful recording start
2. Act: Call startRecording() and advance time by 3 seconds
3. Assert: Verify setInterval called, duration increments to 3  
   **Oczekiwany rezultat**: Duration timer works correctly during recording  
   **Priorytet**: High  
   **Edge cases**: Timer cleanup on stop/cancel  
   **Notatki / uwagi**: Critical for UI feedback

## startRecording Error Handling Tests

### UT-USE_AUDIO_RECORDER-007

**Nazwa testu**: should_handle_permission_denied_error_gracefully  
**Moduł / funkcja**: useAudioRecorder - startRecording permission error  
**Cel testu**: Verify proper error handling when microphone permission is denied  
**Wejście / dane testowe**: Mock getUserMedia throwing NotAllowedError  
**Setup / izolacja**: Mock navigator.mediaDevices.getUserMedia to reject with permission error  
**Kroki testowe (Arrange → Act → Assert)**:

1. Arrange: Setup getUserMedia to throw NotAllowedError
2. Act: Call startRecording() and catch error
3. Assert: Verify error state contains Polish message about microphone access, error is thrown  
   **Oczekiwany rezultat**: User-friendly error message displayed, error propagated  
   **Priorytet**: High  
   **Edge cases**: N/A  
   **Notatki / uwagi**: Common error scenario

### UT-USE_AUDIO_RECORDER-008

**Nazwa testu**: should_handle_no_microphone_found_error  
**Moduł / funkcja**: useAudioRecorder - startRecording device error  
**Cel testu**: Verify error handling when no microphone is available  
**Wejście / dane testowe**: Mock getUserMedia throwing NotFoundError  
**Setup / izolacja**: Mock getUserMedia to reject with NotFoundError  
**Kroki testowe (Arrange → Act → Assert)**:

1. Arrange: Setup getUserMedia to throw NotFoundError
2. Act: Call startRecording() and catch error
3. Assert: Verify error state contains message about checking device connection  
   **Oczekiwany rezultat**: Appropriate error message for missing microphone  
   **Priorytet**: Medium  
   **Edge cases**: N/A  
   **Notatki / uwagi**: Hardware-related error

### UT-USE_AUDIO_RECORDER-009

**Nazwa testu**: should_handle_unsupported_browser_error  
**Moduł / funkcja**: useAudioRecorder - startRecording browser support  
**Cel testu**: Verify error handling when MediaRecorder is not supported  
**Wejście / dane testowe**: Mock getUserMedia throwing NotSupportedError  
**Setup / izolacja**: Mock getUserMedia to reject with NotSupportedError  
**Kroki testowe (Arrange → Act → Assert)**:

1. Arrange: Setup getUserMedia to throw NotSupportedError
2. Act: Call startRecording() and catch error
3. Assert: Verify error state contains message about browser not supporting audio recording  
   **Oczekiwany rezultat**: Clear error message for unsupported browsers  
   **Priorytet**: Medium  
   **Edge cases**: N/A  
   **Notatki / uwagi**: Browser compatibility issue

### UT-USE_AUDIO_RECORDER-010

**Nazwa testu**: should_handle_generic_microphone_access_error  
**Moduł / funkcja**: useAudioRecorder - startRecording generic error  
**Cel testu**: Verify fallback error handling for unknown microphone errors  
**Wejście / dane testowe**: Mock getUserMedia throwing generic Error  
**Setup / izolacja**: Mock getUserMedia to reject with unknown error  
**Kroki testowe (Arrange → Act → Assert)**:

1. Arrange: Setup getUserMedia to throw generic error
2. Act: Call startRecording() and catch error
3. Assert: Verify error state contains generic microphone access message  
   **Oczekiwany rezultat**: Fallback error message for unexpected errors  
   **Priorytet**: Low  
   **Edge cases**: N/A  
   **Notatki / uwagi**: Safety net for unknown errors

## stopRecording Tests

### UT-USE_AUDIO_RECORDER-011

**Nazwa testu**: should_successfully_stop_recording_and_return_audio_blob  
**Moduł / funkcja**: useAudioRecorder - stopRecording success  
**Cel testu**: Verify recording stops and returns audio data  
**Wejście / dane testowe**: Mock MediaRecorder, mock audio chunks  
**Setup / izolacja**: Start recording, setup mock chunks in chunksRef  
**Kroki testowe (Arrange → Act → Assert)**:

1. Arrange: Setup successful recording start with mock MediaRecorder
2. Act: Call stopRecording()
3. Assert: Verify MediaRecorder.stop called, promise resolves with Blob, state updates correctly  
   **Oczekiwany rezultat**: Recording stops and audio blob is returned  
   **Priorytet**: High  
   **Edge cases**: Empty chunks, different mimeTypes  
   **Notatki / uwagi**: Core stop functionality

### UT-USE_AUDIO_RECORDER-012

**Nazwa testu**: should_return_null_when_stopping_inactive_recorder  
**Moduł / funkcja**: useAudioRecorder - stopRecording inactive  
**Cel testu**: Verify behavior when stopping already stopped recorder  
**Wejście / dane testowe**: Inactive MediaRecorder  
**Setup / izolacja**: Call stopRecording without active recording  
**Kroki testowe (Arrange → Act → Assert)**:

1. Arrange: Ensure no active recording
2. Act: Call stopRecording()
3. Assert: Verify returns null immediately  
   **Oczekiwany rezultat**: Null returned for inactive recorder  
   **Priorytet**: Medium  
   **Edge cases**: N/A  
   **Notatki / uwagi**: Edge case handling

### UT-USE_AUDIO_RECORDER-013

**Nazwa testu**: should_cleanup_timer_when_recording_stops_normally  
**Moduł / funkcja**: useAudioRecorder - stopRecording cleanup  
**Cel testu**: Verify timer is cleared when recording ends  
**Wejście / dane testowe**: Active timer during recording  
**Setup / izolacja**: Start recording with active timer  
**Kroki testowe (Arrange → Act → Assert)**:

1. Arrange: Start recording with running timer
2. Act: Call stopRecording()
3. Assert: Verify clearInterval called on timer  
   **Oczekiwany rezultat**: Timer resources are cleaned up  
   **Priorytet**: Medium  
   **Edge cases**: Timer already cleared  
   **Notatki / uwagi**: Resource management

## cancelRecording Tests

### UT-USE_AUDIO_RECORDER-014

**Nazwa testu**: should_cancel_active_recording_and_reset_state  
**Moduł / funkcja**: useAudioRecorder - cancelRecording active  
**Cel testu**: Verify recording cancellation resets all state  
**Wejście / dane testowe**: Active recording session  
**Setup / izolacja**: Start recording then cancel  
**Kroki testowe (Arrange → Act → Assert)**:

1. Arrange: Start successful recording
2. Act: Call cancelRecording()
3. Assert: Verify MediaRecorder.stop called, state reset to initial values, chunks cleared  
   **Oczekiwany rezultat**: Recording cancelled, state fully reset  
   **Priorytet**: High  
   **Edge cases**: N/A  
   **Notatki / uwagi**: Core cancel functionality

### UT-USE_AUDIO_RECORDER-015

**Nazwa testu**: should_cleanup_timer_when_recording_cancelled  
**Moduł / funkcja**: useAudioRecorder - cancelRecording timer cleanup  
**Cel testu**: Verify timer cleanup during cancellation  
**Wejście / dane testowe**: Active timer during cancellation  
**Setup / izolacja**: Start recording with timer, then cancel  
**Kroki testowe (Arrange → Act → Assert)**:

1. Arrange: Start recording with active timer
2. Act: Call cancelRecording()
3. Assert: Verify clearInterval called, timer reference cleared  
   **Oczekiwany rezultat**: Timer resources properly cleaned up on cancel  
   **Priorytet**: Medium  
   **Edge cases**: Timer already null  
   **Notatki / uwagi**: Resource management during cancel

## reset Tests

### UT-USE_AUDIO_RECORDER-016

**Nazwa testu**: should_reset_hook_state_to_initial_values  
**Moduł / funkcja**: useAudioRecorder - reset functionality  
**Cel testu**: Verify reset method calls cancelRecording internally  
**Wejście / dane testowe**: Hook in any state  
**Setup / izolacja**: Mock cancelRecording, put hook in various states  
**Kroki testowe (Arrange → Act → Assert)**:

1. Arrange: Setup hook with mock cancelRecording
2. Act: Call reset()
3. Assert: Verify cancelRecording called  
   **Oczekiwany rezultat**: Reset delegates to cancelRecording  
   **Priorytet**: Medium  
   **Edge cases**: N/A  
   **Notatki / uwagi**: Simple delegation test

## State Management and Edge Cases

### UT-USE_AUDIO_RECORDER-017

**Nazwa testu**: should_prevent_multiple_simultaneous_recordings  
**Moduł / funkcja**: useAudioRecorder - concurrent recording prevention  
**Cel testu**: Verify only one recording session at a time  
**Wejście / dane testowe**: Multiple startRecording calls  
**Setup / izolacja**: Track MediaRecorder instances created  
**Kroki testowe (Arrange → Act → Assert)**:

1. Arrange: Start recording successfully
2. Act: Call startRecording() again while recording
3. Assert: Verify second call creates new MediaRecorder (needs investigation - current implementation may allow multiple)  
   **Oczekiwany rezultat**: Behavior clarified for concurrent calls  
   **Priorytet**: Medium  
   **Edge cases**: Race conditions  
   **Notatki / uwagi**: May need implementation adjustment

### UT-USE_AUDIO_RECORDER-018

**Nazwa testu**: should_handle_media_recorder_errors_during_recording  
**Moduł / funkcja**: useAudioRecorder - MediaRecorder error handling  
**Cel testu**: Verify error handling from MediaRecorder.onerror  
**Wejście / dane testowe**: MediaRecorder error event  
**Setup / izolacja**: Trigger MediaRecorder onerror during recording  
**Kroki testowe (Arrange → Act → Assert)**:

1. Arrange: Start recording, setup error trigger
2. Act: Simulate MediaRecorder error
3. Assert: Verify error state set, recording stopped, cleanup performed  
   **Oczekiwany rezultat**: MediaRecorder errors are handled gracefully  
   **Priorytet**: High  
   **Edge cases**: N/A  
   **Notatki / uwagi**: Runtime error handling

### UT-USE_AUDIO_RECORDER-019

**Nazwa testu**: should_properly_cleanup_media_stream_tracks  
**Moduł / funkcja**: useAudioRecorder - stream cleanup  
**Cel testu**: Verify microphone tracks are stopped to free resources  
**Wejście / dane testowe**: Mock media stream with tracks  
**Setup / izolacja**: Start recording with mock stream  
**Kroki testowe (Arrange → Act → Assert)**:

1. Arrange: Setup recording with mock stream containing audio tracks
2. Act: Stop or cancel recording
3. Assert: Verify track.stop() called on all tracks  
   **Oczekiwany rezultat**: Media resources are properly released  
   **Priorytet**: Medium  
   **Edge cases**: Multiple tracks, already stopped tracks  
   **Notatki / uwagi**: Resource leak prevention

### UT-USE_AUDIO_RECORDER-020

**Nazwa testu**: should_clear_audio_chunks_on_recording_cancel  
**Moduł / funkcja**: useAudioRecorder - chunks cleanup  
**Cel testu**: Verify audio data is cleared when recording is cancelled  
**Wejście / dane testowe**: Accumulated audio chunks during recording  
**Setup / izolacja**: Start recording, accumulate mock chunks  
**Kroki testowe (Arrange → Act → Assert)**:

1. Arrange: Start recording, add chunks to chunksRef
2. Act: Call cancelRecording()
3. Assert: Verify chunksRef.current is empty array  
   **Oczekiwany rezultat**: Audio data is discarded on cancel  
   **Priorytet**: Medium  
   **Edge cases**: N/A  
   **Notatki / uwagi**: Privacy/data cleanup

## Browser Compatibility Tests

### UT-USE_AUDIO_RECORDER-021

**Nazwa testu**: should_fallback_to_mp4_when_webm_not_supported  
**Moduł / funkcja**: useAudioRecorder - browser compatibility  
**Cel testu**: Verify fallback mimeType selection  
**Wejście / dane testowe**: Mock isTypeSupported returning false for webm  
**Setup / izolacja**: Configure MediaRecorder support mocks  
**Kroki testowe (Arrange → Act → Assert)**:

1. Arrange: Setup isTypeSupported to return false for webm, true for mp4
2. Act: Call startRecording()
3. Assert: Verify MediaRecorder created with mimeType="audio/mp4"  
   **Oczekiwany rezultat**: Fallback format works when preferred format unavailable  
   **Priorytet**: Low  
   **Edge cases**: No supported formats  
   **Notatki / uwagi**: Browser compatibility

### UT-USE_AUDIO_RECORDER-022

**Nazwa testu**: should_handle_data_collection_every_second  
**Moduł / funkcja**: useAudioRecorder - data collection timing  
**Cel testu**: Verify MediaRecorder data collection interval  
**Wejście / dane testowe**: Mock ondataavailable events  
**Setup / izolacja**: Start recording, simulate timed data events  
**Kroki testowe (Arrange → Act → Assert)**:

1. Arrange: Setup MediaRecorder with data collection
2. Act: Start recording and simulate data events
3. Assert: Verify start() called with 1000ms interval  
   **Oczekiwany rezultat**: Data collected at correct intervals  
   **Priorytet**: Low  
   **Edge cases**: N/A  
   **Notatki / uwagi**: Performance consideration
