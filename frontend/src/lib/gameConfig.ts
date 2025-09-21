/**
 * Global Game Configuration
 * 
 * This file contains all configurable game parameters that can be easily adjusted.
 */

export const GAME_CONFIG = {
  // Timer Settings (in seconds)
  BATTLE_DURATION: 120, // 2 minutes - main game timer
  
  // Speech Recognition Settings
  SPEECH_SUCCESS_AUTO_CLOSE_DELAY: 1000, // 1 second delay before auto-closing modal
  
  // Audio Settings
  AUDIO_PLAYBACK_VOLUME: 0.5, // Volume for element audio playback
  AUTO_PLAY_DELAY: 200, // Delay before auto-playing pronunciation audio
  
  // UI Settings
  ELEMENT_NOTIFICATION_DURATION: 4000, // 4 seconds
  TOAST_DURATION: 3000, // 3 seconds
  
  // Element Settings
  MAX_DISCOVERIES: 100, // Maximum number of discoveries to track
  INITIAL_ELEMENTS_COUNT: 9, // Number of starting elements
} as const;

// Helper function to get battle duration in minutes for display
export const getBattleDurationMinutes = () => Math.floor(GAME_CONFIG.BATTLE_DURATION / 60);

// Helper function to format time for display
export const formatGameTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};
