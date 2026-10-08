import React, { useState, useEffect } from 'react';
import EmailTrackLayout from '../../components/EmailTrack/EmailTrackLayout';
import EmailDetailModal from '../../components/EmailTrack/EmailDetailModal';
import { RotateCw, Play, Square, CheckCircle2, AlertCircle, Clock, Eye, MessageSquare } from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:4999';

const EmailTrackFollowUp = () => {
  const [summary, setSummary] = useState({
    totalEligible: 0,
    followUpsSent: 0,
    repliesReceived: 0,
    notOpened: 0,
    failed: 0,
    totalRecipients: 0,
  });

  const [recipients, setRecipients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [selectedRecipientModal, setSelectedRecipientModal] = useState(null);

  // Custom follow-up email composer toggle
  const [customSubject, setCustomSubject] = useState('Quick follow-up regarding Octoink Studios');
  const [customBody, setCustomBody] = useState('<p>Hi there,</p><p>I wanted to quickly follow up on my previous email to check if you had a chance to review it. Let us know if you have any questions!</p><p>Best regards,<br/>Octoink Studios</p>');

  const fetchFollowUpData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/email-track/follow-up`);
      const data = await res.json();
      if (data.success) {
        setSummary(data.summary);
        setRecipients(data.recipients);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowUpData();
  }, []);

  // Poll while sending
  useEffect(() => {
    let interval;
    if (isSending) {
      interval = setInterval(fetchFollowUpData, 3000);
    }
    return () => clearInterval(interval);
  }, [isSending]);

  const handleStartFollowUp = async () => {
    if (summary.totalEligible === 0) {
      alert('No clients are currently eligible for follow-up (either all replied or already received follow-up).');
      return;
    }

    try {
      setIsSending(true);
      setStatusMessage(`Starting follow-up sending to ${summary.totalEligible} eligible clients...`);

      const res = await fetch(`${BACKEND_URL}/api/email-track/follow-up/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: customSubject, body: customBody }),
      });

      const data = await res.json();
      if (data.success) {
        setStatusMessage(data.message);
      } else {
        setIsSending(false);
        alert(data.message || 'Failed to start follow-up');
      }
    } catch (err) {
      setIsSending(false);
      alert('Error initiating follow-up execution');
    }
  };

  const handleStopFollowUp = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/email-track/follow-up/stop`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setIsSending(false);
        setStatusMessage('Follow-up process stopped safely.');
      }
    } catch (err) {
      alert('Error stopping follow-up');
    }
  };

  return (
    <EmailTrackLayout>
      <div className="space-y-6">

        {/* Header & Controls Card */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <RotateCw className="text-violet-400" size={20} />
                Follow-up Emails Automation
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Automatically follow up with clients who received initial campaign email but haven't replied (Default timing: 2 days after original send)
              </p>
            </div>

            <div className="flex items-center gap-3">
              {!isSending ? (
                <button
                  onClick={handleStartFollowUp}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all"
                >
                  <Play size={16} fill="currentColor" />
                  <span>Start Follow-up</span>
                </button>
              ) : (
                <button
                  onClick={handleStopFollowUp}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-500/20 transition-all animate-pulse"
                >
                  <Square size={16} fill="currentColor" />
                  <span>Stop Follow-up</span>
                </button>
              )}

              <button
                onClick={fetchFollowUpData}
                className="p-2.5 bg-white/5 hover:bg-white/10 text-slate-300 border border-[var(--border)] rounded-xl text-sm transition-colors"
                title="Refresh Table"
              >
                <RotateCw size={16} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {statusMessage && (
            <div className="p-3 bg-white/5 border border-[var(--border)] rounded-xl text-xs text-amber-300 flex items-center gap-2">
              <Clock size={14} />
              <span>{statusMessage}</span>
            </div>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-[var(--bg-card)] border border-[var(--border)] p-4 rounded-xl">
            <span className="text-xs text-slate-400 block font-medium">Eligible for Follow-up</span>
            <span className="text-xl font-extrabold text-amber-400 mt-1 block">{summary.totalEligible}</span>
          </div>

          <div className="bg-[var(--bg-card)] border border-[var(--border)] p-4 rounded-xl">
            <span className="text-xs text-slate-400 block font-medium">Follow-ups Sent</span>
            <span className="text-xl font-extrabold text-emerald-400 mt-1 block">{summary.followUpsSent}</span>
          </div>

          <div className="bg-[var(--bg-card)] border border-[var(--border)] p-4 rounded-xl">
            <span className="text-xs text-slate-400 block font-medium">Replies Received</span>
            <span className="text-xl font-extrabold text-purple-400 mt-1 block">{summary.repliesReceived}</span>
          </div>

          <div className="bg-[var(--bg-card)] border border-[var(--border)] p-4 rounded-xl">
            <span className="text-xs text-slate-400 block font-medium">Not Opened</span>
            <span className="text-xl font-extrabold text-slate-400 mt-1 block">{summary.notOpened}</span>
          </div>

          <div className="bg-[var(--bg-card)] border border-[var(--border)] p-4 rounded-xl">
            <span className="text-xs text-slate-400 block font-medium">Failed</span>
            <span className="text-xl font-extrabold text-rose-500 mt-1 block">{summary.failed}</span>
          </div>

          <div className="bg-[var(--bg-card)] border border-[var(--border)] p-4 rounded-xl">
            <span className="text-xs text-slate-400 block font-medium">Total Recipients</span>
            <span className="text-xl font-extrabold text-white mt-1 block">{summary.totalRecipients}</span>
          </div>
        </div>

        {/* Follow-up Email Template Preview / Edit */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="text-base font-bold text-white">Follow-up Message Template</h3>

          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Follow-up Subject</label>
              <input
                type="text"
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-[var(--border)] rounded-xl text-sm text-white focus:outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Follow-up Body (HTML/Text)</label>
              <textarea
                rows={3}
                value={customBody}
                onChange={(e) => setCustomBody(e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-[var(--border)] rounded-xl text-sm text-white focus:outline-none focus:border-violet-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Follow-up Clients Table */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="text-base font-bold text-white">Follow-up Eligibility Table</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-[var(--border)] text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Company Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Original Email Sent</th>
                  <th className="py-3 px-4 text-center">Opened</th>
                  <th className="py-3 px-4 text-center">Replied</th>
                  <th className="py-3 px-4">Follow-up Status</th>
                  <th className="py-3 px-4">Follow-up Date</th>
                  <th className="py-3 px-4">Last Activity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-xs text-slate-300">
                {recipients.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500 italic">
                      No campaign recipients found for follow-up evaluation.
                    </td>
                  </tr>
                ) : (
                  recipients.map((rec) => {
                    const isEligible = !rec.replied && !rec.followUpSent;
                    return (
                      <tr 
                        key={rec._id}
                        onClick={() => setSelectedRecipientModal(rec)}
                        className="hover:bg-white/5 cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-4 font-semibold text-white">{rec.companyName}</td>
                        <td className="py-3 px-4 font-mono">{rec.email}</td>
                        <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                          {rec.sentAt ? new Date(rec.sentAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="py-3 px-4 text-center font-bold">{rec.opened ? '👁' : '-'}</td>
                        <td className="py-3 px-4 text-center font-bold">{rec.replied ? '💬' : '-'}</td>
                        <td className="py-3 px-4">
                          {rec.followUpSent ? (
                            <span className="inline-flex items-center gap-1 text-emerald-400 font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                              Sent ✓
                            </span>
                          ) : rec.replied ? (
                            <span className="inline-flex items-center gap-1 text-purple-400 font-medium px-2 py-0.5 rounded-full bg-purple-500/10">
                              Replied (Excluded)
                            </span>
                          ) : isEligible ? (
                            <span className="inline-flex items-center gap-1 text-amber-400 font-medium px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                              Eligible
                            </span>
                          ) : (
                            <span className="text-slate-500">Pending</span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                          {rec.followUpSentAt ? new Date(rec.followUpSentAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                          {rec.lastActivityAt ? new Date(rec.lastActivityAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
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

      {selectedRecipientModal && (
        <EmailDetailModal
          recipient={selectedRecipientModal}
          onClose={() => setSelectedRecipientModal(null)}
        />
      )}

    </EmailTrackLayout>
  );
};

export default EmailTrackFollowUp;
