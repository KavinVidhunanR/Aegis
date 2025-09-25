
import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage as ChatMessageType, MessageSender, AegisResponse } from './types';
import { getAegisResponse } from './services/geminiService';
import { checkForCriticalKeywords } from './utils/safetyCheck';
import ChatInput from './components/ChatInput';
import ChatMessage from './components/ChatMessage';
import ScoreDisplay from './components/ScoreDisplay';
import { AegisIcon, RefreshIcon } from './components/Icons';

const initialAegisResponse: AegisResponse = {
  empatheticReply: "Greetings. I am AEGIS, a tool for focused self-reflection. I'm here to listen and help you explore your thoughts and feelings. Please remember, I am an AI and not a substitute for professional human support. What is on your mind today?",
  reflectionPrompt: "You can start by describing a situation or a feeling that's been occupying your thoughts.",
  wellbeingScore: null,
  improvementTip: "Taking a moment to check in with yourself is a positive step. Be kind to yourself as you reflect.",
  isSafetyAlert: false,
};

const safetyAlertResponse: AegisResponse = {
  empatheticReply: "It sounds like you are in a lot of pain, and I want you to know it's incredibly brave of you to express it. These feelings can be overwhelming, but they can also pass. Please don't act on these thoughts. You are not alone, and help is available. For immediate support, please call or text the 988 Suicide & Crisis Lifeline.",
  reflectionPrompt: "If you feel up to it, could you tell me a little more about what's causing these feelings? There is no pressure to share if you don't wish to.",
  improvementTip: "Please consider speaking with a parent or another adult you trust about what you're experiencing. Also, sometimes, a small, grounding distraction can help. Could you try putting on your favorite song or watching a comforting video for a few minutes?",
  wellbeingScore: 5,
  isSafetyAlert: true,
};

const initialMessage: ChatMessageType = {
  id: 'initial-0',
  sender: MessageSender.AEGIS,
  aegisResponse: initialAegisResponse,
};

const App: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessageType[]>([initialMessage]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [sessionEnded, setSessionEnded] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleNewSession = () => {
    setMessages([initialMessage]);
    setIsLoading(false);
    setSessionEnded(false);
    setError(null);
  };

  const handleSendMessage = async (userInput: string) => {
    setError(null);
    const userMessage: ChatMessageType = {
      id: `user-${Date.now()}`,
      sender: MessageSender.User,
      text: userInput,
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    if (checkForCriticalKeywords(userInput)) {
      const aegisSafetyMessage: ChatMessageType = {
        id: `aegis-${Date.now()}`,
        sender: MessageSender.AEGIS,
        aegisResponse: safetyAlertResponse,
      };
      setMessages(prev => [...prev, aegisSafetyMessage]);
      // CRITICAL CHANGE: Do NOT end the session if the user is in distress.
      // setSessionEnded(true); 
      setIsLoading(false);
      return;
    }

    try {
      const aegisResponse = await getAegisResponse(userInput);
      const aegisMessage: ChatMessageType = {
        id: `aegis-${Date.now()}`,
        sender: MessageSender.AEGIS,
        aegisResponse: aegisResponse,
      };
      setMessages(prev => [...prev, aegisMessage]);
      // CRITICAL CHANGE: Do NOT end the session if the AI detects distress.
      // The user should be able to continue talking.
      // if (aegisResponse.isSafetyAlert) {
      //   setSessionEnded(true);
      // }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "An unknown error occurred.";
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const lastAegisMessage = [...messages].reverse().find(m => m.sender === MessageSender.AEGIS && m.aegisResponse?.wellbeingScore !== null);
  const lastScore = lastAegisMessage?.aegisResponse?.wellbeingScore ?? null;

  return (
    <div className="flex flex-col h-screen" style={{ backgroundColor: 'var(--bg-main)' }}>
      <header className="flex items-center justify-between p-4 shadow-md bg-white z-10">
        <div className="flex items-center gap-3">
          <AegisIcon className="w-8 h-8"/>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-heading)' }}>AEGIS</h1>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Mind, Health, Voice</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {lastScore !== null && (
            <div className="flex items-center gap-2">
               <p className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>Last Score:</p>
               <ScoreDisplay score={lastScore} />
            </div>
          )}
          <button
            onClick={handleNewSession}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors"
            style={{ 
                backgroundColor: 'var(--bg-accent)', 
                color: 'var(--text-light)',
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-accent-darker)'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-accent)'}
            aria-label="Start New Session"
          >
            <RefreshIcon className="w-4 h-4" />
            New Session
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
          {isLoading && (
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-gray-200">
                <AegisIcon className="w-6 h-6 animate-pulse" />
              </div>
              <div className="max-w-2xl p-4 rounded-xl rounded-bl-none shadow-sm" style={{ backgroundColor: 'var(--bg-subtle)' }}>
                <p className="italic" style={{ color: 'var(--text-muted)' }}>AEGIS is thinking...</p>
              </div>
            </div>
          )}
          {error && (
             <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--bg-accent)' }}>
                    <AegisIcon className="w-6 h-6" />
                </div>
                <div className="max-w-2xl p-4 rounded-xl rounded-bl-none bg-red-50 border border-red-200 text-red-900 space-y-2">
                    <h3 className="font-bold text-red-800">An Error Occurred</h3>
                    <p>{error}</p>
                </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      <footer className="sticky bottom-0">
        <ChatInput onSendMessage={handleSendMessage} disabled={isLoading || sessionEnded} />
      </footer>
    </div>
  );
};

export default App;