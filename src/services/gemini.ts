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

    const botColor = turn === 'b' ? 'Black' : 'White';
    const humanColor = turn === 'b' ? 'White' : 'Black';

    const prompt = `You are the Grandmaster Intel AI, a pro-level Chess Strategist.
    CONTEXT: Playing as ${botColor} against a Human playing as ${humanColor}.
    LENS: ${lens} | DIFFICULTY: ${difficulty}
    
    LEGAL_MOVES_AVAILABLE: ${legalMoves.join(", ")}
    RECENT_HISTORY: ${history.slice(-10).join(", ")}

    YOUR TASKS:
    1. Pick the best strategic move from the list.
    2. Explain the move like a smart 18-year-old coach (Tactical, direct, no baby talk).
    3. IMPORTANT: Return the move in Standard Algebraic Notation (SAN). 
       Example: Use 'Nf3' or 'e4' or 'O-O'. Do NOT use coordinates like 'g1f3' or 'e2e4'.

    Return ONLY JSON:
    {
      "move": "san_notation_move",
      "analysis": "one_sentence_explanation"
    }`;

    const result = await model.generateContent(prompt);
    let text = result.response.text().replace(/```json|```/g, "").trim();
    
    // Safety JSON parsing
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1) {
      text = text.substring(start, end + 1);
    }

    const data = JSON.parse(text);
    let finalMove = data.move.trim();

    // LOOP BREAKER: Prevent moving the same piece back and forth if possible
    if (history.length > 2 && history[history.length - 2] === finalMove && legalMoves.length > 1) {
        finalMove = legalMoves.find(m => m !== finalMove) || legalMoves[0];
    }

    // Validation: Ensure the AI's SAN move is actually in our legal list
    if (!legalMoves.includes(finalMove)) {
       finalMove = legalMoves[0];
    }

    return {
      move: finalMove,
      lastManeuver: finalMove, // This feeds the UI box
      analogy: data.analysis || "Adjusting positioning to maintain board pressure.",
      news_headline: `${botColor.toUpperCase()} STRATEGIC SHIFT`,
      stats: { fiscal_stability: 65, market_confidence: 70, inflation: 12 }
    };

  } catch (error: any) {
    console.error("Grandmaster Engine Error:", error);
    const fallback = legalMoves[0];
    return {
      move: fallback,
      lastManeuver: fallback,
      analogy: "Repositioning assets to secure the perimeter.",
      news_headline: "TACTICAL REALIGNMENT",
      stats: { fiscal_stability: 50, market_confidence: 50, inflation: 50 }
    };
  }
}
