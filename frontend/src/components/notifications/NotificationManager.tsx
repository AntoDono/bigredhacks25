import { useState, useCallback } from "react";
import ElementNotification from "./ElementNotification";

interface ElementNotificationData {
  id: string;
  element: string;
  emoji: string;
  combination?: string;
  playerName?: string;
  isOwnDiscovery?: boolean;
}

interface NotificationManagerProps {
  children?: React.ReactNode;
}

const NotificationManager = ({ children }: NotificationManagerProps) => {
  const [notifications, setNotifications] = useState<ElementNotificationData[]>([]);

  const showElementNotification = useCallback((data: Omit<ElementNotificationData, 'id'>) => {
    const id = `notification-${Date.now()}-${Math.random()}`;
    const notification = { ...data, id };
    
    setNotifications(prev => [...prev, notification]);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  return (
    <>
      {children}
      
      {/* Render notifications */}
      <div className="fixed top-4 right-4 z-40 space-y-2">
        {notifications.map((notification, index) => (
          <div
            key={notification.id}
            style={{ 
              transform: `translateY(${index * 10}px)`,
              zIndex: 40 - index 
            }}
          >
            <ElementNotification
              show={true}
              element={notification.element}
              emoji={notification.emoji}
              combination={notification.combination}
              playerName={notification.playerName}
              isOwnDiscovery={notification.isOwnDiscovery}
              onClose={() => removeNotification(notification.id)}
            />
          </div>
        ))}
      </div>
    </>
  );
};

export { NotificationManager, type ElementNotificationData };
export const useNotificationManager = () => {
  // This would normally use React Context, but for simplicity we'll expose via a global
  return {
    showElementNotification: (window as any).__showElementNotification
  };
};
