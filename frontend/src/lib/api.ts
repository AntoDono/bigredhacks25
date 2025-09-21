export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export interface User {
  id: string;
  name: string;
  email: string;
  gamesWon?: number;
  gamesPlayed?: number;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  message: string;
}

export interface CreateElementRequest {
  element1: string;
  element2: string;
}

export interface CreateElementResponse {
  element: string;
}

export interface PronunciationAnalysisRequest {
  groundTruthAudio: string;
  userAudio: string;
  expectedText: string;
  language?: string; // Language code (e.g., 'en', 'es', 'fr')
  context?: 'battle' | 'practice'; // Context for different evaluation modes
}

export interface PronunciationAnalysisResponse {
  success: boolean;
  similarity: number;
  transcription: string;
  confidence: number;
  features: {
    spectral: number;
    prosodic: number;
    phonetic: number;
    overall: number;
  };
  is_correct: boolean; // New field indicating if pronunciation is correct
  context: string; // Context used for evaluation
  language: string;
  timestamp: string;
}

export interface Room {
  name: string;
  description: string;
  target_element: string;
  players: string[];
  player_stats: Record<string, {
    score: number;
    elements: string[];
  }>;
  gameStatus: 'waiting' | 'active' | 'ended';
  winner: string | null;
  createdBy: {
    userId: string;
    userName: string;
  };
  createdAt: string;
  startedAt?: string;
  endedAt?: string;
}

export interface GameHistoryItem {
  id: string;
  targetElement: string;
  roomName: string;
  language: string;
  startedAt: string;
  endedAt: string;
  duration: number;
  createdAt: string;
  winner: {
    userId: string;
    userName: string;
  } | null;
  players: {
    userId: string;
    userName: string;
    score: number;
    elementsDiscovered: number;
  }[];
  userWon: boolean;
  userStats?: {
    userId: string;
    userName: string;
    score: number;
    elementsDiscovered: number;
  };
}

export interface GameDetails extends GameHistoryItem {
  // GameDetails has the same structure as GameHistoryItem for now
  // Could be extended with additional details in the future
}

// API Functions
export const api = {
  // Authentication
  async register(name: string, email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/api/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Registration failed');
    }

    return response.json();
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    return response.json();
  },

  async getProfile(token: string): Promise<{ user: User }> {
    const response = await fetch(`${API_BASE_URL}/api/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch profile');
    }

    return response.json();
  },

  async deleteUser(userId: string, token: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete user');
    }

    return response.json();
  },

  // Element creation (non-socket version)
  async createElement(element1: string, element2: string): Promise<CreateElementResponse> {
    const response = await fetch(`${API_BASE_URL}/create-element`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ element1, element2 }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create element');
    }

    return response.json();
  },

  // Pronunciation analysis
  async analyzePronunciation(data: PronunciationAnalysisRequest): Promise<PronunciationAnalysisResponse> {
    const response = await fetch(`${API_BASE_URL}/api/analyze-pronunciation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to analyze pronunciation');
    }

    return response.json();
  },

  // Get user's learned vocabulary for a language
  async getUserVocabulary(userId: string, languageCode: string, token: string): Promise<{
    languageCode: string;
    vocabulary: any[];
    count: number;
  }> {
    const response = await fetch(`${API_BASE_URL}/api/users/${userId}/vocabulary/${languageCode}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch vocabulary');
    }

    return response.json();
  },

  // Game History
  async getUserGames(userId: string, token: string, page = 1, limit = 10): Promise<{
    games: GameHistoryItem[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalGames: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  }> {
    const response = await fetch(`${API_BASE_URL}/api/users/${userId}/games?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch games');
    }

    return response.json();
  },

  async getGameDetails(gameId: string, token: string): Promise<GameDetails> {
    const response = await fetch(`${API_BASE_URL}/api/games/${gameId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch game details');
    }

    return response.json();
  },
};
