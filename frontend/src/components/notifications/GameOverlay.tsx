import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Clock, Target, Sparkles, Crown } from "lucide-react";

interface GameOverlayProps {
  show: boolean;
  type: 'victory' | 'defeat' | 'timeup';
  title: string;
  message: string;
  targetElement?: string;
  winnerName?: string;
  isPlayerWinner?: boolean;
  onClose?: () => void;
  onViewStory?: () => void;
}

const GameOverlay = ({
  show,
  type,
  title,
  message,
  targetElement,
  winnerName,
  isPlayerWinner,
  onClose,
  onViewStory
}: GameOverlayProps) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      // Slight delay for animation
      setTimeout(() => setVisible(true), 100);
    } else {
      setVisible(false);
    }
  }, [show]);

  if (!show) return null;

  const getOverlayStyles = () => {
    switch (type) {
      case 'victory':
        return 'bg-gradient-to-br from-green-100 to-emerald-50 border-green-300 dark:from-green-900 dark:to-emerald-900 dark:border-green-600';
      case 'defeat':
        return 'bg-gradient-to-br from-red-100 to-rose-50 border-red-300 dark:from-red-900 dark:to-rose-900 dark:border-red-600';
      case 'timeup':
        return 'bg-gradient-to-br from-orange-100 to-amber-50 border-orange-300 dark:from-orange-900 dark:to-amber-900 dark:border-orange-600';
      default:
        return 'bg-gradient-to-br from-gray-100 to-slate-50 border-gray-300 dark:from-gray-900 dark:to-slate-900 dark:border-gray-600';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'victory':
        return <Trophy className="w-16 h-16 text-yellow-500 drop-shadow-lg" />;
      case 'defeat':
        return <Target className="w-16 h-16 text-red-500" />;
      case 'timeup':
        return <Clock className="w-16 h-16 text-orange-500" />;
      default:
        return <Sparkles className="w-16 h-16 text-gray-500" />;
    }
  };

  const getTitleColor = () => {
    switch (type) {
      case 'victory':
        return 'text-green-700 dark:text-green-400';
      case 'defeat':
        return 'text-red-700 dark:text-red-400';
      case 'timeup':
        return 'text-orange-700 dark:text-orange-400';
      default:
        return 'text-gray-700 dark:text-gray-400';
    }
  };

  return (
    <div className={`
      fixed inset-0 z-50 flex items-center justify-center p-4
      bg-black/50 backdrop-blur-sm
      transition-all duration-500 ease-out
      ${visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
    `}>
      <Card className={`
        w-full max-w-md mx-auto border-2 shadow-2xl relative
        transform transition-all duration-500 ease-out
        ${visible ? 'translate-y-0 scale-100' : 'translate-y-4 scale-95'}
        ${getOverlayStyles()}
        ${type === 'victory' ? 'shadow-green-200/50 dark:shadow-green-800/50' : ''}
      `}>
        <CardContent className="p-8 text-center space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            <div className={`${type === 'victory' ? 'animate-pulse' : 'animate-bounce'}`}>
              {getIcon()}
            </div>
          </div>

          {/* Victory Celebration */}
          {type === 'victory' && (
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
              <div className="absolute top-4 left-4 text-2xl animate-bounce delay-100">🎉</div>
              <div className="absolute top-8 right-8 text-2xl animate-bounce delay-200">🎊</div>
              <div className="absolute bottom-12 left-8 text-2xl animate-bounce delay-300">✨</div>
              <div className="absolute bottom-8 right-12 text-2xl animate-bounce delay-400">🌟</div>
              <div className="absolute top-16 left-1/2 text-xl animate-bounce delay-500">🎈</div>
              <div className="absolute bottom-20 right-1/3 text-xl animate-bounce delay-600">🏆</div>
            </div>
          )}

          {/* Title */}
          <div>
            <h1 className={`text-3xl font-bold mb-2 ${getTitleColor()}`}>
              {title}
            </h1>
            <p className="text-lg text-muted-foreground">
              {message}
            </p>
          </div>

          {/* Winner Info */}
          {winnerName && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Crown className="w-5 h-5 text-yellow-500" />
                <span className="font-semibold">Winner</span>
              </div>
              <p className="text-lg font-bold text-primary">{winnerName}</p>
            </div>
          )}

          {/* Target Element */}
          {targetElement && (
            <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
              <p className="text-sm text-muted-foreground mb-1">Target Element</p>
              <p className="font-bold text-primary text-lg">{targetElement}</p>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            
            {onViewStory && (
              <Button onClick={onViewStory} variant="outline" className="w-full">
                View Story
              </Button>
            )}
            
            {onClose && (
              <Button onClick={onClose} variant="ghost" className="w-full">
                Return to Lobby
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GameOverlay;
