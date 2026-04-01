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
    // SWITCHING TO gemini-pro FOR MAXIMUM COMPATIBILITY
    const model = genAI.getGenerativeModel({ 
      model: "gemini-pro" 
    }); 

    const prompt = `You are a Chess Strategist.
    LEGAL MOVES: ${legalMoves.join(", ")}
    LENS: ${lens}
    TASK: Pick ONE move. Return ONLY JSON: {"move": "chosen_move", "analogy": "one short sentence"}`;

    const result = await model.generateContent(prompt);
    let text = result.response.text().replace(/```json|```/g, "").trim();
    
    // Clean JSON
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1) {
      text = text.substring(start, end + 1);
    }

    const data = JSON.parse(text);
    
    let move = legalMoves.includes(data.move) ? data.move : legalMoves[Math.floor(Math.random() * legalMoves.length)];

    return {
      move: move,
      analogy: data.analogy || "Strategic pivot executed.",
      news_headline: "MARKET IMPACT DETECTED",
      stats: { fiscal_stability: 50, market_confidence: 50, inflation: 10 }
    };

  } catch (error: any) {
    console.error("Critical Gemini Error:", error);
    return {
      move: legalMoves[Math.floor(Math.random() * legalMoves.length)],
      analogy: "Intelligence link unstable. Executing automated tactical response.",
      news_headline: "VOLATILITY DETECTED",
      stats: { fiscal_stability: 50, market_confidence: 50, inflation: 50 }
    };
  }
}
