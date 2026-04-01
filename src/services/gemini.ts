import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export async function generateBotTurn(
  fen: string,
  history: string[],
  legalMoves: string[],
  turn: 'w' | 'b',
  lens: string = 'Geopolitics',
  difficulty: string = 'GLOBAL'
) {
  if (!apiKey) return null;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // This prompt is engineered to be impossible for the AI to mess up
    const prompt = `You are a Grandmaster Chess Engine.
    LENS: ${lens}
    DIFFICULTY: ${difficulty}
    FEN: ${fen}
    LEGAL MOVES: ${legalMoves.join(", ")}

    STRICT RULES:
    1. If DIFFICULTY is 'GLOBAL', you MUST pick the move that captures the highest value piece or creates the most pressure. Be ruthless.
    2. If DIFFICULTY is 'JUNIOR', pick a random or weak move.
    3. You must respond ONLY with a JSON object. No extra text.

    FORMAT:
    {"move": "chosen_move", "analogy": "One short, brutal strategic sentence.", "headline": "Short headline"}
    `;

    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();
    
    // Cleaning the response to ensure it's pure JSON
    if (text.includes("{")) {
      text = text.substring(text.indexOf("{"), text.lastIndexOf("}") + 1);
    }

    const data = JSON.parse(text);

    // Validate Move
    let finalMove = legalMoves.includes(data.move) ? data.move : legalMoves[Math.floor(Math.random() * legalMoves.length)];

    return {
      move: finalMove,
      analogy: data.analogy || "Strategic maneuver executed.",
      news_headline: data.headline || "MARKET SHIFT.",
      stats: {
        fiscal_stability: Math.floor(Math.random() * 40) + 30,
        market_confidence: Math.floor(Math.random() * 40) + 30,
        inflation: Math.floor(Math.random() * 20)
      }
    };
  } catch (error) {
    console.error("Gemini Critical Error:", error);
    // RANDOM FALLBACK: If the AI fails, it picks a RANDOM legal move
    // This stops the bot from just moving the same top-left piece!
    const fallbackMove = legalMoves[Math.floor(Math.random() * legalMoves.length)];
    return {
      move: fallbackMove,
      analogy: "Executing emergency tactical contingency.",
      news_headline: "MARKET VOLATILITY.",
      stats: { fiscal_stability: 50, market_confidence: 50, inflation: 50 }
    };
  }
}
