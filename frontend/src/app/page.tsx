'use client';

import { useState, useEffect } from 'react';
import LoginScreen from './components/LoginScreen';
import ProfileScreen from './components/ProfileScreen';
import { API_BASE_URL } from './constants/api';

interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    if (token) {
      fetchProfile(token);
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchProfile = async (token: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        // Token is invalid, remove it
        localStorage.removeItem('token');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      localStorage.removeItem('token');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = (userData: User, token: string) => {
    setUser(userData);
    localStorage.setItem('token', token);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('token');
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${user.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        handleLogout();
        alert('Account deleted successfully');
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Error deleting account');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {user ? (
        <ProfileScreen 
          user={user} 
          onLogout={handleLogout}
          onDeleteAccount={handleDeleteAccount}
        />
      ) : (
        <LoginScreen onLogin={handleLogin} />
      )}
    </div>
  );
}
