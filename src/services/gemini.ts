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

    const prompt = `You are a helpful Chess Advisor.
    LENS: ${lens}
    LEGAL MOVES: ${legalMoves.join(", ")}
    
    TASK:
    1. Pick one move from the list.
    2. Write a VERY SIMPLE 1-sentence explanation of why (No hard words).
    3. Return ONLY JSON: {"move": "chosen_move", "analogy": "simple_sentence"}`;

    const result = await model.generateContent(prompt);
    let text = result.response.text().replace(/```json|```/g, "").trim();
    
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1) {
      text = text.substring(start, end + 1);
    }

    const data = JSON.parse(text);
    
    // UI SYNC: This ensures the "Last Maneuver" box gets the right text format
    let finalMove = data.move.trim();
    if (!legalMoves.includes(finalMove)) {
       finalMove = legalMoves[Math.floor(Math.random() * legalMoves.length)];
    }

    return {
      move: finalMove,
      analogy: data.analogy || "Moving to a better spot on the board.",
      news_headline: `${lens.toUpperCase()} UPDATE`,
      stats: { fiscal_stability: 50, market_confidence: 50, inflation: 10 }
    };

  } catch (error: any) {
    console.error("AI Error:", error);
    return {
      move: legalMoves[0],
      analogy: "Thinking about the next move...",
      news_headline: "MARKET WATCH",
      stats: { fiscal_stability: 50, market_confidence: 50, inflation: 50 }
    };
  }
}
