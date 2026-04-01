import { GoogleGenerativeAI } from "@google/generative-ai";

// Ensure VITE_ prefix is used
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

    const prompt = `You are a Grandmaster Chess AI. 
    LENS: ${lens} | DIFFICULTY: ${difficulty}
    LEGAL MOVES: ${legalMoves.join(", ")}
    
    TASK: Pick ONE move and provide a 1-sentence strategic analogy.
    RETURN ONLY THIS JSON: {"move": "chosen_move", "analogy": "your_sentence"}`;

    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();
    
    // Clean Markdown
    text = text.replace(/```json|```/g, "").trim();
    
    // Find JSON brackets
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1) {
      text = text.substring(start, end + 1);
    }

    const data = JSON.parse(text);
    
    // Validate Move
    let validatedMove = data.move;
    if (!legalMoves.includes(validatedMove)) {
       validatedMove = legalMoves[Math.floor(Math.random() * legalMoves.length)];
    }

    return {
      move: validatedMove,
      analogy: data.analogy || "Strategic repositioning complete.",
      news_headline: "MARKET IMPACT DETECTED",
      stats: {
        fiscal_stability: Math.floor(Math.random() * 30) + 40,
        market_confidence: Math.floor(Math.random() * 30) + 40,
        inflation: Math.floor(Math.random() * 15)
      }
    };

  } catch (error: any) {
    console.error("Gemini Bridge Error:", error);
    const fallbackMove = legalMoves[Math.floor(Math.random() * legalMoves.length)];
    return {
      move: fallbackMove,
      analogy: "ADVISOR_RECALIBRATING: Processing high-frequency market shifts.",
      news_headline: "VOLATILITY DETECTED",
      stats: { fiscal_stability: 50, market_confidence: 50, inflation: 50 }
    };
  }
}
