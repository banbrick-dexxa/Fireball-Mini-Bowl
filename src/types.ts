export type Team = 'Fireball';

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
  { id: 'f5', name: 'Shane', team: 'Fireball', scores: [], currentFrame: 0, isCurrentPlayer: false },
  { id: 'f6', name: 'Garret', team: 'Fireball', scores: [], currentFrame: 0, isCurrentPlayer: false },
  { id: 'f7', name: 'Sean', team: 'Fireball', scores: [], currentFrame: 0, isCurrentPlayer: false },
];
