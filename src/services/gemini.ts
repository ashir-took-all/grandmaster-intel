import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = (import.meta.env as any).VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export async function generateBotTurn(
  fen: string,
  history: string[],
  legalMoves: string[],
  turn: 'w' | 'b',
  lens: string = 'Geopolitics',
  difficulty: string = 'GLOBAL'
) {
  if (!apiKey || !legalMoves.length) return null;

  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash" 
    }, { apiVersion: "v1beta" }); 

    const currentPlayer = turn === 'w' ? 'White' : 'Black';

    const prompt = `You are a Chess Advisor.
    PLAYER: ${currentPlayer}
    MOVES: ${legalMoves.join(", ")}
    
    TASK:
    1. Pick one move.
    2. Explain in 1 very simple sentence (level: 5-year-old).
    3. Return ONLY this JSON:
    {"move": "chosen_move", "simple": "explanation"}`;

    const result = await model.generateContent(prompt);
    let text = result.response.text().replace(/```json|```/g, "").trim();
    
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1) {
      text = text.substring(start, end + 1);
    }

    const data = JSON.parse(text);
    let finalMove = data.move.trim();
    if (!legalMoves.includes(finalMove)) finalMove = legalMoves[0];

    // THE FIX: We are sending EVERY possible name for a move.
    // This way, no matter what the UI box is named, it finds the data.
    return {
      move: finalMove,
      lastManeuver: finalMove,
      maneuver: finalMove,
      lastMove: finalMove,
      playedMove: finalMove,
      analogy: data.simple || "Moving a piece to help the team.",
      news_headline: `${currentPlayer.toUpperCase()} STRATEGY`,
      stats: { fiscal_stability: 50, market_confidence: 50, inflation: 10 }
    };

  } catch (error: any) {
    console.error("UI Sync Error:", error);
    return {
      move: legalMoves[0],
      lastManeuver: legalMoves[0],
      analogy: "Making a move to a new square.",
      news_headline: "TACTICAL SHIFT",
      stats: { fiscal_stability: 50, market_confidence: 50, inflation: 50 }
    };
  }
}
