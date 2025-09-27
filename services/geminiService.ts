import { AegisResponse } from '../types.ts';

export const getAegisResponse = async (userInput: string): Promise<AegisResponse> => {
  try {
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userInput }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'An unknown server error occurred.' }));
      throw new Error(errorData.error || `Request failed with status ${response.status}`);
    }

    const parsedResponse = await response.json();
    
    // The server-side function already validates the score, but a redundant check is harmless.
    if (typeof parsedResponse.wellbeingScore !== 'number' || parsedResponse.wellbeingScore < 0 || parsedResponse.wellbeingScore > 100) {
        parsedResponse.wellbeingScore = 50; 
    }

    return parsedResponse as AegisResponse;

  } catch (error) {
    console.error("Error fetching AEGIS response from backend:", error);
    if (error instanceof Error) {
      // Re-throw the specific error message from the backend or fetch failure
      throw new Error(error.message);
    }
    throw new Error("Failed to get a response from AEGIS. The service may be temporarily unavailable.");
  }
};
