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

    // Explicitly telling the AI NOT to repeat the same move
    const prompt = `You are a Grandmaster Chess AI playing as ${turn === 'w' ? 'White' : 'Black'}.
    Current Board (FEN): ${fen}
    History: ${history.join(", ")}
    Perspective: ${lens}
    
    TASK:
    1. Pick the SMARTEST move from this list: ${legalMoves.join(", ")}. Do NOT just pick the first one.
    2. Provide a 1-sentence strategic analogy.
    
    Format your response EXACTLY like this JSON, nothing else:
    {"move": "chosen_move", "analogy": "your_analogy", "headline": "NEWS_STYLE_HEADLINE"}`;

    const result = await model.generateContent(prompt);
    let text = result.response.text();
    
    // Cleanup: Remove any markdown or extra text the AI might add
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const cleanJson = jsonMatch ? jsonMatch[0] : text;
    const data = JSON.parse(cleanJson);

    // Final check: Is the move actually in our legal list?
    const finalMove = legalMoves.includes(data.move) ? data.move : legalMoves[Math.floor(Math.random() * legalMoves.length)];

    return {
      move: finalMove,
      analogy: data.analogy || "Strategic positioning finalized.",
      news_headline: data.headline || "MARKET SHIFT DETECTED.",
      stats: { 
        fiscal_stability: Math.floor(Math.random() * 20) + 40, 
        market_confidence: Math.floor(Math.random() * 20) + 40, 
        inflation: Math.floor(Math.random() * 10) + 5 
      }
    };
  } catch (error) {
    console.error("Gemini Logic Error:", error);
    // If it fails, pick a RANDOM legal move so it's not always the same piece
    const randomMove = legalMoves[Math.floor(Math.random() * legalMoves.length)];
    return { 
      move: randomMove, 
      analogy: "ADVISOR_BUSY: Executing tactical contingency move.",
      news_headline: "MARKET VOLATILITY DETECTED.",
      stats: { fiscal_stability: 50, market_confidence: 50, inflation: 50 }
    };
  }
}
