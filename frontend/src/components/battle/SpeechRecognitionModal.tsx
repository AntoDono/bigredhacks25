import React, { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mic, MicOff, Play, RefreshCw, Check, SkipForward } from "lucide-react";
import { toast } from "sonner";
import { GAME_CONFIG } from "@/lib/gameConfig";
import { api } from "@/lib/api";

// Custom DialogContent without close button
const DialogContentNoClose = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className,
      )}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
DialogContentNoClose.displayName = "DialogContentNoClose";

interface SpeechRecognitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  elementName: string;
  elementEmoji: string;
  groundTruthAudio: string; // base64 audio data
  language?: string; // language code (e.g., 'en', 'es', 'fr')
  context?: 'battle' | 'practice'; // context to determine auto-start behavior
}

const SpeechRecognitionModal = ({
  isOpen,
  onClose,
  onSuccess,
  elementName,
  elementEmoji,
  groundTruthAudio,
  language = 'en',
  context = 'practice'
}: SpeechRecognitionModalProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [matchPercentage, setMatchPercentage] = useState<number | null>(null);
  const [isPassed, setIsPassed] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [analysisDetails, setAnalysisDetails] = useState<{
    transcription?: string;
    transcriptionMatch?: boolean;
    spectral?: number;
    prosodic?: number;
    phonetic?: number;
    confidence?: number;
  } | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Auto-play ground truth audio when modal opens
  useEffect(() => {
    if (isOpen && groundTruthAudio) {
      // Play after a short delay to ensure modal is fully rendered
      const timer = setTimeout(() => {
        playGroundTruthAudio();
      }, GAME_CONFIG.AUTO_PLAY_DELAY);

      return () => clearTimeout(timer);
    }
  }, [isOpen, groundTruthAudio]);

  // Auto-start recording when in battle context
  useEffect(() => {
    if (isOpen && context === 'battle' && !isRecording && !recordedAudio) {
      console.log('🎯 Battle mode: Auto-starting recording in', GAME_CONFIG.AUTO_PLAY_DELAY + 2000, 'ms');
      // Start recording after ground truth audio plays and a short delay
      const timer = setTimeout(() => {
        console.log('🎯 Battle mode: Starting auto-recording now');
        startRecording();
      }, GAME_CONFIG.AUTO_PLAY_DELAY );

      return () => clearTimeout(timer);
    }
  }, [isOpen, context, isRecording, recordedAudio]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        
        if (isRecording) {
          // Stop recording and auto-check
          stopRecording();
        } else if (!isRecording && !isAnalyzing) {
          // Always start recording when not currently recording
          // This prioritizes new recordings over re-checking failed attempts
          startRecording();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isRecording, isAnalyzing]);

  const startRecording = async () => {
    console.log('🎤 startRecording called');
    try {
      console.log('🎤 Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('🎤 Microphone access granted, creating MediaRecorder...');
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const reader = new FileReader();
        reader.onload = () => {
          const base64Audio = (reader.result as string).split(',')[1];
          setRecordedAudio(base64Audio);
          
          // Auto-trigger analysis after a short delay
          setTimeout(() => {
            if (base64Audio && groundTruthAudio) {
              analyzeAudioWithData(groundTruthAudio, base64Audio);
            }
          }, GAME_CONFIG.AUTO_PLAY_DELAY);
        };
        reader.readAsDataURL(audioBlob);
        
        // Stop all audio tracks
        stream.getTracks().forEach(track => track.stop());
      };

      console.log('🎤 Starting MediaRecorder...');
      mediaRecorder.start();
      setIsRecording(true);
      setMatchPercentage(null);
      setIsPassed(false);
      console.log('🎤 Recording started successfully!');
      
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Failed to access microphone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const analyzeAudioWithData = async (gtAudio: string, recAudio: string) => {
    setIsAnalyzing(true);
    setAttempts(prev => prev + 1);

    try {
      // Call backend API for pronunciation analysis
      const result = await api.analyzePronunciation({
        groundTruthAudio: gtAudio,
        userAudio: recAudio,
        expectedText: elementName,
        language: language,
        context: context
      });

      console.log('Backend analysis result:', result);
      console.log('Context:', context);
      console.log('Overall similarity:', result.features?.overall);
      console.log('is_correct from backend:', result.is_correct);

      // Store the overall similarity score for display purposes
      const similarity = result.features?.overall || 0;
      setMatchPercentage(similarity);

      // Use the backend's is_correct determination based on context
      const isCorrect = result.is_correct || false;
      console.log('Final isCorrect value:', isCorrect);
      setIsPassed(isCorrect);

      // Store detailed analysis for display
      const details = {
        transcription: result.transcription,
        transcriptionMatch: isCorrect, // Use the backend's determination
        spectral: Math.round((result.features?.spectral || 0) * 100),
        prosodic: Math.round((result.features?.prosodic || 0) * 100),
        phonetic: Math.round((result.features?.phonetic || 0) * 100),
        confidence: Math.round(result.confidence * 100)
      };
      
      setAnalysisDetails(details);
      
      // Log detailed analysis
      console.log('Pronunciation Analysis:', {
        word: elementName,
        context: context,
        isCorrect: isCorrect,
        overall: Math.round(similarity * 100),
        ...details
      });

      if (isCorrect) {
        if (context === 'battle') {
          toast.success(`Great pronunciation! Similarity: ${Math.round(similarity * 100)}%`);
        } else {
          toast.success(`Perfect! You said "${result.transcription}" correctly!`);
        }
        
        setTimeout(() => {
          onSuccess();
          onClose(); // Auto-close the modal after success
        }, GAME_CONFIG.SPEECH_SUCCESS_AUTO_CLOSE_DELAY);
      } else {
        if (context === 'battle') {
          toast.error(`Pronunciation needs improvement. Similarity: ${Math.round(similarity * 100)}% (need 70%+)`);
        } else {
          const actualWord = result.transcription || 'nothing detected';
          toast.error(`You said "${actualWord}" but we need "${elementName}". Try again!`);
        }
      }

    } catch (error) {
      console.error('Audio analysis error:', error);
      toast.error('Failed to analyze audio - please try again');
      
      // No fallback threshold - just fail gracefully with 0% similarity
      setMatchPercentage(0);
      setIsPassed(false);
      
      // Set empty analysis details
      setAnalysisDetails({
        transcription: 'Error analyzing audio',
        transcriptionMatch: false,
        spectral: 0,
        prosodic: 0,
        phonetic: 0,
        confidence: 0
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzeAudio = async () => {
    if (!recordedAudio || !groundTruthAudio) {
      toast.error('Missing audio data for analysis');
      return;
    }

    await analyzeAudioWithData(groundTruthAudio, recordedAudio);
  };

  const playGroundTruthAudio = async () => {
    try {
      if (!groundTruthAudio) return;

      // Use simple Audio element for playback
      const audio = new Audio(`data:audio/mp3;base64,${groundTruthAudio}`);
      audio.volume = 0.7;
      await audio.play();
      
    } catch (error) {
      console.error('Error playing ground truth audio:', error);
      toast.error('Failed to play audio');
    }
  };

  const playRecordedAudio = async () => {
    if (!recordedAudio) return;
    
    try {
      const audio = new Audio(`data:audio/wav;base64,${recordedAudio}`);
      audio.volume = 0.7;
      await audio.play();
    } catch (error) {
      console.error('Error playing recorded audio:', error);
      toast.error('Failed to play recorded audio');
    }
  };

  const resetRecording = () => {
    setRecordedAudio(null);
    setMatchPercentage(null);
    setIsPassed(false);
    setAnalysisDetails(null);
  };

  const skipPronunciation = () => {
    toast.info(`Skipped pronunciation challenge for "${elementName}"`);
    onSuccess(); // Treat skip as success to continue the game
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}} modal={true}>
      <DialogContentNoClose className="sm:max-w-[500px]" onEscapeKeyDown={(e) => e.preventDefault()} onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">{elementEmoji}</span>
            Pronounce "{elementName}"
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Instructions */}
          <Card className="p-4 bg-blue-50 dark:bg-blue-950">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              The correct pronunciation will play automatically. {context === 'battle' 
                ? 'Recording will start automatically after the audio plays. ' 
                : 'Then record yourself saying '
              }"{elementName}". 
              Say the word clearly for speech recognition to detect it correctly.
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-300 mt-2 font-medium">
              💡 Press <kbd className="px-1 py-0.5 bg-blue-100 dark:bg-blue-800 rounded text-xs">Enter</kbd> to {context === 'battle' ? 'stop recording' : 'start/stop recording'}
            </p>
          </Card>

          {/* Ground Truth Audio */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Listen to correct pronunciation:</label>
            <Button
              onClick={playGroundTruthAudio}
              variant="outline"
              className="w-full"
            >
              <Play className="w-4 h-4 mr-2" />
              Replay Correct Pronunciation
            </Button>
          </div>

          {/* Recording Controls */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {context === 'battle' ? 'Recording automatically...' : 'Record your pronunciation:'}
            </label>
            <div className="flex gap-2">
              {context === 'practice' && !isRecording ? (
                <Button
                  onClick={startRecording}
                  className="flex-1"
                  variant={recordedAudio ? "outline" : "default"}
                >
                  <Mic className="w-4 h-4 mr-2" />
                  {recordedAudio ? "Record Again" : "Start Recording"}
                  <kbd className="ml-2 px-1 py-0.5 bg-white/20 rounded text-xs">Enter</kbd>
                </Button>
              ) : context === 'practice' && isRecording ? (
                <Button
                  onClick={stopRecording}
                  className="flex-1"
                  variant="destructive"
                >
                  <MicOff className="w-4 h-4 mr-2" />
                  Stop Recording & Check
                  <kbd className="ml-2 px-1 py-0.5 bg-white/20 rounded text-xs">Enter</kbd>
                </Button>
              ) : context === 'battle' && isRecording ? (
                <Button
                  onClick={stopRecording}
                  className="flex-1"
                  variant="destructive"
                >
                  <MicOff className="w-4 h-4 mr-2" />
                  Stop Recording & Check
                  <kbd className="ml-2 px-1 py-0.5 bg-white/20 rounded text-xs">Enter</kbd>
                </Button>
              ) : context === 'battle' && !isRecording && recordedAudio ? (
                <Button
                  onClick={startRecording}
                  className="flex-1"
                  variant="outline"
                >
                  <Mic className="w-4 h-4 mr-2" />
                  Record Again
                  <kbd className="ml-2 px-1 py-0.5 bg-white/20 rounded text-xs">Enter</kbd>
                </Button>
              ) : null}

              {recordedAudio && (
                <Button
                  onClick={playRecordedAudio}
                  variant="outline"
                  size="icon"
                >
                  <Play className="w-4 h-4" />
                </Button>
              )}

              {recordedAudio && context === 'practice' && (
                <Button
                  onClick={resetRecording}
                  variant="outline"
                  size="icon"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Analysis Button - Only show if we haven't analyzed yet */}
          {recordedAudio && matchPercentage === null && !isAnalyzing && (
            <Button
              onClick={analyzeAudio}
              disabled={isAnalyzing}
              className="w-full"
              variant="outline"
            >
              Check Pronunciation
            </Button>
          )}

          {/* Analysis Progress */}
          {isAnalyzing && (
            <div className="flex items-center justify-center gap-2 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
              <span className="text-sm text-blue-800 dark:text-blue-200">Analyzing pronunciation with ML models...</span>
            </div>
          )}

          {/* Results */}
          {matchPercentage !== null && analysisDetails && (
            <Card className={`p-4 ${isPassed ? 'bg-green-50 dark:bg-green-950' : 'bg-red-50 dark:bg-red-950'}`}>
              <div className="space-y-3">
                {/* Main Result */}
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className={`font-medium ${isPassed ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
                      {isPassed ? '✓ Pronunciation Accepted!' : '✗ Pronunciation Needs Improvement'}
                    </p>
                    <p className={`text-sm ${isPassed ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {isPassed 
                        ? (context === 'battle' ? 'Great job! Continuing automatically...' : 'Perfect! Continuing automatically...')
                        : (context === 'battle' ? 'Try speaking more clearly for better similarity.' : 'Try recording the word again clearly.')
                      }
                    </p>
                  </div>
                  
                  {/* Success icon or Skip button */}
                  {isPassed && (
                    <Check className="w-6 h-6 text-green-600" />
                  )}
                  
                  <Button
                    onClick={skipPronunciation}
                    variant="outline"
                    size="sm"
                    className="text-gray-600 hover:text-gray-800 border-gray-300 ml-3"
                  >
                    <SkipForward className="w-4 h-4 mr-2" />
                    Skip This Word
                  </Button>
                </div>

                {/* Transcription Details */}
                <div className="border-t pt-3">
                  <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {context === 'battle' ? 'Analysis Results:' : 'Speech Recognition:'}
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Expected: </span>
                    <span className="font-medium">{elementName}</span>
                  </div>
                  {context === 'practice' && (
                    <div className="text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Detected: </span>
                      <span className={`font-medium ${analysisDetails.transcriptionMatch ? 'text-green-600' : 'text-red-600'}`}>
                        {analysisDetails.transcription || 'No speech detected'}
                      </span>
                    </div>
                  )}
                  {context === 'battle' && (
                    <div className="text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Similarity: </span>
                      <span className={`font-medium ${isPassed ? 'text-green-600' : 'text-red-600'}`}>
                        {Math.round((matchPercentage || 0) * 100)}% {isPassed ? '(≥70%)' : '(<70%)'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Feature Analysis for Display */}
                <div className="border-t pt-3">
                  <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Audio Analysis:</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Spectral:</span>
                      <span>{analysisDetails.spectral}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Prosodic:</span>
                      <span>{analysisDetails.prosodic}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Phonetic:</span>
                      <span>{analysisDetails.phonetic}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Confidence:</span>
                      <span>{analysisDetails.confidence}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Attempt Counter */}
          {attempts > 0 && (
            <p className="text-sm text-muted-foreground text-center">
              Attempt {attempts} {attempts > 1 && "- Keep trying!"}
            </p>
          )}

        </div>
      </DialogContentNoClose>
    </Dialog>
  );
};

export default SpeechRecognitionModal;