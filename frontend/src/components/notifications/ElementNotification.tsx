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
        px-3 py-2 shadow-lg border min-w-[250px] max-w-[320px]
        ${isOwnDiscovery 
          ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800' 
          : 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800'
        }
      `}>
        <div className="flex items-center gap-2">
          {/* Icon */}
          <div className={`
            flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center
            ${isOwnDiscovery 
              ? 'bg-green-100 dark:bg-green-900' 
              : 'bg-blue-100 dark:bg-blue-900'
            }
          `}>
            <Sparkles className={`w-3.5 h-3.5 ${
              isOwnDiscovery ? 'text-green-600' : 'text-blue-600'
            }`} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* New Element - Main content in one line */}
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-lg">{emoji}</span>
              <span className="font-bold text-sm text-foreground">{element}</span>
              <span className={`text-xs font-medium ${
                isOwnDiscovery ? 'text-green-700 dark:text-green-300' : 'text-blue-700 dark:text-blue-300'
              }`}>
                {isOwnDiscovery ? 'discovered!' : `by ${playerName}`}
              </span>
            </div>

            {/* Combination */}
            {combination && (
              <div className="text-xs text-muted-foreground">
                <Plus className="w-2.5 h-2.5 inline mr-1" />
                {combination}
              </div>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-1.5 w-full h-0.5 bg-muted rounded-full overflow-hidden">
          <div 
            className={`h-full ${
              isOwnDiscovery ? 'bg-green-500' : 'bg-blue-500'
            }`}
            style={{
              animation: `shrinkWidth ${duration}ms linear forwards`,
              width: '100%'
            }}
          />
        </div>
      </Card>

      <style>{`
        @keyframes shrinkWidth {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
};

export default ElementNotification;
