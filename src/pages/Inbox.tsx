import { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, MoreVertical, Phone, Bot, UserCheck, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';

const avatarBgs = ['#7c3aed', '#2563eb', '#059669', '#d97706', '#dc2626', '#0891b2', '#7c2d12', '#4f46e5'];

function timeAgo(dateStr: string) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export default function Inbox() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeConv = conversations.find(c => c.id === activeConvId);

  // Load conversations
  useEffect(() => {
    async function load() {
      try {
        const convs = await api.getConversations();
        setConversations(convs);
        if (!activeConvId && convs.length > 0) setActiveConvId(convs[0].id);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  // Load messages when active conversation changes
  useEffect(() => {
    if (!activeConvId) return;
    async function loadMessages() {
      try {
        const msgs = await api.getMessages(activeConvId!);
        setMessages(msgs);
      } catch (e) { console.error(e); }
    }
    loadMessages();
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [activeConvId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getInitials = (name: string) => (name || '??').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  const handleSend = async () => {
    if (!input.trim() || !activeConvId) return;
    setSending(true);
    try {
      await api.sendMessage(activeConvId, input.trim());
      setInput('');
      // Reload messages
      const msgs = await api.getMessages(activeConvId);
      setMessages(msgs);
    } catch (e) { console.error(e); }
    finally { setSending(false); }
  };

  const handleHandoff = async (status: 'bot' | 'human') => {
    if (!activeConvId) return;
    await api.updateConversationStatus(activeConvId, status);
    const convs = await api.getConversations();
    setConversations(convs);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading conversations...</p>
      </div>
    );
  }

  return (
    <div className="inbox-layout" style={{ margin: '-24px -28px', height: 'calc(100vh - var(--header-h))' }}>
      {/* Conversation List */}
      <div className="inbox-list">
        <div className="inbox-list-header">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>Messages</h3>
            <span className="badge green">{conversations.filter(c => c.unread_count > 0).length} unread</span>
          </div>
        </div>

        {conversations.length === 0 ? (
          <div className="empty-state" style={{ padding: '40px 20px' }}>
            <div className="empty-icon">💬</div>
            <h3>No conversations yet</h3>
            <p>Messages from WhatsApp will appear here</p>
          </div>
        ) : (
          conversations.map((conv, i) => (
            <div
              key={conv.id}
              className={`inbox-item ${activeConvId === conv.id ? 'active' : ''}`}
              onClick={() => setActiveConvId(conv.id)}
            >
              <div className="contact-avatar" style={{ background: avatarBgs[i % avatarBgs.length] }}>
                {getInitials(conv.contact_name)}
              </div>
              <div className="contact-info">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="contact-name">{conv.contact_name || conv.wa_id}</span>
                  <span className="contact-time">{timeAgo(conv.last_message_at)}</span>
                </div>
                <div className="contact-preview">{conv.last_message || '...'}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <span style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: conv.status === 'bot' ? 'var(--accent)' : conv.status === 'human' ? 'var(--yellow)' : 'var(--blue)',
                  }} />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{conv.status}</span>
                  {conv.language && conv.language !== 'en' && (
                    <span className="badge gray" style={{ fontSize: '0.65rem', padding: '1px 5px' }}>
                      {conv.language === 'ar' ? 'عربي' : conv.language === 'hi' ? 'हिंदी' : conv.language}
                    </span>
                  )}
                </div>
              </div>
              {conv.unread_count > 0 && <div className="unread-dot" />}
            </div>
          ))
        )}
      </div>

      {/* Chat Area */}
      <div className="chat-area">
        {activeConv ? (
          <>
            <div className="chat-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: avatarBgs[conversations.indexOf(activeConv) % avatarBgs.length], fontWeight: 700, fontSize: '0.85rem',
                }}>
                  {getInitials(activeConv.contact_name)}
                </div>
                <div>
                  <div style={{ fontWeight: 600 }}>{activeConv.contact_name || activeConv.wa_id}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Phone size={11} /> {activeConv.contact_phone || activeConv.wa_id}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {activeConv.status === 'bot' ? (
                  <button className="btn btn-sm btn-secondary" onClick={() => handleHandoff('human')}>
                    <UserCheck size={14} /> Take Over
                  </button>
                ) : activeConv.status === 'human' ? (
                  <button className="btn btn-sm btn-primary" onClick={() => handleHandoff('bot')}>
                    <Bot size={14} /> Hand to Bot
                  </button>
                ) : null}
              </div>
            </div>

            {activeConv.status === 'human' && (
              <div style={{
                padding: '10px 20px', background: 'var(--yellow-glow)', borderBottom: '1px solid rgba(234,179,8,0.2)',
                display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', color: 'var(--yellow)',
              }}>
                <AlertTriangle size={16} />
                <span><strong>Human mode</strong> — Bot is paused. You're replying directly to the customer.</span>
              </div>
            )}

            <div className="chat-messages">
              {messages.map((msg) => {
                let buttons: any[] = [];
                if (msg.buttons) {
                  try { buttons = JSON.parse(msg.buttons); } catch {}
                }
                return (
                  <div key={msg.id}>
                    <div className={`message-bubble ${msg.direction}`}>
                      {msg.content}

                      {/* Inbound: show detected intent + confidence */}
                      {msg.intent && msg.direction === 'inbound' && (
                        <div style={{ marginTop: 6, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <span className="badge blue" style={{ fontSize: '0.65rem' }}>{msg.intent}</span>
                          {msg.confidence_score != null && (
                            <span className={`badge ${msg.confidence_score >= 0.75 ? 'green' : 'yellow'}`} style={{ fontSize: '0.65rem' }}>
                              {Math.round(msg.confidence_score * 100)}%
                            </span>
                          )}
                        </div>
                      )}

                      {/* Outbound: show action_type badge */}
                      {msg.action_type && msg.direction === 'outbound' && (
                        <div style={{ marginTop: 6, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <span className={`badge ${msg.action_type === 'EXISTING_CUSTOMER' ? 'purple' : 'blue'}`} style={{ fontSize: '0.65rem' }}>
                            {msg.action_type === 'EXISTING_CUSTOMER' ? '🚗 Existing Customer' : '🆕 New Prospect'}
                          </span>
                          {msg.intent && (
                            <span className="badge green" style={{ fontSize: '0.65rem' }}>{msg.intent}</span>
                          )}
                        </div>
                      )}

                      {/* Outbound: render interactive buttons */}
                      {buttons.length > 0 && msg.direction === 'outbound' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
                          {buttons.map((btn: any) => (
                            <div key={btn.id} style={{
                              padding: '8px 14px', borderRadius: 8, textAlign: 'center',
                              background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)',
                              color: 'var(--accent)', fontSize: '0.82rem', fontWeight: 600, cursor: 'default',
                            }}>
                              {btn.text}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: msg.direction === 'outbound' ? 'right' : 'left', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>
                      {new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {msg.direction === 'outbound' && ' · 🤖 AI'}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="chat-input-area">
              <input
                type="text"
                placeholder={activeConv.status === 'human' ? 'Type a reply as agent...' : 'Type a message (bot is active)...'}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                disabled={sending}
              />
              <button className="btn btn-primary" style={{ padding: '10px 16px' }} onClick={handleSend} disabled={sending || !input.trim()}>
                <Send size={18} />
              </button>
            </div>
          </>
        ) : (
          <div className="empty-state" style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div className="empty-icon">📩</div>
            <h3>Select a conversation</h3>
            <p>Choose a conversation from the list to view messages</p>
          </div>
        )}
      </div>
    </div>
  );
}
