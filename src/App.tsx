import { useState, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { generateBotTurn } from './services/gemini';
import { getBestMove } from './lib/engine';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal, Shield, Activity, AlertTriangle, RefreshCw, Globe, TrendingUp, ChevronLeft, Info, Play, Map, Volume2, VolumeX } from 'lucide-react';
import { playSound } from './lib/sounds';
import { Howler } from 'howler';
import { supabase } from './lib/supabase';
import { AuthModal } from './components/AuthModal';
import { UserHUD } from './components/UserHUD';
import { GameOverModal } from './components/GameOverModal';

interface Briefing {
  text: string;
  timestamp: string;
}

type AppState = 'START_MENU' | 'GAME';

const PieceSVG = ({ type, width }: { type: string; width: number }) => {
  const isWhite = type.startsWith('w');
  const piece = type.substring(1);

  const colors = {
    white: {
      fill: '#E2E8F0', // Brushed Aluminum
      stroke: '#0F172A', // Deep Charcoal
    },
    black: {
      fill: '#1A202C', // Volcanic Black
      stroke: '#A38652', // Muted Gold
    },
  };

  const theme = isWhite ? colors.white : colors.black;

  // Refined Executive Staunton Paths
  const detailedPaths: Record<string, string> = {
    P: "M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-3 1.06-7.41 5.55-7.41 13.47h23c0-7.92-4.41-12.41-7.41-13.47 1.47-1.19 2.41-3 2.41-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z",
    R: "M9 39h27v-3H9v3zm3-3h21l-2-6H13l-2 6zm22-21V9h-4v3h-2V9h-4v3h-2V9h-4v3h-2V9H9v6l1 14h25l1-14z",
    N: "M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21l-7 7-2-2 8-13z M24 14c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z",
    B: "M9 36h27l-2-4H11l-2 4zm13.5-26c-3 0-5 2-7 5-2 3-3 6-3 10 0 4 1 8 3 11h8c2-3 3-7 3-11 0-4-1-7-3-10-2-3-4-5-7-5z M22 10v6 M20 13h4", // Refined mitre
    Q: "M9 39h27v-3H9v3zm3-3h21l2-10-5 2-2-15-4 15-4-15-4 15-5-2 2 10z M22.5 5c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z",
    K: "M9 39h27v-3H9v3zm3-3h21l2-15-5 2V10h-2v4h-4v-4h-2v4h-4v-4h-2v15l-5-2 2 15z M22.5 2c.8 0 1.5.7 1.5 1.5S23.3 5 22.5 5 21 4.3 21 3.5 21.7 2 22.5 2z", // Refined crown
  };

  return (
    <svg width={width} height={width} viewBox="0 0 45 45" className="drop-shadow-md">
      <path
        d={detailedPaths[piece] || detailedPaths.P}
        fill={theme.fill}
        stroke={theme.stroke}
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

// --- Modals ---

const WelcomeModal = ({ 
  showWelcome, 
  setShowWelcome, 
  difficulty, 
  selectedLens 
}: { 
  showWelcome: boolean; 
  setShowWelcome: (show: boolean) => void; 
  difficulty: string; 
  selectedLens: string; 
}) => {
  if (!showWelcome) return null;

  const getScenario = () => {
    const scenarios = [
      {
        title: "Strategic Trade Corridor",
        text: `Welcome, Commander. A vital trade route is under pressure. As a ${difficulty} strategist, your goal is to secure the central corridor and maintain regional stability using ${selectedLens} principles.`
      },
      {
        title: "Market Hostile Takeover",
        text: `Greetings, Director. An aggressive competitor is attempting a hostile takeover. Use your ${difficulty} level expertise to protect your assets and outmaneuver them through the lens of ${selectedLens}.`
      },
      {
        title: "Diplomatic Crisis",
        text: `Welcome, Agent. Diplomatic relations are at a breaking point. In this ${difficulty} simulation, you must use ${selectedLens} to navigate the tension and claim a position of strength.`
      },
      {
        title: "Economic Expansion",
        text: `Greetings, Strategist. We are expanding into new territories. Your ${difficulty} mission is to manage resources and establish a dominant presence using ${selectedLens} tactics.`
      },
      {
        title: "Global Power Shift",
        text: `Welcome, Chairman. A major power shift is occurring. Leverage your ${difficulty} analytical skills to ensure our influence remains supreme in this ${selectedLens} theater.`
      }
    ];
    
    const index = (selectedLens.length + difficulty.length) % scenarios.length;
    return scenarios[index];
  };

  const scenario = getScenario();

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="max-w-lg w-full glass-panel border border-blue-500/30 rounded-lg overflow-hidden shadow-[0_0_50px_rgba(59,130,246,0.2)]"
      >
        <div className="p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-blue-500/10 rounded-full text-blue-500">
                <Globe size={32} className="animate-pulse" />
              </div>
            </div>
            <div className="data-label text-blue-400 tracking-[0.3em] uppercase text-[10px]">Briefing</div>
            <h2 className="text-2xl font-bold text-dash-text tracking-tight uppercase">{scenario.title}</h2>
            <p className="text-sm text-slate-400 leading-relaxed pt-2">
              {scenario.text}
            </p>
          </div>

          <div className="pt-4">
            <button 
              onClick={() => setShowWelcome(false)}
              className="w-full py-4 bg-dash-accent text-dash-bg font-bold uppercase tracking-widest text-xs rounded hover:bg-blue-400 transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)]"
            >
              Begin Operation
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const ExitConfirmationModal = ({ 
  showExitConfirmation, 
  setShowExitConfirmation, 
  setAppState, 
  resetGame 
}: { 
  showExitConfirmation: boolean; 
  setShowExitConfirmation: (show: boolean) => void; 
  setAppState: (state: 'START_MENU' | 'GAME') => void; 
  resetGame: () => void; 
}) => {
  if (!showExitConfirmation) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="max-w-md w-full glass-panel border border-red-500/30 rounded-lg overflow-hidden shadow-[0_0_50px_rgba(239,68,68,0.2)]"
      >
        <div className="p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-red-500/10 rounded-full text-red-500">
                <AlertTriangle size={32} />
              </div>
            </div>
            <h2 className="text-xl font-bold text-dash-text tracking-tight uppercase">Exit Game?</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Are you sure you want to leave? Your current game progress will be lost.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <button 
              onClick={() => {
                setShowExitConfirmation(false);
                setAppState('START_MENU');
                resetGame();
              }}
              className="w-full py-3 bg-red-500 text-white font-bold uppercase tracking-widest text-xs rounded hover:bg-red-600 transition-all shadow-[0_0_20px_rgba(239,68,68,0.3)]"
            >
              Confirm Exit
            </button>
            <button 
              onClick={() => setShowExitConfirmation(false)}
              className="w-full py-3 bg-white/5 border border-white/10 text-dash-text font-bold uppercase tracking-widest text-xs rounded hover:bg-white/10 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};


export default function App() {
  const [appState, setAppState] = useState<AppState>('START_MENU');
  const [showAbout, setShowAbout] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) setShowAuth(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) setShowAuth(false);
      else setShowAuth(true);
    });

    // Re-check session on window focus (useful for returning from OAuth popups)
    const handleFocus = () => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) setShowAuth(false);
      });
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('focus', handleFocus);
    };
  }, []);
  const [selectedLens, setSelectedLens] = useState('Geopolitics');
  const [difficulty, setDifficulty] = useState<'JUNIOR' | 'SENIOR' | 'GLOBAL'>('SENIOR');
  const [game, setGame] = useState(new Chess());
  const [playerColor, setPlayerColor] = useState<'w' | 'b'>('w');
  const aiColor = playerColor === 'w' ? 'b' : 'w';
  const [isAiTurn, setIsAiTurn] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const currentRequestId = useRef(0);
  const [briefingHistory, setBriefingHistory] = useState<Briefing[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isEngineThinking, setIsEngineThinking] = useState(false);
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isQuotaExceeded, setIsQuotaExceeded] = useState(false);
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [moveFrom, setMoveFrom] = useState<string | null>(null);
  const [optionSquares, setOptionSquares] = useState<Record<string, any>>({});
  const [headlines, setHeadlines] = useState<{ text: string; id: string }[]>([]);
  const [globalBaseline, setGlobalBaseline] = useState<string | null>(null);
  const [indicators, setIndicators] = useState({
    stability: 100,
    funds: 1000,
    resources: 0,
    market: 80,
    inflation: 12
  });
  const [turnsTaken, setTurnsTaken] = useState(0);
  const [gameOverType, setGameOverType] = useState<'VICTORY' | 'DEFEAT' | null>(null);
  const [showGameOver, setShowGameOver] = useState(false);
  const [isMuted, setIsMuted] = useState(() => {
    const saved = localStorage.getItem('isMuted');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('isMuted', JSON.stringify(isMuted));
  }, [isMuted]);

  useEffect(() => {
    // Enable auto-unlock for mobile/strict browsers
    Howler.autoUnlock = true;
    
    const handleInteraction = () => {
      if (Howler.ctx && Howler.ctx.state === 'suspended') {
        Howler.ctx.resume().catch(console.error);
      }
    };
    window.addEventListener('click', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);
    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };
  }, []);

  async function saveGameStats(finalScore: number) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      // Save to user_stats table
      await supabase.from('user_stats').insert({
        user_id: user.id,
        score: finalScore,
        turns: turnsTaken,
        stability: indicators.stability
      });

      // Also update high_score in profiles if this is higher
      const { data: profile } = await supabase
        .from('profiles')
        .select('high_score')
        .eq('id', user.id)
        .single();

      if (profile && finalScore > profile.high_score) {
        await supabase
          .from('profiles')
          .update({ high_score: finalScore })
          .eq('id', user.id);
      }
    } catch (error) {
      console.error('Error saving game stats:', error);
    }
  }

  function checkGameStatus(gameCopy: Chess, currentIndicators: typeof indicators) {
    // Victory Conditions
    const isCheckmate = gameCopy.isCheckmate();
    const isPlayerVictory = isCheckmate && gameCopy.turn() === aiColor;
    const targetResourceReached = currentIndicators.resources >= 100;

    if (isPlayerVictory || targetResourceReached) {
      triggerGameOver('VICTORY', currentIndicators);
      return true;
    }

    // Defeat Conditions
    const isPlayerDefeat = isCheckmate && gameCopy.turn() === playerColor;
    const stabilityZero = currentIndicators.stability <= 0;
    const fundsNegative = currentIndicators.funds < 0;

    if (isPlayerDefeat || stabilityZero || fundsNegative) {
      triggerGameOver('DEFEAT', currentIndicators);
      return true;
    }

    return false;
  }

  function triggerGameOver(type: 'VICTORY' | 'DEFEAT', finalIndicators: typeof indicators) {
    const score = calculateScore(type, finalIndicators);
    setGameOverType(type);
    setShowGameOver(true);
    setIsGameOver(true);
    saveGameStats(score);
  }

  function calculateScore(type: 'VICTORY' | 'DEFEAT', finalIndicators: typeof indicators) {
    const baseScore = type === 'VICTORY' ? 10000 : 2000;
    const stabilityBonus = finalIndicators.stability * 50;
    const efficiencyBonus = Math.max(0, (100 - turnsTaken) * 100);
    return baseScore + stabilityBonus + efficiencyBonus;
  }

  function makeAMove(move: any) {
    try {
      const gameCopy = new Chess(game.fen());
      
      // Strict Turn Validation: Ensure the move is for the current turn
      const currentTurn = gameCopy.turn();
      
      // For object moves (player)
      if (typeof move === 'object' && move.from) {
        const piece = gameCopy.get(move.from as any);
        if (!piece || piece.color !== currentTurn) return null;
      }

      const result = gameCopy.move(move);
      if (result) {
        // Double check: Did the turn actually change?
        if (gameCopy.turn() === currentTurn && !gameCopy.isGameOver()) {
          // This prevents "null" moves or hallucinations that don't shift the turn
          return null;
        }
        
        setGame(gameCopy);
        setMoveHistory(prev => [...prev, result.san]);
        setTurnsTaken(prev => prev + 1);

        // Update indicators based on move
        const newIndicators = { ...indicators };
        if (result.captured) {
          newIndicators.resources += 10;
          newIndicators.funds += 50;
          newIndicators.stability = Math.min(100, newIndicators.stability + 5);
        } else {
          newIndicators.funds -= 20;
          newIndicators.stability -= 2;
        }
        setIndicators(newIndicators);

        // Check for Game Over
        checkGameStatus(gameCopy, newIndicators);

        return { result, gameCopy };
      }
    } catch (e) {
      return null;
    }
    return null;
  }

  function playMoveSound(result: any, gameCopy: Chess) {
    if (gameCopy.isCheckmate() || gameCopy.isCheck()) {
      playSound('check', isMuted);
    } else if (result.captured) {
      playSound('capture', isMuted);
    } else {
      playSound('move', isMuted);
    }
  }

  function onDrop(sourceSquare: string, targetSquare: string) {
    // Resume audio context on first interaction
    if (Howler.ctx && Howler.ctx.state === 'suspended') {
      Howler.ctx.resume().catch(console.error);
    }

    // Only allow moves if it's player's turn and engine is not thinking
    if (game.turn() !== playerColor || isEngineThinking || game.isGameOver()) return false;

    // Ensure the user is moving their own piece
    const piece = game.get(sourceSquare as any);
    if (!piece || piece.color !== playerColor) return false;

    const moveData = makeAMove({
      from: sourceSquare,
      to: targetSquare,
      promotion: 'q',
    });

    if (moveData === null) return false;
    
    // Switch to AI Turn after successful player move
    setIsAiTurn(true);
    
    // Play sound for user move
    playMoveSound(moveData.result, moveData.gameCopy);
    
    setMoveFrom(null);
    setOptionSquares({});
    return true;
  }

  function getMoveOptions(square: string) {
    const moves = game.moves({
      square: square as any,
      verbose: true,
    });
    if (moves.length === 0) {
      setOptionSquares({});
      return false;
    }

    const newSquares: Record<string, any> = {};
    moves.forEach((move) => {
      const isCapture = game.get(move.to as any);
      newSquares[move.to] = {
        background: isCapture
          ? "radial-gradient(circle, transparent 70%, rgba(239, 68, 68, 0.3) 70%, rgba(239, 68, 68, 0.3) 80%, transparent 80%)"
          : "radial-gradient(circle, rgba(59, 130, 246, 0.3) 22%, transparent 22%)",
      };
    });
    
    // Highlight selected square
    newSquares[square] = {
      background: "rgba(59, 130, 246, 0.1)",
    };
    
    setOptionSquares(newSquares);
    return true;
  }

  function onSquareClick(square: string) {
    // Resume audio context on first interaction
    if (Howler.ctx && Howler.ctx.state === 'suspended') {
      Howler.ctx.resume().catch(console.error);
    }

    if (game.turn() !== playerColor || isEngineThinking || game.isGameOver()) return;

    // If we already have a square selected
    if (moveFrom) {
      const moveData = makeAMove({
        from: moveFrom,
        to: square,
        promotion: "q",
      });

      if (moveData) {
        // Switch to AI Turn after successful player move
        setIsAiTurn(true);

        // Play sound for user move
        playMoveSound(moveData.result, moveData.gameCopy);
        
        setMoveFrom(null);
        setOptionSquares({});
        return;
      }
    }

    // If no move was made, try selecting the new square
    const piece = game.get(square as any);
    if (piece && piece.color === playerColor) {
      const hasMoves = getMoveOptions(square);
      if (hasMoves) {
        setMoveFrom(square);
      } else {
        setMoveFrom(null);
        setOptionSquares({});
      }
    } else {
      setMoveFrom(null);
      setOptionSquares({});
    }
  }

  useEffect(() => {
    // GATEKEEPER: Trigger AI move ONLY if isAiTurn is true and NOT resetting
    if (isAiTurn && !isResetting && !game.isGameOver() && !isEngineThinking && appState === 'GAME') {
      const timer = setTimeout(makeComputerMove, 1000);
      return () => clearTimeout(timer);
    }
  }, [isAiTurn, isResetting, game, isEngineThinking, appState]);

  async function makeComputerMove() {
    // Singleton API Call: Capture current request ID to detect if game was reset
    const requestId = currentRequestId.current;

    // GATEKEEPER: Hard-coded rule - Gemini cannot be called if isAiTurn is false
    if (!isAiTurn || game.turn() === playerColor || game.isGameOver() || isResetting) {
      setIsAiTurn(false); // Fail-safe reset
      return;
    }
    
    setIsEngineThinking(true);
    setIsAnalyzing(true);
    
    // 2-second debounce to save quota
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Cleanup Function: If requestId changed, the game was reset mid-turn. ABORT.
    if (requestId !== currentRequestId.current) return;
    
    const currentFen = game.fen();
    const legalMoves = game.moves();
    const currentTurn = game.turn();
    
    try {
      const result = await generateBotTurn(
        currentFen, 
        moveHistory.slice(-10), 
        legalMoves, 
        currentTurn,
        selectedLens, 
        difficulty,
        globalBaseline
      );
      
      // Cleanup Function: Check again after API call
      if (requestId !== currentRequestId.current) return;

      const { user_move_analogy, move, analogy, news_headline, stats } = result;
      
      if (analogy.includes("QUOTA_EXHAUSTED")) {
        setIsQuotaExceeded(true);
      }

      // Final turn validation before execution
      if (game.turn() !== aiColor) return;

      const moveData = makeAMove(move);
      if (moveData) {
        // ONE-AND-DONE: AI move complete, immediately set isAiTurn to false
        setIsAiTurn(false);
        
        // Play sound for computer move
        playMoveSound(moveData.result, moveData.gameCopy);
        
        setBriefingHistory(prev => {
  const updated = [...prev,
    {
      text: user_move_analogy,
      move: move, // ADD THIS LINE (Line 597)
      timestamp: new Date().toLocaleTimeString(),
    },
    {
      text: analogy,
      move: move, // ADD THIS LINE (Line 601)
      timestamp: new Date().toLocaleTimeString(),
    }
  ];
  return updated.slice(-10);
});
        setHeadlines(prev => [{ text: news_headline, id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}` }, ...prev].slice(0, 10));
        
        const newStats = {
          stability: Math.min(100, Math.max(0, stats.market_confidence)),
          funds: indicators.funds + (stats.fiscal_stability - 50) * 10,
          resources: indicators.resources + (stats.inflation < 10 ? 5 : 0),
          market: stats.market_confidence,
          inflation: stats.inflation
        };
        
        setIndicators(newStats);
        
        // Check for Game Over after AI move
        checkGameStatus(moveData.gameCopy, newStats);
        
        // Update baseline if history exceeds 10 moves
        if (moveHistory.length > 10) {
          setGlobalBaseline(`Funds: ${newStats.funds}, Stability: ${newStats.stability}, Resources: ${newStats.resources}`);
        }
      }
    } catch (error) {
      // Fallback to Stockfish if Gemini fails
      const engineGame = new Chess(currentFen);
      const bestMove = getBestMove(engineGame, difficulty);
      if (bestMove) {
        const moveData = makeAMove(bestMove);
        if (moveData) {
          // ONE-AND-DONE: AI move complete, immediately set isAiTurn to false
          setIsAiTurn(false);
          playMoveSound(moveData.result, moveData.gameCopy);
        }
      }
    } finally {
      setIsAiTurn(false); // GATEKEEPER: Always reset after attempt to prevent hallucinations
      setIsEngineThinking(false);
      setIsAnalyzing(false);
    }
  }

  // Removed useEffect that triggered handleBriefing on every move
  // Analysis is now batched with the bot's turn

  function resetGame() {
    // Complete State Wipe: Increment Request ID to cancel any pending AI moves
    currentRequestId.current++;
    setIsResetting(true);
    
    const newGame = new Chess();
    const newPlayerColor = Math.random() > 0.5 ? 'w' : 'b';
    
    setGame(newGame);
    setPlayerColor(newPlayerColor);
    
    // Turn Lockdown on Reset: Explicitly clear AI turn state
    setIsAiTurn(false);
    setIsEngineThinking(false);
    setIsAnalyzing(false);
    
    setMoveHistory([]);
    setBriefingHistory([]);
    setGlobalBaseline(null);
    setIsGameOver(false);
    setMoveFrom(null);
    setOptionSquares({});
    setHeadlines([]);
    setTurnsTaken(0);
    setIndicators({
      stability: 100,
      funds: 1000,
      resources: 0,
      market: 80,
      inflation: 12
    });
    setGameOverType(null);
    setShowGameOver(false);

    // Turn Lockdown on Reset: Wait for board animation/state to settle
    setTimeout(() => {
      setIsResetting(false);
      // RANDOM START FIX: If AI is White, trigger AI move once AFTER reset is complete
      if (newPlayerColor === 'b') {
        setIsAiTurn(true);
      }
    }, 500);
    playSound('start', isMuted);
  }

  useEffect(() => {
    if (game.isGameOver() && !isGameOver) {
      // Chess logic game over is handled in checkGameStatus within makeAMove
      // This is a fallback for other game over triggers if any
    }
  }, [game]);




  const StartMenu = () => (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-dash-bg bg-grid relative font-sans p-8 overflow-y-auto">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-dash-accent/5 to-transparent pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="z-10 flex flex-col items-center gap-8 p-12 glass-panel rounded-lg shadow-2xl"
      >
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tighter text-dash-text">STRATEGIC COMMAND</h1>
          <p className="data-label tracking-[0.3em]">Intelligence Analysis Engine v4.0</p>
        </div>

        <div className="flex flex-col w-80 gap-6">
          <div className="space-y-3">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-dash-accent/60 text-center">Strategic Level</div>
            <div className="grid grid-cols-3 gap-2 p-1 bg-white/5 border border-white/10 rounded-lg">
              {(['JUNIOR', 'SENIOR', 'GLOBAL'] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => setDifficulty(level)}
                  className={`
                    py-2 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all duration-300
                    ${difficulty === level 
                      ? 'bg-dash-accent text-dash-bg shadow-[0_0_15px_rgba(59,130,246,0.5)]' 
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'}
                  `}
                >
                  {level === 'JUNIOR' ? 'Junior' : level === 'SENIOR' ? 'Senior' : 'Global'}
                </button>
              ))}
            </div>
            <div className="text-[9px] text-center text-slate-500 italic">
              {difficulty === 'JUNIOR' && 'Junior Analyst: Focuses on basic material gain. Elo ~800.'}
              {difficulty === 'SENIOR' && 'Senior Strategist: Balanced positional play and tactical awareness. Elo ~1500.'}
              {difficulty === 'GLOBAL' && 'Global Oversight: High-level engine depth with long-term predictive planning. Elo ~2500+.'}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="relative group">
              <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded text-slate-400 hover:border-white/20 transition-all">
                <div className="flex items-center gap-3 w-full">
                  {selectedLens === 'Geopolitics' ? <Globe size={18} /> : selectedLens === 'Macroeconomics' ? <TrendingUp size={18} /> : <Map size={18} />}
                  <select 
                    value={selectedLens}
                    onChange={(e) => setSelectedLens(e.target.value)}
                    className="bg-transparent outline-none text-sm font-bold tracking-widest uppercase cursor-pointer w-full"
                  >
                    <option value="Geopolitics">Geopolitical Mode</option>
                    <option value="Macroeconomics">Economic Mode</option>
                    <option value="Regional Economic Strategy">Regional Strategy</option>
                  </select>
                </div>
              </div>
            </div>

            <button 
              onClick={() => {
                // Complete State Wipe on Start
                currentRequestId.current++;
                setIsResetting(true);
                
                const newPlayerColor = Math.random() > 0.5 ? 'w' : 'b';
                setPlayerColor(newPlayerColor);
                
                // Turn Lockdown on Start
                setIsAiTurn(false);
                setAppState('GAME');
                setShowWelcome(true);
                
                setTimeout(() => {
                  setIsResetting(false);
                  // RANDOM START FIX: If AI is White, trigger AI move once AFTER reset is complete
                  if (newPlayerColor === 'b') {
                    setIsAiTurn(true);
                  }
                }, 500);
              }}
              className="group flex items-center justify-center p-4 bg-dash-accent/10 border border-dash-accent/20 rounded hover:bg-dash-accent/20 transition-all text-dash-accent"
            >
              <div className="flex items-center gap-3">
                <Play size={18} />
                <span className="text-sm font-bold tracking-widest uppercase">Start</span>
              </div>
            </button>

            <button 
              onClick={() => setShowAbout(true)}
              className="group flex items-center justify-center p-4 bg-white/5 border border-white/10 rounded hover:bg-white/10 transition-all text-dash-text"
            >
              <div className="flex items-center gap-3">
                <Shield size={18} />
                <span className="text-sm font-bold tracking-widest uppercase">Briefing</span>
              </div>
            </button>
          </div>
        </div>

        <div className="data-label">
          Secure Terminal // Authorization Required
        </div>
      </motion.div>

      <AnimatePresence>
        {showAbout && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-2xl w-full glass-panel rounded-lg overflow-hidden flex flex-col max-h-[80vh] shadow-2xl"
            >
              <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
                <div className="flex items-center gap-2 text-dash-accent font-bold tracking-widest uppercase text-sm">
                  <Info size={16} />
                  Briefing
                </div>
                <button onClick={() => setShowAbout(false)} className="text-slate-500 hover:text-white transition-colors">
                  <RefreshCw size={16} className="rotate-45" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar executive-text">
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-dash-text tracking-tighter">THE GRAND CHESSBOARD: COGNITIVE ARCHITECTURE</h2>
                  <p className="text-slate-400 leading-relaxed">
                    Mission: This is not just a game; it is a Strategic Analogy Engine. By merging Grandmaster chess tactics with Gemini 3 Pro’s reasoning, we translate abstract moves into real-world business and political intelligence.
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="border-l-2 border-dash-accent pl-4 space-y-2">
                    <h3 className="data-label">The Framework</h3>
                    <div className="space-y-4 text-slate-400">
                      <p><span className="text-dash-text font-bold">Geopolitics:</span> Understand "The Center" as a strategic trade corridor (e.g., the Suez Canal).</p>
                      <p><span className="text-dash-text font-bold">Macroeconomics:</span> View Pawn structures as "Market Liquidity" and Knight outposts as "Emerging Market Hubs."</p>
                      <p><span className="text-dash-text font-bold">Regional Strategy:</span> Analyze "Strategic Trade Corridors" and "Mobile Capital" flows across regional hubs.</p>
                      <p><span className="text-white font-bold">Predictive Logic:</span> Train your brain to identify "Black Swan" events before they occur on the board.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-white/5 border-t border-white/5 text-center">
                <button 
                  onClick={() => setShowAbout(false)}
                  className="px-8 py-2 bg-dash-accent/10 border border-dash-accent/20 text-dash-accent text-xs font-bold uppercase tracking-widest hover:bg-dash-accent/20 transition-all rounded"
                >
                  Acknowledge & Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  if (appState === 'START_MENU') return (
    <div className="relative">
      <div className="absolute top-6 right-6 z-50">
        <UserHUD />
      </div>
      <AnimatePresence>
        {showAuth && (
          <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
        )}
      </AnimatePresence>
      <StartMenu />
    </div>
  );

  return (
    <div className="h-screen w-full bg-dash-bg bg-grid font-sans grid grid-cols-1 lg:grid-cols-[1fr_2.5fr_1fr] p-4 lg:p-6 pb-10 gap-6 overflow-hidden select-none relative">
      {/* Left Column: Economic Health */}
      <div className="flex flex-col h-full border border-white/5 bg-white/5 backdrop-blur-xl rounded-lg p-4 overflow-hidden min-h-0">
        <div className="flex items-center gap-2 mb-6 border-b border-white/10 pb-2">
          <Activity size={16} className="text-dash-accent" />
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Economic Health</div>
        </div>
        
        <div className="flex-1 min-h-0 flex items-center justify-center gap-6 px-4">
          {[
            { label: 'STABILITY', value: indicators.stability, display: `${indicators.stability}%`, percent: indicators.stability },
            { label: 'FUNDS', value: indicators.funds, display: `$${indicators.funds}`, percent: Math.min(100, (indicators.funds / 2000) * 100) },
            { label: 'RESOURCES', value: indicators.resources, display: `${indicators.resources}/100`, percent: indicators.resources }
          ].map((ind, i) => (
            <div key={i} className="flex flex-col items-center h-full py-4">
              <div className="text-[10px] font-mono text-dash-accent mb-3">{ind.display}</div>
              <div className="flex-1 w-1 bg-white/5 border border-white/10 rounded-full relative overflow-hidden">
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ 
                    height: `${ind.percent}%`,
                    backgroundColor: ind.label === 'STABILITY' 
                      ? (ind.percent < 30 ? '#ef4444' : ind.percent > 70 ? '#22c55e' : '#3b82f6')
                      : (ind.label === 'FUNDS' ? (ind.value < 0 ? '#ef4444' : '#3b82f6') : '#3b82f6')
                  }}
                  className="absolute bottom-0 left-0 right-0 transition-all duration-1000 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                />
              </div>
              <div className="h-16 flex items-center justify-center mt-4">
                <div className="text-[8px] font-mono text-slate-500 rotate-90 uppercase tracking-widest whitespace-nowrap">
                  {ind.label}
                </div>
              </div>
            </div>
          ))}
        </div>

        <button 
          onClick={() => setShowExitConfirmation(true)}
          className="mt-auto flex items-center justify-center gap-2 p-3 bg-white/5 border border-white/10 rounded hover:bg-white/10 transition-all text-slate-500 hover:text-dash-accent"
        >
          <ChevronLeft size={16} />
          <span className="text-[10px] font-bold uppercase tracking-widest">Exit Command</span>
        </button>
      </div>

      {/* Center Column: Strategic Board */}
      <div className="flex flex-col items-center justify-center h-full relative lg:py-0 min-h-0 overflow-hidden">
        <div className="w-full max-w-[75vh] flex flex-col gap-1 mb-4">
          <div className="flex items-center gap-2 data-label">
            <div className="w-2 h-2 rounded-full bg-dash-accent animate-pulse" />
            Active Session // Operational
          </div>
          <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">
            Perspective: {selectedLens} // {difficulty}
          </div>
          <div className="text-[10px] text-dash-accent font-bold font-mono uppercase tracking-[0.2em] mt-1">
            YOU ARE PLAYING AS: {playerColor === 'w' ? 'WHITE' : 'BLACK'}
          </div>
        </div>

        <div className="w-full max-h-[75vh] max-w-[75vh] aspect-square shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-white/10 rounded-sm bg-[#1a1e26]">
          <Chessboard 
            id="BasicBoard"
            position={game.fen()} 
            onPieceDrop={onDrop} 
            onSquareClick={onSquareClick}
            onSquareRightClick={() => {
              setMoveFrom(null);
              setOptionSquares({});
            }}
            boardOrientation={playerColor === 'w' ? 'white' : 'black'}
            customDarkSquareStyle={{ backgroundColor: '#1a1e26' }}
            customLightSquareStyle={{ backgroundColor: '#2d333d' }}
            customSquareStyles={{
              ...optionSquares
            }}
            customPieces={{
              wP: ({ squareWidth }) => <PieceSVG type="wP" width={squareWidth} />,
              bP: ({ squareWidth }) => <PieceSVG type="bP" width={squareWidth} />,
              wR: ({ squareWidth }) => <PieceSVG type="wR" width={squareWidth} />,
              bR: ({ squareWidth }) => <PieceSVG type="bR" width={squareWidth} />,
              wN: ({ squareWidth }) => <PieceSVG type="wN" width={squareWidth} />,
              bN: ({ squareWidth }) => <PieceSVG type="bN" width={squareWidth} />,
              wB: ({ squareWidth }) => <PieceSVG type="wB" width={squareWidth} />,
              bB: ({ squareWidth }) => <PieceSVG type="bB" width={squareWidth} />,
              wQ: ({ squareWidth }) => <PieceSVG type="wQ" width={squareWidth} />,
              bQ: ({ squareWidth }) => <PieceSVG type="bQ" width={squareWidth} />,
              wK: ({ squareWidth }) => <PieceSVG type="wK" width={squareWidth} />,
              bK: ({ squareWidth }) => <PieceSVG type="bK" width={squareWidth} />,
            }}
          />
        </div>

        <div className="h-12 mt-2 flex flex-col items-center justify-center gap-2">
          {isEngineThinking && (
            <div className="flex items-center gap-2 text-dash-accent animate-pulse font-mono text-[10px] tracking-[0.3em]">
              <RefreshCw size={12} className="animate-spin" />
              OPPONENT_THINKING...
            </div>
          )}

          {isQuotaExceeded && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/50 rounded-full text-red-400 font-mono text-[10px] tracking-wider whitespace-nowrap z-50"
            >
              <AlertTriangle size={12} />
              ORACLE_QUOTA_EXHAUSTED // FALLBACK_ENGINES_ACTIVE
              <button 
                onClick={() => setIsQuotaExceeded(false)}
                className="ml-2 hover:text-white transition-colors"
              >
                <RefreshCw size={10} className="rotate-45" />
              </button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Right Column: Intelligence & News */}
      <div className="grid grid-rows-[auto_1fr_0.4fr] h-full gap-4 overflow-hidden min-h-0">
        {/* User Profile Card */}
        <div className="flex justify-end items-start pt-1">
          <UserHUD />
        </div>

        {/* Strategic Analysis */}
        <div className="min-h-0 flex flex-col border border-white/5 bg-white/5 backdrop-blur-xl rounded-lg overflow-hidden">
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
            <div className="flex items-center gap-2 font-sans text-[10px] font-bold uppercase tracking-widest text-dash-accent">
              <Terminal size={14} />
              Strategic Analysis
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => {
                  setIsMuted(!isMuted);
                  if (isMuted && Howler.ctx) {
                    Howler.ctx.resume().catch(console.error);
                  }
                }}
                className="p-1 text-slate-500 hover:text-dash-accent transition-colors"
                title={isMuted ? "Unmute Tactical Audio" : "Mute Tactical Audio"}
              >
                {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
              </button>
              {isAnalyzing && <RefreshCw size={12} className="animate-spin text-dash-accent" />}
            </div>
          </div>
          {/* SECTION: STRATEGIC ANALYSIS - Clean Build for Vercel */}
    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar font-mono space-y-6">
      
      {/* 1. LAST MANEUVER BOX */}
      {briefingHistory.length > 1 && (
        <div className="space-y-2 opacity-80">
          <div className="text-[9px] text-slate-400 font-bold tracking-[0.2em] uppercase">Last Maneuver</div>
          <div className="p-3 border border-white/20 rounded bg-white/5 text-[11px] leading-relaxed text-slate-200">
            {briefingHistory[briefingHistory.length - 2].text}
          </div>
        </div>
      )}

      {/* 2. ACTIVE CONFLICT BOX */}
      {briefingHistory.length > 0 ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-[9px] text-dash-accent font-bold tracking-[0.2em] uppercase">Active Conflict</div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
              <span className="text-[8px] text-blue-500/70 font-bold uppercase tracking-tighter">Live Intel</span>
            </div>
          </div>
          
          <div className="p-4 border-l-4 border-blue-500 bg-blue-500/5 rounded-r text-[13px] leading-relaxed text-white shadow-[inset_0_0_20px_rgba(59,130,246,0.05)]">
            {briefingHistory[briefingHistory.length - 1].text}
            
            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
              <div className="text-[9px] font-bold text-blue-400/40 uppercase tracking-widest">Status: Operational</div>
              <div className="text-[8px] text-slate-600 uppercase tracking-tighter">
                {briefingHistory[briefingHistory.length - 1].timestamp}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="h-full flex flex-col items-center justify-center opacity-20 space-y-2">
           <div className="text-[10px] uppercase tracking-widest">Awaiting Tactical Uplink...</div>
        </div>
      )}
    </div>
          <div className="text-[8px] text-slate-600 uppercase tracking-tighter">
            {briefingHistory[briefingHistory.length - 1].timestamp}
          </div>
        </div>
      </div>
    </div>
  ) : (
    <div className="h-full flex flex-col items-center justify-center opacity-20 space-y-2">
       <div className="text-[10px] uppercase tracking-widest">Awaiting Tactical Uplink...</div>
    </div>
  )}
</div>
                      Status: {game.isCheck() ? 'Elevated Risk' : 'Operational'}
                    </div>
                    <div className="text-[8px] text-slate-600 uppercase tracking-tighter">
                      {briefingHistory[briefingHistory.length - 1].timestamp}
                    </div>
                  </div>
                  {globalBaseline && (
                    <div className="mt-2 text-[8px] text-blue-500/40 font-mono uppercase tracking-widest border-t border-white/5 pt-2">
                      Global Economic Baseline: {globalBaseline}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center opacity-20 space-y-2">
                <Terminal size={32} />
                <div className="text-[10px] font-bold uppercase tracking-widest">Awaiting Input</div>
              </div>
            )}
          </div>
        </div>

        {/* News Ticker */}
        <div className="min-h-0 flex flex-col border border-white/5 bg-white/5 backdrop-blur-xl rounded-lg overflow-hidden">
          <div className="p-4 border-b border-white/10 flex items-center gap-2 bg-white/5">
            <Globe size={14} className="text-dash-accent" />
            <div className="text-[10px] font-bold text-dash-accent uppercase tracking-widest">Market Impact</div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            <AnimatePresence initial={false}>
              {headlines.map((headline) => (
                <motion.div
                  key={headline.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-3 bg-white/5 border-l-2 border-dash-accent rounded-r text-[11px] font-sans leading-tight text-slate-300"
                >
                  <div className="text-[8px] text-slate-500 mb-1 font-mono uppercase tracking-tighter">Live // {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  {headline.text}
                </motion.div>
              ))}
            </AnimatePresence>
            {headlines.length === 0 && (
              <div className="h-full flex items-center justify-center opacity-20 italic text-[10px] text-center">
                Awaiting volatility...
              </div>
            )}
          </div>
        </div>
      </div>
      <AnimatePresence>
        <WelcomeModal 
          showWelcome={showWelcome} 
          setShowWelcome={setShowWelcome} 
          difficulty={difficulty} 
          selectedLens={selectedLens} 
        />
        <ExitConfirmationModal 
          showExitConfirmation={showExitConfirmation} 
          setShowExitConfirmation={setShowExitConfirmation} 
          setAppState={setAppState} 
          resetGame={resetGame} 
        />
        <GameOverModal 
          isOpen={showGameOver}
          type={gameOverType || 'DEFEAT'}
          stats={{
            turnsTaken,
            finalStability: indicators.stability,
            finalScore: calculateScore(gameOverType || 'DEFEAT', indicators)
          }}
          onRestart={resetGame}
          onExit={() => {
            resetGame();
            setAppState('START_MENU');
          }}
        />
      </AnimatePresence>
    </div>
  );
}
