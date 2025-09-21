import React from 'react';

export interface Game {
  id: string;
  name: string;
  description: string;
  Icon: React.FC<{ className?: string }>;
  component: React.FC<{ updateScore: (gameId: string, score: number) => void }>;
}

export interface MultiplayerGame {
  id: string;
  name: string;
  Icon: React.FC<{ className?: string }>;
  component: React.FC<{ user: User, match: Match, onUpdateMatch: (match: Match) => void }>;
}

export interface User {
  username: string;
  email: string;
  fullName: string;
  avatar: string; // e.g., 'superman', 'ironman'
}

// Represents the full user record in storage
export interface UserAccount {
  password: string;
  user: User;
  joinDate: string;
  lastLoginDate: string;
  loginStreak: number;
}

export type Scores = Record<string, number>;

export interface Avatar {
    id: string;
    name: string;
    Icon: React.FC<{ className?: string }>;
}

// --- Leaderboard Types ---
export interface LeaderboardEntry {
    username: string;
    avatar: string;
    score: number;
}

export interface LeaderboardData {
    [gameId: string]: LeaderboardEntry[];
}


// --- Multiplayer Types ---
export interface Challenge {
  id: string;
  inviter: User;
  inviteeEmail: string;
  gameId: string;
  status: 'pending' | 'accepted' | 'declined';
}

export interface Match {
  id: string;
  gameId: string;
  players: [User, User];
  gameState: any; // Game-specific state (e.g., board)
  turn: string; // Email of the current player
  winner?: string | null; // Email of the winner or 'draw'
}