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
  if (!apiKey || !legalMoves || legalMoves.length === 0) return null;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" }); 

    const botColor = turn === 'b' ? 'Black' : 'White';
    const humanColor = turn === 'b' ? 'White' : 'Black';

    // SIMPLEST PROMPT POSSIBLE: No room for error.
    const prompt = `You are a Chess Advisor. Play as ${botColor}.
    VALID_MOVES: [${legalMoves.join(", ")}]
    
    TASK:
    1. Pick one move from the list.
    2. Write a 2-sentence strategy. 
    3. Use "Commander, your move..." if you are explaining the human's play.
    
    Return ONLY JSON:
    {"move": "SAN_MOVE", "analysis": "SHORT_TEXT"}`;

    const result = await model.generateContent(prompt);
    let rawText = result.response.text();
    
    // SURGICAL EXTRACTION: Cuts out any talking before or after the JSON
    const start = rawText.indexOf('{');
    const end = rawText.lastIndexOf('}');
    const data = JSON.parse(rawText.substring(start, end + 1));
    
    let finalMove = data.move.trim();

    // PIECE PROTECTION: Ensures the piece actually moves legally
    if (!legalMoves.includes(finalMove)) {
       finalMove = legalMoves[0];
    }

    return {
      move: finalMove,
      text: data.analysis,           // Fills Active Conflict
      lastManeuver: data.analysis,    // Saved for the next turn shift
      analogy: data.analysis,
      news_headline: `${botColor.toUpperCase()} STRATEGIC MANEUVER`, // Professional Headline
      stats: { fiscal_stability: 78, market_confidence: 85, inflation: 4 }
    };

  } catch (error: any) {
    console.error("Engine Fallback:", error);
    // STABLE FALLBACK: What shows if the AI fails
    const safeMove = legalMoves[0];
    return {
      move: safeMove,
      text: "Securing the center. Commander, your positioning requires a tactical response.",
      lastManeuver: "Maintaining defensive integrity across the front line.",
      analogy: "Strategic realignment.",
      news_headline: "TACTICAL UPDATE",
      stats: { fiscal_stability: 60, market_confidence: 60, inflation: 10 }
    };
  }
}
