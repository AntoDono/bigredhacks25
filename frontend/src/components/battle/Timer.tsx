import { Card, CardContent } from "@/components/ui/card";
import { Clock, Trophy, AlertTriangle } from "lucide-react";

interface TimerProps {
  timeLeft: number;
  isActive: boolean;
  gameEnded: boolean;
  playerWon?: boolean;
}

const Timer = ({ timeLeft, isActive, gameEnded, playerWon }: TimerProps) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerClass = () => {
    if (gameEnded) return '';
    if (timeLeft <= 10) return 'timer-danger';
    if (timeLeft <= 30) return 'timer-warning';
    return '';
  };

  const getStatusColor = () => {
    if (gameEnded) {
      return playerWon ? 'text-success' : 'text-destructive';
    }
    if (timeLeft <= 10) return 'text-destructive';
    if (timeLeft <= 30) return 'text-warning';
    return 'text-primary';
  };

  const getStatusIcon = () => {
    if (gameEnded) {
      return playerWon ? <Trophy className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />;
    }
    return <Clock className="w-6 h-6" />;
  };

  const getStatusText = () => {
    if (gameEnded) {
      return playerWon ? '¡Ganaste! (You Won!)' : '¡Tiempo Agotado! (Time\'s Up!)';
    }
    return isActive ? 'Battle in Progress' : 'Battle Paused';
  };

  return (
    <Card className="p-4">
      <CardContent className="p-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`${getStatusColor()} transition-colors`}>
              {getStatusIcon()}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Battle Status</p>
              <p className={`font-semibold ${getStatusColor()}`}>
                {getStatusText()}
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-sm text-muted-foreground">Time Remaining</p>
            <div className={`text-3xl font-bold font-mono ${getTimerClass()} ${getStatusColor()}`}>
              {formatTime(timeLeft)}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 w-full bg-muted rounded-full h-2 overflow-hidden">
          <div
            className={`
              h-full transition-all duration-1000 ease-linear
              ${timeLeft <= 10 ? 'bg-destructive' : timeLeft <= 30 ? 'bg-warning' : 'bg-primary'}
            `}
            style={{ width: `${(timeLeft / 60) * 100}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default Timer;