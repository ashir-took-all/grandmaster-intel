import { GoogleGenerativeAI } from "@google/generative-ai";

// VITE REQUIREMENT: Use import.meta.env for Vercel compatibility
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
  if (!apiKey) {
    console.error("API Key is missing in Environment Variables");
    return null;
  }

  // 1. DYNAMIC PERSONALITY LOGIC based on Difficulty Level
  const difficultyContext = 
    difficulty === 'JUNIOR' ? 
      "You are a developmental advisor. Play a relaxed game, make occasional tactical mistakes, and use encouraging, simple analogies." :
    difficulty === 'GLOBAL' ? 
      "You are a cold, calculating Super-AI. Play the most brutal, winning move possible. If a capture is available, TAKE IT. No mercy." :
      "You are a professional strategic advisor. Play a balanced, solid, and positional game.";

  // 2. DYNAMIC VOCABULARY LOGIC based on Selected Lens
  const lensContext = 
    lens === 'Cybersecurity' ? 
      "Use terminology like: Firewall, Encryption Breach, Zero-Day, Malware, and System Patch." :
    lens === 'Supply Chain' ? 
      "Use terminology like: Logistics, Bottleneck, Inventory, Lead-Time, Customs, and Distribution." :
      "Use terminology like: Sanctions, Territory, Sovereignty, Leverage, and Diplomatic Immunity.";

  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `
      ROLE: Grandmaster Chess Strategic Oracle.
      CURRENT BOARD (FEN): ${fen}
      MOVE HISTORY: ${history.join(", ")}
      LEGAL MOVES FOR YOU: ${legalMoves.join(", ")}
      
      MISSION PARAMETERS:
      - Perspective: ${lens}
      - Difficulty: ${difficulty}
      - Instruction: ${difficultyContext}
      - Vocabulary: ${lensContext}

      TASK:
      1. Analyze the board and pick ONE move from the LEGAL MOVES list.
      2. Provide a 2-sentence strategic analogy reflecting the chosen move through the ${lens} lens.
      3. Create a short Bloomberg-style news headline.

      RESPONSE FORMAT (STRICT JSON ONLY):
      {
        "move": "the_chosen_move_string",
        "analogy": "your_two_sentence_analysis",
        "news_headline": "your_punchy_headline",
        "stats": {
          "stability": number_0_to_100,
          "funds": number_0_to_100,
          "resources": number_0_to_100
        }
      }
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // Cleanup logic to ensure valid JSON parsing
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const data = JSON.parse(jsonMatch ? jsonMatch[0] : text);

    // MOVE VALIDATION: If AI hallucinates a move, pick a legal one.
    // On GLOBAL difficulty, we pick a random move to ensure variety if the AI fails.
    let finalMove = legalMoves.includes(data.move) ? data.move : legalMoves[Math.floor(Math.random() * legalMoves.length)];

    return {
      move: finalMove,
      analogy: data.analogy || "Strategic repositioning in progress.",
      news_headline: data.news_headline || "MARKET VOLATILITY DETECTED.",
      stats: {
        fiscal_stability: data.stats?.stability || 50,
        market_confidence: data.stats?.funds || 50,
        inflation: data.stats?.resources || 50
      }
    };

  } catch (error) {
    console.error("Gemini Oracle Error:", error);
    // Fallback protocol to keep the game moving
    return {
      move: legalMoves[Math.floor(Math.random() * legalMoves.length)],
      analogy: "TACTICAL_RECALIBRATION: Advisor is currently processing a high-volume data stream. Communications will resume shortly.",
      news_headline: "MARKET WATCH ACTIVE",
      stats: { fiscal_stability: 50, market_confidence: 50, inflation: 50 }
    };
  }
}

// Optional: Game End Analysis
export async function generateFinalPostMortem(history: string[], lens: string) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Summarize this chess game history: ${history.join(", ")} as a 3-sentence post-mortem through the lens of ${lens}.`;
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    return "INTEL_LINK_SEVERED: Final report unavailable.";
  }
}
