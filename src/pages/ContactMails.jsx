import React, { useState, useEffect } from 'react';
import { Mail, Search, ChevronRight, Trash2, RefreshCw, X, MessageSquare, AlertCircle } from 'lucide-react';

import { API_URL as API } from '../config';
import { fetchWithRetry } from '../utils/api';


const ContactMails = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [notification, setNotification] = useState(null);


  const fetchMessages = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchWithRetry(`${API}/api/contact`);
      if (data.success) setMessages(data.messages || data.contacts || []);
      else setError('Could not load messages. The server returned an error.');
    } catch (e) {
      console.error(e);
      setError('Failed to connect to the server. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => { fetchMessages(); }, []);

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API}/api/contact/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setMessages(prev => prev.filter(m => m._id !== id));
        if (selectedMessage?._id === id) setSelectedMessage(null);
        setDeleteConfirm(null);
        showNotify('Message deleted successfully');
      }
    } catch (e) { console.error(e); }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm('ARE YOU SURE? This will permanently delete ALL contact messages. This cannot be undone.')) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/contact/delete-all`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setMessages([]);
        setSelectedMessage(null);
        showNotify('All messages deleted successfully');
      } else {
        showNotify(data.message || 'Delete failed', 'error');
      }
    } catch (e) {
      console.error('Delete All Error:', e);
      showNotify('Connection error during deletion', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotify = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const filtered = messages.filter(m => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return (
      (m.name?.toLowerCase() || '').includes(s) ||
      (m.email?.toLowerCase() || '').includes(s) ||
      (m.service?.toLowerCase() || '').includes(s)
    );
  });


  const formatDate = (d) => {
    if (!d) return 'N/A';
    return new Date(d).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  };

  const formatDateTime = (d) => {
    if (!d) return 'N/A';
    return new Date(d).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-[calc(100vh-var(--header-height)-120px)] flex flex-col max-w-7xl mx-auto w-full">

      {/* Notification */}
      {notification && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border ${
          notification.type === 'error' ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
        } backdrop-blur-md animate-in slide-in-from-right-10`}>
          {notification.type === 'error' ? <AlertCircle size={20} /> : <Mail size={20} />}
          <p className="font-bold">{notification.msg}</p>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold mb-2">Website Mails</h2>
          <p className="text-[var(--text-dim)]">
            {loading ? 'Loading...' : `${messages.length} message${messages.length !== 1 ? 's' : ''} from contact form`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchMessages}
            className="p-3 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl hover:bg-white/5 transition-all"
            title="Refresh"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={handleDeleteAll}
            disabled={loading || messages.length === 0}
            className="flex items-center gap-2 px-4 py-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl font-bold text-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 size={16} /> Delete All
          </button>
          <div className="w-full md:w-[350px] relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="text"
              placeholder="Search by name, email, service..."
              className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl py-3 pl-12 pr-4 outline-none focus:border-[var(--primary)] text-sm transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-10 h-10 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-[var(--text-dim)]">Loading messages...</p>
          </div>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-10">
            <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6 border border-red-500/20">
              <AlertCircle size={40} className="text-red-400" />
            </div>
            <h3 className="text-xl font-bold mb-2">Failed to Load Messages</h3>
            <p className="text-[var(--text-dim)] max-w-xs mx-auto mb-6">{error}</p>
            <button onClick={fetchMessages} className="px-6 py-3 bg-[var(--primary)] text-white rounded-xl font-bold text-sm hover:opacity-90 transition-all">
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && messages.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-10">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6 border border-[var(--border)]">
              <Mail size={40} className="text-[var(--text-dim)]" />
            </div>
            <h3 className="text-xl font-bold mb-2">No messages yet</h3>
            <p className="text-[var(--text-dim)] max-w-xs mx-auto">
              When visitors submit the contact form on your website, they'll appear here.
            </p>
          </div>
        </div>
      )}

      {/* Main layout */}
      {!loading && messages.length > 0 && (
        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row gap-6">

          {/* Left: Message List */}
          <div className={`flex-1 lg:max-w-md bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl overflow-hidden flex flex-col ${selectedMessage ? 'hidden lg:flex' : 'flex'}`}>
            <div className="p-4 border-b border-[var(--border)] bg-slate-500/[0.02]">
              <h3 className="font-bold">Inbox ({filtered.length})</h3>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-[var(--border)]">
              {filtered.map((msg) => (
                <div
                  key={msg._id}
                  onClick={() => setSelectedMessage(msg)}
                  className={`p-5 cursor-pointer transition-all hover:bg-slate-500/5 relative ${selectedMessage?._id === msg._id ? 'bg-[var(--primary)]/[0.03] before:content-[""] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-[var(--primary)]' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-lg bg-[var(--primary)]/10 border border-[var(--border)] flex items-center justify-center flex-shrink-0">
                      <span className="text-[var(--primary)] text-lg font-bold">
                        {msg.name?.charAt(0)?.toUpperCase() || '?'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-bold truncate">{msg.name}</p>
                        <p className="text-[10px] text-[var(--text-dim)] flex-shrink-0 ml-2">{formatDate(msg.createdAt)}</p>
                      </div>
                      <p className="text-sm font-medium text-[var(--primary)] truncate">{msg.email}</p>
                      <p className="text-xs text-[var(--text-dim)] truncate mt-1">
                        {msg.service || 'General Inquiry'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Message Detail */}
          <div className={`flex-[2] bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl flex flex-col overflow-hidden ${!selectedMessage ? 'hidden lg:flex items-center justify-center' : 'flex'}`}>
            {selectedMessage ? (
              <>
                <div className="p-4 border-b border-[var(--border)] bg-slate-500/[0.02] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setSelectedMessage(null)} className="lg:hidden p-2 text-[var(--text-dim)] hover:text-[var(--text-main)]">
                      <ChevronRight className="rotate-180" size={20} />
                    </button>
                    <h3 className="font-bold">Message Details</h3>
                  </div>
                  <button
                    onClick={() => setDeleteConfirm(selectedMessage._id)}
                    className="p-2 text-[var(--text-dim)] hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 space-y-6">
                  <div>
                    <p className="text-xs text-[var(--text-dim)] mb-3 font-semibold uppercase tracking-wider">Contact Info</p>
                    <div className="rounded-xl border border-[var(--border)] overflow-hidden">
                      {[
                        { label: 'Name', value: selectedMessage.name },
                        { label: 'Email', value: selectedMessage.email },
                        { label: 'Service', value: selectedMessage.service || 'Not specified' },
                        { label: 'Submitted', value: formatDateTime(selectedMessage.createdAt) },
                      ].map((row, i) => (
                        <div key={i} className={`flex ${i % 2 === 0 ? 'bg-white/[0.02]' : ''}`}>
                          <div className="w-32 px-4 py-3 text-xs font-semibold text-[var(--text-dim)] flex-shrink-0 border-r border-[var(--border)]">
                            {row.label}
                          </div>
                          <div className="px-4 py-3 text-sm flex-1">
                            {row.value || <span className="text-[var(--text-dim)]">N/A</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-[var(--text-dim)] mb-2 font-semibold uppercase tracking-wider">Message</p>
                    <div className="p-5 rounded-xl bg-white/[0.02] border border-[var(--border)] text-sm leading-relaxed whitespace-pre-wrap">
                      {selectedMessage.message}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center p-10">
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6 border border-[var(--border)]">
                  <MessageSquare size={40} className="text-[var(--text-dim)]" />
                </div>
                <h3 className="text-xl font-bold mb-2">Select a message to view</h3>
                <p className="text-[var(--text-dim)] max-w-xs mx-auto">Choose a message from the list to read it in full.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-bold">Delete Message?</h3>
              <button onClick={() => setDeleteConfirm(null)} className="p-1 text-[var(--text-dim)] hover:text-white">
                <X size={18} />
              </button>
            </div>
            <p className="text-[var(--text-dim)] text-sm mb-6">This will permanently remove the message. This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-3 bg-white/5 border border-[var(--border)] rounded-xl text-sm font-bold hover:bg-white/10 transition-all">
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-3 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 transition-all">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactMails;

