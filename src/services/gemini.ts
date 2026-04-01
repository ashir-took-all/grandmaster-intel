import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export async function generateBotTurn(
  fen: string,
  history: string[],
  legalMoves: string[],
  turn: 'w' | 'b',
  lens: string = 'Geopolitics',
  difficulty: string = 'SENIOR'
) {
  if (!apiKey) return null;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Analyze this chess move through the lens of ${lens}. 
    History: ${history.join(", ")}. 
    1. Select a move from: ${legalMoves.join(", ")}.
    2. Give a 1-sentence strategic analogy.
    Return only a JSON object like this: {"move": "move_here", "analogy": "text_here"}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json|```/g, "").trim();
    const data = JSON.parse(text);

    return {
      move: data.move || legalMoves[0],
      analogy: data.analogy || "Strategic repositioning complete.",
      news_headline: "MARKET VOLATILITY DETECTED.",
      stats: { fiscal_stability: 50, market_confidence: 50, inflation: 50 }
    };
  } catch (error) {
    console.error("Gemini Error:", error);
    // Return a default move so the game doesn't freeze
    return { 
      move: legalMoves[0], 
      analogy: "TACTICAL_RECALIBRATION: Advisor is processing market data.",
      news_headline: "MARKET WATCH ACTIVE",
      stats: { fiscal_stability: 50, market_confidence: 50, inflation: 50 }
    };
  }
}
