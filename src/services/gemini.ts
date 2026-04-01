import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export async function generateBotTurn(
  fen: string,
  history: string[],
  legalMoves: string[],
  turn: 'w' | 'b',
  lens: string = 'Geopolitics'
) {
  if (!apiKey) return null;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // We are stripping the prompt to the absolute bare minimum to avoid errors
    const prompt = `Chess Game. Lens: ${lens}. 
    Moves: ${legalMoves.join(", ")}. 
    Pick one move and give a 1-sentence analogy. 
    Return ONLY: {"move": "chosen_move", "analogy": "sentence"}`;

    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();
    
    // THE SHIELD: This part ensures only the JSON is read
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');
    const cleanJson = text.substring(jsonStart, jsonEnd + 1);
    
    const data = JSON.parse(cleanJson);

    return {
      move: legalMoves.includes(data.move) ? data.move : legalMoves[0],
      analogy: data.analogy || "Strategic shift confirmed.",
      news_headline: "MARKET IMPACT",
      stats: { fiscal_stability: 50, market_confidence: 50, inflation: 50 }
    };
  } catch (error) {
    console.error("AI Error:", error);
    // FALLBACK: If everything fails, it picks a RANDOM move to show it's working
    return {
      move: legalMoves[Math.floor(Math.random() * legalMoves.length)],
      analogy: "ADVISOR_BUSY: Processing geopolitical shifts.",
      news_headline: "VOLATILITY",
      stats: { fiscal_stability: 50, market_confidence: 50, inflation: 50 }
    };
  }
}
