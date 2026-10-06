import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  X, 
  Send, 
  Sparkles, 
  Minimize2, 
  Maximize2, 
  RotateCcw, 
  Zap,
  BarChart3
} from 'lucide-react';
import { askGeminiAI } from '../services/geminiService';
import { useLanguage } from '../context/LanguageContext';

export default function AIAssistantBot({ 
  patients = [], 
  currentTab = 'home', 
  activePatient = null, 
  operator = null 
}) {
  const { language, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Compute live stats for quick badges
  const totalScans = patients.length;
  const positiveScans = patients.filter(
    p => (p.cataract_status || p.status || '').toLowerCase() === 'positive'
  ).length;
  const negativeScans = patients.filter(
    p => {
      const s = (p.cataract_status || p.status || '').toLowerCase();
      return s === 'negative' || s === 'normal';
    }
  ).length;

  const getWelcomeText = (lang) => {
    if (lang === 'bn') {
      return `নমস্কার! 👋 আমি **নেত্রবট এআই**, আপনার ক্লিনিকাল ও ডাটা সহকারী (পাওয়ার্ড বাই **গুগল জেমিনি এআই**)।
      
আমি চোখের ছানি স্ক্রিনিং ডাটাবেস থেকে তাৎক্ষণিক রোগীর তথ্য অনুসন্ধান, পজিটিভ/নেগেটিভ হিসাব, জেলাভিত্তিক পরিসংখ্যান এবং যেকোনো চক্ষু চিকিৎসা সংক্রান্ত প্রশ্নের স্মার্ট পরামর্শ দিতে পারি।

নিচের যেকোনো প্রশ্নে ক্লিক করুন বা লিখে পাঠান!`;
    }
    return `Hello! 👋 I am **NetraBot AI**, your clinical and data intelligence robot powered by **Google Gemini AI**.
      
I can instantly search patient records, calculate positive/negative statistics, break down regional district cases, or provide smart ophthalmology decisions.

Try clicking a quick prompt below or ask me anything!`;
  };
  
  // Default welcome message
  const [messages, setMessages] = useState(() => [
    {
      id: 1,
      sender: 'bot',
      text: getWelcomeText(language),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      modelUsed: 'gemini-3.5-flash-lite'
    }
  ]);

  // Update welcome message if language switches and no user messages sent yet
  useEffect(() => {
    if (messages.length === 1 && messages[0].sender === 'bot') {
      setMessages([
        {
          id: 1,
          sender: 'bot',
          text: getWelcomeText(language),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          modelUsed: 'gemini-3.5-flash-lite'
        }
      ]);
    }
  }, [language]);

  const messagesEndRef = useRef(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
    }
  }, [messages, isOpen, isMinimized]);

  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || loading) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      const response = await askGeminiAI({
        userPrompt: text,
        chatHistory: messages,
        patients,
        currentTab,
        activePatient,
        operator,
        language
      });

      const botMsg = {
        id: Date.now() + 1,
        sender: 'bot',
        text: response.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: response.modelUsed
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error("Bot error:", err);
      const fallbackText = language === 'bn'
        ? `⚠️ জেমিনির সাথে সংযোগে ত্রুটি হয়েছে। তবে লোকাল ডাটাবেস অনুযায়ী:\n• মোট রোগী: ${totalScans}\n• ছানি পজিটিভ: ${positiveScans}\n• স্বাভাবিক: ${negativeScans}`
        : `⚠️ I encountered an error connecting to Gemini. However, looking at the local database:\n• Total Scans: ${totalScans}\n• Positive: ${positiveScans}\n• Normal: ${negativeScans}`;

      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'bot',
          text: fallbackText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          modelUsed: 'local-analytics-engine'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    const resetText = language === 'bn'
      ? `কথোপকথন মুছে ফেলা হয়েছে। বর্তমানে ডাটাবেসে **${totalScans} জন রোগী** (${positiveScans} পজিটিভ, ${negativeScans} স্বাভাবিক) যুক্ত আছেন। কীভাবে সাহায্য করতে পারি?`
      : `Conversation cleared. Live database connection is active with **${totalScans} patients** (${positiveScans} positive, ${negativeScans} normal). How can I assist you?`;

    setMessages([
      {
        id: Date.now(),
        sender: 'bot',
        text: resetText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: 'gemini-3.5-flash-lite'
      }
    ]);
  };

  const quickPrompts = [
    { label: t('botChipStats'), query: language === 'bn' ? 'ডাটাবেসে মোট কতজন রোগী, কতজন পজিটিভ এবং কতজন নেগেটিভ?' : 'How many total patients, positive cases, and negative cases are in the database?' },
    { label: t('botChipSearch'), query: language === 'bn' ? 'সম্প্রতি পরীক্ষা করা রোগীদের নাম ও ছানির ফলাফল দেখাও।' : 'Show me details of the most recently scanned patients in the system.' },
    { label: t('botChipDistricts'), query: language === 'bn' ? 'কোন জেলায় সবচেয়ে বেশি ছানি রোগী শনাক্ত হয়েছে?' : 'Which Indian districts have the highest cataract positivity rate based on current records?' },
    { label: t('botChipSurgical'), query: language === 'bn' ? 'নিউক্লিয়ার ছানি আক্রান্ত রোগীকে আশা কর্মীর কী পরামর্শ দেওয়া উচিত?' : 'What should an ASHA worker advise a patient diagnosed with advanced Nuclear Sclerosis cataract?' },
    { label: t('botChipTriage'), query: language === 'bn' ? 'চোখের স্পষ্ট ছবি তোলার জন্য ৩টি সেরা পদ্ধতি কী কী?' : 'Give me 3 best practices for high-accuracy eye camera capture in rural clinics.' }
  ];

  return (
    <>
      {/* ── 1. Floating Robot Button ────────────────────────────────────────── */}
      {!isOpen && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '8px'
        }}>
          {/* Quick Peek Tooltip */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(12px)',
            border: '1.5px solid #BAE6FD',
            borderRadius: '16px',
            padding: '8px 14px',
            boxShadow: '0 8px 24px rgba(2, 132, 199, 0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '12px',
            fontWeight: '700',
            color: '#091E3A',
            cursor: 'pointer',
            animation: 'floatGentle 4s ease-in-out infinite'
          }} onClick={() => setIsOpen(true)}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#10B981',
              boxShadow: '0 0 8px #10B981'
            }} />
            <span>{t('botAskTooltip')}</span>
            <span style={{
              background: '#E0F2FE',
              color: '#0284C7',
              padding: '2px 6px',
              borderRadius: '6px',
              fontSize: '10px'
            }}>
              {positiveScans} {t('botLivePos')} / {negativeScans} {t('botLiveNeg')}
            </span>
          </div>

          {/* Glowing Animated Robot Launcher */}
          <button
            onClick={() => setIsOpen(true)}
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
              border: '2px solid #BAE6FD',
              boxShadow: '0 10px 28px rgba(2, 132, 199, 0.38)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              position: 'relative',
              transition: 'transform 0.25s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.08)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1.0)'}
            title={t('botTitle')}
          >
            <Bot size={32} />
            {/* Sparkle badge */}
            <div style={{
              position: 'absolute',
              top: '-2px',
              right: '-2px',
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: '#F59E0B',
              border: '2px solid #FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Sparkles size={11} color="#FFFFFF" />
            </div>
          </button>
        </div>
      )}

      {/* ── 2. Active Chat Modal Window ─────────────────────────────────────── */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: isMinimized ? '20px' : '24px',
          right: '24px',
          width: isMinimized ? '320px' : 'min(440px, calc(100vw - 32px))',
          height: isMinimized ? '60px' : 'min(640px, calc(100vh - 48px))',
          background: '#FFFFFF',
          borderRadius: '20px',
          border: '1.5px solid rgba(186, 230, 253, 0.95)',
          boxShadow: '0 24px 60px rgba(2, 132, 199, 0.22)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          zIndex: 9999,
          transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #091E3A 0%, #0369A1 100%)',
            padding: '14px 18px',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Bot size={22} color="#BAE6FD" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontWeight: '800', fontSize: '15px' }}>{t('botTitle')}</span>
                  <span style={{
                    background: 'rgba(56, 189, 248, 0.2)',
                    border: '1px solid rgba(56, 189, 248, 0.4)',
                    color: '#BAE6FD',
                    fontSize: '9px',
                    fontWeight: '800',
                    padding: '1px 6px',
                    borderRadius: '4px'
                  }}>GEMINI 3.5</span>
                </div>
                <div style={{ fontSize: '11px', color: '#BAE6FD', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981' }} />
                  <span>{t('botSubtitle')}</span>
                </div>
              </div>
            </div>

            {/* Header Action Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                onClick={handleClearChat}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#BAE6FD',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '6px'
                }}
                title={language === 'bn' ? 'কথোপকথন মুছুন' : 'Reset conversation'}
              >
                <RotateCcw size={15} />
              </button>
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#BAE6FD',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '6px'
                }}
                title={isMinimized ? 'Expand' : 'Minimize'}
              >
                {isMinimized ? <Maximize2 size={15} /> : <Minimize2 size={15} />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#BAE6FD',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '6px'
                }}
                title="Close"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Live Database Status Ribbon */}
              <div style={{
                background: '#F0F8FE',
                borderBottom: '1px solid #BAE6FD',
                padding: '8px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '11px',
                color: '#091E3A',
                fontWeight: '700'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <BarChart3 size={13} color="#0284C7" />
                  <span>{language === 'bn' ? 'সরাসরি তথ্য:' : 'Live Data:'}</span>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <span style={{ color: '#091E3A' }}>{t('botLiveTotal')}: <strong>{totalScans}</strong></span>
                  <span style={{ color: '#E11D48' }}>{t('botLivePos')}: <strong>{positiveScans}</strong></span>
                  <span style={{ color: '#059669' }}>{t('botLiveNeg')}: <strong>{negativeScans}</strong></span>
                </div>
              </div>

              {/* Message History */}
              <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                background: '#FAFCFE'
              }}>
                {messages.map((m) => {
                  const isBot = m.sender === 'bot';
                  return (
                    <div
                      key={m.id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isBot ? 'flex-start' : 'flex-end',
                        maxWidth: '92%',
                        alignSelf: isBot ? 'flex-start' : 'flex-end'
                      }}
                    >
                      <div style={{
                        padding: '12px 16px',
                        borderRadius: isBot ? '16px 16px 16px 4px' : '16px 16px 4px 16px',
                        background: isBot ? '#FFFFFF' : 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
                        color: isBot ? '#091E3A' : '#FFFFFF',
                        border: isBot ? '1px solid #BAE6FD' : 'none',
                        boxShadow: isBot ? '0 2px 8px rgba(2, 132, 199, 0.06)' : '0 4px 12px rgba(2, 132, 199, 0.25)',
                        fontSize: '13px',
                        lineHeight: 1.55,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word'
                      }}>
                        {m.text}
                      </div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginTop: '4px',
                        fontSize: '10px',
                        color: 'var(--text-muted)'
                      }}>
                        <span>{m.timestamp}</span>
                        {m.modelUsed && (
                          <span style={{ color: '#0284C7', fontWeight: '700' }}>
                            • {m.modelUsed}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Loading typing bubble */}
                {loading && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 16px',
                    borderRadius: '16px 16px 16px 4px',
                    background: '#FFFFFF',
                    border: '1px solid #BAE6FD',
                    width: 'fit-content',
                    fontSize: '12px',
                    color: '#0284C7',
                    fontWeight: '700'
                  }}>
                    <Zap size={14} className="pulse-animation" />
                    <span>{language === 'bn' ? 'তথ্য বিশ্লেষণ ও জেমিনি এআই পরামর্শ প্রস্তুত হচ্ছে...' : 'Analyzing database & consulting Gemini AI...'}</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Preset Quick Chips */}
              <div style={{
                padding: '8px 14px',
                background: '#FFFFFF',
                borderTop: '1px solid #E0F2FE',
                display: 'flex',
                gap: '6px',
                overflowX: 'auto',
                whiteSpace: 'nowrap'
              }}>
                {quickPrompts.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(q.query)}
                    style={{
                      background: '#F0F8FE',
                      border: '1px solid #BAE6FD',
                      borderRadius: '14px',
                      padding: '5px 10px',
                      fontSize: '11px',
                      fontWeight: '700',
                      color: '#0284C7',
                      cursor: 'pointer',
                      flexShrink: 0,
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#0284C7';
                      e.currentTarget.style.color = '#FFFFFF';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#F0F8FE';
                      e.currentTarget.style.color = '#0284C7';
                    }}
                  >
                    {q.label}
                  </button>
                ))}
              </div>

              {/* Input Area */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                style={{
                  padding: '12px 14px',
                  background: '#FFFFFF',
                  borderTop: '1px solid rgba(186, 230, 253, 0.8)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={t('botPlaceholder')}
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    borderRadius: '12px',
                    border: '1.5px solid #BAE6FD',
                    fontSize: '13px',
                    outline: 'none',
                    background: '#F8FBFE'
                  }}
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || loading}
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: inputMessage.trim() && !loading
                      ? 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)'
                      : '#E2E8F0',
                    color: '#FFFFFF',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: inputMessage.trim() && !loading ? 'pointer' : 'not-allowed',
                    flexShrink: 0,
                    transition: 'all 0.2s'
                  }}
                >
                  <Send size={16} />
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
}
