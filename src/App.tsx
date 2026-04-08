import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Flame, Wind, RotateCcw, Users } from 'lucide-react';
import { Player, Team, INITIAL_PLAYERS } from './types';
import BowlingCanvas from './BowlingCanvas';

export default function App() {
  const [players, setPlayers] = useState<Player[]>(INITIAL_PLAYERS);
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [winner, setWinner] = useState<Team | 'Draw' | null>(null);
  const scoreboardRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scoreboardRef.current) {
      const activeElement = scoreboardRef.current.children[currentTurnIndex] as HTMLElement;
      if (activeElement) {
        activeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      }
    }
  }, [currentTurnIndex]);

  const currentPlayer = players[currentTurnIndex];

  const handleBowl = (pinsKnocked: number) => {
    const updatedPlayers = [...players];
    const player = { ...updatedPlayers[currentTurnIndex] };
    
    player.scores.push(pinsKnocked);
    updatedPlayers[currentTurnIndex] = player;

    setPlayers(updatedPlayers);

    // Move to next player
    const nextIndex = (currentTurnIndex + 1) % players.length;
    
    // Check if game is over (after 3 balls for each player)
    const totalFrames = 3;
    if (updatedPlayers.every(p => p.scores.length >= totalFrames)) {
      setIsGameOver(true);
      calculateWinner(updatedPlayers);
    } else {
      setCurrentTurnIndex(nextIndex);
    }
  };

  const calculateWinner = (finalPlayers: Player[]) => {
    // Since all players are currently on the 'Fireball' team, 
    // we'll just acknowledge the team's completion or find the top scorer.
    setWinner('Fireball');
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
      {/* Header with Scoreboard */}
      <header className="p-2 border-b border-white/5 bg-black/50 backdrop-blur-sm sticky top-0 z-50 h-[12vh] flex items-center overflow-hidden">
        <div className="max-w-7xl mx-auto w-full px-4 flex items-center gap-6">
          <div 
            className="flex items-center gap-2 shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => setIsGameStarted(false)}
          >
            <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(234,88,12,0.4)]">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <div className="hidden md:block">
              <h1 className="text-sm font-bold tracking-tighter uppercase italic leading-none">Fireball</h1>
              <p className="text-[7px] font-mono text-orange-500/60 tracking-[0.2em]">ROSTER</p>
            </div>
          </div>

          <div ref={scoreboardRef} className="flex-1 flex gap-2 overflow-x-auto no-scrollbar py-1">
            {players.map((player) => (
              <div key={player.id} className="min-w-[120px] flex-1">
                <PlayerCard player={player} isActive={currentPlayer.id === player.id} />
              </div>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 flex flex-col items-center justify-center min-h-[80vh]">
        {/* Game Canvas */}
        <section className="flex flex-col items-center justify-center">
          <AnimatePresence mode="wait">
            {!isGameStarted ? (
              <StartMenu onStart={() => setIsGameStarted(true)} />
            ) : !isGameOver ? (
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
                className="text-center p-8 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-xl w-[350px]"
              >
                <Trophy className="w-16 h-16 mx-auto mb-4 text-orange-500" />
                <h2 className="text-3xl font-black tracking-tighter uppercase italic mb-2">
                  Game Over!
                </h2>
                <p className="text-white/40 font-mono text-[10px] mb-6 uppercase tracking-widest">
                  Final Score: {getTeamScore('Fireball')}
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
      </main>
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
        scale: isActive ? 1.02 : 1,
        backgroundColor: isActive ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)'
      }}
      className={`p-1.5 rounded-lg border ${isActive ? 'border-orange-500/50' : 'border-white/5'} transition-colors`}
    >
      <div className="flex items-center gap-2">
        <div className={`w-6 h-6 rounded flex items-center justify-center font-black text-[10px] ${player.team === 'Fireball' ? 'bg-orange-500/20 text-orange-500' : 'bg-blue-500/20 text-blue-500'}`}>
          {player.name[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold tracking-tight text-[10px] truncate uppercase">{player.name}</div>
          <div className="flex gap-0.5 mt-0.5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div 
                key={i} 
                className={`w-2 h-0.5 rounded-full ${player.scores[i] !== undefined ? 'bg-orange-500' : 'bg-white/10'}`} 
              />
            ))}
          </div>
        </div>
        <div className="text-xs font-black tabular-nums opacity-80">
          {totalScore}
        </div>
      </div>
    </motion.div>
  );
}

function StartMenu({ onStart }: { onStart: () => void }) {
  return (
    <motion.div
      key="start-menu"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="text-center p-8 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-xl w-[350px]"
    >
      <Flame className="w-16 h-16 mx-auto mb-4 text-orange-500 animate-pulse" />
      <h2 className="text-2xl font-black tracking-tighter uppercase italic mb-6 leading-tight">
        FIREBALL ROLL-OFF<br/>WARM-UP
      </h2>
      
      <div className="space-y-6 text-left mb-8">
        <section>
          <h3 className="text-[10px] font-mono text-orange-500 uppercase tracking-widest mb-2">Objective</h3>
          <p className="text-xs text-white/70 leading-relaxed">
            Work together as a team to achieve the highest possible total score.
          </p>
        </section>

        <section>
          <h3 className="text-[10px] font-mono text-orange-500 uppercase tracking-widest mb-2">Controls</h3>
          <ul className="text-xs text-white/70 space-y-1">
            <li>• <span className="text-white">Pull Back:</span> Charge Power</li>
            <li>• <span className="text-white">Drag Left/Right:</span> Adjust Spin</li>
            <li>• <span className="text-white">Release:</span> Bowl</li>
          </ul>
        </section>

        <section>
          <h3 className="text-[10px] font-mono text-orange-500 uppercase tracking-widest mb-2">Difficulty Curve</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <p className="text-[10px] text-white/60"><span className="text-white">Ball 1:</span> Full Trajectory Line</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
              <p className="text-[10px] text-white/60"><span className="text-white">Ball 2:</span> Half Trajectory Line</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
              <p className="text-[10px] text-white/60"><span className="text-white">Ball 3:</span> No Trajectory Line</p>
            </div>
          </div>
        </section>
      </div>

      <button
        onClick={onStart}
        className="w-full py-4 bg-white text-black font-black rounded-full hover:bg-orange-500 hover:text-white transition-all active:scale-95 text-sm uppercase tracking-widest"
      >
        Let's Roll!
      </button>
    </motion.div>
  );
}
