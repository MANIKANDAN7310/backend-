import React, { useState, useEffect } from 'react';
import EmailTrackLayout from '../../components/EmailTrack/EmailTrackLayout';
import EmailDetailModal from '../../components/EmailTrack/EmailDetailModal';
import { History, Eye, RotateCw, Play, Square, Calendar, Users, Send, MessageSquare } from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:4999';

const EmailTrackCampaigns = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [recipients, setRecipients] = useState([]);
  const [selectedRecipientModal, setSelectedRecipientModal] = useState(null);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/email-track/campaigns`);
      const data = await res.json();
      if (data.success) {
        setCampaigns(data.campaigns);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleSelectCampaign = async (cmp) => {
    setSelectedCampaign(cmp);
    try {
      const res = await fetch(`${BACKEND_URL}/api/email-track/campaigns/${cmp.campaignId}`);
      const data = await res.json();
      if (data.success) {
        setRecipients(data.recipients);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <EmailTrackLayout>
      <div className="space-y-6">

        {/* Header section */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 shadow-xl flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <History className="text-violet-400" size={20} />
              Outreach History & Campaign Performance
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Review all historical campaigns, recipient stats, open counts, and reply metrics
            </p>
          </div>

          <button
            onClick={fetchCampaigns}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 border border-[var(--border)] rounded-xl text-xs font-semibold transition-colors"
          >
            <RotateCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh History
          </button>
        </div>

        {/* Campaigns Table */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 shadow-xl space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="border-b border-[var(--border)] text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Campaign Name / ID</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 px-4 text-center">Total Clients</th>
                  <th className="py-3 px-4 text-center">Sent</th>
                  <th className="py-3 px-4 text-center">Opened</th>
                  <th className="py-3 px-4 text-center">Replies</th>
                  <th className="py-3 px-4 text-center">Follow-ups</th>
                  <th className="py-3 px-4 text-center">Failed</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-xs text-slate-300">
                {campaigns.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-500 italic">
                      No campaigns found in history yet.
                    </td>
                  </tr>
                ) : (
                  campaigns.map((cmp) => (
                    <tr key={cmp._id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-white">{cmp.name}</div>
                        <div className="text-[11px] font-mono text-violet-400">{cmp.campaignId}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                        {new Date(cmp.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-white">{cmp.totalClients}</td>
                      <td className="py-3 px-4 text-center text-emerald-400 font-bold">{cmp.emailsSent}</td>
                      <td className="py-3 px-4 text-center text-violet-400 font-bold">{cmp.openedCount}</td>
                      <td className="py-3 px-4 text-center text-purple-400 font-bold">{cmp.replyCount}</td>
                      <td className="py-3 px-4 text-center text-amber-400 font-bold">{cmp.followUpsSent}</td>
                      <td className="py-3 px-4 text-center text-rose-500 font-bold">{cmp.failedCount}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold inline-block ${
                          cmp.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          cmp.status === 'Sending' ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20 animate-pulse' :
                          cmp.status === 'Stopped' || cmp.status === 'Paused' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          'bg-slate-500/10 text-slate-400'
                        }`}>
                          {cmp.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleSelectCampaign(cmp)}
                          className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-violet-300 border border-violet-500/20 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ml-auto"
                        >
                          <Eye size={14} /> View Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Campaign Recipients Breakdown */}
        {selectedCampaign && (
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
              <div>
                <h3 className="text-base font-bold text-white">
                  Recipient Details for {selectedCampaign.name} ({selectedCampaign.campaignId})
                </h3>
                <p className="text-xs text-slate-400">Subject: {selectedCampaign.subject}</p>
              </div>
              <button
                onClick={() => setSelectedCampaign(null)}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-medium"
              >
                Close Breakdown
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-[var(--border)] text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Company Name</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-center">Sent</th>
                    <th className="py-3 px-4 text-center">Opened</th>
                    <th className="py-3 px-4 text-center">Replied</th>
                    <th className="py-3 px-4 text-center">Follow-up</th>
                    <th className="py-3 px-4">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)] text-xs text-slate-300">
                  {recipients.map((rec) => (
                    <tr key={rec._id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 font-semibold text-white">{rec.companyName}</td>
                      <td className="py-3 px-4 font-mono">{rec.email}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[11px] bg-white/5 border border-[var(--border)]">
                          {rec.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-bold">{rec.emailSent ? '✓' : '-'}</td>
                      <td className="py-3 px-4 text-center font-bold">{rec.opened ? `👁 (${rec.openCount}x)` : '-'}</td>
                      <td className="py-3 px-4 text-center font-bold">{rec.replied ? '💬' : '-'}</td>
                      <td className="py-3 px-4 text-center font-bold">{rec.followUpSent ? '✓' : '-'}</td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => setSelectedRecipientModal(rec)}
                          className="text-violet-400 hover:underline font-medium"
                        >
                          View Timeline
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {selectedRecipientModal && (
        <EmailDetailModal
          recipient={selectedRecipientModal}
          campaign={selectedCampaign}
          onClose={() => setSelectedRecipientModal(null)}
        />
      )}

    </EmailTrackLayout>
  );
};

export default EmailTrackCampaigns;
