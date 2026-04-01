import { GoogleGenerativeAI } from "@google/generative-ai";

// This pulls the key you saved in Vercel
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
  if (!apiKey) {
    return { 
      move: legalMoves[0], 
      analogy: "API_KEY_MISSING: Check Vercel Environment Variables.",
      news_headline: "SYSTEM OFFLINE",
      stats: { fiscal_stability: 0, market_confidence: 0, inflation: 0 }
    };
  }

  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `Analyze this chess game through the lens of ${lens}. 
    Moves: ${history.join(", ")}. FEN: ${fen}.
    Provide a JSON response with: user_move_analogy, move (from ${legalMoves.join(", ")}), analogy, news_headline, and stats (fiscal_stability, market_confidence, inflation).`;

    const result = await model.generateContent(prompt);
    const data = JSON.parse(result.response.text());

    // Ensure the move is actually legal
    if (!legalMoves.includes(data.move)) {
      data.move = legalMoves[0];
    }
    
    return data;
  } catch (error) {
    console.error("Gemini Error:", error);
    return { 
      move: legalMoves[0], 
      analogy: "COMMUNICATIONS_JAMMED: Intelligence link failed.",
      news_headline: "MARKET VOLATILITY DETECTED.",
      stats: { fiscal_stability: 50, market_confidence: 50, inflation: 50 }
    };
  }
}
