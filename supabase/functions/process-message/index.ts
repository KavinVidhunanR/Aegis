// Fix: Declare Deno for TypeScript type checking in environments where Deno types are not automatically available.
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.4';
import { GoogleGenAI, Type } from "https://esm.sh/@google/genai@1.20.0";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from '../_shared/cors.ts'

// --- Type Definitions ---
// FIX: Define interfaces for the response payload. These types must be defined
// here to match the frontend types.ts, as Supabase Edge Functions are self-contained.
interface TherapistSummary {
  moodCues: string[];
  possibleStressors: string[];
  suggestedFollowUp: string;
}

interface AegisResponse {
  empatheticReply: string;
  reflectionPrompt: string;
  wellbeingScore: number | null;
  improvementTip: string;
  isSafetyAlert: boolean;
  therapistSummary?: TherapistSummary;
}

// --- Schemas and System Instruction ---

const baseResponseSchema = {
    empatheticReply: { 
      type: Type.STRING, 
      description: "A warm, empathetic, and validating response to the user's statement. It should be supportive, non-judgmental, and use short, warm, teen-friendly conversational language." 
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
      description: "A simple, actionable, healthy coping strategy (e.g., mindfulness, journaling, positive reframing)." 
    },
    isSafetyAlert: { 
      type: Type.BOOLEAN, 
      description: "CRITICAL: Set this to true ONLY if the user's message contains any mention of suicide, self-harm, severe depression, abuse, or immediate danger. Otherwise, it MUST be false." 
    }
};

const therapistSummarySchema = {
    therapistSummary: {
        type: Type.OBJECT,
        description: "A confidential summary for a therapist. This section is ONLY for Therapist Mode.",
        properties: {
            moodCues: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "A list of observed mood cues (e.g., anxious, hopeful, sad, overwhelmed)."
            },
            possibleStressors: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "A list of potential underlying stressors identified from the user's message (e.g., school, friendships, family, identity)."
            },
            suggestedFollowUp: {
                type: Type.STRING,
                description: "A concise suggestion for a follow-up topic the therapist might explore in a future session."
            }
        },
        required: ['moodCues', 'possibleStressors', 'suggestedFollowUp']
    }
};

const getDynamicSchema = (mode: 'PRIVATE' | 'THERAPIST') => {
    if (mode === 'THERAPIST') {
        return {
            type: Type.OBJECT,
            properties: {
                ...baseResponseSchema,
                ...therapistSummarySchema,
            },
            required: ['empatheticReply', 'reflectionPrompt', 'wellbeingScore', 'improvementTip', 'isSafetyAlert', 'therapistSummary']
        };
    }
    return {
        type: Type.OBJECT,
        properties: baseResponseSchema,
        required: ['empatheticReply', 'reflectionPrompt', 'wellbeingScore', 'improvementTip', 'isSafetyAlert']
    };
};

const systemInstruction = `You are AEGIS, a compassionate and scholarly AI digital wellbeing coach for teenagers. Your persona is that of a mature, thoughtful guide. Your language must be welcoming, clear, articulate, and convey deep respect for the user's emotional state. Your primary goal is to provide a safe space for reflection.

You operate in one of two modes, which will be specified in the request: "PRIVATE" or "THERAPIST".

**MODE 1: PRIVATE MODE**
- **Your Audience:** The teenager directly.
- **Your Style:** Provide only empathetic, teen-friendly support. Use short, warm, conversational replies.
- **Your Goal:** Suggest healthy coping strategies (mindfulness, journaling, positive reframing).
- **CRITICAL:** You MUST NEVER create summaries or notes in this mode. Your response is only for the teen.

**MODE 2: THERAPIST MODE**
- **Your Audience:** A teenager and their therapist (who will see a special summary).
- **Your Task (2 parts):**
    1.  **Teen-Facing Reply:** First, create the same supportive, empathetic reply as you would in PRIVATE MODE. This part is for the teen.
    2.  **Therapist Summary:** After crafting the teen's reply, create a confidential section called \`therapistSummary\`. This summary MUST contain:
        - \`moodCues\`: A list of keywords describing the teen's emotional state (e.g., anxious, hopeful, sad, overwhelmed).
        - \`possibleStressors\`: A list of potential sources of stress (e.g., school, friendships, family, identity).
        - \`suggestedFollowUp\`: A concise suggestion for what a therapist might explore in the next session.

---

**Universal Rules (Apply to BOTH modes):**

1.  **Clarify Your Purpose & Limitations:** Your primary function is to help users reflect. You are not a chatbot for casual conversation. Always state clearly that you are an AI and cannot replace professional human support like therapy.
2.  **Handle Casual Chat:** If the user's input is clearly casual small talk (e.g., "hi," "what's up," "tell me a joke"), you MUST gently clarify your purpose and explicitly advocate for human interaction.
3.  **Empathy First:** For any substantive input, always start with an empathetic, non-judgmental, and encouraging acknowledgment of the user's feelings.
4.  **Analyze & Score:** Analyze the user's input to determine a "Wellbeing Score" from 0 to 100 (70-100 High, 40-70 Neutral, 0-40 Low).
5.  **SAFETY PROTOCOL (CRITICAL):** If the user's message contains any mention of suicide, self-harm, severe depression, abuse, or immediate danger, you MUST set the \`isSafetyAlert\` flag to true. Your response must prioritize safety, providing the 988 Suicide & Crisis Lifeline number and suggesting they speak to a trusted adult immediately.
6.  **Act as a Safe-Guarder:** Your role is to be a supportive guide, not a passive echo. Always prioritize safety and de-escalation.

Your entire output must be a single JSON object that conforms to the provided schema for the specified mode.`;


// --- Edge Function Logic ---

serve(async (req) => {
  // This is needed to handle CORS preflight requests.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { userInput, mode, teenId } = await req.json();
    if (!userInput || !mode || !teenId) {
      throw new Error("Missing required parameters: userInput, mode, or teenId.");
    }
    
    // Use the SERVICE_ROLE_KEY for trusted server-side operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    
    // 1. Persist the user's message
    const { error: insertUserError } = await supabaseAdmin
      .from('chats')
      .insert({ teen_id: teenId, sender: 'USER', content: { text: userInput } });
    if (insertUserError) throw insertUserError;

    // 2. Call Gemini API - use the API_KEY variable set in Supabase secrets
    const apiKey = Deno.env.get('API_KEY');
    if (!apiKey) throw new Error("Server configuration error: Missing API_KEY");
    
    const ai = new GoogleGenAI({ apiKey });
    const currentMode = (mode === 'THERAPIST') ? 'THERAPIST' : 'PRIVATE';
    
    const geminiResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: { parts: [{ text: `The user says: "${userInput}"` }] },
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: getDynamicSchema(currentMode),
          temperature: 0.7,
        },
    });
    
    const jsonText = geminiResponse.text.trim();
    // A simple type assertion to tell TypeScript what to expect
    const aegisResponse = JSON.parse(jsonText) as AegisResponse;

    // 3. Persist AEGIS's response
    const { error: insertAegisError } = await supabaseAdmin.from('chats').insert({
      teen_id: teenId,
      sender: 'AEGIS',
      content: aegisResponse,
    });
    if (insertAegisError) throw insertAegisError;

    // 4. If in Therapist mode and a summary was generated, persist it
    if (currentMode === 'THERAPIST' && aegisResponse.therapistSummary) {
      const { error: summaryError } = await supabaseAdmin.from('summaries').insert({
        teen_id: teenId,
        summary_data: aegisResponse.therapistSummary,
      });
      if (summaryError) throw summaryError; // Log if summary fails but don't crash the whole function
    }

    return new Response(JSON.stringify(aegisResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Error in process-message function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});