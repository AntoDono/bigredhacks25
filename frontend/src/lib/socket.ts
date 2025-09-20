import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from './api';

// Socket event types
export interface SocketEvents {
  // Client to server
  'join_room': (data: { roomId: string; roomName?: string; roomDescription?: string; language?: string }) => void;
  'message': (data: { type: string; data: any }) => void;

  // Server to client
  'room_joined': (data: { success: boolean; roomId: string; room: any; message: string }) => void;
  'room_join_error': (data: { success: boolean; message: string; error: string }) => void;
  'room_left': (data: { success: boolean; message: string; error?: string }) => void;
  'message_response': (data: { type: string; success: boolean; message: string; data: any; error?: string }) => void;
  'message_broadcast': (data: { type: string; data: any }) => void;
  'message_error': (data: { success: boolean; message: string; originalMessage: any; error?: string }) => void;
  'player_left': (data: { userId: string; userName: string; playersCount: number }) => void;
}

export interface CreateElementData {
  element1: string;
  element2: string;
}

export interface StartGameData {
  // No additional data needed
}

export interface MessageData {
  type: 'create-element' | 'start-game';
  data: CreateElementData | StartGameData;
}

export interface RoomJoinData {
  roomId: string;
  roomName?: string;
  roomDescription?: string;
  language?: string;
}

export interface PlayerStats {
  score: number;
  elements: string[];
}

export interface RoomStats {
  score: number;
  elementsDiscovered: number;
  targetElement: string;
  gameStatus: 'waiting' | 'active' | 'ended';
}

export interface ElementCreationResponse {
  type: 'create-element';
  success: boolean;
  message: string;
  data: {
    element: string;
    en_text?: string;
    emoji: string;
    combination: string;
    audio_b64?: string;
    roomStats?: RoomStats;
    gameStatus?: 'waiting' | 'active' | 'ended';
    winner?: string;
  } | null;
  error?: string;
}

export interface GameStartResponse {
  type: 'start-game';
  success: boolean;
  message: string;
  data: any;
  error?: string;
}

export interface PlayerDiscoveredElement {
  type: 'player-discovered-element';
  data: {
    userId: string;
    userName: string;
    element: string;
    combination: string;
    newScore: number;
  };
}

export interface GameStartedBroadcast {
  type: 'game-started';
  data: {
    message: string;
    targetElement: string;
    startedBy: string;
    startTime: string;
  };
}

export interface EndGameBroadcast {
  type: 'endgame';
  data: {
    winner: {
      userId: string;
      userName: string;
    };
    targetElement: string;
    finalScores: Record<string, PlayerStats>;
    gameEndTime: string;
  };
}

export interface PlayerJoinedBroadcast {
  type: 'player_joined';
  data: {
    userId: string;
    userName: string;
    playersCount: number;
    message: string;
  };
}

class SocketClient {
  private socket: Socket | null = null;
  private token: string | null = null;

  connect(token: string): Promise<Socket> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve(this.socket);
        return;
      }

      this.token = token;
      this.socket = io(API_BASE_URL, {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling']
      });

      this.socket.on('connect', () => {
        console.log('Socket connected:', this.socket?.id);
        resolve(this.socket!);
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        reject(error);
      });

      this.socket.on('disconnect', () => {
        console.log('Socket disconnected');
      });
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinRoom(roomData: RoomJoinData) {
    if (!this.socket?.connected) {
      throw new Error('Socket not connected');
    }
    this.socket.emit('join_room', roomData);
  }

  leaveRoom() {
    if (!this.socket?.connected) {
      throw new Error('Socket not connected');
    }
    // alert('leave_room');
    this.socket.emit('leave_room');
  }

  sendMessage(messageData: MessageData) {
    if (!this.socket?.connected) {
      throw new Error('Socket not connected');
    }
    this.socket.emit('message', messageData);
  }

  createElement(element1: string, element2: string) {
    this.sendMessage({
      type: 'create-element',
      data: { element1, element2 }
    });
  }

  startGame() {
    this.sendMessage({
      type: 'start-game',
      data: {}
    });
  }

  onRoomJoined(callback: (data: any) => void) {
    this.socket?.on('room_joined', callback);
  }

  onRoomJoinError(callback: (data: any) => void) {
    this.socket?.on('room_join_error', callback);
  }

  onRoomLeft(callback: (data: any) => void) {
    this.socket?.on('room_left', callback);
  }

  onMessageResponse(callback: (data: any) => void) {
    this.socket?.on('message_response', callback);
  }

  onMessageBroadcast(callback: (data: any) => void) {
    this.socket?.on('message_broadcast', callback);
  }

  onMessageError(callback: (data: any) => void) {
    this.socket?.on('message_error', callback);
  }

  onPlayerLeft(callback: (data: any) => void) {
    this.socket?.on('player_left', callback);
  }

  off(event: string, callback?: (...args: any[]) => void) {
    this.socket?.off(event, callback);
  }

  get connected() {
    return this.socket?.connected || false;
  }

  get instance() {
    return this.socket;
  }
}

export const socketClient = new SocketClient();
