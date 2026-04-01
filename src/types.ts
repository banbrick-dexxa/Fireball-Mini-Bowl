export type Team = 'Fireball' | 'FM Exhaust';

export interface Player {
  id: string;
  name: string;
  team: Team;
  scores: number[]; // Scores for each frame
  currentFrame: number;
  isCurrentPlayer: boolean;
}

export interface GameState {
  players: Player[];
  currentTurnIndex: number;
  currentFrame: number;
  isGameOver: boolean;
  winner: Team | 'Draw' | null;
}

export const INITIAL_PLAYERS: Player[] = [
  { id: 'f1', name: 'John', team: 'Fireball', scores: [], currentFrame: 0, isCurrentPlayer: true },
  { id: 'f2', name: 'Jay', team: 'Fireball', scores: [], currentFrame: 0, isCurrentPlayer: false },
  { id: 'f3', name: 'Nate', team: 'Fireball', scores: [], currentFrame: 0, isCurrentPlayer: false },
  { id: 'f4', name: 'Travis', team: 'Fireball', scores: [], currentFrame: 0, isCurrentPlayer: false },
  { id: 'e1', name: 'Dallas', team: 'FM Exhaust', scores: [], currentFrame: 0, isCurrentPlayer: false },
  { id: 'e2', name: 'Les', team: 'FM Exhaust', scores: [], currentFrame: 0, isCurrentPlayer: false },
  { id: 'e3', name: 'Paul', team: 'FM Exhaust', scores: [], currentFrame: 0, isCurrentPlayer: false },
  { id: 'e4', name: 'Bo', team: 'FM Exhaust', scores: [], currentFrame: 0, isCurrentPlayer: false },
];
