import { GoogleGenerativeAI } from "@google/generative-ai";

// Vercel/Vite require the VITE_ prefix for environment variables
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
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
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // The prompt is now a strict "Command" to prevent the AI from talking too much
    const prompt = `You are a Grandmaster Chess AI. 
    LENS: ${lens} | DIFFICULTY: ${difficulty}
    LEGAL MOVES: ${legalMoves.join(", ")}
    
    TASK: Pick ONE move and provide a 1-sentence strategic analogy.
    RETURN ONLY THIS JSON: {"move": "chosen_move", "analogy": "your_sentence"}`;

    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();
    
    // STEP 1: Remove Markdown code blocks if the AI added them
    text = text.replace(/```json|```/g, "").trim();
    
    // STEP 2: Find the first '{' and last '}' to isolate the JSON
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1) {
      text = text.substring(start, end + 1);
    }

    const data = JSON.parse(text);
    
    // STEP 3: Validate the move against the legal list
    let validatedMove = data.move;
    if (!legalMoves.includes(validatedMove)) {
       // If the AI hallucinations a move, pick a random legal one
       validatedMove = legalMoves[Math.floor(Math.random() * legalMoves.length)];
    }

    return {
      move: validatedMove,
      analogy: data.analogy || "Strategic repositioning complete
