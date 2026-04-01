import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Flame, Wind, RotateCcw, Users } from 'lucide-react';
import { Player, Team, INITIAL_PLAYERS } from './types';
import BowlingCanvas from './BowlingCanvas';

export default function App() {
  const [players, setPlayers] = useState<Player[]>(INITIAL_PLAYERS);
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [winner, setWinner] = useState<Team | 'Draw' | null>(null);

  const currentPlayer = players[currentTurnIndex];

  const handleBowl = (pinsKnocked: number) => {
    const updatedPlayers = [...players];
    const player = { ...updatedPlayers[currentTurnIndex] };
    
    player.scores.push(pinsKnocked);
    updatedPlayers[currentTurnIndex] = player;

    setPlayers(updatedPlayers);

    // Move to next player
    const nextIndex = (currentTurnIndex + 1) % players.length;
    
    // Check if game is over (e.g., after 5 frames for each player)
    const totalFrames = 5;
    if (updatedPlayers.every(p => p.scores.length >= totalFrames)) {
      setIsGameOver(true);
      calculateWinner(updatedPlayers);
    } else {
      setCurrentTurnIndex(nextIndex);
    }
  };

  const calculateWinner = (finalPlayers: Player[]) => {
    const fireballScore = finalPlayers
      .filter(p => p.team === 'Fireball')
      .reduce((sum, p) => sum + p.scores.reduce((a, b) => a + b, 0), 0);
    
    const exhaustScore = finalPlayers
      .filter(p => p.team === 'FM Exhaust')
      .reduce((sum, p) => sum + p.scores.reduce((a, b) => a + b, 0), 0);

    if (fireballScore > exhaustScore) setWinner('Fireball');
    else if (exhaustScore > fireballScore) setWinner('FM Exhaust');
    else setWinner('Draw');
  };

  const resetGame = () => {
    setPlayers(INITIAL_PLAYERS.map(p => ({ ...p, scores: [] })));
    setCurrentTurnIndex(0);
    setIsGameOver(false);
    setWinner(null);
  };

  const getTeamScore = (team: Team) => {
    return players
      .filter(p => p.team === team)
      .reduce((sum, p) => sum + p.scores.reduce((a, b) => a + b, 0), 0);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-orange-500/30">
      {/* Header */}
      <header className="p-4 border-b border-white/5 flex justify-between items-center bg-black/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(234,88,12,0.4)]">
            <Flame className="w-5 h-5 text-white" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-bold tracking-tighter uppercase italic leading-none">Fireball</h1>
            <p className="text-[8px] font-mono text-orange-500/60 tracking-[0.2em]">TEAM ALPHA</p>
          </div>
        </div>

        <div className="text-center">
          <div className="text-2xl font-black tracking-tighter tabular-nums leading-none">
            {getTeamScore('Fireball')} <span className="text-white/20 mx-1">VS</span> {getTeamScore('FM Exhaust')}
          </div>
          <div className="text-[8px] font-mono text-white/40 uppercase tracking-widest mt-1">
            Total Pins
          </div>
        </div>

        <div className="flex items-center gap-2 text-right">
          <div className="hidden sm:block">
            <h1 className="text-lg font-bold tracking-tighter uppercase italic leading-none">FM Exhaust</h1>
            <p className="text-[8px] font-mono text-blue-500/60 tracking-[0.2em]">TEAM OMEGA</p>
          </div>
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.4)]">
            <Wind className="w-5 h-5 text-white" />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-12 items-start">
        {/* Game Canvas (Left) */}
        <section className="flex flex-col items-center justify-center lg:sticky lg:top-24">
          <AnimatePresence mode="wait">
            {!isGameOver ? (
              <motion.div
                key="game"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
              >
                <BowlingCanvas currentPlayer={currentPlayer} onBowl={handleBowl} />
              </motion.div>
            ) : (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center p-8 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-xl w-full"
              >
                <Trophy className={`w-16 h-16 mx-auto mb-4 ${winner === 'Fireball' ? 'text-orange-500' : winner === 'FM Exhaust' ? 'text-blue-500' : 'text-gray-400'}`} />
                <h2 className="text-3xl font-black tracking-tighter uppercase italic mb-2">
                  {winner === 'Draw' ? "It's a Draw!" : `${winner} Wins!`}
                </h2>
                <p className="text-white/40 font-mono text-[10px] mb-6 uppercase tracking-widest">
                  Final Score: {getTeamScore('Fireball')} - {getTeamScore('FM Exhaust')}
                </p>
                <button
                  onClick={resetGame}
                  className="flex items-center gap-2 mx-auto px-6 py-3 bg-white text-black font-bold rounded-full hover:bg-orange-500 hover:text-white transition-all active:scale-95 text-sm"
                >
                  <RotateCcw className="w-4 h-4" /> REMATCH
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Scoreboards (Right) */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Fireball Team List */}
          <div className="space-y-4">
            <h2 className="text-[10px] font-mono uppercase tracking-[0.3em] text-orange-500/60 flex items-center gap-2">
              <Flame className="w-3 h-3" /> Fireball Roster
            </h2>
            <div className="space-y-2">
              {players.filter(p => p.team === 'Fireball').map((player) => (
                <div key={player.id}>
                  <PlayerCard player={player} isActive={currentPlayer.id === player.id} />
                </div>
              ))}
            </div>
          </div>

          {/* FM Exhaust Team List */}
          <div className="space-y-4">
            <h2 className="text-[10px] font-mono uppercase tracking-[0.3em] text-blue-500/60 flex items-center gap-2">
              <Wind className="w-3 h-3" /> FM Exhaust Roster
            </h2>
            <div className="space-y-2">
              {players.filter(p => p.team === 'FM Exhaust').map((player) => (
                <div key={player.id}>
                  <PlayerCard player={player} isActive={currentPlayer.id === player.id} />
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 p-6 flex justify-center pointer-events-none">
        <div className="px-6 py-2 bg-white/5 backdrop-blur-md rounded-full border border-white/10 text-[10px] font-mono text-white/40 uppercase tracking-[0.4em]">
          Fireball vs FM Exhaust • 4v4 Bowling Championship
        </div>
      </footer>
    </div>
  );
}

interface PlayerCardProps {
  player: Player;
  isActive: boolean;
  isRight?: boolean;
}

function PlayerCard({ player, isActive, isRight = false }: PlayerCardProps) {
  const totalScore = player.scores.reduce((a, b) => a + b, 0);
  
  return (
    <motion.div
      animate={{ 
        x: isActive ? (isRight ? -5 : 5) : 0,
        backgroundColor: isActive ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)'
      }}
      className={`p-2 rounded-xl border ${isActive ? (player.team === 'Fireball' ? 'border-orange-500/50' : 'border-blue-500/50') : 'border-white/5'} transition-colors`}
    >
      <div className={`flex items-center gap-3 ${isRight ? 'flex-row-reverse' : ''}`}>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm ${player.team === 'Fireball' ? 'bg-orange-500/20 text-orange-500' : 'bg-blue-500/20 text-blue-500'}`}>
          {player.name[0]}
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="font-bold tracking-tight text-sm truncate">{player.name}</div>
          <div className="flex gap-0.5 mt-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div 
                key={i} 
                className={`w-3 h-0.5 rounded-full ${player.scores[i] !== undefined ? (player.team === 'Fireball' ? 'bg-orange-500' : 'bg-blue-500') : 'bg-white/10'}`} 
              />
            ))}
          </div>
        </div>
        <div className="text-lg font-black tabular-nums opacity-80">
          {totalScore}
        </div>
      </div>
    </motion.div>
  );
}
