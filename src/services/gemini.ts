import { GoogleGenerativeAI } from "@google/generative-ai";

// Force Vite to recognize the environment variable
const apiKey = (import.meta.env as any).VITE_GEMINI_API_KEY || "";

// CRITICAL FIX: Adding 'apiVersion: "v1beta"' to the config
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
    // FORCE v1beta to support gemini-1.5-flash
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash"
    }, { apiVersion: "v1beta" }); 

    const prompt = `CHESS_STRATEGY:
    LEGAL_MOVES: ${legalMoves.join(", ")}
    LENS: ${lens} | DIFFICULTY: ${difficulty}
    
    TASK: Pick ONE move. Return ONLY JSON: {"move": "string", "analogy": "string"}`;

    const result = await model.generateContent(prompt);
    let text = result.response.text().replace(/```json|```/g, "").trim();
    
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1) {
      text = text.substring(start, end + 1);
    }

    const data = JSON.parse(text);
    
    let move = legalMoves.includes(data.move) ? data.move : legalMoves[Math.floor(Math.random() * legalMoves.length)];

    return {
      move: move,
      analogy: data.analogy || "Tactical advancement confirmed.",
      news_headline: "MARKET IMPACT DETECTED",
      stats: { fiscal_stability: 50, market_confidence: 50, inflation: 10 }
    };

  } catch (error: any) {
    console.error("Critical Gemini Error:", error);
    // This fallback keeps the game moving while the UI shows the error
    return {
      move: legalMoves[Math.floor(Math.random() * legalMoves.length)],
      analogy: "Executing automated tactical response due to signal interference.",
      news_headline: "VOLATILITY DETECTED",
      stats: { fiscal_stability: 50, market_confidence: 50, inflation: 50 }
    };
  }
}
