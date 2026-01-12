import { GoogleGenAI, Type } from "@google/genai";
import { EnglishArticle } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const fetchDailyEnglishArticle = async (topic: string = "general"): Promise<EnglishArticle> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a short, inspiring English learning article (about 80-100 words) suitable for an intermediate learner. 
      The topic should be related to: ${topic}.
      Also provide 3 key vocabulary words with definitions in Simplified Chinese (简体中文).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            content: { type: Type.STRING },
            difficulty: { type: Type.STRING, enum: ["Beginner", "Intermediate", "Advanced"] },
            vocabulary: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  word: { type: Type.STRING },
                  definition: { type: Type.STRING },
                },
              },
            },
          },
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    return JSON.parse(text) as EnglishArticle;
  } catch (error) {
    console.error("Error fetching article:", error);
    // Fallback content in case of error
    return {
      title: "The Power of Habits",
      content: "Small habits can make a big difference. When you do something every day, it becomes part of who you are. Start with one small change and stick to it.",
      difficulty: "Intermediate",
      vocabulary: [
        { word: "Habit", definition: "习惯，通常定期重复的行为。" },
        { word: "Difference", definition: "差异，不同之处。" },
        { word: "Stick", definition: "坚持，继续做某事。" }
      ]
    };
  }
};