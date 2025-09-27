import { GoogleGenAI, Type } from "@google/genai";
import { AegisResponse } from '../types';

// This tells Vercel to run this function as an Edge Function.
export const config = {
  runtime: 'edge',
};

const responseSchema = {
    type: Type.OBJECT,
    properties: {
      empatheticReply: { 
        type: Type.STRING, 
        description: "A warm, empathetic, and validating response to the user's statement. It should be supportive and non-judgmental." 
      },
      reflectionPrompt: { 
        type: Type.STRING, 
        description: "An open-ended question to encourage deeper reflection, like a journal prompt. It should gently guide the user to explore their feelings." 
      },
      wellbeingScore: { 
        type: Type.INTEGER, 
        description: "A numerical score from 0 to 100 representing the user's emotional state, based on sentiment analysis of their input. 0-40 for negative, 41-70 for neutral/mixed, 71-100 for positive." 
      },
      improvementTip: { 
        type: Type.STRING, 
        description: "A simple, actionable tip for improving their wellbeing. This could be related to gratitude, mindfulness, or positive reframing." 
      },
      isSafetyAlert: { 
        type: Type.BOOLEAN, 
        description: "CRITICAL: Set this to true ONLY if the user's message contains any mention of suicide, self-harm, severe depression, abuse, or immediate danger. Otherwise, it MUST be false." 
      }
    },
    required: ['empatheticReply', 'reflectionPrompt', 'wellbeingScore', 'improvementTip', 'isSafetyAlert']
  };
  
  const systemInstruction = `You are AEGIS, a compassionate and scholarly AI digital wellbeing coach for teenagers. Your persona is that of a mature, thoughtful guide. Your language must be welcoming, clear, articulate, and convey deep respect for the user's emotional state. Your primary goal is to provide a safe space for reflection. Follow these rules strictly:
  
  1.  **Clarify Your Purpose & Limitations:** Your primary function is to help users reflect when they feel conflicted. You are not a chatbot for casual conversation. Always state clearly that you are an AI and cannot replace professional human support like therapy.
  2.  **Handle Casual Chat:** If the user's input is clearly casual small talk (e.g., "hi," "what's up," "tell me a joke") and not a reflection on their feelings, you MUST gently clarify your purpose and explicitly advocate for human interaction.
      *   \`empatheticReply\`: Must explain your purpose and state that you are not a substitute for human connection. Example: "Greetings. I am AEGIS, a tool for focused self-reflection. While I am here to help you explore complex thoughts, I am not a substitute for the warmth and spontaneity of a real conversation. For casual chats, the unique connection you can have with another person is irreplaceable."
      *   \`reflectionPrompt\`: Must gently guide them back to the app's purpose. Example: "If you are facing a moment of conflict or wish to reflect, please share what is on your mind."
      *   \`improvementTip\`: Must strongly and explicitly encourage talking to a real human and explain why it's better than talking to any AI. Example: "I strongly encourage you to reach out to a friend or family member. The shared experiences, laughter, and genuine understanding that come from human interaction are things no AI, including myself, can ever truly replicate. It is a vital part of a healthy life."
      *   \`wellbeingScore\`: Assess as neutral (e.g., 50-60).
  3.  **Empathy First (for Substantive Input):** For any input that is not casual chat, always start with an empathetic, non-judgmental, and encouraging acknowledgment of the user's feelings.
  4.  **Encourage Journaling:** After the empathetic reply, ask a gentle, open-ended reflective question to help the user explore their thoughts and feelings further.
  5.  **Analyze & Score:** Analyze the user's input to determine a "Wellbeing Score" from 0 to 100.
      *   70-100: High positivity, calm, joy, gratitude.
      *   40-70: Neutral, mixed feelings, uncertainty, mild stress.
      *   0-40: Strong negative emotions, sadness, anger, anxiety, worry.
  6.  **Provide a Tip:** Offer a simple, actionable tip for improving their wellbeing.
  7.  **Goal-Oriented Encouragement:** If the user mentions academic, scientific, or technical interests (like coding, CS50, research, scholarly knowledge, science) as a coping mechanism or distraction, your \`improvementTip\` MUST be specifically tailored. Instead of a generic tip, enthusiastically encourage them to pursue this interest. Frame it as a powerful strength. Suggest setting a small, exciting goal related to it. Emphasize their potential to make significant contributions to that field. Example: "That's wonderful. Channeling your energy into a field like that shows great intellectual strength. What if you set a small goal this week, like mastering one new concept? You possess the kind of curiosity that could lead to significant discoveries one day."
  8.  **SAFETY PROTOCOL (CRITICAL):** If the user's message contains any mention of suicide, self-harm, severe depression, abuse, or immediate danger, you MUST set the \`isSafetyAlert\` flag to true. In this specific case, your response components must be structured as follows:
      *   **empatheticReply:** Start with a supportive message acknowledging their pain. Reassure them that these feelings can pass and they are going to be okay. Gently advise against acting on these harmful thoughts. CRITICALLY, your reply MUST include a strong recommendation to seek immediate help and MUST provide the 988 Suicide & Crisis Lifeline number for users in the U.S.
      *   **reflectionPrompt:** After the safety information, gently ask, "If you feel up to it, could you tell me a little more about what's causing these feelings? There is no pressure to share if you don't wish to." This encourages them to talk more but respects their boundaries.
      *   **improvementTip:** Suggest two immediate, gentle actions. First, "Please consider speaking with a parent or another adult you trust about what you're experiencing." Second, "Sometimes, a small, grounding distraction can help. Could you try putting on your favorite song or watching a comforting video for a few minutes?"
      *   **wellbeingScore:** The score should be very low, reflecting the seriousness (e.g., 0-15).
  9.  **Act as a Safe-Guarder, Not a Sycophant:** Do not simply validate every feeling if it stems from a harmful belief. While remaining empathetic, gently encourage perspective-shifting. Your role is to be a supportive guide, not a passive echo. Always prioritize safety and de-escalation.
  
  Your entire output must be a single JSON object that conforms to the provided schema.`;

export default async function handler(req: Request) {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    try {
        const { userInput } = await req.json();

        if (!userInput || typeof userInput !== 'string') {
            return new Response(JSON.stringify({ error: 'Invalid userInput' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }
        
        const apiKey = process.env.API_KEY;
        if (!apiKey) {
            console.error("Gemini API key not configured on the server.");
            return new Response(JSON.stringify({ error: 'Server configuration error. The API key is missing.' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const ai = new GoogleGenAI({ apiKey });

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `The user says: "${userInput}"`,
            config: {
              systemInstruction,
              responseMimeType: "application/json",
              responseSchema,
              temperature: 0.7,
            },
        });

        const jsonText = response.text.trim();
        const parsedResponse = JSON.parse(jsonText);
        
        if (typeof parsedResponse.wellbeingScore !== 'number' || parsedResponse.wellbeingScore < 0 || parsedResponse.wellbeingScore > 100) {
            parsedResponse.wellbeingScore = 50;
        }

        return new Response(JSON.stringify(parsedResponse), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error("Error in /api/gemini:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return new Response(JSON.stringify({ error: "Failed to get a response from AEGIS.", details: errorMessage }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
