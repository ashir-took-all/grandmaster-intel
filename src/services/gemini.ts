import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = (import.meta.env as any).VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

// --- THE LOCAL BRAIN (Calculates the move without AI) ---
function calculateBestMove(legalMoves: string[]) {
  // 1. Look for captures (Check for 'x' in SAN notation)
  const captures = legalMoves.filter(m => m.includes('x'));
  if (captures.length > 0) return captures[0];

  // 2. Look for central control (e4, d4, Nf3, Nc3, e5, d5)
  const centerMoves = legalMoves.filter(m => 
    m.startsWith('e4') || m.startsWith('d4') || m.startsWith('Nf3') || m.startsWith('Nc3') ||
    m.startsWith('e5') || m.startsWith('d5')
  );
  if (centerMoves.length > 0) return centerMoves[Math.floor(Math.random() * centerMoves.length)];

  // 3. Otherwise, pick a random legal move
  return legalMoves[Math.floor(Math.random() * legalMoves.length)];
}

export async function generateBotTurn(
  fen: string,
  history: string[],
  legalMoves: string[],
  turn: 'w' | 'b',
  lens: string = 'Geopolitics'
) {
  if (!legalMoves.length) return null;

  // STEP 1: Calculate the move INSTANTLY using our local rules
  const chosenMove = calculateBestMove(legalMoves);

  // STEP 2: Ask Gemini ONLY for the "Advisor Briefing"
  try {
    if (!apiKey) throw new Error("No API Key");

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const botColor = turn === 'b' ? 'Black' : 'White';

    const prompt = `You are a Senior Geopolitical Advisor. 
    The bot (playing as ${botColor}) just moved: ${chosenMove}. 
    Explain why this is a strong strategic maneuver in the context of ${lens}. 
    Keep it to exactly 2 short, punchy sentences. Start with "Commander,".`;

    const result = await model.generateContent(prompt);
    const analysis = result.response.text().trim();

    return {
      move: chosenMove,
      text: analysis,
      lastManeuver: analysis,
      news_headline: `${botColor.toUpperCase()} ADVANCE`,
      stats: { fiscal_stability: 85, market_confidence: 90, inflation: 2 }
    };

  } catch (error: any) {
    console.warn("AI Quota hit (429). Using local tactical briefing.");
    
    // This returns the text immediately so the boxes don't stay empty
    return {
      move: chosenMove,
      text: `Commander, tactical sensors indicate high signal interference. Executing ${chosenMove} based on localized ${lens} protocols to maintain board control.`,
      lastManeuver: `Positioned at ${chosenMove}.`,
      news_headline: "LOCAL INTEL ACTIVE",
      stats: { 
        fiscal_stability: Math.floor(Math.random() * 10) + 80, 
        market_confidence: Math.floor(Math.random() * 10) + 70, 
        inflation: 4 
      }
    };
  }
 }
