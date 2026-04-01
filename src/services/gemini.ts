import { GoogleGenerativeAI } from "@google/generative-ai";

// VITE_ prefix is mandatory for Vercel/Vite environment variables
const apiKey = "AIzaSyASwO4JJc6FkisenR3OYHYbUb5NNV2zYng";
const genAI = new GoogleGenerativeAI(apiKey);

export async function generateBotTurn(
  fen: string,
  history: string[],
  legalMoves: string[],
  turn: 'w' | 'b',
  lens: string = 'Geopolitics',
  difficulty: string = 'GLOBAL'
) {
  if (!apiKey || !legalMoves.length) {
     console.error("System Error: API Key or Legal Moves missing.");
     return null;
  }

  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    // Strategy Logic: Forces aggression on GLOBAL, mistakes on JUNIOR
    const strategy = difficulty === 'GLOBAL' 
      ? "You are a ruthless Grandmaster. Always prioritize capturing pieces (moves with 'x'). Play the absolute best tactical move." 
      : difficulty === 'JUNIOR' 
      ? "Play like a beginner. Make obvious mistakes and avoid complex tactics." 
      : "Play like a professional positional advisor.";

    // Vocabulary Logic: Forces the "Lens" to change the AI's words
    const lingo = lens === 'Cybersecurity' ? "Use cyber terms: breach, firewall, exploit." : 
                  lens === 'Supply Chain' ? "Use logistics terms: bottleneck, inventory, freight." : 
                  "Use geopolitical terms: sanctions, sovereignty, leverage.";

    const prompt = `
      CONTEXT: Chess AI Advisor. 
      BOARD_FEN: ${fen}
      HISTORY: ${history.slice(-10).join(", ")}
      LEGAL_MOVES: ${legalMoves.join(", ")}
      
      RULES:
      1. ${strategy}
      2. ${lingo}
      3. Return ONLY a JSON object. No markdown, no backticks.
      
      JSON_STRUCTURE:
      {
        "move": "EXACT_STRING_FROM_LEGAL_MOVES",
        "analogy": "ONE_SHORT_STRIKING_SENTENCE",
        "headline": "BLOOMBERG_STYLE_HEADLINE"
      }
    `;

    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();
    
    // CRITICAL: Clean any "Studio Noise" (removes backticks or extra text)
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1) {
      text = text.substring(start, end + 1);
    }

    const data = JSON.parse(text);
    
    // VALIDATION: Ensures the "Last Maneuver" box actually sees a real move
    let validatedMove = data.move;
    if (!legalMoves.includes(validatedMove)) {
       // If AI hallucinates, we pick a random move so the game doesn't "Freeze"
       validatedMove = legalMoves[Math.floor(Math.random() * legalMoves.length)];
    }

    return {
      move: validatedMove,
      analogy: data.analogy || "Tactical advancement confirmed.",
      news_headline: data.headline || "MARKET IMPACT DETECTED",
      stats: {
        fiscal_stability: Math.floor(Math.random() * 30) + 40,
        market_confidence: Math.floor(Math.random() * 30) + 40,
        inflation: Math.floor(Math.random() * 10)
      }
    };

  } catch (error) {
    console.error("Oracle Failure:", error);
    // FALLBACK: Keeps the game alive even if the API crashes
    return {
      move: legalMoves[Math.floor(Math.random() * legalMoves.length)],
      analogy: "ADVISOR_OFFLINE: Executing emergency tactical override.",
      news_headline: "VOLATILITY DETECTED",
      stats: { fiscal_stability: 50, market_confidence: 50, inflation: 50 }
    };
  }
}
