import React from 'react';
import { X, Mail, Eye, MessageSquare, CheckCircle2, Clock, Paperclip, AlertCircle } from 'lucide-react';

const EmailDetailModal = ({ recipient, campaign, onClose }) => {
  if (!recipient) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Mail className="text-violet-400" size={20} />
              {recipient.companyName}
            </h2>
            <p className="text-sm text-slate-400 mt-0.5">{recipient.email}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Status Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white/5 border border-[var(--border)] p-3 rounded-xl">
            <span className="text-xs text-slate-400 block mb-1">Email Sent</span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full inline-block ${
              recipient.emailSent ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400'
            }`}>
              {recipient.emailSent ? 'Sent ✓' : 'Pending'}
            </span>
          </div>

          <div className="bg-white/5 border border-[var(--border)] p-3 rounded-xl">
            <span className="text-xs text-slate-400 block mb-1">Open Status</span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full inline-block ${
              recipient.opened ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-500/10 text-slate-400'
            }`}>
              {recipient.opened ? `Opened 👁 (${recipient.openCount || 1}x)` : 'Not Opened'}
            </span>
          </div>

          <div className="bg-white/5 border border-[var(--border)] p-3 rounded-xl">
            <span className="text-xs text-slate-400 block mb-1">Reply Status</span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full inline-block ${
              recipient.replied ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-slate-500/10 text-slate-400'
            }`}>
              {recipient.replied ? 'Replied 💬' : 'No Reply'}
            </span>
          </div>

          <div className="bg-white/5 border border-[var(--border)] p-3 rounded-xl">
            <span className="text-xs text-slate-400 block mb-1">Follow-up</span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full inline-block ${
              recipient.followUpSent ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400'
            }`}>
              {recipient.followUpSent ? 'Sent ✓' : recipient.followUpStatus || 'Pending'}
            </span>
          </div>
        </div>

        {/* Campaign Info */}
        <div className="bg-white/5 border border-[var(--border)] rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Campaign: <strong className="text-white">{campaign?.name || recipient.campaignId}</strong></span>
            <span>ID: <strong className="text-violet-400">{recipient.campaignId}</strong></span>
          </div>
          <div className="text-sm font-semibold text-white">
            Subject: {campaign?.subject || recipient.subject || 'N/A'}
          </div>
        </div>

        {/* Email Body Content */}
        {campaign?.body && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider">Email Body</h4>
            <div 
              className="bg-black/30 border border-[var(--border)] rounded-xl p-4 text-sm text-slate-300 max-h-48 overflow-y-auto prose prose-invert"
              dangerouslySetInnerHTML={{ __html: campaign.body }}
            />
          </div>
        )}

        {/* Attachments Section */}
        {campaign?.attachments && campaign.attachments.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider">Attachments</h4>
            <div className="flex flex-wrap gap-2">
              {campaign.attachments.map((att, idx) => (
                <div key={idx} className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-[var(--border)] rounded-xl text-xs text-slate-300">
                  <Paperclip size={14} className="text-violet-400" />
                  <span className="truncate max-w-[200px]">{att.originalname || att.filename}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reply Message if available */}
        {recipient.replied && (
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare size={14} /> Received Reply
              </h4>
              <span className="text-xs text-purple-300">{formatDate(recipient.repliedAt)}</span>
            </div>
            <p className="text-sm font-medium text-white">Subject: {recipient.replySubject || 'Re: Campaign'}</p>
            <p className="text-sm text-slate-300 bg-black/40 p-3 rounded-lg border border-purple-500/10 whitespace-pre-line">
              {recipient.replyMessage || 'No reply text available.'}
            </p>
          </div>
        )}

        {/* Interactive Chronological Timeline */}
        <div className="space-y-3">
          <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider">Interaction Timeline</h4>
          <div className="relative border-l-2 border-violet-500/30 pl-4 space-y-4 ml-2">
            
            {recipient.sentAt && (
              <div className="relative flex items-start gap-3">
                <div className="absolute -left-[23px] top-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[var(--bg-card)]"></div>
                <div>
                  <p className="text-xs font-semibold text-white">First email sent ✓</p>
                  <p className="text-[11px] text-slate-400">{formatDate(recipient.sentAt)}</p>
                </div>
              </div>
            )}

            {recipient.opened && (
              <div className="relative flex items-start gap-3">
                <div className="absolute -left-[23px] top-0 w-3 h-3 rounded-full bg-blue-500 border-2 border-[var(--bg-card)]"></div>
                <div>
                  <p className="text-xs font-semibold text-white">Email opened 👁</p>
                  <p className="text-[11px] text-slate-400">First: {formatDate(recipient.firstOpenedAt)} | Total Opens: {recipient.openCount}</p>
                </div>
              </div>
            )}

            {recipient.followUpSent && (
              <div className="relative flex items-start gap-3">
                <div className="absolute -left-[23px] top-0 w-3 h-3 rounded-full bg-violet-500 border-2 border-[var(--bg-card)]"></div>
                <div>
                  <p className="text-xs font-semibold text-white">Follow-up sent ✓</p>
                  <p className="text-[11px] text-slate-400">{formatDate(recipient.followUpSentAt)}</p>
                </div>
              </div>
            )}

            {recipient.replied && (
              <div className="relative flex items-start gap-3">
                <div className="absolute -left-[23px] top-0 w-3 h-3 rounded-full bg-purple-500 border-2 border-[var(--bg-card)]"></div>
                <div>
                  <p className="text-xs font-semibold text-white">Reply received 💬</p>
                  <p className="text-[11px] text-slate-400">{formatDate(recipient.repliedAt)}</p>
                </div>
              </div>
            )}

            {!recipient.sentAt && !recipient.opened && !recipient.followUpSent && !recipient.replied && (
              <p className="text-xs text-slate-500 italic">No activity recorded yet.</p>
            )}

          </div>
        </div>

        {/* Footer Close */}
        <div className="flex justify-end pt-4 border-t border-[var(--border)]">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium text-sm transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

export default EmailDetailModal;
