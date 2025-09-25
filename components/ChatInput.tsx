import React, { useState, KeyboardEvent } from 'react';
import { SendIcon } from './Icons';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, disabled }) => {
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (input.trim() && !disabled) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-4 bg-white" style={{ borderTop: '1px solid var(--border-color)'}}>
      <div className="relative max-w-4xl mx-auto">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={disabled ? "Session complete. Take a moment for yourself." : "Tell me what's on your mind..."}
          rows={1}
          className="w-full rounded-full py-3 pl-5 pr-16 resize-none focus:ring-2 focus:outline-none placeholder-gray-500 transition border"
          style={{ 
            backgroundColor: '#ffffff', 
            color: 'var(--text-main)',
            borderColor: 'var(--border-color)',
            '--tw-ring-color': 'var(--bg-accent)'
          } as React.CSSProperties}
          disabled={disabled}
        />
        <button
          onClick={handleSend}
          disabled={disabled || !input.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-full text-white disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          style={{ 
            backgroundColor: disabled ? '#d1d5db' : 'var(--bg-accent)',
          }}
          onMouseOver={(e) => { if (!disabled) e.currentTarget.style.backgroundColor = 'var(--bg-accent-darker)'}}
          onMouseOut={(e) => { if (!disabled) e.currentTarget.style.backgroundColor = 'var(--bg-accent)'}}
          aria-label="Send message"
        >
          <SendIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default ChatInput;