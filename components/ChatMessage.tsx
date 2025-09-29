import React, { useState, useCallback } from 'react';
import { ChatMessage as ChatMessageType, MessageSender, TherapistSummary } from '../types.ts';
import { UserIcon, AegisIcon, ClipboardIcon } from './Icons.tsx';
import TypingEffect from './TypingEffect.tsx';

interface ChatMessageProps {
  message: ChatMessageType;
}

const TherapistSummaryDisplay: React.FC<{ summary: TherapistSummary }> = ({ summary }) => (
    <div 
        className="mt-4 p-4 rounded-lg animate-fade-in-delayed"
        style={{ 
            backgroundColor: 'var(--bg-therapist-summary)', 
            border: '1px solid var(--border-therapist)' 
        }}
    >
        <div className="flex items-center gap-3 mb-3">
            <ClipboardIcon className="w-5 h-5" style={{ color: 'var(--text-therapist-heading)' }} />
            <h4 className="font-bold text-md" style={{ color: 'var(--text-therapist-heading)' }}>
                Therapist Summary
            </h4>
        </div>
        <div className="space-y-3 text-sm">
            <div>
                <p className="font-semibold" style={{ color: 'var(--text-heading)' }}>Mood Cues:</p>
                <div className="flex flex-wrap gap-2 mt-1">
                    {summary.moodCues.map((cue, index) => (
                        <span key={index} className="px-2 py-1 text-xs font-medium rounded-full" style={{ backgroundColor: 'var(--bg-user)', color: 'var(--text-main)' }}>
                            {cue}
                        </span>
                    ))}
                </div>
            </div>
            <div>
                <p className="font-semibold" style={{ color: 'var(--text-heading)' }}>Possible Stressors:</p>
                <div className="flex flex-wrap gap-2 mt-1">
                     {summary.possibleStressors.map((stressor, index) => (
                        <span key={index} className="px-2 py-1 text-xs font-medium rounded-full" style={{ backgroundColor: 'var(--bg-user)', color: 'var(--text-main)' }}>
                            {stressor}
                        </span>
                    ))}
                </div>
            </div>
            <div>
                <p className="font-semibold" style={{ color: 'var(--text-heading)' }}>Suggested Follow-Up:</p>
                <p className="mt-1" style={{ color: 'var(--text-main)' }}>{summary.suggestedFollowUp}</p>
            </div>
        </div>
    </div>
);

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  const isUser = message.sender === MessageSender.User;

  const handleTypingComplete = useCallback(() => {
    setIsTypingComplete(true);
  }, []);

  if (isUser) {
    return (
      <div className="flex items-start gap-4 justify-end">
        <div className="max-w-xl p-4 rounded-xl rounded-br-none shadow-sm" style={{ backgroundColor: 'var(--bg-user)', color: 'var(--text-main)' }}>
          <p>{message.text}</p>
        </div>
        <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-gray-200">
          <UserIcon className="w-6 h-6 text-gray-500" />
        </div>
      </div>
    );
  }

  if (message.sender === MessageSender.AEGIS && message.aegisResponse) {
    const { empatheticReply, reflectionPrompt, improvementTip, isSafetyAlert, therapistSummary } = message.aegisResponse;

    if (isSafetyAlert) {
      return (
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--bg-accent)' }}>
            <AegisIcon className="w-6 h-6" />
          </div>
          <div className="max-w-2xl p-4 rounded-xl rounded-bl-none bg-red-50 border border-red-200 text-red-900 space-y-4">
            <h3 className="font-bold text-lg text-red-800">Important: Please Read This</h3>
            <p>{empatheticReply}</p>

            <div className="border-l-4 border-red-400 pl-4 py-2 bg-red-100/50 rounded-r-lg">
              <p className="font-semibold text-red-800">A Gentle Question</p>
              <p>{reflectionPrompt}</p>
            </div>

            <div className="border-l-4 border-amber-400 pl-4 py-2 bg-amber-50 rounded-r-lg">
              <p className="font-semibold text-amber-800">Immediate Ideas</p>
              <p>{improvementTip}</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-gray-200">
          <AegisIcon className="w-6 h-6" />
        </div>
        <div className="flex-1 max-w-2xl">
          <div className="p-4 rounded-xl rounded-bl-none space-y-4 shadow-sm" style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--text-main)' }}>
            <TypingEffect text={empatheticReply} onComplete={handleTypingComplete} />
            
            {isTypingComplete && (
              <>
                <div className="pl-4 py-2 rounded-r-lg bg-gray-50 animate-fade-in" style={{ borderLeft: '4px solid var(--bg-accent)' }}>
                  <p className="font-semibold" style={{ color: 'var(--text-heading)' }}>Reflection Prompt</p>
                  <p className="text-gray-700">{reflectionPrompt}</p>
                </div>

                <div className="pl-4 py-2 rounded-r-lg bg-gray-50 animate-fade-in-delayed" style={{ borderLeft: '4px solid var(--text-muted)' }}>
                  <p className="font-semibold" style={{ color: 'var(--text-heading)' }}>Improvement Tip</p>
                  <p className="text-gray-700">{improvementTip}</p>
                </div>
              </>
            )}
          </div>
          {isTypingComplete && therapistSummary && <TherapistSummaryDisplay summary={therapistSummary} />}
        </div>
      </div>
    );
  }

  return null;
};

export default ChatMessage;