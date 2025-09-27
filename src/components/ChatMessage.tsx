import React, { useState, useCallback } from 'react';
import { ChatMessage as ChatMessageType, MessageSender } from '../types.ts';
import { UserIcon, AegisIcon } from './Icons.tsx';
import TypingEffect from './TypingEffect.tsx';

interface ChatMessageProps {
  message: ChatMessageType;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  const isUser = message.sender === MessageSender.User;

  // Memoize the callback function to prevent the TypingEffect from re-rendering unnecessarily.
  // This was causing the animation to loop.
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
    const { empatheticReply, reflectionPrompt, improvementTip, isSafetyAlert } = message.aegisResponse;

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
        <div className="max-w-2xl p-4 rounded-xl rounded-bl-none space-y-4 shadow-sm" style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--text-main)' }}>
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
      </div>
    );
  }

  return null;
};

export default ChatMessage;