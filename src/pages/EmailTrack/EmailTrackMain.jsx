import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import EmailTrackLayout from '../../components/EmailTrack/EmailTrackLayout';
import EmailDetailModal from '../../components/EmailTrack/EmailDetailModal';
import { 
  Upload, 
  Send, 
  Square, 
  Play, 
  CheckCircle2, 
  XCircle, 
  FileSpreadsheet, 
  Paperclip, 
  Eye, 
  Search, 
  Filter, 
  RotateCw, 
  Save, 
  AlertCircle,
  FileText,
  Image as ImageIcon
} from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:4999';

const EmailTrackMain = () => {
  // Single connection state — no prop dependency, owns its own fetch
  const [connection, setConnection] = useState({
    connected: false,
    loading: true,
    senderEmail: 'hello.octoinkstudios@gmail.com',
    message: ''
  });

  const checkSenderConnection = async () => {
    setConnection(prev => ({ ...prev, loading: true }));
    try {
      const res = await fetch(`${BACKEND_URL}/api/email-track/connection`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setConnection({
        connected: Boolean(data.connected),
        loading: false,
        senderEmail: data.senderEmail || data.email || 'hello.octoinkstudios@gmail.com',
        message: data.message || '',
      });
    } catch (err) {
      setConnection({
        connected: false,
        loading: false,
        senderEmail: 'hello.octoinkstudios@gmail.com',
        message: 'Could not reach backend',
      });
    } finally {
      // loading is already set to false in try/catch above,
      // but finally ensures it clears even on unexpected throws
      setConnection(prev => prev.loading ? { ...prev, loading: false } : prev);
    }
  };

  useEffect(() => {
    checkSenderConnection();
  }, []);

  const isSenderConnected = connection.connected;
  const isConnectionLoading = connection.loading;

  // File Upload State
  const fileInputRef = useRef(null);
  const attachmentInputRef = useRef(null);

  const [importSummary, setImportSummary] = useState({
    totalClients: 0,
    validEmails: 0,
    invalidEmails: 0,
    emailsSent: 0,
    opened: 0,
    replied: 0,
    followUpsSent: 0,
    failed: 0,
  });

  const [clients, setClients] = useState([]);
  const [selectedClients, setSelectedClients] = useState([]);

  // Campaign Form State
  const [campaignName, setCampaignName] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [activeCampaign, setActiveCampaign] = useState(null);

  // Sending Queue State
  const [isSending, setIsSending] = useState(false);
  const [sendingStatusMessage, setSendingStatusMessage] = useState('');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Preview & Detail Modals
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedRecipientForModal, setSelectedRecipientForModal] = useState(null);

  // Poll active campaign status if sending
  useEffect(() => {
    let interval;
    if (activeCampaign && isSending) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`${BACKEND_URL}/api/email-track/campaigns/${activeCampaign.campaignId}`);
          const data = await res.json();
          if (data.success && data.campaign) {
            setActiveCampaign(data.campaign);
            if (data.recipients) {
              setClients(data.recipients);
              updateSummaryFromRecipients(data.recipients);
            }
            if (data.campaign.status === 'Completed' || data.campaign.status === 'Stopped') {
              setIsSending(false);
              setSendingStatusMessage(`Campaign status: ${data.campaign.status}`);
            }
          }
        } catch (_) {}
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [activeCampaign, isSending]);

  const updateSummaryFromRecipients = (recList) => {
    let sent = 0, open = 0, reply = 0, follow = 0, fail = 0;
    recList.forEach(r => {
      if (r.emailSent) sent++;
      if (r.opened) open++;
      if (r.replied) reply++;
      if (r.followUpSent) follow++;
      if (r.status === 'Failed') fail++;
    });
    setImportSummary(prev => ({
      ...prev,
      emailsSent: sent,
      opened: open,
      replied: reply,
      followUpsSent: follow,
      failed: fail,
    }));
  };

  // 1. Upload Excel / CSV file
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSendingStatusMessage('Reading uploaded file...');

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' });

        if (!rows || rows.length === 0) {
          alert('The uploaded file is empty or could not be read.');
          setSendingStatusMessage('Uploaded file is empty.');
          return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const parsedList = [];
        let validCount = 0;
        let invalidCount = 0;

        // Detect if Row 0 is a Header row or Data row
        let startRowIndex = 0;
        const row0 = rows[0] || [];
        const isRow0Header = row0.some((cell) => {
          const str = String(cell).trim().toLowerCase();
          return (
            (str.includes('company') || str.includes('email') || str.includes('mail') || str.includes('name') || str.includes('org')) &&
            !emailRegex.test(str)
          );
        });

        if (isRow0Header) {
          startRowIndex = 1;
        }

        for (let i = startRowIndex; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0) continue;

          let companyName = '';
          let email = '';

          row.forEach((cell) => {
            const val = String(cell).trim();
            if (!val) return;

            if (emailRegex.test(val)) {
              if (!email) email = val;
            } else {
              if (!companyName) companyName = val;
            }
          });

          if (!email && !companyName) continue;
          if (!companyName) companyName = email ? email.split('@')[0] : `Client #${i + 1}`;

          const isValid = emailRegex.test(email);
          if (isValid) validCount++;
          else invalidCount++;

          parsedList.push({
            _id: `temp-${i}-${Date.now()}`,
            companyName,
            email,
            isValidEmail: isValid,
            status: isValid ? 'Ready' : 'Failed',
            errorMessage: isValid ? '' : 'Invalid email address format',
            emailSent: false,
            opened: false,
            replied: false,
            followUpSent: false,
            lastActivityAt: new Date(),
          });
        }

        if (parsedList.length === 0) {
          alert('No client records or email addresses found in uploaded file. Please check file columns.');
          setSendingStatusMessage('No clients parsed from file.');
          return;
        }

        setClients(parsedList);
        setImportSummary({
          totalClients: parsedList.length,
          validEmails: validCount,
          invalidEmails: invalidCount,
          emailsSent: 0,
          opened: 0,
          replied: 0,
          followUpsSent: 0,
          failed: invalidCount,
        });

        setSendingStatusMessage(`Successfully imported ${parsedList.length} clients (${validCount} valid emails).`);
      } catch (err) {
        console.error('File parsing error:', err);
        alert('Error parsing uploaded file. Please ensure it is a valid .xlsx, .xls, or .csv file.');
        setSendingStatusMessage('Error parsing file.');
      }
    };

    reader.onerror = () => {
      alert('Failed to read file from disk.');
      setSendingStatusMessage('Failed to read file.');
    };

    reader.readAsArrayBuffer(file);
  };

  // 2. Add Attachments
  const handleAttachmentChange = (e) => {
    const files = Array.from(e.target.files);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // 3. Create Campaign & Start Sending
  const handleStartSending = async () => {
    if (!isSenderConnected) {
      alert('Gmail sender (hello.octoinkstudios@gmail.com) is currently Disconnected. Click the reconnect/refresh button at top right to check Gmail SMTP connection.');
      return;
    }
    if (clients.length === 0) {
      alert('Please upload a client list (.xlsx, .csv) first!');
      return;
    }
    if (!subject || !body) {
      alert('Please enter an Email Subject and Email Body before starting campaign!');
      return;
    }

    try {
      setIsSending(true);
      setSendingStatusMessage('Initializing campaign and creating sending queue...');

      // Always create a new campaign if no active campaign exists, or if the active campaign is
      // already completed/stopped, or if the user changed the subject or body
      const needNewCampaign =
        !activeCampaign ||
        activeCampaign.status === 'Completed' ||
        activeCampaign.status === 'Stopped' ||
        activeCampaign.subject !== subject ||
        activeCampaign.body !== body;

      let currentCampId = activeCampaign?.campaignId;

      if (needNewCampaign) {
        // Clean clients for new campaign (strip old send statuses)
        const clientsForCampaign = clients.map((c) => ({
          companyName: c.companyName || (c.email ? c.email.split('@')[0] : 'Client'),
          email: c.email,
          isValidEmail: Boolean(c.isValidEmail),
        }));

        const formData = new FormData();
        formData.append('name', campaignName || `Campaign ${new Date().toLocaleDateString()}`);
        formData.append('subject', subject);
        formData.append('body', body);
        formData.append('clients', JSON.stringify(clientsForCampaign));

        attachments.forEach((file) => {
          formData.append('attachments', file);
        });

        const createRes = await fetch(`${BACKEND_URL}/api/email-track/campaigns`, {
          method: 'POST',
          body: formData,
        });

        const createData = await createRes.json();
        if (!createData.success) {
          setIsSending(false);
          alert(createData.message || 'Failed to create campaign');
          return;
        }

        setActiveCampaign(createData.campaign);
        currentCampId = createData.campaign.campaignId;

        // Reset UI clients status to Ready
        setClients((prev) =>
          prev.map((c) => ({
            ...c,
            emailSent: false,
            status: c.isValidEmail ? 'Ready' : 'Failed',
            errorMessage: c.isValidEmail ? '' : 'Invalid email address format',
          }))
        );
      }

      // Now start campaign sending on backend
      const startRes = await fetch(`${BACKEND_URL}/api/email-track/campaigns/${currentCampId}/start`, {
        method: 'POST',
      });

      const startData = await startRes.json();
      if (startData.success) {
        setSendingStatusMessage('🚀 Campaign sending started! Emails are being processed safely...');
      } else {
        setIsSending(false);
        alert(startData.message || 'Failed to start campaign sending');
      }
    } catch (err) {
      setIsSending(false);
      alert('Error starting campaign send execution');
    }
  };

  // 4. Stop Sending
  const handleStopSending = async () => {
    if (!activeCampaign) {
      setIsSending(false);
      return;
    }

    try {
      const res = await fetch(`${BACKEND_URL}/api/email-track/campaigns/${activeCampaign.campaignId}/stop`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        setIsSending(false);
        setSendingStatusMessage('⏸️ Campaign sending paused/stopped safely. Remaining clients remain ready.');
      }
    } catch (err) {
      alert('Error stopping campaign execution');
    }
  };

  // 5. Reset / Prepare New Campaign
  const handleResetCampaign = () => {
    setActiveCampaign(null);
    setCampaignName('');
    setSubject('');
    setBody('');
    setAttachments([]);
    setClients((prev) =>
      prev.map((c) => ({
        ...c,
        emailSent: false,
        status: c.isValidEmail ? 'Ready' : 'Failed',
        errorMessage: c.isValidEmail ? '' : 'Invalid email address format',
        opened: false,
        replied: false,
        followUpSent: false,
      }))
    );
    setSendingStatusMessage('Ready to configure and send a new campaign.');
  };

  // 5. Select / Deselect Checkboxes
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedClients(filteredClients.map(c => c._id));
    } else {
      setSelectedClients([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedClients(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Filter clients by search & status
  const filteredClients = clients.filter(c => {
    const matchesSearch = 
      c.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (statusFilter === 'ALL') return matchesSearch;
    if (statusFilter === 'SENT') return matchesSearch && c.emailSent;
    if (statusFilter === 'OPENED') return matchesSearch && c.opened;
    if (statusFilter === 'REPLIED') return matchesSearch && c.replied;
    if (statusFilter === 'FAILED') return matchesSearch && c.status === 'Failed';
    return matchesSearch;
  });

  return (
    <EmailTrackLayout>
      <div className="space-y-6">

        {/* Action Header & Upload Section */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white">Upload Clients & Campaign Controls</h2>
              <p className="text-xs text-slate-400">Import Excel/CSV files and control automated campaign execution</p>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".xlsx, .xls, .csv"
                className="hidden"
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2.5 bg-violet-600/20 border border-violet-500/30 text-violet-300 hover:bg-violet-600/30 rounded-xl text-sm font-semibold transition-all shadow-md"
              >
                <Upload size={16} />
                <span>Upload Clients (.xlsx, .csv)</span>
              </button>

              <button
                onClick={handleResetCampaign}
                title="Reset form and prepare a new campaign"
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 border border-slate-700 hover:bg-slate-700/80 text-slate-300 rounded-xl text-sm font-semibold transition-all"
              >
                <RotateCw size={16} />
                <span>New Campaign</span>
              </button>

              {!isSending ? (
                <button
                  disabled={isConnectionLoading || !isSenderConnected}
                  onClick={handleStartSending}
                  title={
                    isConnectionLoading
                      ? 'Checking sender connection...'
                      : !isSenderConnected
                      ? 'Sender is Disconnected. Click Reconnect Sender to retry.'
                      : ''
                  }
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    isConnectionLoading
                      ? 'bg-slate-800 text-slate-400 border border-slate-700/50 cursor-wait opacity-70'
                      : isSenderConnected
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/20 cursor-pointer'
                      : 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed opacity-60'
                  }`}
                >
                  <Play size={16} fill="currentColor" />
                  <span>{isConnectionLoading ? 'Checking...' : 'Start Sending'}</span>
                </button>
              ) : (
                <button
                  onClick={handleStopSending}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-500/20 transition-all animate-pulse"
                >
                  <Square size={16} fill="currentColor" />
                  <span>Stop Sending</span>
                </button>
              )}
            </div>
          </div>

          {!isConnectionLoading && !isSenderConnected && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle size={16} />
                <span>
                  Active Gmail sender <strong>hello.octoinkstudios@gmail.com</strong> is <strong>Disconnected</strong>. Start Sending is disabled until connection is verified.
                </span>
              </div>
              <button
                onClick={checkSenderConnection}
                className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/30 rounded-lg text-xs font-semibold transition-colors"
              >
                Reconnect Sender
              </button>
            </div>
          )}

          {sendingStatusMessage && (
            <div className="p-3 bg-white/5 border border-[var(--border)] rounded-xl text-xs text-violet-300 flex items-center gap-2">
              <RotateCw size={14} className={isSending ? 'animate-spin' : ''} />
              <span>{sendingStatusMessage}</span>
            </div>
          )}
        </div>

        {/* Client Import Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          <div className="bg-[var(--bg-card)] border border-[var(--border)] p-4 rounded-xl">
            <span className="text-xs text-slate-400 block font-medium">Total Clients</span>
            <span className="text-xl font-extrabold text-white mt-1 block">{importSummary.totalClients}</span>
          </div>

          <div className="bg-[var(--bg-card)] border border-[var(--border)] p-4 rounded-xl">
            <span className="text-xs text-slate-400 block font-medium">Valid Emails</span>
            <span className="text-xl font-extrabold text-emerald-400 mt-1 block">{importSummary.validEmails}</span>
          </div>

          <div className="bg-[var(--bg-card)] border border-[var(--border)] p-4 rounded-xl">
            <span className="text-xs text-slate-400 block font-medium">Invalid Emails</span>
            <span className="text-xl font-extrabold text-red-400 mt-1 block">{importSummary.invalidEmails}</span>
          </div>

          <div className="bg-[var(--bg-card)] border border-[var(--border)] p-4 rounded-xl">
            <span className="text-xs text-slate-400 block font-medium">Emails Sent</span>
            <span className="text-xl font-extrabold text-blue-400 mt-1 block">{importSummary.emailsSent}</span>
          </div>

          <div className="bg-[var(--bg-card)] border border-[var(--border)] p-4 rounded-xl">
            <span className="text-xs text-slate-400 block font-medium">Opened</span>
            <span className="text-xl font-extrabold text-violet-400 mt-1 block">{importSummary.opened}</span>
          </div>

          <div className="bg-[var(--bg-card)] border border-[var(--border)] p-4 rounded-xl">
            <span className="text-xs text-slate-400 block font-medium">Replied</span>
            <span className="text-xl font-extrabold text-purple-400 mt-1 block">{importSummary.replied}</span>
          </div>

          <div className="bg-[var(--bg-card)] border border-[var(--border)] p-4 rounded-xl">
            <span className="text-xs text-slate-400 block font-medium">Follow-ups</span>
            <span className="text-xl font-extrabold text-amber-400 mt-1 block">{importSummary.followUpsSent}</span>
          </div>

          <div className="bg-[var(--bg-card)] border border-[var(--border)] p-4 rounded-xl">
            <span className="text-xs text-slate-400 block font-medium">Failed</span>
            <span className="text-xl font-extrabold text-rose-500 mt-1 block">{importSummary.failed}</span>
          </div>
        </div>

        {/* Email Composer & Template Section */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FileText size={18} className="text-violet-400" />
              Email Template & Composer
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPreviewOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 border border-[var(--border)] rounded-lg text-xs font-medium transition-colors"
              >
                <Eye size={14} /> Preview Email
              </button>
            </div>
          </div>

          <div className="p-3 bg-violet-500/10 border border-violet-500/20 rounded-xl text-xs text-violet-300 flex items-center justify-between">
            <span>💡 Client/Company names are automatically extracted from your uploaded Excel/CSV file (supports Company Name, Client Name, Company, Name). Use <code className="bg-black/30 px-1.5 py-0.5 rounded text-violet-200 font-mono">{`{companyName}`}</code> or <code className="bg-black/30 px-1.5 py-0.5 rounded text-violet-200 font-mono">{`{email}`}</code> in subject or body to personalize greetings automatically!</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Campaign Name</label>
              <input
                type="text"
                placeholder="e.g. Q3 B2B Client Outreach"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/5 border border-[var(--border)] rounded-xl text-sm text-white focus:outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Email Subject Line *</label>
              <input
                type="text"
                placeholder="e.g. Exclusive Business Collaboration with Octoink Studios"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/5 border border-[var(--border)] rounded-xl text-sm text-white focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">Email Body (HTML / Text) *</label>
            <textarea
              rows={5}
              placeholder="Write your email body message here..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-[var(--border)] rounded-xl text-sm text-white focus:outline-none focus:border-violet-500 font-mono"
            />
          </div>

          {/* Attachments Area */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-400">Attachments (Images, PDFs, Documents)</label>
              <input
                type="file"
                ref={attachmentInputRef}
                onChange={handleAttachmentChange}
                multiple
                className="hidden"
              />
              <button
                type="button"
                onClick={() => attachmentInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-violet-300 border border-violet-500/20 rounded-lg text-xs font-medium transition-colors"
              >
                <Paperclip size={14} /> Add Attachment
              </button>
            </div>

            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {attachments.map((file, idx) => (
                  <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-[var(--border)] rounded-xl text-xs text-slate-300">
                    <Paperclip size={12} className="text-violet-400" />
                    <span className="truncate max-w-[150px]">{file.name}</span>
                    <button onClick={() => removeAttachment(idx)} className="text-slate-400 hover:text-red-400 ml-1">
                      <XCircle size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Client Import Table & Search Filters */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <h3 className="text-base font-bold text-white">Imported Clients List ({filteredClients.length})</h3>

            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Search client or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white/5 border border-[var(--border)] rounded-xl text-xs text-white focus:outline-none focus:border-violet-500"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-[#181825] border border-[var(--border)] rounded-xl text-xs text-white focus:outline-none focus:border-violet-500"
              >
                <option value="ALL" className="bg-[#181825] text-white py-1">All Statuses</option>
                <option value="SENT" className="bg-[#181825] text-white py-1">Sent</option>
                <option value="OPENED" className="bg-[#181825] text-white py-1">Opened</option>
                <option value="REPLIED" className="bg-[#181825] text-white py-1">Replied</option>
                <option value="FAILED" className="bg-[#181825] text-white py-1">Failed</option>
              </select>
            </div>
          </div>

          {/* Data Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-[var(--border)] text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={selectedClients.length > 0 && selectedClients.length === filteredClients.length}
                      className="rounded border-slate-700 bg-white/5 text-violet-600 focus:ring-0"
                    />
                  </th>
                  <th className="py-3 px-4">Company Name</th>
                  <th className="py-3 px-4">Email Address</th>
                  <th className="py-3 px-4">Campaign Status</th>
                  <th className="py-3 px-4 text-center">Email Sent</th>
                  <th className="py-3 px-4 text-center">Opened</th>
                  <th className="py-3 px-4 text-center">Replied</th>
                  <th className="py-3 px-4 text-center">Follow-up</th>
                  <th className="py-3 px-4">Last Activity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-xs text-slate-300">
                {filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-500 italic">
                      No client records found. Upload an Excel or CSV file to start.
                    </td>
                  </tr>
                ) : (
                  filteredClients.map((client) => (
                    <tr 
                      key={client._id}
                      onClick={() => setSelectedRecipientForModal(client)}
                      className="hover:bg-white/5 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedClients.includes(client._id)}
                          onChange={() => handleSelectOne(client._id)}
                          className="rounded border-slate-700 bg-white/5 text-violet-600 focus:ring-0"
                        />
                      </td>
                      <td className="py-3 px-4 font-semibold text-white">{client.companyName}</td>
                      <td className="py-3 px-4 font-mono text-slate-300">{client.email}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold inline-block ${
                          client.status === 'Sent' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          client.status === 'Opened' ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20' :
                          client.status === 'Replied' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                          client.status === 'Failed' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                          'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {client.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {client.emailSent ? (
                          <span className="text-emerald-400 font-bold">✓</span>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {client.opened ? (
                          <span className="text-violet-400 font-semibold flex items-center justify-center gap-1">
                            <Eye size={14} /> {client.openCount > 1 ? `${client.openCount}x` : '✓'}
                          </span>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {client.replied ? (
                          <span className="text-purple-400 font-bold">💬</span>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {client.followUpSent ? (
                          <span className="text-emerald-400 font-bold">✓</span>
                        ) : (
                          <span className="text-slate-600">{client.followUpStatus || 'Pending'}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                        {client.lastActivityAt ? new Date(client.lastActivityAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Email Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl w-full max-w-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h3 className="text-lg font-bold text-white">Email Preview</h3>
              <button onClick={() => setIsPreviewOpen(false)} className="text-slate-400 hover:text-white">
                <XCircle size={20} />
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <p><strong>From:</strong> hello.octoinkstudios@gmail.com</p>
              <p><strong>To:</strong> Sample Client (client@company.com)</p>
              <p><strong>Subject:</strong> {subject || '(No Subject)'}</p>
            </div>

            <div 
              className="bg-black/40 border border-[var(--border)] p-4 rounded-xl text-sm text-slate-200 min-h-[150px] max-h-60 overflow-y-auto"
              dangerouslySetInnerHTML={{ __html: body || '<p className="text-slate-500 italic">No email body provided yet.</p>' }}
            />

            <div className="flex justify-end">
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-medium"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedRecipientForModal && (
        <EmailDetailModal
          recipient={selectedRecipientForModal}
          campaign={activeCampaign}
          onClose={() => setSelectedRecipientForModal(null)}
        />
      )}

    </EmailTrackLayout>
  );
};

export default EmailTrackMain;
