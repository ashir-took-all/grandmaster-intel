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
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" }); 

    const botColor = turn === 'b' ? 'Black' : 'White';
    const humanColor = turn === 'b' ? 'White' : 'Black';

    // THE BRAIN: Teaching the AI exactly who is moving and how to talk
    const prompt = `You are a Senior Geopolitical Advisor.
    PLAYER_ROLE: ${humanColor} (Commander/User)
    AI_ROLE: ${botColor} (Strategist)
    LENS: ${lens} | DIFFICULTY: ${difficulty}
    
    BOARD_HISTORY: ${history.slice(-10).join(" -> ")}
    LEGAL_MOVES: ${legalMoves.join(", ")}

    INSTRUCTIONS:
    1. Select the best move from the LEGAL_MOVES list.
    2. ANALYSIS PERSPECTIVE: 
       - If the LAST move was by ${humanColor}, start by explaining THEIR move (e.g., "Commander, your push to...").
       - If YOU (${botColor}) are moving, explain YOUR strategy (e.g., "I am responding with...").
    3. BREVITY: Max 2 short sentences. No walls of text.
    4. FORMAT: Return ONLY a JSON object. No extra talking.

    JSON_TEMPLATE:
    {
      "move": "SAN_MOVE",
      "analysis": "Short 2-sentence briefing."
    }`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    
    // SURGICAL CLEANING: Find only the JSON block to prevent "Sync Errors"
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    
    if (start === -1 || end === -1) throw new Error("Invalid AI Response");
    
    const cleanJson = text.substring(start, end + 1);
    const data = JSON.parse(cleanJson);
    
    let finalMove = data.move.trim();

    // VALIDATION: Ensure the move exists in the legal list
    if (!legalMoves.includes(finalMove)) {
       finalMove = legalMoves[0];
    }

    // FINAL DATA SYNC: Feeds both boxes and the Market Impact
    return {
      move: finalMove,
      text: data.analysis,
      lastManeuver: data.analysis,
      analogy: data.analysis,
      news_headline: `${botColor.toUpperCase()} STRATEGIC SHIFT`,
      stats: { 
        fiscal_stability: 70, 
        market_confidence: 75, 
        inflation: 5 
      }
    };

  } catch (error: any) {
    console.error("Critical Engine Error:", error);
    // FALLBACK: Prevents the UI from showing empty boxes if AI fails
    const fallback = legalMoves[0];
    return {
      move: fallback,
      text: "Securing tactical perimeter. System recalibrating for next phase.",
      lastManeuver: "Data link stabilized. Awaiting commander's next move.",
      analogy: "Tactical realignment initiated.",
      news_headline: "ENGINE STABILIZED",
      stats: { fiscal_stability: 50, market_confidence: 50, inflation: 50 }
    };
  }
}
