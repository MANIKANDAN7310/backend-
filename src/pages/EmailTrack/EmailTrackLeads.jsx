import React, { useState, useEffect } from 'react';
import EmailTrackLayout from '../../components/EmailTrack/EmailTrackLayout';
import EmailDetailModal from '../../components/EmailTrack/EmailDetailModal';
import { MessageSquare, Search, Eye, Plus, RotateCw, CheckCircle2, Filter } from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:4999';

const EmailTrackLeads = () => {
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  // Modal states
  const [selectedReply, setSelectedReply] = useState(null);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  // Form state for logging a reply
  const [logForm, setLogForm] = useState({
    email: '',
    replySubject: '',
    replyMessage: '',
  });

  const fetchReplies = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/email-track/replies`);
      const data = await res.json();
      if (data.success) {
        setReplies(data.replies);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReplies();
  }, []);

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
        fetchReplies();
      } else {
        alert(data.message || 'Failed to log reply');
      }
    } catch (err) {
      alert('Error logging reply');
    }
  };

  const filteredReplies = replies.filter(r => {
    const matchesSearch = 
      r.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.replyMessage?.toLowerCase().includes(searchQuery.toLowerCase());

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
              Only clients who actually replied to email campaigns appear here. View real conversation messages and manage lead stages.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsLogModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-purple-600/20 border border-purple-500/30 text-purple-300 hover:bg-purple-600/30 rounded-xl text-xs font-semibold transition-colors"
            >
              <Plus size={16} /> Log Incoming Reply
            </button>

            <button
              onClick={fetchReplies}
              className="p-2.5 bg-white/5 hover:bg-white/10 text-slate-300 border border-[var(--border)] rounded-xl text-xs transition-colors"
            >
              <RotateCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Replies Inbox Table */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <h3 className="text-base font-bold text-white">Received Replies ({filteredReplies.length})</h3>

            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Search replies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-white/5 border border-[var(--border)] rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-[#181825] border border-[var(--border)] rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
              >
                <option value="ALL" className="bg-[#181825] text-white py-1">All Reply Statuses</option>
                <option value="New Reply" className="bg-[#181825] text-white py-1">New Reply</option>
                <option value="Contacted" className="bg-[#181825] text-white py-1">Contacted</option>
                <option value="Qualified" className="bg-[#181825] text-white py-1">Qualified</option>
                <option value="Follow-up" className="bg-[#181825] text-white py-1">Follow-up</option>
                <option value="Closed" className="bg-[#181825] text-white py-1">Closed</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[850px]">
              <thead>
                <tr className="border-b border-[var(--border)] text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Company Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Reply Subject</th>
                  <th className="py-3 px-4">Reply Excerpt</th>
                  <th className="py-3 px-4">Received Date</th>
                  <th className="py-3 px-4">Campaign</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">View Message</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-xs text-slate-300">
                {filteredReplies.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500 italic">
                      No replies received yet.
                    </td>
                  </tr>
                ) : (
                  filteredReplies.map((r) => (
                    <tr key={r._id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 font-bold text-white">{r.companyName}</td>
                      <td className="py-3 px-4 font-mono text-slate-300">{r.email}</td>
                      <td className="py-3 px-4 font-medium text-white">{r.replySubject || 'Re: Campaign'}</td>
                      <td className="py-3 px-4 text-slate-400 truncate max-w-[200px]">{r.replyMessage}</td>
                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                        {new Date(r.receivedAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-mono text-violet-400">{r.campaignId}</td>
                      <td className="py-3 px-4">
                        <select
                          value={r.status}
                          onChange={(e) => handleUpdateStatus(r._id, e.target.value)}
                          className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20 focus:outline-none"
                        >
                          <option value="New Reply" className="bg-slate-900 text-slate-200">New Reply</option>
                          <option value="Contacted" className="bg-slate-900 text-slate-200">Contacted</option>
                          <option value="Qualified" className="bg-slate-900 text-slate-200">Qualified</option>
                          <option value="Follow-up" className="bg-slate-900 text-slate-200">Follow-up</option>
                          <option value="Closed" className="bg-slate-900 text-slate-200">Closed</option>
                        </select>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedReply(r)}
                          className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-purple-300 border border-purple-500/20 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1.5"
                        >
                          <Eye size={14} /> View Message
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Reply Content View Modal */}
      {selectedReply && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl w-full max-w-xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div>
                <h3 className="text-lg font-bold text-white">{selectedReply.companyName}</h3>
                <p className="text-xs text-slate-400">{selectedReply.email}</p>
              </div>
              <button onClick={() => setSelectedReply(null)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <div className="space-y-1 text-xs text-slate-300">
              <p><strong>Campaign ID:</strong> {selectedReply.campaignId}</p>
              <p><strong>Subject:</strong> {selectedReply.replySubject}</p>
              <p><strong>Received:</strong> {new Date(selectedReply.receivedAt).toLocaleString()}</p>
            </div>

            <div className="bg-black/40 border border-purple-500/20 rounded-xl p-4 text-sm text-slate-200 whitespace-pre-line min-h-[120px]">
              {selectedReply.replyMessage}
            </div>

            <div className="flex justify-end pt-3">
              <button
                onClick={() => setSelectedReply(null)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Log Reply Modal */}
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
