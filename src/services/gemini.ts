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

    // THE UPGRADE: 18-year-old Strategy Coach Persona
    const prompt = `You are a High-Level Chess Strategist. 
    LENS: ${lens} | YOUR COLOR: ${botColor}
    LEGAL MOVES: ${legalMoves.join(", ")}
    HISTORY: ${history.slice(-10).join(", ")}

    STRICT GUIDELINES:
    1. Explain the move like a 18-year-old coach (Smart, direct, tactical).
    2. Focus on "Controlling the center" or "Developing pieces." 
    3. NO "baby talk" or "toys." Talk about "Pressure" and "Position."
    4. BREAK THE LOOP: Do not move the same piece back and forth.
    
    Return ONLY JSON:
    {"move": "chosen_move", "strategy": "short_direct_explanation"}`;

    const result = await model.generateContent(prompt);
    let text = result.response.text().replace(/```json|```/g, "").trim();
    
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1) {
      text = text.substring(start, end + 1);
    }

    const data = JSON.parse(text);
    let finalMove = data.move.trim();

    // LOOP BREAKER: Logic to prevent the horse from dancing in circles
    if (history.length > 2 && history[history.length - 2] === finalMove && legalMoves.length > 1) {
        finalMove = legalMoves.find(m => m !== finalMove) || legalMoves[0];
    }
    if (!legalMoves.includes(finalMove)) finalMove = legalMoves[0];

    return {
      move: finalMove,
      // SHOTGUN MAPPING: Sending the move to every possible key name
      lastManeuver: finalMove,
      maneuver: finalMove,
      lastMove: finalMove,
      playedMove: finalMove,
      analogy: data.strategy || "Improving piece coordination for board control.",
      news_headline: `${botColor.toUpperCase()} STRATEGIC MANEUVER`,
      stats: { fiscal_stability: 60, market_confidence: 65, inflation: 8 }
    };

  } catch (error: any) {
    console.error("Coach Error:", error);
    const fallback = legalMoves[Math.floor(Math.random() * legalMoves.length)];
    return {
      move: fallback,
      lastManeuver: fallback,
      analogy: "Adjusting positions to maintain pressure.",
      news_headline: "TACTICAL REALIGNMENT",
      stats: { fiscal_stability: 50, market_confidence: 50, inflation: 50 }
    };
  }
}
