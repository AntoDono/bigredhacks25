import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Play audio from base64 encoded data
 * @param base64Audio - Base64 encoded audio data
 * @param volume - Volume level (0-1)
 */
export async function playBase64Audio(base64Audio: string, volume: number = 0.7): Promise<void> {
  try {
    if (!base64Audio) return;
    
    // Create audio context if not available
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Convert base64 to array buffer
    const binaryString = window.atob(base64Audio);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Decode audio data
    const audioBuffer = await audioContext.decodeAudioData(bytes.buffer);
    
    // Create audio source
    const source = audioContext.createBufferSource();
    const gainNode = audioContext.createGain();
    
    source.buffer = audioBuffer;
    gainNode.gain.value = volume;
    
    // Connect and play
    source.connect(gainNode);
    gainNode.connect(audioContext.destination);
    source.start();
    
  } catch (error) {
    console.error('Error playing audio:', error);
    // Fallback to simpler method
    try {
      const audio = new Audio(`data:audio/mp3;base64,${base64Audio}`);
      audio.volume = volume;
      await audio.play();
    } catch (fallbackError) {
      console.error('Fallback audio play failed:', fallbackError);
    }
  }
}
