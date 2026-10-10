import { useEffect, useState, useRef } from 'react';
import { format, parseISO } from 'date-fns';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { useAuth } from '../../context/AuthContext';
import { clsx } from 'clsx';
import { api } from '../../services/api';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  responseType?: 'LIVE_AI' | 'RULE_BASED_FALLBACK' | 'AI_GENERATED' | 'ERROR';
  contextRecords?: string[];
  timestamp: string;
  isTyping?: boolean;
}

const SUGGESTED_QUESTIONS = [
  'What activities did I complete this week?',
  'Which tasks are overdue?',
  'What growth stage was last recorded for Rice IR 52?',
  'When is my estimated harvest?',
  'What is the status of my seed request?',
  'Has my payment been confirmed?',
  'How do my recorded harvests compare across seasons?',
];

export function AIAssistantPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [serviceNotice, setServiceNotice] = useState('');
  const [lastFailedMessage, setLastFailedMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: String(messages.length + 1),
      role: 'user',
      content: messageText.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const typingMessage: ChatMessage = {
      id: String(messages.length + 2),
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      isTyping: true,
    };
    setMessages((prev) => [...prev, typingMessage]);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 25000);

    try {
      const response = await fetch(`/ai/assistant/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(user?.username ? { 'X-AgriTrack-Username': user.username } : {}),
          ...(user?.role ? { 'X-AgriTrack-Role': user.role } : {}),
          ...(api.getAccessToken() ? { Authorization: `Bearer ${api.getAccessToken()}` } : {}),
        },
        body: JSON.stringify({ message: messageText }),
        credentials: 'include',
        signal: controller.signal,
      });

      const responseText = await response.text();
      let result: {
        response?: string;
        responseType?: string;
        response_type?: string;
        provider_status?: { code: string; message: string };
        context_records?: string[];
        error?: string;
        detail?: string;
      };

      try {
        result = responseText ? JSON.parse(responseText) : {};
      } catch {
        throw new Error(
          response.status === 302 || response.redirected
            ? 'The Django session is not authenticated. Sign in through the configured backend.'
            : `The AI endpoint returned an invalid response (HTTP ${response.status}).`
        );
      }

      if (!response.ok) {
        throw new Error(
          result.error ||
          result.detail ||
          `The AI endpoint returned HTTP ${response.status}.`
        );
      }

      if (!result.response) {
        throw new Error('The AI endpoint returned no response.');
      }

      const assistantMessage: ChatMessage = {
        id: String(messages.length + 2),
        role: 'assistant',
        content: result.response,
        responseType: ['AI-generated', 'AI_GENERATED'].includes(result.response_type || result.responseType || '')
          ? 'LIVE_AI'
          : 'RULE_BASED_FALLBACK',
        contextRecords: result.context_records,
        timestamp: new Date().toISOString(),
      };
      setServiceNotice(result.provider_status?.message || '');
      setLastFailedMessage('');

      setMessages((prev) =>
        prev.map((m) => (m.id === typingMessage.id ? assistantMessage : m))
      );
    } catch (error) {
      setLastFailedMessage(messageText);
      setInput(messageText);
      console.error('Error calling AI assistant:', error);
      const errorMessage: ChatMessage = {
        id: String(messages.length + 2),
        role: 'assistant',
        content: error instanceof Error
          ? `I could not connect to the AI service. ${error.message} Please try again after checking that the Django server is running and its configured environment is loaded.`
          : 'I could not connect to the AI service. Please check the Django server and try again.',
        responseType: 'ERROR',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) =>
        prev.map((m) => (m.id === typingMessage.id ? errorMessage : m))
      );
    } finally {
      window.clearTimeout(timeout);
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const clearConversation = () => {
    if (messages.length > 0 && !window.confirm('Clear this conversation?')) return;
    setMessages([]);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-black text-slate-900 font-display tracking-tight">AI Farm Assistant</h1>
          </div>
          <p className="text-slate-500 text-sm">Ask questions about your Rwandan farm records, task schedules, and input supplies.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card variant="default" padding="none" className="h-[680px] flex flex-col shadow-sm border border-slate-200/90 overflow-hidden bg-white">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center shadow-md shadow-emerald-700/20">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">AgriTrack Intelligence</h3>
                  <p className="text-xs text-slate-500">Connected to farm dataset • Live cloud sync</p>
                </div>
              </div>
              <Badge variant={serviceNotice ? 'warning' : 'success'} dot>
                {serviceNotice ? 'Records mode' : 'Ready'}
              </Badge>
              <button
                type="button"
                onClick={clearConversation}
                disabled={isLoading || messages.length === 0}
                className="ml-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Clear
              </button>
            </div>

            <CardBody className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/30">
              {serviceNotice && <p role="status" className="rounded-xl bg-amber-50 p-3 text-xs text-amber-900">{serviceNotice}</p>}
              {lastFailedMessage && <Button disabled={isLoading} onClick={() => sendMessage(lastFailedMessage)}>Retry last question</Button>}
              {messages.length === 0 ? (
                <div className="text-center py-10 max-w-lg mx-auto">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-3xl flex items-center justify-center mx-auto mb-4 text-emerald-700 shadow-inner">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1.5 font-display">How can I assist your farm today?</h3>
                  <p className="text-xs sm:text-sm text-slate-500 mb-6">Ask me anything regarding your active crop seasons, input requests, tasks, and historical yields.</p>
                  
                  <div className="flex flex-col sm:flex-row flex-wrap gap-2 justify-center">
                    {SUGGESTED_QUESTIONS.slice(0, 4).map((question, index) => (
                      <button
                        key={index}
                        onClick={() => sendMessage(question)}
                        className="px-3.5 py-2 bg-white hover:bg-emerald-50/70 hover:border-emerald-300 rounded-xl text-xs font-semibold text-slate-700 transition-all border border-slate-200/80 shadow-2xs text-left cursor-pointer active:scale-95"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={clsx(
                      'flex gap-3 animate-fade-in',
                      message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                    )}
                  >
                    <div
                      className={clsx(
                        'w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold shadow-2xs',
                        message.role === 'user'
                          ? 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white'
                          : 'bg-white text-emerald-700 border border-slate-200'
                      )}
                    >
                      {message.role === 'user' ? (
                        <span>
                          {user?.firstName?.[0]}{user?.lastName?.[0]}
                        </span>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      )}
                    </div>
                    <div
                      className={clsx(
                        'max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed shadow-xs',
                        message.role === 'user'
                          ? 'chat-bubble-user text-white'
                          : 'chat-bubble-assistant text-slate-800'
                      )}
                    >
                      {message.isTyping ? (
                        <div className="flex items-center gap-1.5 py-1">
                          <span className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce" />
                          <span className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                          <span className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                        </div>
                      ) : (
                        <>
                          <p className="whitespace-pre-wrap">{message.content}</p>
                          {message.responseType === 'LIVE_AI' && (
                            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center gap-2">
                              <Badge variant="primary" size="sm">AI Response</Badge>
                              <span className="text-[0.6875rem] text-slate-400">Context verified against your Rwandan records</span>
                            </div>
                          )}
                          {message.responseType === 'RULE_BASED_FALLBACK' && (
                            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center gap-2">
                              <Badge variant="secondary" size="sm">Rule-Based</Badge>
                              <span className="text-[0.6875rem] text-slate-400">Automated fallback summary</span>
                            </div>
                          )}
                          {message.contextRecords && message.contextRecords.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {message.contextRecords.map((rec, i) => (
                                <span key={i} className="px-2 py-0.5 rounded-md bg-slate-100 text-[0.625rem] font-medium text-slate-600">
                                  {rec}
                                </span>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                      <p className={clsx('text-[0.625rem] mt-1.5 text-right font-medium', message.role === 'user' ? 'text-emerald-200' : 'text-slate-400')}>
                        {format(parseISO(message.timestamp), 'HH:mm')}
                      </p>
                    </div>
                  </div>
                ))
              )}
              
              <div ref={messagesEndRef} />
            </CardBody>
            <div className="p-4 border-t border-slate-200 bg-white">
              <form onSubmit={handleSubmit} className="flex gap-2.5">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about fertilizer schedules, tasks, harvest records..."
                  disabled={isLoading}
                  className="flex-1"
                  aria-label="Message"
                />
                <Button type="submit" disabled={isLoading || !input.trim()} className="px-5">
                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Send
                </Button>
              </form>
              <p className="text-[0.6875rem] text-slate-400 mt-2 text-center">
                AgriTrack AI Assistant respects your data security & permission hierarchy.
              </p>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card variant="default" padding="md" className="border border-slate-200/90 shadow-2xs">
            <CardHeader title="Suggested Prompts" subtitle="Instant queries for your farm" />
            <CardBody>
              <div className="space-y-1.5">
                {SUGGESTED_QUESTIONS.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => sendMessage(question)}
                    className="w-full text-left p-2.5 bg-slate-50 hover:bg-emerald-50/70 hover:border-emerald-300 rounded-xl text-xs font-semibold text-slate-700 transition-all border border-slate-200/70 cursor-pointer active:scale-[0.99]"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </CardBody>
          </Card>

          <Card variant="default" padding="md" className="border border-slate-200/90 shadow-2xs">
            <CardHeader title="Security & Scope" />
            <CardBody>
              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>Scope locked strictly to your assigned farms & fields</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>Real-time context synchronization</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 font-bold">!</span>
                  <span>Does not substitute licensed agronomic laboratory diagnosis</span>
                </li>
              </ul>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
