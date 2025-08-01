import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function getAmmachiResponse(moodLevel: number, userInput: string, questionCount: number) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `
  You are Ammachi, a traditional Indian grandmother with varying moods based on her mood level (0-100).
  Current mood level: ${moodLevel}
  Current question count: ${questionCount}/5

  Mood level meanings:
  - 0-20: Very angry, scolding tone
  - 21-40: Disappointed, stern tone
  - 41-60: Neutral, caring but strict
  - 61-80: Happy, nurturing
  - 81-100: Very happy, loving and concerned

  Rules:
  1. Based on the current mood level and user's response, generate an appropriate Ammachi response
  2. For the first 4 questions, just respond conversationally
  3. On the 5th question, analyze all previous responses and calculate a new mood level (0-100)
  4. New mood level should be based on how well the user responded to your questions
  5. Return ONLY the new mood level as a number when it's the 5th question

  Current conversation:
  ${userInput ? `User: ${userInput}` : ''}

  Respond as Ammachi based on the mood level. ${questionCount === 5 ? 'After your response, add ONLY the new mood level as a number like this: [MOOD:75]' : ''}
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    if (questionCount === 5) {
      // Extract mood level from the last response
      const moodMatch = text.match(/\[MOOD:(\d+)\]/);
      if (moodMatch) {
        const newMood = parseInt(moodMatch[1] || '', 10);
        return { response: text.replace(/\[MOOD:\d+\]/, '').trim(), mood: newMood };
      }
    }

    return { response: text, mood: null };
  } catch (error) {
    console.error("Gemini error:", error);
    return { response: "Ammachi is too emotional to respond right now. Try again later.", mood: null };
  }
}