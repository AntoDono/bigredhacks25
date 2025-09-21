import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mic, MicOff, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface MicrophonePermissionModalProps {
  isOpen: boolean;
  onPermissionGranted: () => void;
  onPermissionDenied: () => void;
  onContinueAnyway?: () => void;
}

const MicrophonePermissionModal = ({
  isOpen,
  onPermissionGranted,
  onPermissionDenied,
  onContinueAnyway
}: MicrophonePermissionModalProps) => {
  const [isRequesting, setIsRequesting] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<'idle' | 'granted' | 'denied'>('idle');

  const requestMicrophonePermission = async () => {
    setIsRequesting(true);
    setPermissionStatus('idle');

    try {
      console.log('🎤 Requesting microphone permission...');
      
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Microphone access not supported in this browser');
      }

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      console.log('🎤 Microphone permission granted!');
      setPermissionStatus('granted');
      
      // Stop the stream immediately as we just needed permission
      stream.getTracks().forEach(track => track.stop());
      
      toast.success('Microphone access granted! You can now participate in speech challenges.');
      
      // Close modal after a short delay to show success state
      setTimeout(() => {
        onPermissionGranted();
      }, 1500);
      
    } catch (error) {
      console.error('❌ Microphone permission denied:', error);
      setPermissionStatus('denied');
      
      let errorMessage = 'Microphone access is required for speech challenges.';
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Microphone access was denied. Please allow microphone access in your browser settings to participate in speech challenges.';
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'No microphone found. Please connect a microphone to participate in speech challenges.';
        } else if (error.name === 'NotSupportedError') {
          errorMessage = 'Microphone access is not supported in this browser.';
        }
      }
      
      toast.error(errorMessage);
      
      // Close modal after showing error
      setTimeout(() => {
        onPermissionDenied();
      }, 3000);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleRetry = () => {
    setPermissionStatus('idle');
    requestMicrophonePermission();
  };

  const handleSkip = () => {
    toast.warning('You can still play the game, but speech challenges will be disabled.');
    onPermissionDenied();
  };

  // Check if we can show a "Continue Anyway" option for users who want to try speech recognition later
  const handleContinueAnyway = () => {
    toast.info('You can try speech recognition later when you create new elements.');
    if (onContinueAnyway) {
      onContinueAnyway();
    } else {
      onPermissionDenied();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mic className="w-5 h-5" />
            Microphone Access Required
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Status Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                {permissionStatus === 'idle' && (
                  <>
                    <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                      <Mic className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Enable Microphone Access</h3>
                      <p className="text-sm text-muted-foreground mt-2">
                        Duelingo uses your microphone for pronunciation challenges during battles. 
                        This helps you learn correct pronunciation and compete effectively.
                      </p>
                    </div>
                  </>
                )}
                
                {permissionStatus === 'granted' && (
                  <>
                    <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-green-600 dark:text-green-400">
                        Microphone Access Granted!
                      </h3>
                      <p className="text-sm text-muted-foreground mt-2">
                        You're all set for speech challenges. Let's start the battle!
                      </p>
                    </div>
                  </>
                )}
                
                {permissionStatus === 'denied' && (
                  <>
                    <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                      <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">
                        Microphone Access Denied
                      </h3>
                      <p className="text-sm text-muted-foreground mt-2">
                        You can still play the game, but speech challenges will be disabled.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            {permissionStatus === 'idle' && (
              <Button 
                onClick={requestMicrophonePermission}
                disabled={isRequesting}
                className="w-full"
                size="lg"
              >
                {isRequesting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Requesting Access...
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4 mr-2" />
                    Allow Microphone Access
                  </>
                )}
              </Button>
            )}
            
            {permissionStatus === 'denied' && (
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <Button 
                    onClick={handleRetry}
                    variant="outline"
                    className="flex-1"
                  >
                    <Mic className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>
                  <Button 
                    onClick={handleSkip}
                    variant="secondary"
                    className="flex-1"
                  >
                    Continue Without Microphone
                  </Button>
                </div>
                <Button 
                  onClick={handleContinueAnyway}
                  variant="ghost"
                  className="w-full"
                >
                  Continue Anyway (Try Speech Later)
                </Button>
              </div>
            )}
          </div>

          {/* Help Text */}
          <div className="text-xs text-muted-foreground text-center space-y-1">
            <p>• Your microphone is only used for pronunciation challenges</p>
            <p>• Audio is processed locally and not stored</p>
            <p>• You can change this permission anytime in your browser settings</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MicrophonePermissionModal;
