import { useEffect, useState, useCallback } from 'react';
import { socketClient } from '@/lib/socket';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface UseSocketReturn {
  connected: boolean;
  joinRoom: (roomId: string, roomName?: string, roomDescription?: string) => void;
  createElement: (element1: string, element2: string) => void;
  startGame: () => void;
  currentRoom: any;
  roomError: string | null;
  onElementCreated: (callback: (elementData: any) => void) => void;
  onGameEvent: (callback: (eventData: any) => void) => void;
  offElementCreated: (callback: (elementData: any) => void) => void;
  offGameEvent: (callback: (eventData: any) => void) => void;
}

export const useSocket = (): UseSocketReturn => {
  const { token, isAuthenticated } = useAuth();
  const [connected, setConnected] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<any>(null);
  const [roomError, setRoomError] = useState<string | null>(null);

  // Connect socket when authenticated
  useEffect(() => {
    if (isAuthenticated && token) {
      socketClient.connect(token)
        .then(() => {
          setConnected(true);
          console.log('Socket connected successfully');
        })
        .catch((error) => {
          console.error('Failed to connect socket:', error);
          toast.error('Failed to connect to game server');
        });
    } else {
      socketClient.disconnect();
      setConnected(false);
      setCurrentRoom(null);
    }

    return () => {
      if (!isAuthenticated) {
        socketClient.disconnect();
      }
    };
  }, [isAuthenticated, token]);

  // Setup socket event listeners
  useEffect(() => {
    if (!connected) return;

    // Room events
    const handleRoomJoined = (data: any) => {
      console.log('Joined room:', data);
      setCurrentRoom(data.room);
      setRoomError(null);
      toast.success(data.message);
    };

    const handleRoomJoinError = (data: any) => {
      console.error('Room join error:', data);
      setRoomError(data.message);
      toast.error(data.message);
    };

    // Message events
    const handleMessageResponse = (data: any) => {
      console.log('Message response:', data);
      
      switch (data.type) {
        case 'create-element':
          if (data.success) {
            // Don't show toast here - let the Battle component handle it
            // Just trigger the element created callback
          } else {
            toast.error(data.message);
          }
          break;
        case 'start-game':
          if (data.success) {
            toast.success('Game started!');
          } else {
            toast.error(data.message);
          }
          break;
        case 'endgame':
          // Handle winner endgame event (sent via message_response to winner)
          console.log('Winner endgame event received:', data);
          setGameEvent(data);
          break;
        default:
          if (data.success) {
            toast.success(data.message);
          } else {
            toast.error(data.message);
          }
      }
    };

    const handleMessageBroadcast = (data: any) => {
      console.log('Message broadcast:', data);
      
      switch (data.type) {
        case 'player_joined':
          toast.info(data.data.message);
          // Update current room player count
          if (currentRoom) {
            setCurrentRoom(prev => ({
              ...prev,
              players: {
                ...prev.players,
                [data.data.userId]: {
                  name: data.data.userName,
                  joinedAt: new Date()
                }
              }
            }));
          }
          break;
        case 'player-discovered-element':
          toast.info(`${data.data.userName} discovered ${data.data.element}!`);
          break;
        case 'game-started':
          toast.success(data.data.message);
          // Update room status to active
          if (currentRoom) {
            setCurrentRoom(prev => ({
              ...prev,
              gameStatus: 'active',
              startedAt: data.data.startTime
            }));
          }
          break;
        case 'endgame':
          const winner = data.data.winner;
          toast.success(`Game ended! ${winner.userName} won by creating ${data.data.targetElement}!`);
          // Update room status to ended
          if (currentRoom) {
            setCurrentRoom(prev => ({
              ...prev,
              gameStatus: 'ended',
              winner: winner.userId,
              endedAt: data.data.gameEndTime
            }));
          }
          break;
        default:
          console.log('Unhandled broadcast:', data);
      }
    };

    const handleMessageError = (data: any) => {
      console.error('Message error:', data);
      toast.error(data.message);
    };

    const handlePlayerLeft = (data: any) => {
      console.log('Player left:', data);
      toast.info(`${data.userName} left the room`);
      // Update current room player count
      if (currentRoom) {
        setCurrentRoom(prev => {
          const newPlayers = { ...prev.players };
          delete newPlayers[data.userId];
          return {
            ...prev,
            players: newPlayers
          };
        });
      }
    };

    // Register event listeners
    socketClient.onRoomJoined(handleRoomJoined);
    socketClient.onRoomJoinError(handleRoomJoinError);
    socketClient.onMessageResponse(handleMessageResponse);
    socketClient.onMessageBroadcast(handleMessageBroadcast);
    socketClient.onMessageError(handleMessageError);
    socketClient.onPlayerLeft(handlePlayerLeft);

    // Cleanup function
    return () => {
      socketClient.off('room_joined', handleRoomJoined);
      socketClient.off('room_join_error', handleRoomJoinError);
      socketClient.off('message_response', handleMessageResponse);
      socketClient.off('message_broadcast', handleMessageBroadcast);
      socketClient.off('message_error', handleMessageError);
      socketClient.off('player_left', handlePlayerLeft);
    };
  }, [connected, currentRoom]);

  // Socket methods
  const joinRoom = useCallback((roomId: string, roomName?: string, roomDescription?: string) => {
    if (!connected) {
      toast.error('Not connected to game server');
      return;
    }
    
    setRoomError(null);
    socketClient.joinRoom({ roomId, roomName, roomDescription });
  }, [connected]);

  const createElement = useCallback((element1: string, element2: string) => {
    if (!connected) {
      toast.error('Not connected to game server');
      return;
    }
    
    socketClient.createElement(element1, element2);
  }, [connected]);

  const startGame = useCallback(() => {
    if (!connected) {
      toast.error('Not connected to game server');
      return;
    }
    
    socketClient.startGame();
  }, [connected]);

  // Callback functions for Battle component
  const onElementCreated = useCallback((callback: (elementData: any) => void) => {
    socketClient.instance?.on('message_response', (data: any) => {
      if (data.type === 'create-element' && data.success) {
        callback(data.data);
      } else if (data.type === 'endgame') {
        // Pass the entire endgame event to the callback
        callback(data);
      }
    });
  }, []);

  const onGameEvent = useCallback((callback: (eventData: any) => void) => {
    socketClient.instance?.on('message_broadcast', callback);
  }, []);

  const offElementCreated = useCallback((callback: (elementData: any) => void) => {
    socketClient.instance?.off('message_response', callback);
  }, []);

  const offGameEvent = useCallback((callback: (eventData: any) => void) => {
    socketClient.instance?.off('message_broadcast', callback);
  }, []);

  return {
    connected,
    joinRoom,
    createElement,
    startGame,
    currentRoom,
    roomError,
    onElementCreated,
    onGameEvent,
    offElementCreated,
    offGameEvent,
  };
};
