import React, { useState, useEffect, useRef } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabaseClient';
import { isConfigured as isLocalConfigured } from './lib/config';
import { ChatMessage as ChatMessageType, MessageSender, AegisResponse, TeenProfile } from './types.ts';
import { getAegisResponse } from './services/geminiService.ts';
import { checkForCriticalKeywords } from './utils/safetyCheck.ts';
import Auth from './components/Auth.tsx';
import ChatInput from './components/ChatInput.tsx';
import ChatMessage from './components/ChatMessage.tsx';
import ScoreDisplay from './components/ScoreDisplay.tsx';
import { AegisIcon, TrashIcon } from './components/Icons.tsx';
import ConfigurationNotice from './components/ConfigurationNotice.tsx';

type AegisMode = 'PRIVATE' | 'THERAPIST';

const safetyAlertResponse: AegisResponse = {
  empatheticReply: "It sounds like you are in a lot of pain, and I want you to know it's incredibly brave of you to express it. These feelings can be overwhelming, but they can also pass. Please don't act on these thoughts. You are not alone, and help is available. For immediate support, please call or text the 988 Suicide & Crisis Lifeline.",
  reflectionPrompt: "If you feel up to it, could you tell me a little more about what's causing these feelings? There is no pressure to share if you don't wish to.",
  improvementTip: "Please consider speaking with a parent or another adult you trust about what you're experiencing. Also, sometimes, a small, grounding distraction can help. Could you try putting on your favorite song or watching a comforting video for a few minutes?",
  wellbeingScore: 5,
  isSafetyAlert: true,
};

const initialAegisResponse: AegisResponse = {
  empatheticReply: "Greetings. I am AEGIS, a tool for focused self-reflection. I'm here to listen and help you explore your thoughts and feelings. Please remember, I am an AI and not a substitute for professional human support. What is on your mind today?",
  reflectionPrompt: "You can start by describing a situation or a feeling that's been occupying your thoughts.",
  wellbeingScore: null,
  improvementTip: "Taking a moment to check in with yourself is a positive step. Be kind to yourself as you reflect.",
  isSafetyAlert: false,
};

const initialMessage: ChatMessageType = {
  id: 'initial-0',
  sender: MessageSender.AEGIS,
  aegisResponse: initialAegisResponse,
};

const ConsentToggle: React.FC<{ profile: TeenProfile | null; onToggle: (hasConsented: boolean) => void }> = ({ profile, onToggle }) => {
  const hasConsent = profile?.consent_to_share ?? false;
  return (
    <div className="flex items-center gap-2">
      <span className={`text-sm font-semibold ${!hasConsent ? 'text-gray-800' : 'text-gray-500'}`}>Private</span>
      <button
        onClick={() => onToggle(!hasConsent)}
        role="switch"
        aria-checked={hasConsent}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2`}
        style={{
          backgroundColor: hasConsent ? 'var(--bg-therapist-accent)' : '#ccc',
          '--tw-ring-color': hasConsent ? 'var(--bg-therapist-accent)' : 'var(--bg-accent)',
        } as React.CSSProperties}
      >
        <span
          aria-hidden="true"
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${hasConsent ? 'translate-x-5' : 'translate-x-0'}`}
        />
      </button>
      <span className={`text-sm font-semibold ${hasConsent ? 'text-gray-800' : 'text-gray-500'}`}>Share with Therapist</span>
    </div>
  );
};

const App: React.FC = () => {
  // Safely check for Vercel environment variables first (production)
  // Fix: Cast `import.meta` to `any` to avoid TypeScript errors when Vite client types are not available.
  const isVercelConfigured = 
    (typeof import.meta !== 'undefined' && (import.meta as any).env) &&
    (import.meta as any).env.VITE_SUPABASE_URL && 
    (import.meta as any).env.VITE_SUPABASE_ANON_KEY;
  
  // The app is configured if either Vercel env vars are set OR the local config file is set.
  const isAppConfigured = isVercelConfigured || isLocalConfigured;

  if (!isAppConfigured) {
    return <ConfigurationNotice />;
  }

  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<TeenProfile | null>(null);
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isPageLoading, setIsPageLoading] = useState<boolean>(true);
  const [isAwaitingResponse, setIsAwaitingResponse] = useState<boolean>(false);
  const [isClearing, setIsClearing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<AegisMode>('PRIVATE');
  const [animatingMessageId, setAnimatingMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fetchedUserId = useRef<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);
  
  const fetchProfileAndChats = async (user_id: string) => {
    setIsPageLoading(true);
    setError(null);
    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('teens')
        .select('*')
        .eq('id', user_id)
        .single();
      
      if (profileError) throw profileError;
      setProfile(profileData);
      setMode(profileData.consent_to_share ? 'THERAPIST' : 'PRIVATE');

      // Fetch chats
      const { data: chatData, error: chatError } = await supabase
        .from('chats')
        .select('*')
        .eq('teen_id', user_id)
        .order('created_at', { ascending: true });

      if (chatError) throw chatError;

      const formattedMessages: ChatMessageType[] = chatData.map((chat: any) => ({
        id: chat.id.toString(),
        sender: chat.sender,
        text: chat.sender === 'USER' ? chat.content.text : undefined,
        aegisResponse: chat.sender === 'AEGIS' ? chat.content : undefined,
      }));
      
      setMessages(formattedMessages.length > 0 ? formattedMessages : [initialMessage]);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data.');
    } finally {
      setIsPageLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user && session.user.id !== fetchedUserId.current) {
      fetchedUserId.current = session.user.id;
      fetchProfileAndChats(session.user.id);
    } else if (!session?.user) {
      setMessages([]);
      setProfile(null);
      setIsPageLoading(false);
      fetchedUserId.current = null;
    }
  }, [session]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isAwaitingResponse]);
  
  const handleConsentToggle = async (hasConsented: boolean) => {
    if (!profile) return;
    
    setMode(hasConsented ? 'THERAPIST' : 'PRIVATE'); // Update local state immediately for responsiveness
    setProfile(p => p ? { ...p, consent_to_share: hasConsented } : null);

    const { error } = await supabase
      .from('teens')
      .update({ consent_to_share: hasConsented })
      .eq('id', profile.id);

    if (error) {
      setError("Could not update consent settings.");
       // Revert optimistic update on error
      setMode(!hasConsented ? 'THERAPIST' : 'PRIVATE');
      setProfile(p => p ? { ...p, consent_to_share: !hasConsented } : null);
    }
  };

  const handleSendMessage = async (userInput: string) => {
    setError(null);
    const userMessage: ChatMessageType = {
      id: `user-${Date.now()}`,
      sender: MessageSender.User,
      text: userInput,
    };
    setMessages(prev => [...prev, userMessage]);
    setIsAwaitingResponse(true);

    if (checkForCriticalKeywords(userInput)) {
      const aegisSafetyMessageId = `aegis-${Date.now()}`;
      const aegisSafetyMessage: ChatMessageType = {
        id: aegisSafetyMessageId,
        sender: MessageSender.AEGIS,
        aegisResponse: safetyAlertResponse,
      };
      setMessages(prev => [...prev, aegisSafetyMessage]);
      setAnimatingMessageId(aegisSafetyMessageId);
      setIsAwaitingResponse(false);
      return;
    }

    try {
      const aegisResponse = await getAegisResponse(userInput, mode);
      const aegisMessageId = `aegis-${Date.now()}`;
      const aegisMessage: ChatMessageType = {
        id: aegisMessageId,
        sender: MessageSender.AEGIS,
        aegisResponse: aegisResponse,
      };
      setMessages(prev => [...prev, aegisMessage]);
      setAnimatingMessageId(aegisMessageId);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "An unknown error occurred.";
      setError(errorMsg);
    } finally {
      setIsAwaitingResponse(false);
    }
  };

  const handleClearChat = async () => {
    if (!session?.user || isClearing) return;

    const isConfirmed = window.confirm(
      "Are you sure you want to clear your entire chat history? This action cannot be undone."
    );

    if (isConfirmed) {
      setIsClearing(true);
      setError(null);
      try {
        const { error: deleteError } = await supabase
          .from('chats')
          .delete()
          .eq('teen_id', session.user.id);

        if (deleteError) throw deleteError;
        
        // Reset messages to the initial state
        setMessages([initialMessage]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to clear chat history.');
      } finally {
        setIsClearing(false);
      }
    }
  };


  if (!session) {
    return <Auth />;
  }
  
  if (isPageLoading && messages.length === 0) {
    return (
      <div className="flex flex-col h-screen items-center justify-center" style={{ backgroundColor: 'var(--bg-main)' }}>
        <AegisIcon className="w-16 h-16 animate-pulse" />
        <p className="mt-4 text-lg" style={{ color: 'var(--text-muted)' }}>Loading your session...</p>
      </div>
    );
  }

  const lastAegisMessage = [...messages].reverse().find(m => m.sender === MessageSender.AEGIS && m.aegisResponse?.wellbeingScore !== null);
  const lastScore = lastAegisMessage?.aegisResponse?.wellbeingScore ?? null;

  return (
    <div className="flex flex-col h-screen" style={{ backgroundColor: 'var(--bg-main)' }}>
      <header 
        className="flex items-center justify-between p-4 shadow-md z-10"
      >
        <div className="flex items-center gap-3">
          <AegisIcon className="w-8 h-8"/>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-heading)' }}>AEGIS</h1>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Mind, Health, Voice</p>
          </div>
        </div>
        <div className="flex items-center gap-4 md:gap-6">
          <ConsentToggle profile={profile} onToggle={handleConsentToggle} />
          {lastScore !== null && (
            <div className="hidden md:flex items-center gap-2">
               <p className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>Last Score:</p>
               <ScoreDisplay score={lastScore} />
            </div>
          )}
          <button
            onClick={handleClearChat}
            disabled={isClearing}
            className="p-2 rounded-full text-gray-500 hover:bg-gray-200 hover:text-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Clear chat history"
            title="Clear chat history"
          >
              <TrashIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => supabase.auth.signOut()}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors"
            style={{ 
                backgroundColor: 'var(--bg-accent)', 
                color: 'var(--text-light)',
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-accent-darker)'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-accent)'}
            aria-label="Sign Out"
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {messages.map((msg) => (
            <ChatMessage 
              key={msg.id} 
              message={msg} 
              animate={msg.id === animatingMessageId} 
            />
          ))}
          {isAwaitingResponse && (
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
        <ChatInput onSendMessage={handleSendMessage} disabled={isAwaitingResponse || isClearing} isAwaitingResponse={isAwaitingResponse} />
      </footer>
    </div>
  );
};

export default App;