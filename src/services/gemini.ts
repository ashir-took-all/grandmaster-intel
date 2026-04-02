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

    const botColor = turn === 'b' ? 'Black' : 'White';

    const prompt = `You are a Pro Chess Strategist. 
    YOUR_COLOR: ${botColor} | MOVES: ${legalMoves.join(", ")}
    
    TASK:
    1. Pick one move.
    2. Explain it in 1 short sentence (18-year-old level).
    3. Provide the move in Standard Algebraic Notation (SAN) if possible.
    
    Return ONLY JSON:
    {"move": "chosen_move", "san": "move_name", "analysis": "short_sentence"}`;

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

    // THE OVERRIDE: We send the "San" name (like Qf6) to the Last Maneuver box.
    // If "san" is missing, we use the move itself.
    const displayMove = data.san || finalMove;

    return {
      move: finalMove,
      // We are flooding the response with every key the UI might be asking for
      lastManeuver: displayMove,
      lastMove: displayMove,
      maneuver: displayMove,
      analogy: data.analysis || "Improving coordination for board control.",
      news_headline: `${botColor.toUpperCase()} STRATEGIC MANEUVER`,
      stats: { fiscal_stability: 65, market_confidence: 60, inflation: 10 }
    };

  } catch (error: any) {
    console.error("Critical UI Sync Error:", error);
    return {
      move: legalMoves[0],
      lastManeuver: legalMoves[0],
      analogy: "Adjusting positions to maintain pressure.",
      news_headline: "TACTICAL REALIGNMENT",
      stats: { fiscal_stability: 50, market_confidence: 50, inflation: 50 }
    };
  }
}
