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
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `CHESS_STRATEGY_ENGINE:
    LENS: ${lens} | DIFFICULTY: ${difficulty} | FEN: ${fen}
    LEGAL_MOVES: ${legalMoves.join(", ")}
    
    INSTRUCTION: Pick one move and give a 1-sentence strategic analogy.
    FORMAT: {"move": "chosen_move", "analogy": "sentence"}`;

    const result = await model.generateContent(prompt);
    const rawText = result.response.text();
    
    // --- SAFE EXTRACTION LOGIC ---
    let move = "";
    let analogy = "";

    // Try to find a legal move mentioned in the text if JSON fails
    const foundMove = legalMoves.find(m => rawText.includes(m));
    move = foundMove || legalMoves[Math.floor(Math.random() * legalMoves.length)];

    try {
      // Try standard JSON cleaning
      const cleanJson = rawText.replace(/```json|```/g, "").trim();
      const data = JSON.parse(cleanJson.substring(cleanJson.indexOf('{'), cleanJson.lastIndexOf('}') + 1));
      if (legalMoves.includes(data.move)) move = data.move;
      analogy = data.analogy;
    } catch (e) {
      // Fallback analogy if JSON is broken but move was found
      analogy = `Strategic pivot executed via ${move} to secure market position.`;
    }

    return {
      move: move,
      analogy: analogy,
      news_headline: `${lens.toUpperCase()} SHIFT DETECTED`,
      stats: {
        fiscal_stability: Math.floor(Math.random() * 40) + 30,
        market_confidence: Math.floor(Math.random() * 40) + 30,
        inflation: 10
      }
    };

  } catch (error: any) {
    console.error("Critical Gemini Error:", error);
    return {
      move: legalMoves[Math.floor(Math.random() * legalMoves.length)],
      analogy: "Intelligence link unstable. Executing automated tactical response.",
      news_headline: "MARKET VOLATILITY",
      stats: { fiscal_stability: 50, market_confidence: 50, inflation: 50 }
    };
  }
}
