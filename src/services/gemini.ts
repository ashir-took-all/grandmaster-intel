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
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" }); 

    const botColor = turn === 'b' ? 'Black' : 'White';
    const humanColor = turn === 'b' ? 'White' : 'Black';

    // THE PROMPT: Simple, direct, and focused.
    const prompt = `You are an elite Chess Advisor. 
    LENS: ${lens} | DIFFICULTY: ${difficulty}
    YOUR_ROLE: Playing as ${botColor} against User (${humanColor}).
    LEGAL_MOVES: ${legalMoves.join(", ")}

    TASK:
    1. Pick one move.
    2. Explain it in 2 SHORT sentences. 
    3. If the Human just moved, say "Commander, your move to...". If you are moving, say "I am deploying...".

    Return ONLY JSON:
    {"move": "SAN_MOVE", "analysis": "SHORT_TEXT"}`;

    const result = await model.generateContent(prompt);
    let text = result.response.text().replace(/```json|```/g, "").trim();
    
    // THE SURGICAL FIX: Safely find the JSON data
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    const data = JSON.parse(text.substring(start, end + 1));
    
    let finalMove = data.move.trim();
    if (!legalMoves.includes(finalMove)) finalMove = legalMoves[0];

    // THE SYNC: This maps everything to the right boxes
    return {
      move: finalMove,
      text: data.analysis,           // Fills Active Conflict
      lastManeuver: data.analysis,    // Will fill Last Maneuver on next turn
      analogy: data.analysis,
      news_headline: `${botColor.toUpperCase()} STRATEGIC SHIFT`,
      stats: { fiscal_stability: 78, market_confidence: 85, inflation: 4 }
    };

  } catch (error: any) {
    console.error("Engine Error:", error);
    return {
      move: legalMoves[0],
      text: "Securing the center to maintain pressure.",
      lastManeuver: "Securing the center to maintain pressure.",
      analogy: "Strategic realignment.",
      news_headline: "TACTICAL SHIFT",
      stats: { fiscal_stability: 65, market_confidence: 70, inflation: 8 }
    };
  }
}
