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

    // THE FIX: We tell the AI that YOU are White and it is playing for BLACK.
    const botColor = turn === 'b' ? 'Black' : 'White';
    const userColor = turn === 'b' ? 'White' : 'Black';

    const prompt = `You are the AI Chess Bot. 
    YOU ARE PLAYING AS: ${botColor}. 
    THE HUMAN IS playing as: ${userColor}.
    MOVES AVAILABLE FOR YOU: ${legalMoves.join(", ")}
    
    TASK:
    1. Pick one move.
    2. Explain it in 5-year-old English. 
    3. IMPORTANT: Use words like "I am moving" or "The ${botColor} horse is moving".
    
    Return ONLY JSON:
    {"move": "chosen_move", "analogy": "explanation", "lastManeuver": "chosen_move"}`;

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

    return {
      move: finalMove,
      lastManeuver: finalMove, // For the UI box
      analogy: data.analogy || "I am making a move.",
      news_headline: `${botColor.toUpperCase()} MANEUVER`,
      stats: { fiscal_stability: 50, market_confidence: 50, inflation: 10 }
    };

  } catch (error: any) {
    console.error("AI Logic Error:", error);
    return {
      move: legalMoves[0],
      lastManeuver: legalMoves[0],
      analogy: "I am moving my piece now.",
      news_headline: "TACTICAL SHIFT",
      stats: { fiscal_stability: 50, market_confidence: 50, inflation: 50 }
    };
  }
}
