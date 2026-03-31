import { GoogleGenAI, Type } from "@google/genai";
import { withRetry } from "../lib/api-utils";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function generateBotTurn(
  fen: string,
  history: string[],
  legalMoves: string[],
  turn: 'w' | 'b',
  lens: string = 'Geopolitics',
  difficulty: string = 'SENIOR',
  baseline?: string | null
) {
  const turnColor = turn === 'w' ? 'White' : 'Black';
  const difficultyContext = 
    difficulty === 'JUNIOR' ? 'The adversary is showing signs of market volatility and uncoordinated expansion. Play a move that is strategically sound but not overly aggressive.' :
    difficulty === 'GLOBAL' ? 'The adversary is executing a precision-engineered hostile takeover. Play the absolute best tactical move to crush the opponent.' :
    'The adversary is a balanced, positional strategist with tactical awareness. Play a solid, professional move.';

  const prompt = `
    CURRENT FEN: ${fen}
    MOVE HISTORY (Last 10): ${history.join(", ")}
    ${baseline ? `GLOBAL ECONOMIC BASELINE (Pre-Buffer): ${baseline}` : ""}
    LEGAL MOVES: ${legalMoves.join(", ")}
    ADVERSARY PROFILE: ${difficultyContext}
    
    TASK:
    1. ${history.length > 0 ? `Analyze the LAST MOVE in the MOVE HISTORY (the user's move) through the lens of ${lens}.` : "This is the start of the game. Provide a brief opening statement about the current geopolitical/economic climate."}
    2. Select the best move from the LEGAL MOVES list for ${turnColor}.
    3. Provide a strategic analysis (analogy) of THIS NEW MOVE (${turnColor}'s move) through the lens of ${lens}.
    4. Generate a news headline and economic stats reflecting the current state of the game.
    
    RESPONSE FORMAT: JSON
    {
      "user_move_analogy": "STRATEGIC_ANALYSIS_OF_USER_MOVE_OR_OPENING_STATEMENT",
      "move": "SAN_MOVE_STRING",
      "analogy": "STRATEGIC_ANALYSIS_OF_BOT_MOVE",
      "news_headline": "SHORT_BLOOMBERG_STYLE_HEADLINE",
      "stats": {
        "fiscal_stability": number (0-100),
        "market_confidence": number (0-100),
        "inflation": number (0-100)
      }
    }
  `;

  try {
    const response = await withRetry(() => ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: `You are the 'Chief Strategic Officer'. Your purpose is to analyze chess moves through the lens of ${lens}.
        VOICE RULES:
        - Use high-impact, short sentences (Max 10 words per bullet).
        - Use 'Impact Verbs' (e.g., 'Blocks', 'Seizes', 'Crashes', 'Secures', 'Dominates').
        - Use simple English that a 15-year-old can understand.
        - No academic jargon or complex 'textbook' language.
        - Keep each analysis under 2 bullet points.
        - News headline should be a short, punchy news ticker style string (max 10 words).
        - Stats should reflect the strategic balance of the game.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            user_move_analogy: { type: Type.STRING },
            move: { type: Type.STRING },
            analogy: { type: Type.STRING },
            news_headline: { type: Type.STRING },
            stats: {
              type: Type.OBJECT,
              properties: {
                fiscal_stability: { type: Type.NUMBER },
                market_confidence: { type: Type.NUMBER },
                inflation: { type: Type.NUMBER }
              },
              required: ["fiscal_stability", "market_confidence", "inflation"]
            }
          },
          required: ["user_move_analogy", "move", "analogy", "news_headline", "stats"]
        }
      }
    }));
    
    const text = response.text || "{}";
    const data = JSON.parse(text);
    
    // ONE-AND-DONE RULE: Extract only the first valid move notation that exists in legalMoves
    if (data.move && typeof data.move === 'string') {
      // Find the first word that matches a legal move
      const words = data.move.split(/\s+/);
      const firstLegalMove = words.find((word: string) => {
        const cleanWord = word.replace(/[.?!,]/g, '');
        return legalMoves.includes(cleanWord);
      });
      
      if (firstLegalMove) {
        data.move = firstLegalMove.replace(/[.?!,]/g, '');
      } else {
        // Fallback: search the entire response text if the 'move' field is hallucinated
        const allWords = text.split(/\s+/);
        const foundMove = allWords.find((word: string) => {
          const cleanWord = word.replace(/[.?!,]/g, '');
          return legalMoves.includes(cleanWord);
        });
        if (foundMove) data.move = foundMove.replace(/[.?!,]/g, '');
      }
    }

    // Validate move is legal
    if (!legalMoves.includes(data.move)) {
      return { 
        move: legalMoves[0], 
        analogy: "TACTICAL_RECALIBRATION: Executing secondary contingency.",
        news_headline: "MARKET VOLATILITY DETECTED.",
        stats: { fiscal_stability: 50, market_confidence: 50, inflation: 50 }
      };
    }
    return data;
  } catch (error: any) {
    console.error("Gemini Bot Turn Error:", error);
    const isQuotaExceeded = error?.message?.includes('429') || error?.status === 429 || error?.error?.status === 'RESOURCE_EXHAUSTED';
    
    return { 
      move: legalMoves[0], 
      analogy: isQuotaExceeded 
        ? "QUOTA_EXHAUSTED: The Global Strategy Oracle is currently over-capacity. Please wait for the market to stabilize (quota reset)."
        : "COMMUNICATIONS_JAMMED: Executing default protocol.",
      news_headline: isQuotaExceeded ? "ORACLE OVER-CAPACITY DETECTED." : "MARKET VOLATILITY DETECTED.",
      stats: { fiscal_stability: 50, market_confidence: 50, inflation: 50 }
    };
  }
}

export async function generateFinalPostMortem(history: string[], lens: string = 'Geopolitics', difficulty: string = 'SENIOR') {
  const prompt = `
    LENS: ${lens}
    DIFFICULTY: ${difficulty}
    FULL MOVE HISTORY: ${history.join(", ")}
    
    The Task: Summarize the entire game in exactly 3 sentences as a post-mortem business/geopolitical analysis.
    Example: 'Despite a strong opening, your over-leveraged middle-game led to a liquidity crisis on the kingside, allowing the adversary to complete a hostile takeover.'
  `;

  try {
    const response = await withRetry(() => ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: `You are the 'Chief Strategic Officer'. Your purpose is to provide a final post-mortem analysis of a completed chess match.
        VOICE RULES:
        - Use high-impact, short sentences (Max 10 words per sentence).
        - Use 'Impact Verbs' (e.g., 'Blocks', 'Seizes', 'Crashes', 'Secures', 'Dominates').
        - Use simple English that a 15-year-old can understand.
        - No academic jargon or complex 'textbook' language.
        - Keep the summary to exactly 3 sentences.`
      }
    }));
    return response.text || "INTEL_LINK_SEVERED: FINAL_REPORT_UNAVAILABLE.";
  } catch (error: any) {
    console.error("Gemini Post-Mortem Error:", error);
    const isQuotaExceeded = error?.message?.includes('429') || error?.status === 429 || error?.error?.status === 'RESOURCE_EXHAUSTED';
    
    return isQuotaExceeded 
      ? "QUOTA_EXHAUSTED: The Global Strategy Oracle is currently over-capacity. Final post-mortem analysis unavailable due to market saturation."
      : "INTEL_LINK_SEVERED: FINAL_REPORT_UNAVAILABLE.";
  }
}
