import React, { useState, useEffect } from 'react';
import EmailTrackLayout from '../../components/EmailTrack/EmailTrackLayout';
import EmailDetailModal from '../../components/EmailTrack/EmailDetailModal';
import { 
  History, 
  Eye, 
  RotateCw, 
  Search, 
  Calendar, 
  Users, 
  Send, 
  MessageSquare, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  ArrowLeft,
  Filter
} from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:4999';

const EmailTrackCampaigns = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [recipients, setRecipients] = useState([]);
  const [recipientsLoading, setRecipientsLoading] = useState(false);
  const [selectedRecipientModal, setSelectedRecipientModal] = useState(null);

  // Search & Filter for Recipient-level view
  const [recipientSearch, setRecipientSearch] = useState('');
  const [recipientStatusFilter, setRecipientStatusFilter] = useState('ALL');

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/email-track/campaigns`);
      const data = await res.json();
      if (data.success && Array.isArray(data.campaigns)) {
        setCampaigns(data.campaigns);
      }
    } catch (err) {
      console.error('Failed to fetch campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleSelectCampaign = async (cmp) => {
    setSelectedCampaign(cmp);
    setRecipientsLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/email-track/campaigns/${cmp.campaignId}`);
      const data = await res.json();
      if (data.success) {
        // Use updated campaign with accurate dynamically computed statistics
        if (data.campaign) {
          setSelectedCampaign(data.campaign);
        }
        if (Array.isArray(data.recipients)) {
          setRecipients(data.recipients);
        }
      }
    } catch (err) {
      console.error('Failed to load campaign recipients:', err);
    } finally {
      setRecipientsLoading(false);
    }
  };

  // Filter recipients
  const filteredRecipients = recipients.filter((rec) => {
    const matchesSearch =
      rec.companyName?.toLowerCase().includes(recipientSearch.toLowerCase()) ||
      rec.email?.toLowerCase().includes(recipientSearch.toLowerCase());

    if (recipientStatusFilter === 'ALL') return matchesSearch;
    if (recipientStatusFilter === 'SENT') return matchesSearch && rec.emailSent;
    if (recipientStatusFilter === 'OPENED') return matchesSearch && rec.opened;
    if (recipientStatusFilter === 'REPLIED') return matchesSearch && rec.replied;
    if (recipientStatusFilter === 'FOLLOWUP') return matchesSearch && rec.followUpSent;
    if (recipientStatusFilter === 'FAILED') return matchesSearch && rec.status === 'Failed';
    return matchesSearch;
  });

  return (
    <EmailTrackLayout>
      <div className="space-y-6">

        {/* Top Header Card */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <History className="text-violet-400" size={20} />
              Outreach History & Campaign Tracking
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Accurate recipient-level history showing exactly WHO received each email, open rates, and reply interactions.
            </p>
          </div>

          <button
            onClick={fetchCampaigns}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 border border-[var(--border)] rounded-xl text-xs font-semibold transition-colors"
          >
            <RotateCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh History</span>
          </button>
        </div>

        {/* 1. All Campaigns List */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
            <div>
              <h3 className="text-base font-bold text-white">Previous Campaigns ({campaigns.length})</h3>
              <p className="text-xs text-slate-400">Click on any campaign below to view recipient-level tracking</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[920px]">
              <thead>
                <tr className="border-b border-[var(--border)] text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Campaign Name / ID</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4 text-center">Total Clients</th>
                  <th className="py-3 px-4 text-center">Emails Sent</th>
                  <th className="py-3 px-4 text-center">Opened</th>
                  <th className="py-3 px-4 text-center">Replied</th>
                  <th className="py-3 px-4 text-center">Follow-ups</th>
                  <th className="py-3 px-4 text-center">Failed</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Recipient History</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-xs text-slate-300">
                {campaigns.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-500 italic">
                      {loading ? 'Loading outreach campaigns...' : 'No previous campaigns found in history.'}
                    </td>
                  </tr>
                ) : (
                  campaigns.map((cmp) => {
                    const isSelected = selectedCampaign?.campaignId === cmp.campaignId;
                    const formattedDate = new Date(cmp.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    });
                    const formattedTime = new Date(cmp.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <tr 
                        key={cmp._id || cmp.campaignId} 
                        onClick={() => handleSelectCampaign(cmp)}
                        className={`transition-colors cursor-pointer ${
                          isSelected ? 'bg-violet-600/10 border-l-4 border-violet-500' : 'hover:bg-white/5'
                        }`}
                      >
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-white text-sm">{cmp.name}</div>
                          <div className="text-[11px] font-mono text-violet-400">{cmp.campaignId}</div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                          <div>{formattedDate}</div>
                          <div className="text-slate-500">{formattedTime}</div>
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-white text-sm">{cmp.totalClients || 0}</td>
                        <td className="py-3.5 px-4 text-center text-emerald-400 font-bold text-sm">{cmp.emailsSent || 0}</td>
                        <td className="py-3.5 px-4 text-center text-violet-400 font-bold text-sm">{cmp.openedCount || 0}</td>
                        <td className="py-3.5 px-4 text-center text-purple-400 font-bold text-sm">{cmp.replyCount || 0}</td>
                        <td className="py-3.5 px-4 text-center text-amber-400 font-bold text-sm">{cmp.followUpsSent || 0}</td>
                        <td className="py-3.5 px-4 text-center text-rose-500 font-bold text-sm">{cmp.failedCount || 0}</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold inline-block ${
                            cmp.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            cmp.status === 'Sending' ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20 animate-pulse' :
                            cmp.status === 'Stopped' || cmp.status === 'Paused' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                            'bg-slate-500/10 text-slate-400'
                          }`}>
                            {cmp.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectCampaign(cmp);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1.5 ${
                              isSelected
                                ? 'bg-violet-600 text-white shadow-md'
                                : 'bg-white/5 hover:bg-white/10 text-violet-300 border border-violet-500/20'
                            }`}
                          >
                            <Eye size={13} />
                            <span>{isSelected ? 'Viewing' : 'View Recipients'}</span>
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

        {/* 2. Actual Recipient-level History for Selected Campaign */}
        {selectedCampaign && (
          <div className="bg-[var(--bg-card)] border border-violet-500/30 rounded-2xl p-6 shadow-2xl space-y-5 animate-in fade-in duration-300">
            {/* Header with Campaign Summary */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 font-mono font-semibold">
                    {selectedCampaign.campaignId}
                  </span>
                  <h3 className="text-lg font-bold text-white">
                    Recipient History: {selectedCampaign.name}
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  <strong>Subject:</strong> {selectedCampaign.subject || 'Outreach'}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedCampaign(null)}
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 border border-[var(--border)] rounded-xl text-xs font-medium transition-colors"
                >
                  Close Recipient View
                </button>
              </div>
            </div>

            {/* Campaign Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="bg-white/5 border border-[var(--border)] p-3 rounded-xl">
                <span className="text-[11px] text-slate-400 block font-medium">Total Recipients</span>
                <span className="text-lg font-extrabold text-white mt-0.5 block">{selectedCampaign.totalClients || recipients.length}</span>
              </div>
              <div className="bg-white/5 border border-[var(--border)] p-3 rounded-xl">
                <span className="text-[11px] text-slate-400 block font-medium">Emails Sent</span>
                <span className="text-lg font-extrabold text-emerald-400 mt-0.5 block">{selectedCampaign.emailsSent || 0}</span>
              </div>
              <div className="bg-white/5 border border-[var(--border)] p-3 rounded-xl">
                <span className="text-[11px] text-slate-400 block font-medium">Opened</span>
                <span className="text-lg font-extrabold text-violet-400 mt-0.5 block">{selectedCampaign.openedCount || 0}</span>
              </div>
              <div className="bg-white/5 border border-[var(--border)] p-3 rounded-xl">
                <span className="text-[11px] text-slate-400 block font-medium">Replied</span>
                <span className="text-lg font-extrabold text-purple-400 mt-0.5 block">{selectedCampaign.replyCount || 0}</span>
              </div>
              <div className="bg-white/5 border border-[var(--border)] p-3 rounded-xl">
                <span className="text-[11px] text-slate-400 block font-medium">Follow-ups Sent</span>
                <span className="text-lg font-extrabold text-amber-400 mt-0.5 block">{selectedCampaign.followUpsSent || 0}</span>
              </div>
              <div className="bg-white/5 border border-[var(--border)] p-3 rounded-xl">
                <span className="text-[11px] text-slate-400 block font-medium">Failed / Skipped</span>
                <span className="text-lg font-extrabold text-rose-400 mt-0.5 block">
                  {(selectedCampaign.failedCount || 0) + (selectedCampaign.skippedCount || 0)}
                </span>
              </div>
            </div>

            {/* Recipient Search & Filters */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
                <input
                  type="text"
                  placeholder="Search company or email address..."
                  value={recipientSearch}
                  onChange={(e) => setRecipientSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white/5 border border-[var(--border)] rounded-xl text-xs text-white focus:outline-none focus:border-violet-500"
                />
              </div>

              <select
                value={recipientStatusFilter}
                onChange={(e) => setRecipientStatusFilter(e.target.value)}
                className="px-3 py-2 bg-[#181825] border border-[var(--border)] rounded-xl text-xs text-white focus:outline-none focus:border-violet-500"
              >
                <option value="ALL">All Statuses ({recipients.length})</option>
                <option value="SENT">Sent</option>
                <option value="OPENED">Opened</option>
                <option value="REPLIED">Replied</option>
                <option value="FOLLOWUP">Follow-up Sent</option>
                <option value="FAILED">Failed</option>
              </select>
            </div>

            {/* Recipient-Level Table matching exact user specification */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[850px]">
                <thead>
                  <tr className="border-b border-[var(--border)] text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Company</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Sent Date / Time</th>
                    <th className="py-3 px-4 text-center">Sent</th>
                    <th className="py-3 px-4 text-center">Opened</th>
                    <th className="py-3 px-4 text-center">Replied</th>
                    <th className="py-3 px-4 text-center">Follow-up</th>
                    <th className="py-3 px-4">Current Status</th>
                    <th className="py-3 px-4 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)] text-xs text-slate-300">
                  {recipientsLoading ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400">
                        <RotateCw size={16} className="animate-spin inline mr-2" />
                        Loading recipient tracking history...
                      </td>
                    </tr>
                  ) : filteredRecipients.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-500 italic">
                        No recipients match your search or filter.
                      </td>
                    </tr>
                  ) : (
                    filteredRecipients.map((rec) => {
                      const sentTimeStr = rec.sentAt
                        ? new Date(rec.sentAt).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : rec.createdAt
                        ? new Date(rec.createdAt).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '—';

                      return (
                        <tr key={rec._id || rec.trackingId} className="hover:bg-white/5 transition-colors">
                          <td className="py-3 px-4 font-semibold text-white">
                            {rec.companyName || 'Client'}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-300">
                            {rec.email}
                          </td>
                          <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                            {sentTimeStr}
                          </td>
                          <td className="py-3 px-4 text-center font-bold">
                            {rec.emailSent ? (
                              <span className="text-emerald-400" title="Email sent successfully">✓</span>
                            ) : rec.status === 'Already Sent' ? (
                              <span className="text-amber-400/80" title="Already sent in previous campaign">✓ prev</span>
                            ) : (
                              <span className="text-slate-600">—</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center font-bold">
                            {rec.opened ? (
                              <span className="text-violet-400 flex items-center justify-center gap-1" title={`Opened ${rec.openCount} times`}>
                                <Eye size={13} /> {rec.openCount > 1 ? `${rec.openCount}x` : '✓'}
                              </span>
                            ) : (
                              <span className="text-slate-600">—</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center font-bold">
                            {rec.replied ? (
                              <span className="text-purple-400 font-bold" title={rec.replySubject || 'Replied'}>
                                💬 ✓
                              </span>
                            ) : (
                              <span className="text-slate-600">—</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center font-bold">
                            {rec.followUpSent ? (
                              <span className="text-emerald-400" title="Follow-up sent">✓</span>
                            ) : (
                              <span className="text-slate-600">—</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold inline-block ${
                              rec.status === 'Replied' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                              rec.status === 'Opened' ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20' :
                              rec.status === 'Sent' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                              rec.status === 'Follow-up Sent' ? 'bg-teal-500/10 text-teal-300 border border-teal-500/20' :
                              rec.status === 'Already Sent' ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30' :
                              rec.status === 'Failed' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                              'bg-slate-500/10 text-slate-400'
                            }`}>
                              {rec.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => setSelectedRecipientModal(rec)}
                              className="text-violet-400 hover:text-violet-300 text-xs font-semibold hover:underline"
                            >
                              Timeline
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
        )}

      </div>

      {/* Recipient Timeline Modal */}
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
