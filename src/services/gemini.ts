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
    // 2026 UPDATE: Using gemini-2.5-flash for maximum speed and stability
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash" 
    }, { apiVersion: "v1beta" }); 

    const prompt = `You are a Grandmaster Chess AI (Grandmaster Intel).
    LEGAL MOVES: ${legalMoves.join(", ")}
    LENS: ${lens} | DIFFICULTY: ${difficulty}
    
    TASK: Pick ONE move. Return ONLY JSON: {"move": "chosen_move", "analogy": "one short strategy sentence"}`;

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
      analogy: data.analogy || "Strategic maneuver executed.",
      news_headline: `${lens.toUpperCase()} UPDATE`,
      stats: { fiscal_stability: 50, market_confidence: 50, inflation: 10 }
    };

  } catch (error: any) {
    console.error("Critical Gemini Error:", error);
    return {
      move: legalMoves[Math.floor(Math.random() * legalMoves.length)],
      analogy: "Signal interference detected. Executing emergency tactical protocol.",
      news_headline: "MARKET VOLATILITY",
      stats: { fiscal_stability: 50, market_confidence: 50, inflation: 50 }
    };
  }
}
