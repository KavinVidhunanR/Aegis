export enum MessageSender {
  User = 'USER',
  AEGIS = 'AEGIS',
}

export interface AegisResponse {
  empatheticReply: string;
  reflectionPrompt: string;
  wellbeingScore: number | null;
  improvementTip: string;
  isSafetyAlert: boolean;
}

export interface ChatMessage {
  id: string;
  sender: MessageSender;
  text?: string;
  aegisResponse?: AegisResponse;
}