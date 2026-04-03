import { GoogleGenerativeAI } from "@google/generative-ai";

// 1. INITIALIZE ENGINE
const apiKey = (import.meta.env as any).VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

/**
 * COMMANDER ASHIR'S STRATEGIC ENGINE
 * This function handles the AI's brain and the Advisor's voice.
 */
export async function generateBotTurn(
  fen: string,
  history: string[],
  legalMoves: string[],
  turn: 'w' | 'b',
  lens: string = 'Geopolitics',
  difficulty: string = 'GLOBAL'
) {
  // SAFETY CHECK: If no API key or no moves, abort to prevent crash.
  if (!apiKey || !legalMoves.length) {
    console.error("Engine Stop: Missing API Key or Legal Moves.");
    return null;
  }

  try {
    // USE THE FASTEST MODEL FOR REAL-TIME REELS
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" }); 

    // 2. DEFINE PERSPECTIVE
    const botColor = turn === 'b' ? 'Black' : 'White';
    const humanColor = turn === 'b' ? 'White' : 'Black';
    
    // 3. BUILD THE "SMART" PROMPT
    const prompt = `
      ROLE: You are a Senior Geopolitical Chess Advisor (Elite Strategist).
      LENS: Analyzing through ${lens} at a ${difficulty} level.
      
      SITUATIONAL AWARENESS:
      - Board State (FEN): ${fen}
      - Recent Moves: ${history.slice(-10).join(" -> ")}
      - Your Role: You are playing as ${botColor}.
      - Opponent: The Human is playing as ${humanColor}.

      INSTRUCTIONS:
      1. SELECT MOVE: Pick the most tactical move from this list: [${legalMoves.join(", ")}].
      2. ANALYZE PERSPECTIVE: 
         - If the LAST move in history was by ${humanColor}, start by explaining THEIR move (e.g., "Commander, your push to...").
         - Then, explain why your upcoming move (${botColor}) is the perfect response.
      3. BREVITY RULE: Keep the total analysis under 50 words (Max 2 sentences).
      4. FORMAT: Return ONLY a valid JSON object.

      JSON STRUCTURE:
      {
        "move": "Use Standard Algebraic Notation (e.g., Nf3)",
        "analysis": "Short, sharp tactical briefing."
      }
    `;

    // 4. EXECUTE AI THOUGHT PROCESS
    const result = await model.generateContent(prompt);
    let responseText = result.response.text().replace(/```json|```/g, "").trim();
    
    // CLEANING THE DATA (Regex to find the JSON block)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Invalid AI Response Format");
    
    const data = JSON.parse(jsonMatch[0]);
    let finalMove = data.move.trim();

    // 5. MOVE VALIDATION (Ensures the AI doesn't "cheat" or hallucinate)
    if (!legalMoves.includes(finalMove)) {
       console.warn(`AI suggested illegal move: ${finalMove}. Falling back to safest option.`);
       finalMove = legalMoves[0]; 
    }

    // 6. RETURN SYNCED DATA TO THE UI
    return {
      move: finalMove,
      text: data.analysis,           // For 'Active Conflict'
      lastManeuver: data.analysis,    // For 'Last Maneuver' (on next turn shift)
      analogy: data.analysis,
      news_headline: `${botColor.toUpperCase()} OPERATIONAL UPDATE`,
      stats: { 
        fiscal_stability: Math.floor(Math.random() * 20) + 60, 
        market_confidence: Math.floor(Math.random() * 20) + 70, 
        inflation: 5 
      }
    };

  } catch (error: any) {
    console.error("Strategic Engine Critical Failure:", error);
    return {
      move: legalMoves[0],
      text: "System recalibrating. Maintaining defensive perimeter.",
      lastManeuver: "Tactical data stream interrupted.",
      analogy: "Engine error fallback initiated.",
      news_headline: "DATA SYNC ERROR",
      stats: { fiscal_stability: 50, market_confidence: 50, inflation: 50 }
    };
  }
}
