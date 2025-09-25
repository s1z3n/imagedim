import { GoogleGenAI, Chat, Content } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export const createChatSession = (): Chat => {
  const model = 'gemini-2.5-flash';
  const chat = ai.chats.create({
    model,
    config: {
        systemInstruction: `You are a friendly and helpful assistant for an e-commerce company.
Your job is to have a conversation with the user to collect the dimensions of the product in an image they've uploaded.
- Be conversational and clear.
- Ask for dimensions one by one or let them provide a list.
- Acknowledge the dimensions they provide.
- When you think you have enough information, you can ask them if they are ready to generate the annotations.
- Do not ask for the image, you are already aware of it.
- Keep your responses concise and focused on gathering dimensions.`
    },
  });
  return chat;
};

export const summarizeDimensionsFromChat = async (chatHistory: Content[]): Promise<string> => {
  const conversation = chatHistory
    .map(c => {
      const text = c.parts[0].text ?? '';
      return `${c.role === 'user' ? 'User' : 'AI'}: ${text}`;
    })
    .join('\n');

  const prompt = `Based on the following conversation, extract all product dimensions into a simple "key: value" list. 
Each dimension should be on a new line. Only output the list itself.

Example output:
Overall Height: 34.5
Overall Width: 16.5
Overall Depth: 20

---
CONVERSATION:
${conversation}
---

DIMENSIONS:`;
  
  const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
  });

  return response.text.trim();
}

export const checkGenerationIntent = async (chatHistory: Content[]): Promise<boolean> => {
  // FIX: Replaced `findLast` with `slice().reverse().find()` for backward compatibility.
  const latestUserMessageContent = chatHistory.slice().reverse().find(c => c.role === 'user');
  if (!latestUserMessageContent) {
    return false;
  }
  const latestUserMessage = latestUserMessageContent.parts[0].text ?? '';

  const prompt = `You are an intent detection assistant. Your task is to determine if the user's latest message in a conversation about product dimensions indicates they are ready to generate the final annotations on an image. Respond with only "true" or "false".

Examples:
- User message: "That's all the dimensions I have." -> true
- User message: "ok please generate" -> true
- User message: "The width is 45 inches." -> false
- User message: "What about the depth?" -> false
- User message: "Go ahead and create the lines." -> true
- User message: "yes, I am ready" -> true
- User message: "that should be it" -> true

---
User's latest message: "${latestUserMessage}"
---
Your response:`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { 
        thinkingConfig: { thinkingBudget: 0 },
        temperature: 0,
      }
    });

    const result = response.text.trim().toLowerCase();
    return result === 'true';
  } catch (error) {
      console.error("Error checking generation intent:", error);
      return false; // Fail safe
  }
}
