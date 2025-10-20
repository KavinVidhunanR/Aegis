export enum MessageSender {
  User = 'USER',
  AEGIS = 'AEGIS',
}

export interface TherapistSummary {
  moodCues: string[];
  possibleStressors: string[];
  suggestedFollowUp: string;
}

export interface AegisResponse {
  empatheticReply: string;
  reflectionPrompt: string;
  wellbeingScore: number | null;
  improvementTip: string;
  isSafetyAlert: boolean;
  therapistSummary?: TherapistSummary;
}

export interface ChatMessage {
  id: string;
  sender: MessageSender;
  text?: string;
  aegisResponse?: AegisResponse;
}

export interface TeenProfile {
  id: string; // matches auth.users.id
  unique_display_id: string;
  consent_to_share: boolean;
}

export interface TherapistProfile {
  id: string;
  full_name: string;
}

export type UserProfile = TeenProfile | TherapistProfile;

// Represents a single summary record from the 'summaries' table
export interface Summary {
  id: string;
  teen_id: string;
  created_at: string;
  summary_data: TherapistSummary;
}