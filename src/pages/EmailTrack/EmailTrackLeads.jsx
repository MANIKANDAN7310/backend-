import React, { useState, useEffect } from 'react';
import EmailTrackLayout from '../../components/EmailTrack/EmailTrackLayout';
import EmailDetailModal from '../../components/EmailTrack/EmailDetailModal';
import { 
  MessageSquare, 
  Search, 
  Eye, 
  Plus, 
  RotateCw, 
  CheckCircle2, 
  Filter, 
  RefreshCw,
  Mail,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:4999';

const EmailTrackLeads = () => {
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  // Modal states
  const [selectedReply, setSelectedReply] = useState(null);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  // Form state for logging a reply manually
  const [logForm, setLogForm] = useState({
    email: '',
    replySubject: '',
    replyMessage: '',
  });

  const fetchReplies = async (triggerAutoSync = false) => {
    setLoading(true);
    try {
      if (triggerAutoSync) {
        // Automatically request server to check Gmail for new incoming replies
        try {
          await fetch(`${BACKEND_URL}/api/email-track/replies/sync`, { method: 'POST' });
        } catch (_) {}
      }

      const res = await fetch(`${BACKEND_URL}/api/email-track/replies`);
      const data = await res.json();
      if (data.success && Array.isArray(data.replies)) {
        setReplies(data.replies);
      }
    } catch (err) {
      console.error('Error fetching replies:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReplies(true);
  }, []);

  // Manual Trigger to Check Gmail IMAP for New Client Replies
  const handleManualSync = async () => {
    setSyncing(true);
    setSyncMessage('Connecting to Gmail (hello.octoinkstudios@gmail.com) and scanning for new client replies...');
    try {
      const res = await fetch(`${BACKEND_URL}/api/email-track/replies/sync`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        if (Array.isArray(data.replies)) {
          setReplies(data.replies);
        } else {
          await fetchReplies(false);
        }
        setSyncMessage(
          data.newRepliesCount > 0
            ? `🎉 Detected and recorded ${data.newRepliesCount} new incoming client reply(ies)!`
            : `Scan complete. Inbox is up to date (no new unrecorded replies).`
        );
      } else {
        setSyncMessage(`Sync warning: ${data.error || 'Could not complete scan'}`);
        await fetchReplies(false);
      }
    } catch (err) {
      setSyncMessage('Error communicating with sync service');
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncMessage(''), 6000);
    }
  };

  const handleUpdateStatus = async (replyId, newStatus) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/email-track/replies/${replyId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setReplies(prev => prev.map(r => r._id === replyId ? data.reply : r));
      }
    } catch (err) {
      alert('Failed to update reply status');
    }
  };

  const handleLogReplySubmit = async (e) => {
    e.preventDefault();
    if (!logForm.email || !logForm.replyMessage) {
      alert('Please fill email address and reply message');
      return;
    }

    try {
      const res = await fetch(`${BACKEND_URL}/api/email-track/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logForm),
      });
      const data = await res.json();
      if (data.success) {
        setIsLogModalOpen(false);
        setLogForm({ email: '', replySubject: '', replyMessage: '' });
        fetchReplies(false);
      } else {
        alert(data.message || 'Failed to log reply');
      }
    } catch (err) {
      alert('Error logging reply');
    }
  };

  const filteredReplies = replies.filter(r => {
    const emailVal = r.email || r.sender || '';
    const companyVal = r.companyName || '';
    const subjectVal = r.replySubject || r.subject || '';
    const messageVal = r.replyMessage || r.body || '';

    const matchesSearch = 
      companyVal.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emailVal.toLowerCase().includes(searchQuery.toLowerCase()) ||
      subjectVal.toLowerCase().includes(searchQuery.toLowerCase()) ||
      messageVal.toLowerCase().includes(searchQuery.toLowerCase());

    if (statusFilter === 'ALL') return matchesSearch;
    return matchesSearch && r.status === statusFilter;
  });

  return (
    <EmailTrackLayout>
      <div className="space-y-6">

        {/* Header section */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <MessageSquare className="text-purple-400" size={20} />
              Replies & Qualified Lead Inbox
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Client responses to outreach emails are automatically detected and linked to their original campaign, email address, and subject.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleManualSync}
              disabled={syncing}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-md ${
                syncing
                  ? 'bg-purple-600/30 text-purple-200 border border-purple-500/40 cursor-wait'
                  : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/20'
              }`}
            >
              <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
              <span>{syncing ? 'Checking Gmail Inbox...' : 'Sync Incoming Replies'}</span>
            </button>

            <button
              onClick={() => setIsLogModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-white/5 border border-[var(--border)] text-slate-300 hover:bg-white/10 rounded-xl text-xs font-semibold transition-colors"
            >
              <Plus size={15} /> Log Reply
            </button>

            <button
              onClick={() => fetchReplies(false)}
              title="Refresh list"
              className="p-2.5 bg-white/5 hover:bg-white/10 text-slate-300 border border-[var(--border)] rounded-xl text-xs transition-colors"
            >
              <RotateCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {syncMessage && (
          <div className="p-3.5 bg-purple-500/10 border border-purple-500/30 rounded-xl text-xs text-purple-300 flex items-center gap-2 animate-in fade-in">
            <Sparkles size={16} className="text-purple-400 shrink-0" />
            <span>{syncMessage}</span>
          </div>
        )}

        {/* Replies Inbox Table */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <h3 className="text-base font-bold text-white">Received Client Replies ({filteredReplies.length})</h3>

            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
                <input
                  type="text"
                  placeholder="Search replies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white/5 border border-[var(--border)] rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-[#181825] border border-[var(--border)] rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
              >
                <option value="ALL">All Reply Statuses</option>
                <option value="New Reply">New Reply</option>
                <option value="Contacted">Contacted</option>
                <option value="Qualified">Qualified</option>
                <option value="Follow-up">Follow-up</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[950px]">
              <thead>
                <tr className="border-b border-[var(--border)] text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Client / Company</th>
                  <th className="py-3 px-4">Client Email</th>
                  <th className="py-3 px-4">Original Campaign</th>
                  <th className="py-3 px-4">Original Outreach Subject</th>
                  <th className="py-3 px-4">Reply Received Date</th>
                  <th className="py-3 px-4">Reply Subject & Message</th>
                  <th className="py-3 px-4">Lead Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-xs text-slate-300">
                {filteredReplies.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500 italic">
                      {loading ? 'Checking inbox for replies...' : 'No replies recorded yet. Click "Sync Incoming Replies" to check Gmail inbox.'}
                    </td>
                  </tr>
                ) : (
                  filteredReplies.map((r) => {
                    const receivedDateStr = new Date(r.receivedAt).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <tr key={r._id} className="hover:bg-white/5 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-white text-sm">
                          {r.companyName || (r.email ? r.email.split('@')[0] : 'Client')}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-300">
                          {r.email || r.sender || '-'}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-violet-400">
                          <div className="font-semibold text-slate-200">{r.originalCampaignName || r.campaignId}</div>
                          <div className="text-[11px] text-slate-400">{r.campaignId}</div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-300 max-w-[180px] truncate" title={r.originalSubject}>
                          {r.originalSubject || 'Outreach Email'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                          {receivedDateStr}
                        </td>
                        <td className="py-3.5 px-4 max-w-[220px]">
                          <div className="font-semibold text-white truncate" title={r.replySubject || r.subject}>
                            {r.replySubject || r.subject || 'Re: Inquiry'}
                          </div>
                          <div className="text-slate-400 truncate text-[11px]" title={r.replyMessage || r.body}>
                            {r.replyMessage || r.body || '-'}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <select
                            value={r.status}
                            onChange={(e) => handleUpdateStatus(r._id, e.target.value)}
                            className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20 focus:outline-none cursor-pointer"
                          >
                            <option value="New Reply" className="bg-slate-900 text-slate-200">New Reply</option>
                            <option value="Contacted" className="bg-slate-900 text-slate-200">Contacted</option>
                            <option value="Qualified" className="bg-slate-900 text-slate-200">Qualified</option>
                            <option value="Follow-up" className="bg-slate-900 text-slate-200">Follow-up</option>
                            <option value="Closed" className="bg-slate-900 text-slate-200">Closed</option>
                          </select>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => setSelectedReply(r)}
                            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-purple-300 border border-purple-500/20 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1.5"
                          >
                            <Eye size={13} /> View Message
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Reply Message View Modal */}
      {selectedReply && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl w-full max-w-xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div>
                <h3 className="text-lg font-bold text-white">{selectedReply.companyName || (selectedReply.email ? selectedReply.email.split('@')[0] : 'Client')}</h3>
                <p className="text-xs text-slate-400 font-mono">{selectedReply.email || selectedReply.sender}</p>
              </div>
              <button onClick={() => setSelectedReply(null)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <div className="space-y-1.5 text-xs text-slate-300 bg-white/5 p-3.5 rounded-xl border border-[var(--border)]">
              <p><strong>Original Campaign:</strong> <span className="text-violet-300">{selectedReply.originalCampaignName || selectedReply.campaignId}</span></p>
              <p><strong>Original Outreach Subject:</strong> {selectedReply.originalSubject || 'Outreach Email'}</p>
              <p><strong>Reply Subject:</strong> <span className="text-white font-semibold">{selectedReply.replySubject || selectedReply.subject || 'Re: Inquiry'}</span></p>
              <p><strong>Received Date & Time:</strong> {new Date(selectedReply.receivedAt).toLocaleString()}</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Reply Message Content:</label>
              <div className="bg-black/40 border border-purple-500/20 rounded-xl p-4 text-sm text-slate-200 whitespace-pre-line min-h-[140px] max-h-64 overflow-y-auto leading-relaxed">
                {selectedReply.replyMessage || selectedReply.body || '(No message body provided)'}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedReply(null)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-medium"
              >
                Close Message
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Log Reply Modal */}
      {isLogModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleLogReplySubmit} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h3 className="text-base font-bold text-white">Log Received Client Reply</h3>
              <button type="button" onClick={() => setIsLogModalOpen(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Client Email Address *</label>
              <input
                type="email"
                required
                placeholder="client@company.com"
                value={logForm.email}
                onChange={(e) => setLogForm({ ...logForm, email: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-[var(--border)] rounded-xl text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Reply Subject</label>
              <input
                type="text"
                placeholder="Re: Octoink Studios Collaboration"
                value={logForm.replySubject}
                onChange={(e) => setLogForm({ ...logForm, replySubject: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-[var(--border)] rounded-xl text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Reply Message *</label>
              <textarea
                required
                rows={4}
                placeholder="Enter client's reply message body..."
                value={logForm.replyMessage}
                onChange={(e) => setLogForm({ ...logForm, replyMessage: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-[var(--border)] rounded-xl text-sm text-white focus:outline-none focus:border-purple-500 font-mono"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsLogModalOpen(false)}
                className="px-4 py-2 bg-white/10 text-white rounded-xl text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold"
              >
                Save Received Reply
              </button>
            </div>
          </form>
        </div>
      )}

    </EmailTrackLayout>
  );
};

export default EmailTrackLeads;
