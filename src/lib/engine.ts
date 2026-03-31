import { Chess } from 'chess.js';

/**
 * Basic evaluation function for the chess board.
 * Positive values favor White, negative values favor Black.
 */
function evaluateBoard(game: Chess): number {
  let totalEvaluation = 0;
  const board = game.board();
  
  const pieceValues: Record<string, number> = {
    p: 10,
    n: 30,
    b: 30,
    r: 50,
    q: 90,
    k: 900,
  };

  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const piece = board[i][j];
      if (piece) {
        const value = pieceValues[piece.type] || 0;
        totalEvaluation += piece.color === 'w' ? value : -value;
      }
    }
  }
  return totalEvaluation;
}

/**
 * Minimax algorithm with Alpha-Beta pruning.
 */
function minimax(
  game: Chess, 
  depth: number, 
  alpha: number, 
  beta: number, 
  isMaximizingPlayer: boolean
): number {
  if (depth === 0 || game.isGameOver()) {
    // For the bot (Black), we want to minimize the evaluation (favor Black)
    // So we return the negative evaluation if we are looking for Black's best move
    return evaluateBoard(game);
  }

  const moves = game.moves();

  if (isMaximizingPlayer) {
    let bestEval = -Infinity;
    for (const move of moves) {
      game.move(move);
      const evaluation = minimax(game, depth - 1, alpha, beta, false);
      game.undo();
      bestEval = Math.max(bestEval, evaluation);
      alpha = Math.max(alpha, evaluation);
      if (beta <= alpha) break;
    }
    return bestEval;
  } else {
    let bestEval = Infinity;
    for (const move of moves) {
      game.move(move);
      const evaluation = minimax(game, depth - 1, alpha, beta, true);
      game.undo();
      bestEval = Math.min(bestEval, evaluation);
      beta = Math.min(beta, evaluation);
      if (beta <= alpha) break;
    }
    return bestEval;
  }
}

/**
 * Returns the best move for the current player based on difficulty.
 */
export function getBestMove(game: Chess, difficulty: 'JUNIOR' | 'SENIOR' | 'GLOBAL'): string | null {
  const moves = game.moves();
  if (moves.length === 0) return null;

  // Junior: Random move for a "market volatility" feel
  if (difficulty === 'JUNIOR') {
    return moves[Math.floor(Math.random() * moves.length)];
  }

  // Senior: Depth 2 (Positional awareness)
  // Global: Depth 3 (Predictive planning)
  const depth = difficulty === 'GLOBAL' ? 3 : 2;
  const isWhite = game.turn() === 'w';
  
  let bestMove = null;
  let bestValue = isWhite ? -Infinity : Infinity;

  for (const move of moves) {
    game.move(move);
    const boardValue = minimax(game, depth - 1, -Infinity, Infinity, !isWhite);
    game.undo();
    
    if (isWhite) {
      if (boardValue > bestValue) {
        bestValue = boardValue;
        bestMove = move;
      }
    } else {
      if (boardValue < bestValue) {
        bestValue = boardValue;
        bestMove = move;
      }
    }
  }

  return bestMove || moves[0];
}
