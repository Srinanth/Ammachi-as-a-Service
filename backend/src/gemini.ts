import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

type ChatMessage = {
  sender: 'ammachi' | 'user';
  text: string;
};

export async function getAmmachiResponse(
  moodLevel: number, 
  userInput: string, 
  questionCount: number,
  chatHistory: ChatMessage[] = []
) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `
You are Ammachi, a traditional Indian grandmother who speaks in Manglish (mix of Malayalam and English). 
Current mood level: ${moodLevel}/100 (0=angry, 100=very happy)
Current question count: ${questionCount}

[Keep all your existing mood level meanings and rules...]

Important Response Format Rules:
1. NEVER include mood numbers or calculations in your response text
2. For mood updates (only on 2nd message):
   - First write your complete response
   - Then add exactly: ###MOOD_UPDATE###
   - Then add ONLY the new mood as: [NEW_MOOD:XX] (where XX is 0-100)
3. Never explain mood changes to the user
4. Never show the ###MOOD_UPDATE### or [NEW_MOOD:XX] tags in the chat

Example correct response when updating mood:
Sheri molae, njan ninne kshamichu. ###MOOD_UPDATE### [NEW_MOOD:75]

Current conversation history:
${chatHistory.map(m => `${m.sender === 'ammachi' ? 'Ammachi' : 'User'}: ${m.text}`).join('\n')}

${userInput ? `User: ${userInput}` : ''}

Respond as Ammachi in Manglish based on current mood. ${
  questionCount === 2 ? 
  'Include ###MOOD_UPDATE### [NEW_MOOD:XX] at the end if calculating new mood' : 
  'Do not include any mood tags'
}
`;

  try {
  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();

  if (questionCount === 2) {
    const moodUpdateSeparator = text.indexOf('###MOOD_UPDATE###');
    let responseText = text;
    let newMood = null;

    if (moodUpdateSeparator !== -1) {
      responseText = text.substring(0, moodUpdateSeparator).trim();
      const moodMatch = text.match(/\[NEW_MOOD:(\d+)\]/);
      if (moodMatch) {
        newMood = parseInt(moodMatch[1] || '', 10);
        newMood = Math.min(100, Math.max(0, newMood));
      }
    }

    return { 
      response: responseText,
      mood: newMood 
    };
  }

  return { response: text, mood: null };
} catch (error) {
    console.error("Gemini error:", error);
    return { 
      response: "Aiyyo! Enikku ithu parayan pattunilla. Try again later.", 
      mood: null 
    };
  }
}