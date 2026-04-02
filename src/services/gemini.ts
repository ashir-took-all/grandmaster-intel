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

    // THE FIX: We tell the AI exactly who is moving right now
    const currentPlayer = turn === 'w' ? 'White' : 'Black';

    const prompt = `You are a Chess Strategy Advisor.
    CURRENT_PLAYER_MOVING: ${currentPlayer}
    MOVES_LIST: ${legalMoves.join(", ")}
    
    TASK:
    1. Pick one move for ${currentPlayer}.
    2. Explain it in VERY SIMPLE English (Level: 5-year-old).
    3. Return ONLY this JSON:
    {
      "move": "chosen_move", 
      "analogy": "simple_explanation"
    }`;

    const result = await model.generateContent(prompt);
    let text = result.response.text().replace(/```json|```/g, "").trim();
    
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1) {
      text = text.substring(start, end + 1);
    }

    const data = JSON.parse(text);
    
    let finalMove = data.move.trim();
    if (!legalMoves.includes(finalMove)) {
       finalMove = legalMoves[0];
    }

    // THE UI SYNC: We send the move to EVERY possible key 
    // to ensure "Last Maneuver" and "Active Conflict" both see it.
    return {
      move: finalMove,
      lastManeuver: finalMove,
      lastMove: finalMove,
      analogy: data.analogy || "I am making a good move for my team.",
      news_headline: `${currentPlayer.toUpperCase()} STRATEGY`,
      stats: { fiscal_stability: 50, market_confidence: 50, inflation: 10 }
    };

  } catch (error: any) {
    console.error("AI Logic Error:", error);
    return {
      move: legalMoves[0],
      lastManeuver: legalMoves[0],
      analogy: "I am moving my piece to a better square.",
      news_headline: "TACTICAL SHIFT",
      stats: { fiscal_stability: 50, market_confidence: 50, inflation: 50 }
    };
  }
}
