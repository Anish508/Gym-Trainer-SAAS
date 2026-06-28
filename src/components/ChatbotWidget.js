'use client';

import React, { useState, useEffect, useRef } from 'react';
import { dbReadAll, dbReadOne, dbCreate, dbUpdate } from '@/lib/db';
import { MessageSquare, X, Send } from 'lucide-react';

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Initial welcome message
    if (messages.length === 0) {
      setMessages([
        {
          role: 'model',
          text: `👋 **Hello! I am your MindFit AI Assistant.**\n\nI can help you analyze client statistics, lookup check-ins, or plan workout splits and diet regimes.\n\nAsk me a question or click one of the quick options below!`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Aggregate current stats context
  const getTrainerStats = async () => {
    try {
      const members = await dbReadAll('members') || [];
      const attendance = await dbReadAll('attendance') || [];
      const settings = await dbReadOne('settings', 'settings') || {};

      const totalMembers = members.length;
      const activeMembers = members.filter(m => m.status === 'active');
      const suspendedMembers = members.filter(m => m.status === 'suspended');
      const ptMembers = members.filter(m => m.isPT);

      const todayStr = new Date().toISOString().split('T')[0];
      const todayAttendance = attendance.filter(a => a.date === todayStr);
      const checkedInToday = todayAttendance.filter(a => a.status === 'present' || a.status === 'late');

      const membersSummary = members.map(m => 
        `- ${m.fullName}: ID=${m.id}, Status=${m.status}, Goal=${m.fitnessGoal}, PT=${m.isPT ? 'Yes' : 'No'}`
      ).join('\n');

      return {
        trainerName: settings.gymName || 'Keerthan',
        totalMembers,
        activeCount: activeMembers.length,
        suspendedCount: suspendedMembers.length,
        ptCount: ptMembers.length,
        checkedInTodayCount: checkedInToday.length,
        membersSummary
      };
    } catch (err) {
      console.error(err);
      return {
        trainerName: "Keerthan", totalMembers: 0, activeCount: 0, suspendedCount: 0, ptCount: 0, checkedInTodayCount: 0, membersSummary: ''
      };
    }
  };

  // Find close client name in text
  const findClientInQuery = async (queryText) => {
    const members = await dbReadAll('members') || [];
    const query = queryText.toLowerCase();

    return members.filter(m => {
      const fullNameLower = m.fullName.toLowerCase();
      const firstNameLower = m.fullName.split(' ')[0].toLowerCase();
      const nameParts = fullNameLower.split(/\s+/);
      
      return query.includes(fullNameLower) || 
             query.includes(firstNameLower) || 
             nameParts.some(part => part.length > 2 && query.includes(part));
    });
  };

  const markAttendanceDirect = async (memberId, status) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const attendance = await dbReadAll('attendance') || [];
    const searchRecord = attendance.find(r => r.memberId === memberId && r.date === todayStr);
    const now = new Date();
    const timeStr = status === 'absent' ? '--' : now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (searchRecord) {
      await dbUpdate('attendance', searchRecord.id, { status, checkInTime: timeStr });
    } else {
      await dbCreate('attendance', {
        id: `ATT-${memberId}-${todayStr}`,
        memberId,
        date: todayStr,
        status,
        checkInTime: timeStr
      });
    }
    window.dispatchEvent(new Event('db-change'));
  };

  // Execute Command blocks returned by Gemini
  const executeAiCommands = async (responseText) => {
    const cmdRegex = /\[CMD:\s*(\{.*?\})\s*\]/g;
    let match;
    let cleanText = responseText;

    while ((match = cmdRegex.exec(responseText)) !== null) {
      try {
        const cmd = JSON.parse(match[1]);
        if (cmd.action === 'mark_attendance') {
          await markAttendanceDirect(cmd.memberId, cmd.status);
        } else if (cmd.action === 'open_profile') {
          window.location.hash = `#member-profile?id=${cmd.memberId}`;
        }
      } catch (e) {
        console.error("AI Command parse failed", e);
      }
    }
    return cleanText.replace(cmdRegex, '').trim();
  };

  // Gemini API client
  const queryGemini = async (userMessage, history, stats, apiKey) => {
    const systemPrompt = `You are MindFit AI Assistant, a premium personal training coach and assistant for Trainer "${stats.trainerName}".
You have access to the following current client statistics and database context:
- Trainer/Brand Name: ${stats.trainerName}
- Total Registered Clients: ${stats.totalMembers}
- Active Clients: ${stats.activeCount}
- Suspended Clients: ${stats.suspendedCount}
- Clients on Personal Training (PT) Splits: ${stats.ptCount}
- Client Attendance Today (Checked-in): ${stats.checkedInTodayCount} out of ${stats.activeCount} active clients
- Client Roster Details Summary:
${stats.membersSummary}

You possess AGENT capabilities to interact directly with the application interface. If the user asks you to perform an action, you can execute it by appending a Command Tag at the very end of your response.
Supported commands (append exactly as shown, substituting the actual member ID):
1. Navigate/Open client profile today:
   [CMD: {"action": "open_profile", "memberId": "MEMBER_ID"}]
2. Mark client attendance today (status can be "present", "absent", or "late"):
   [CMD: {"action": "mark_attendance", "memberId": "MEMBER_ID", "status": "STATUS"}]

Only append a Command Tag when the user explicitly requests you to perform that action. Always explain in text what you are doing. Keep responses concise and formatted.`;

    const contents = [];
    // Last 10 context logs
    history.slice(-10).forEach(msg => {
      contents.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      });
    });

    contents.push({
      role: 'user',
      parts: [{ text: userMessage }]
    });

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        systemInstruction: { parts: [{ text: systemPrompt }] }
      })
    });

    if (!response.ok) {
      throw new Error('API failure');
    }

    const result = await response.json();
    return result.candidates?.[0]?.content?.parts?.[0]?.text || 'Empty AI response.';
  };

  // Local Offline fallback engine
  const handleOfflineActions = async (queryText, stats) => {
    const query = queryText.toLowerCase();
    const matches = await findClientInQuery(queryText);

    if (matches.length > 0) {
      const client = matches[0];
      if (query.includes('present') || query.includes('absent') || query.includes('late')) {
        const status = query.includes('present') ? 'present' : (query.includes('late') ? 'late' : 'absent');
        await markAttendanceDirect(client.id, status);
        return `✅ **Attendance Updated:** Marked **${client.fullName}** (${client.id}) as **${status}** today.`;
      }
      if (query.includes('open') || query.includes('profile') || query.includes('show')) {
        window.location.hash = `#member-profile?id=${client.id}`;
        return `👤 **Navigating:** Opened profile page for **${client.fullName}**.`;
      }
    }

    // Default mock logs
    if (query.includes('member') || query.includes('client') || query.includes('stats')) {
      return `📊 **Roster Statistics:**\n- Total: ${stats.totalMembers}\n- Active: ${stats.activeCount}\n- PT Splits: ${stats.ptCount}`;
    }
    if (query.includes('attendance') || query.includes('check')) {
      return `📋 **Attendance Today:**\n- Checked in: ${stats.checkedInTodayCount} / ${stats.activeCount} active.`;
    }

    return `🤖 **MindFit Offline Assistant:**\nI am currently running in offline mode. Please configure your **Gemini API Key** in Trainer Settings to unlock full conversational AI capabilities!`;
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const query = inputVal.trim();
    if (!query) return;

    setInputVal('');
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Add user message
    setMessages(prev => [...prev, { role: 'user', text: query, time }]);
    setIsTyping(true);

    try {
      const stats = await getTrainerStats();
      const settings = await dbReadOne('settings', 'settings') || {};
      let apiKey = settings.geminiApiKey || '';

      if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY') {
        apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
      }

      let botResponse = '';
      if (apiKey && apiKey !== 'YOUR_GEMINI_API_KEY') {
        botResponse = await queryGemini(query, messages, stats, apiKey);
        botResponse = await executeAiCommands(botResponse);
      } else {
        botResponse = await handleOfflineActions(query, stats);
      }

      setMessages(prev => [...prev, { role: 'model', text: botResponse, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'model', text: `❌ **Error:** Failed to reach chatbot server. Please check your internet or key in Trainer Settings.`, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    }
    setIsTyping(false);
  };

  // Convert simple markdown bold and list logs to React Elements
  const renderMessageContent = (text) => {
    let formatted = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>');

    // Split lines for lists
    const lines = formatted.split('\n');
    let insideList = false;

    return lines.map((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
        const content = trimmed.substring(2);
        return <li key={idx} dangerouslySetInnerHTML={{ __html: content }} style={{ marginLeft: '1rem', listStyleType: 'disc' }} />;
      }
      return <p key={idx} dangerouslySetInnerHTML={{ __html: line }} style={{ margin: '0.2rem 0' }} />;
    });
  };

  return (
    <div id="ai-chatbot-container" className="ai-chatbot-container" style={{ zIndex: 10000 }}>
      {/* Toggle button */}
      <button 
        id="chatbot-toggle-btn" 
        className="chatbot-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
        style={{ background: 'var(--color-primary)' }}
      >
        <MessageSquare size={24} />
        {!isOpen && <span className="pulse-ring"></span>}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div id="chatbot-window" className="chatbot-window card-glass" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="chatbot-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="chatbot-header-info" style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
              <div className="chatbot-avatar" style={{ fontSize: '1.2rem' }}>🤖</div>
              <div>
                <h4 className="chatbot-title" style={{ fontWeight: 600 }}>MindFit AI Assistant</h4>
                <span className="chatbot-status" style={{ fontSize: '0.75rem', color: '#10B981' }}>● Online</span>
              </div>
            </div>
            <button id="chatbot-close-btn" className="btn-icon" onClick={() => setIsOpen(false)}>
              <X size={18} />
            </button>
          </div>

          {/* Messages list */}
          <div className="chatbot-messages" style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {messages.map((msg, index) => (
              <div key={index} className={`chat-message ${msg.role}`}>
                <div className="message-bubble" style={{ fontSize: '0.9rem', lineHeight: 1.4 }}>
                  {renderMessageContent(msg.text)}
                </div>
                <div className="message-time" style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  {msg.time}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="chat-message model typing">
                <div className="message-bubble">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggest chips */}
          <div className="chatbot-suggestions" style={{ display: 'flex', gap: '0.4rem', padding: '0.5rem', overflowX: 'auto', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <button className="chip" style={{ fontSize: '0.75rem' }} onClick={() => setInputVal('How many active clients?')}>Active Clients 📊</button>
            <button className="chip" style={{ fontSize: '0.75rem' }} onClick={() => setInputVal('Who checked in today?')}>Checked In Today 📋</button>
            <button className="chip" style={{ fontSize: '0.75rem' }} onClick={() => setInputVal('Open profile for Alex Mercer')}>Open Alex Mercer profile 👤</button>
          </div>

          {/* Form input */}
          <form onSubmit={handleSend} className="chatbot-input-form" style={{ padding: '0.8rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <input 
              type="text" 
              placeholder="Ask MindFit AI..." 
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: 'none', padding: '0.5rem 1rem', borderRadius: '20px', color: '#fff', outline: 'none' }}
            />
            <button type="submit" className="btn-icon" style={{ background: 'var(--color-primary)', borderRadius: '50%', width: '36px', height: '36px' }}>
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
