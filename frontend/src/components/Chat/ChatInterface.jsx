/**
 * ChatInterface — The Empathetic LLM Companion chat UI.
 * Now connects to the backend chat API for session management
 * and message sending. Falls back to local responses if API is unavailable.
 */
import { useState, useRef, useEffect } from 'react';
import api from '../../api/client';
import './ChatInterface.css';
import { upcomingExams, moodHistory } from '../../data/mockData';

const MODES = [
  { key: 'casual', label: 'Chat', icon: 'chat_bubble', color: 'var(--primary)' },
  { key: 'study', label: 'Study', icon: 'school', color: 'var(--tertiary)' },
  { key: 'hype', label: 'Hype', icon: 'local_fire_department', color: 'var(--warning)' },
  { key: 'vent', label: 'Vent', icon: 'favorite', color: 'var(--secondary)' },
];

export default function ChatInterface({ initialMessages, student, studentId = 1 }) {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState('casual');
  const [isTyping, setIsTyping] = useState(false);
  const [showContext, setShowContext] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Try to create a backend session on mount
  useEffect(() => {
    const initSession = async () => {
      try {
        const session = await api.createChatSession(studentId);
        setSessionId(session.id);
      } catch (err) {
        console.warn('Could not create backend chat session, using local mode:', err.message);
      }
    };
    initSession();
  }, [studentId]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = {
      id: Date.now(),
      role: 'user',
      content: input,
      type: 'text',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    setInput('');
    setIsTyping(true);

    // Try backend API first, fall back to local
    if (sessionId) {
      try {
        const aiResponse = await api.sendChatMessage(studentId, sessionId, currentInput, mode);
        const aiMsg = {
          id: aiResponse.id || Date.now() + 1,
          role: 'assistant',
          content: aiResponse.content,
          type: aiResponse.message_type || 'text',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages(prev => [...prev, aiMsg]);
        setIsTyping(false);
        return;
      } catch (err) {
        console.warn('Backend chat failed, using local fallback:', err.message);
      }
    }

    // Local fallback
    setTimeout(() => {
      const fallbackResponses = {
        casual: "Got it! I'm here for whatever you need — study tips, motivation, or just a friendly chat. 😊",
        study: "Let's lock in! 📚 What subject should we tackle?",
        hype: "LET'S GOOO! 🔥 You've been crushing it lately!",
        vent: "I'm listening. It's okay to feel what you're feeling. 💙",
      };
      const aiMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: fallbackResponses[mode],
        type: 'text',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1000 + Math.random() * 600);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="chat-container animate-fade-in">
      {/* Mode Switcher */}
      <div className="chat-modes">
        {MODES.map((m) => (
          <button
            key={m.key}
            className={`mode-btn ${mode === m.key ? 'mode-active' : ''}`}
            onClick={() => setMode(m.key)}
            style={mode === m.key ? { '--mode-color': m.color } : {}}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>{m.icon}</span>
            <span>{m.label}</span>
          </button>
        ))}
        <button className="mode-btn mode-context-toggle" onClick={() => setShowContext(!showContext)}>
          <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>info</span>
        </button>
      </div>

      <div className="chat-body">
        {/* Context Panel */}
        {showContext && (
          <div className="context-panel animate-fade-in">
            <h4 className="t-h4" style={{ marginBottom: '0.75rem' }}>
              <span className="material-symbols-outlined text-secondary" style={{ fontSize: '1rem', verticalAlign: 'middle' }}>neurology</span>
              {' '}AI Context
            </h4>
            <div className="context-section">
              <p className="t-eyebrow text-error" style={{ marginBottom: '0.375rem' }}>Upcoming Exams</p>
              {upcomingExams.map((exam, i) => (
                <div key={i} className="context-item">
                  <span className="context-dot" style={{ background: exam.daysLeft <= 7 ? 'var(--error)' : 'var(--primary)' }} />
                  <span className="t-small">{exam.subject}</span>
                  <span className="t-small text-muted" style={{ marginLeft: 'auto' }}>{exam.daysLeft}d</span>
                </div>
              ))}
            </div>
            <div className="context-section">
              <p className="t-eyebrow text-secondary" style={{ marginBottom: '0.375rem' }}>Recent Mood</p>
              <div className="mood-pills">
                {moodHistory.slice(0, 3).map((m, i) => (
                  <span key={i} className={`mood-pill mood-${m.mood}`}>
                    {m.mood} ({m.energy}/10)
                  </span>
                ))}
              </div>
            </div>
            {sessionId && (
              <div className="context-section">
                <p className="t-eyebrow text-primary" style={{ marginBottom: '0.25rem' }}>Session</p>
                <p className="t-small text-muted">Connected to backend (ID: {sessionId})</p>
              </div>
            )}
          </div>
        )}

        {/* Messages */}
        <div className="messages-scroll">
          {messages.map((msg) => (
            <div key={msg.id} className={`message-row msg-${msg.role}`}>
              {msg.role === 'assistant' && (
                <div className="msg-avatar">
                  <span className="material-symbols-outlined" style={{ fontSize: '1rem', fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                </div>
              )}
              <div className={`msg-bubble ${msg.role === 'user' ? 'msg-user-bubble' : 'msg-ai-bubble'}`}>
                <p className="msg-text" dangerouslySetInnerHTML={{
                  __html: msg.content
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\n/g, '<br/>')
                }} />
                <span className="msg-time">{msg.time}</span>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="message-row msg-assistant">
              <div className="msg-avatar">
                <span className="material-symbols-outlined" style={{ fontSize: '1rem', fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              </div>
              <div className="msg-bubble msg-ai-bubble typing-bubble">
                <div className="typing-dots">
                  <span /><span /><span />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="chat-input-bar">
        <button className="btn-icon emoji-btn" aria-label="Emoji">😊</button>
        <textarea
          ref={inputRef}
          className="chat-input"
          placeholder={`Message your AI companion (${mode} mode)...`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          id="chat-input-field"
        />
        <button
          className="btn-icon send-btn"
          onClick={sendMessage}
          disabled={!input.trim() || isTyping}
          id="send-message-btn"
          aria-label="Send message"
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
        </button>
      </div>
    </div>
  );
}
