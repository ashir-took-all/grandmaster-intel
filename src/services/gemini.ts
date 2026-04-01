import { GoogleGenerativeAI } from "@google/generative-ai";

// VITE REQUIREMENT: Use import.meta.env and the VITE_ prefix
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export async function generateBotTurn(
  fen: string,
  history: string[],
  legalMoves: string[],
  turn: 'w' | 'b',
  lens: string = 'Geopolitics',
  difficulty: string = 'SENIOR',
  baseline?: string | null
) {
  // If the key is missing, this will trigger the error block below
  if (!apiKey) {
    throw new Error("API key is missing. Check Vercel Environment Variables.");
  }

  const turnColor = turn === 'w' ? 'White' : 'Black';
  const difficultyContext = 
    difficulty === 'JUNIOR' ? 'The adversary is showing signs of market volatility.' :
    difficulty === 'GLOBAL' ? 'The adversary is executing a precision-engineered takeover.' :
    'The adversary is a balanced, positional strategist.';

  const prompt = `
    CURRENT FEN: ${fen}
    MOVE HISTORY: ${history.join(", ")}
    LEGAL MOVES: ${legalMoves.join(", ")}
    TASK: Analyze through the lens of ${lens}. Select best move for ${turnColor}.
    RESPONSE FORMAT: JSON
    {
      "user_move_analogy": "string",
      "move": "string",
      "analogy": "string",
      "news_headline": "string",
      "stats": { "fiscal_stability": 50, "market_confidence": 50, "inflation": 50 }
    }
  `;

  try {
    // Vite uses the latest Gemini model names
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const data = JSON.parse(text);

    // Validate that the AI actually picked a legal move
    if (!legalMoves.includes(data.move)) {
      data.move = legalMoves[0];
    }
    
    return data;
  } catch (error: any) {
    console.error("Gemini Error:", error);
    return { 
      move: legalMoves[0], 
      analogy: "COMMUNICATIONS_JAMMED: Executing default protocol.",
      news_headline: "MARKET VOLATILITY DETECTED.",
      stats: { fiscal_stability: 50, market_confidence: 50, inflation: 50 }
    };
  }
}
