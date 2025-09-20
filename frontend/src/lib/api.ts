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
};
