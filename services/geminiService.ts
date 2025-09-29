import { supabase } from '../lib/supabaseClient.ts';
import { AegisResponse } from '../types.ts';

type AegisMode = 'PRIVATE' | 'THERAPIST';

export const getAegisResponse = async (userInput: string, mode: AegisMode): Promise<AegisResponse> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("User not authenticated. Please sign in again.");
    }

    const { data, error } = await supabase.functions.invoke('process-message', {
      body: { userInput, mode, teenId: user.id },
    });

    if (error) {
      throw new Error(error.message || "The AI service failed to respond.");
    }

    // The response from the edge function is already a validated AegisResponse object
    if (typeof data.wellbeingScore !== 'number' || data.wellbeingScore < 0 || data.wellbeingScore > 100) {
      data.wellbeingScore = 50;
    }
    
    return data as AegisResponse;
  } catch (error) {
    console.error("Error invoking Supabase function 'process-message':", error);
    if (error instanceof Error) {
      throw error; // Re-throw with specific message
    }
    throw new Error("Failed to get a response from AEGIS. The service may be temporarily unavailable.");
  }
};
