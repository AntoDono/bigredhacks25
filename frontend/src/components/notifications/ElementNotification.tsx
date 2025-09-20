import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Sparkles, Plus } from "lucide-react";

interface ElementNotificationProps {
  show: boolean;
  element: string;
  emoji: string;
  combination?: string;
  playerName?: string;
  isOwnDiscovery?: boolean;
  duration?: number;
  onClose?: () => void;
}

const ElementNotification = ({
  show,
  element,
  emoji,
  combination,
  playerName,
  isOwnDiscovery = true,
  duration = 4000,
  onClose
}: ElementNotificationProps) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      
      // Auto hide after duration
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(() => onClose?.(), 300); // Allow fade out animation
      }, duration);

      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [show, duration, onClose]);

  if (!show) return null;

  return (
    <div className={`
      fixed top-4 right-4 z-40
      transform transition-all duration-300 ease-out
      ${visible ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-full opacity-0 scale-95'}
    `}>
      <Card className={`
        p-4 shadow-lg border-2 min-w-[280px] max-w-[350px]
        ${isOwnDiscovery 
          ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800' 
          : 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800'
        }
      `}>
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div className={`
            flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
            ${isOwnDiscovery 
              ? 'bg-green-100 dark:bg-green-900' 
              : 'bg-blue-100 dark:bg-blue-900'
            }
          `}>
            <Sparkles className={`w-5 h-5 ${
              isOwnDiscovery ? 'text-green-600' : 'text-blue-600'
            }`} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className={`text-sm font-medium ${
                isOwnDiscovery ? 'text-green-800 dark:text-green-200' : 'text-blue-800 dark:text-blue-200'
              }`}>
                {isOwnDiscovery ? 'You discovered!' : `${playerName} discovered!`}
              </p>
            </div>

            {/* New Element */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{emoji}</span>
              <span className="font-bold text-lg text-foreground">{element}</span>
            </div>

            {/* Combination */}
            {combination && (
              <div className="text-xs text-muted-foreground">
                <Plus className="w-3 h-3 inline mr-1" />
                {combination}
              </div>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 w-full h-1 bg-muted rounded-full overflow-hidden">
          <div 
            className={`h-full ${
              isOwnDiscovery ? 'bg-green-500' : 'bg-blue-500'
            } animate-shrink`}
            style={{
              animation: `shrink ${duration}ms linear forwards`
            }}
          />
        </div>
      </Card>

      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
        .animate-shrink {
          animation: shrink ${duration}ms linear forwards;
        }
      `}</style>
    </div>
  );
};

export default ElementNotification;
