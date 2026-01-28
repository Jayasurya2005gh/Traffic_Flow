
import { GoogleGenAI, Type } from "@google/genai";

const API_KEY = process.env.API_KEY || '';

export const analyzeTrafficIncident = async (description: string) => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analyze the following traffic incident and provide a risk assessment and recommended actions: ${description}`,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          severity: { type: Type.STRING, description: 'Low, Medium, or High' },
          priority: { type: Type.INTEGER, description: '1 to 5' },
          recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
          estimatedImpactDuration: { type: Type.STRING }
        },
        required: ['severity', 'priority', 'recommendations']
      }
    }
  });
  return JSON.parse(response.text);
};

export const getTrafficAssistantResponse = async (query: string, history: { role: 'user' | 'assistant', content: string }[]) => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const chat = ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: 'You are an AI Traffic Management Specialist for SmartCity. You provide expert advice on route optimization, congestion reduction, and traffic safety. Use grounding in real-world traffic engineering principles.',
    }
  });

  // Reconstruct history if needed (manual injection because chat object handles it)
  // For simplicity in this demo, we'll just send the latest message or the whole context if needed.
  const response = await chat.sendMessage({ message: query });
  return response.text;
};

export const optimizeRoute = async (start: string, end: string, conditions: string) => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Optimize a route from ${start} to ${end} considering ${conditions}. Provide a JSON response.`,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          route_path: { type: Type.ARRAY, items: { type: Type.STRING } },
          total_time_minutes: { type: Type.NUMBER },
          eco_friendly_rating: { type: Type.NUMBER },
          why_this_route: { type: Type.STRING }
        }
      }
    }
  });
  return JSON.parse(response.text);
};
