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
  AlertTriangle,
  FileText,
  Sparkles,
  Info
} from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:4999';

// Default Prepared Email Template for Admin Customization
const DEFAULT_SUBJECT = 'Elevate Your Brand with Custom Design & Printing | Octoink Studios';
const DEFAULT_BODY = `<p>Hi {companyName},</p>
<p>I hope this email finds you well. I came across your business and was really impressed with your brand's presence.</p>
<p>At Octoink Studios, we specialize in high-impact visual branding, custom merchandise, creative design, and premium print solutions crafted to help businesses stand out and grow.</p>
<p>We'd love to share a few creative ideas tailored for {companyName}. Would you be open to a brief 5-minute conversation sometime this week?</p>
<p>Looking forward to connecting!</p>
<p>Best regards,<br/><strong>Manikandan & The Octoink Studios Team</strong><br/>hello.octoinkstudios@gmail.com</p>`;

const EmailTrackMain = () => {
  // Connection state
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
    readyToSend: 0,
    alreadySentCount: 0,
    emailsSent: 0,
    opened: 0,
    replied: 0,
    followUpsSent: 0,
    failed: 0,
  });

  const [clients, setClients] = useState([]);
  const [selectedClients, setSelectedClients] = useState([]);

  // Campaign Form State — Editable with Prepared Default Message
  const [campaignName, setCampaignName] = useState('');
  const [subject, setSubject] = useState(DEFAULT_SUBJECT);
  const [body, setBody] = useState(DEFAULT_BODY);
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
    let sent = 0, open = 0, reply = 0, follow = 0, fail = 0, already = 0;
    recList.forEach(r => {
      if (r.emailSent) sent++;
      if (r.opened) open++;
      if (r.replied) reply++;
      if (r.followUpSent) follow++;
      if (r.status === 'Failed') fail++;
      if (r.status === 'Already Sent' || r.isDuplicate) already++;
    });
    setImportSummary(prev => ({
      ...prev,
      emailsSent: sent,
      opened: open,
      replied: reply,
      followUpsSent: follow,
      failed: fail,
      alreadySentCount: already,
      readyToSend: Math.max(0, recList.filter(r => r.isValidEmail && !r.emailSent && r.status !== 'Already Sent' && !r.isDuplicate).length),
    }));
  };

  // 1. Upload Excel / CSV file with Global Duplicate Detection
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSendingStatusMessage('Reading uploaded file and verifying against previous campaigns...');

    const reader = new FileReader();
    reader.onload = async (evt) => {
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
            (str.includes('company') || str.includes('email') || str.includes('mail') || str.includes('name') || str.includes('client') || str.includes('contact') || str.includes('customer')) &&
            !emailRegex.test(str)
          );
        });

        let nameColIdx = -1;
        let emailColIdx = -1;

        if (isRow0Header) {
          startRowIndex = 1;
          row0.forEach((cell, idx) => {
            const h = String(cell).trim().toLowerCase();
            if (!h) return;

            // Detect Email Column
            if (h === 'email' || h === 'e-mail' || h === 'mail' || h.includes('email') || h.includes('e-mail')) {
              if (emailColIdx === -1) emailColIdx = idx;
            }

            // Detect Client Name Column - prioritize explicit client/customer/contact/person/full/first name
            if (
              h === 'client name' ||
              h === 'client_name' ||
              h === 'clientname' ||
              h === 'customer name' ||
              h === 'customer_name' ||
              h === 'contact name' ||
              h === 'contact_name' ||
              h === 'full name' ||
              h === 'full_name' ||
              h === 'person name' ||
              h === 'person_name' ||
              h === 'contact person'
            ) {
              nameColIdx = idx;
            } else if (nameColIdx === -1 && (h === 'first name' || h === 'firstname' || h === 'first_name')) {
              nameColIdx = idx;
            } else if (nameColIdx === -1 && (h === 'name' || h === 'client' || h === 'customer' || h === 'contact')) {
              nameColIdx = idx;
            } else if (nameColIdx === -1 && h.includes('name') && !h.includes('company') && !h.includes('file') && !h.includes('domain') && !h.includes('org')) {
              nameColIdx = idx;
            }
          });
        }

        for (let i = startRowIndex; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0) continue;

          let clientName = '';
          let email = '';

          // 1. If explicit column indices were identified from headers:
          if (emailColIdx !== -1 && row[emailColIdx] !== undefined) {
            const candidateEmail = String(row[emailColIdx]).trim();
            if (candidateEmail.includes('@')) {
              email = candidateEmail;
            }
          }

          if (nameColIdx !== -1 && row[nameColIdx] !== undefined) {
            const candidateName = String(row[nameColIdx]).trim();
            if (candidateName && !candidateName.includes('@')) {
              clientName = candidateName;
            }
          }

          // 2. If not found by index, inspect row cells
          if (!email || !clientName) {
            row.forEach((cell, colIdx) => {
              const val = String(cell).trim();
              if (!val) return;

              if (emailRegex.test(val)) {
                if (!email) email = val;
              } else if (!val.includes('@') && !clientName) {
                // Check if column header is labeled company-only
                if (isRow0Header) {
                  const h = String(row0[colIdx] || '').trim().toLowerCase();
                  if (h.includes('company') || h.includes('org') || h.includes('business') || h.includes('brand')) {
                    return; // skip company-related column when searching for client name
                  }
                }
                clientName = val;
              }
            });
          }

          // Fallback: if still no clientName, inspect any non-email string in row, skipping company columns
          if (!clientName) {
            for (let colIdx = 0; colIdx < row.length; colIdx++) {
              if (isRow0Header) {
                const h = String(row0[colIdx] || '').trim().toLowerCase();
                if (h.includes('company') || h.includes('org') || h.includes('business') || h.includes('brand')) {
                  continue;
                }
              }
              const val = String(row[colIdx]).trim();
              if (val && !val.includes('@')) {
                clientName = val;
                break;
              }
            }
          }

          if (!email && !clientName) continue;

          // RULE 4: Do NOT use the email address as the clientName / companyName
          if (!clientName || clientName.includes('@')) {
            clientName = 'Client';
          }

          const normalizedEmail = email.trim().toLowerCase();
          const isValid = emailRegex.test(normalizedEmail);
          if (isValid) validCount++;
          else invalidCount++;

          parsedList.push({
            _id: `temp-${i}-${Date.now()}`,
            companyName: clientName, // maps to client name for {companyName} placeholder
            clientName: clientName,
            email: normalizedEmail,
            isValidEmail: isValid,
            status: isValid ? 'Ready' : 'Failed',
            errorMessage: isValid ? '' : 'Invalid email address format',
            emailSent: false,
            opened: false,
            replied: false,
            followUpSent: false,
            alreadySent: false,
            isDuplicate: false,
            lastActivityAt: new Date(),
          });
        }

        if (parsedList.length === 0) {
          alert('No client records or email addresses found in uploaded file. Please check file columns.');
          setSendingStatusMessage('No clients parsed from file.');
          return;
        }

        // Check against ALL previous successful outreach sends via Backend API
        const normalizedEmails = parsedList.map(c => c.email).filter(Boolean);
        let duplicateMap = {};
        try {
          const dupRes = await fetch(`${BACKEND_URL}/api/email-track/check-duplicates`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ emails: normalizedEmails }),
          });
          const dupData = await dupRes.json();
          if (dupData.success && dupData.results) {
            duplicateMap = dupData.results;
          }
        } catch (dupErr) {
          console.warn('Could not verify duplicates from server:', dupErr.message);
        }

        // Apply duplicate checks to parsed clients
        let alreadySentCount = 0;
        let readyCount = 0;

        parsedList.forEach((client) => {
          const dupInfo = duplicateMap[client.email];
          if (dupInfo && dupInfo.alreadySent) {
            client.alreadySent = true;
            client.isDuplicate = true;
            client.status = 'Already Sent';
            client.duplicateReason = `Already contacted in previous campaign (${dupInfo.campaignName || dupInfo.campaignId || 'Previous Outreach'})`;
            client.errorMessage = 'Skipped: Already contacted in previous outreach';
            alreadySentCount++;
          } else if (client.isValidEmail) {
            client.alreadySent = false;
            client.isDuplicate = false;
            client.status = 'Ready';
            readyCount++;
          }
        });

        setClients(parsedList);
        setImportSummary({
          totalClients: parsedList.length,
          validEmails: validCount,
          invalidEmails: invalidCount,
          readyToSend: readyCount,
          alreadySentCount,
          emailsSent: 0,
          opened: 0,
          replied: 0,
          followUpsSent: 0,
          failed: invalidCount,
        });

        // Set initial selected clients to only ready/new clients
        const readyIds = parsedList.filter(c => c.isValidEmail && !c.alreadySent).map(c => c._id);
        setSelectedClients(readyIds);

        if (alreadySentCount > 0) {
          setSendingStatusMessage(
            `Imported ${parsedList.length} contacts: ${readyCount} emails ready to send. ${alreadySentCount} contacts already contacted and will be skipped.`
          );
        } else {
          setSendingStatusMessage(`Successfully imported ${parsedList.length} clients (${readyCount} emails ready to send).`);
        }
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
    // Clear input so same file can be re-uploaded if needed
    if (e.target) e.target.value = '';
  };

  // 2. Add Attachments
  const handleAttachmentChange = (e) => {
    const files = Array.from(e.target.files);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // 3. Reset Template to Default Prepared Message
  const handleResetToDefaultTemplate = () => {
    setSubject(DEFAULT_SUBJECT);
    setBody(DEFAULT_BODY);
  };

  // 4. Create Campaign & Start Sending with Duplicate Exclusion
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

    // Filter only eligible new clients (strictly exclude already contacted)
    const eligibleClients = clients.filter(c => c.isValidEmail && !c.alreadySent && !c.isDuplicate && c.status !== 'Already Sent');
    const skippedCount = clients.filter(c => c.alreadySent || c.isDuplicate || c.status === 'Already Sent').length;

    if (eligibleClients.length === 0) {
      alert(`All ${clients.length} contact(s) in this list have already been contacted in previous outreach campaigns. No new emails will be sent.`);
      return;
    }

    try {
      setIsSending(true);
      setSendingStatusMessage(
        `${eligibleClients.length} emails ready to send. ${skippedCount > 0 ? `${skippedCount} contacts already contacted and will be skipped.` : ''}`
      );

      // Clean clients for new campaign, preserving already contacted flags
      const clientsForCampaign = clients.map((c) => {
        let name = String(c.clientName || c.companyName || '').trim();
        if (!name || name.includes('@')) {
          name = 'Client';
        }
        return {
          companyName: name, // mapped to client name for {companyName} placeholder
          clientName: name,
          email: c.email.trim().toLowerCase(),
          isValidEmail: Boolean(c.isValidEmail),
          alreadySent: Boolean(c.alreadySent || c.isDuplicate || c.status === 'Already Sent'),
        };
      });

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
      const currentCampId = createData.campaign.campaignId;

      // Start campaign sending on backend (existing sender processes the queue)
      const startRes = await fetch(`${BACKEND_URL}/api/email-track/campaigns/${currentCampId}/start`, {
        method: 'POST',
      });

      const startData = await startRes.json();
      if (startData.success) {
        setSendingStatusMessage(
          `🚀 Campaign sending started! ${eligibleClients.length} new email(s) are being sent. ${skippedCount > 0 ? `${skippedCount} previously contacted email(s) skipped.` : ''}`
        );
      } else {
        setIsSending(false);
        alert(startData.message || 'Failed to start campaign sending');
      }
    } catch (err) {
      setIsSending(false);
      alert('Error starting campaign send execution');
    }
  };

  // 5. Stop Sending
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

  // 6. Reset / Prepare New Campaign
  const handleResetCampaign = () => {
    setActiveCampaign(null);
    setCampaignName('');
    setSubject(DEFAULT_SUBJECT);
    setBody(DEFAULT_BODY);
    setAttachments([]);
    setClients((prev) =>
      prev.map((c) => ({
        ...c,
        emailSent: false,
        status: c.alreadySent ? 'Already Sent' : (c.isValidEmail ? 'Ready' : 'Failed'),
        errorMessage: c.alreadySent ? 'Skipped: Already contacted' : (c.isValidEmail ? '' : 'Invalid email address format'),
        opened: false,
        replied: false,
        followUpSent: false,
      }))
    );
    setSendingStatusMessage('Ready to configure and send a new campaign.');
  };

  // 7. Select / Deselect Checkboxes (Disabled for Already Sent)
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const eligibleIds = filteredClients
        .filter(c => !c.alreadySent && c.status !== 'Already Sent' && c.isValidEmail)
        .map(c => c._id);
      setSelectedClients(eligibleIds);
    } else {
      setSelectedClients([]);
    }
  };

  const handleSelectOne = (id, isAlreadyContacted) => {
    if (isAlreadyContacted) return;
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
    if (statusFilter === 'READY') return matchesSearch && !c.alreadySent && c.isValidEmail && !c.emailSent;
    if (statusFilter === 'ALREADY_SENT') return matchesSearch && (c.alreadySent || c.status === 'Already Sent');
    if (statusFilter === 'SENT') return matchesSearch && c.emailSent;
    if (statusFilter === 'OPENED') return matchesSearch && c.opened;
    if (statusFilter === 'REPLIED') return matchesSearch && c.replied;
    if (statusFilter === 'FAILED') return matchesSearch && c.status === 'Failed';
    return matchesSearch;
  });

  const readyClientsCount = clients.filter(c => c.isValidEmail && !c.alreadySent && c.status !== 'Already Sent').length;
  const alreadyContactedCount = clients.filter(c => c.alreadySent || c.status === 'Already Sent').length;

  return (
    <EmailTrackLayout>
      <div className="space-y-6">

        {/* Action Header & Upload Section */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white">Upload Clients & Campaign Controls</h2>
              <p className="text-xs text-slate-400">Import Excel/CSV files with automatic duplicate outreach prevention across all campaigns</p>
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

          {/* Duplicate Send UI Notification Banner */}
          {clients.length > 0 && (
            <div className="p-3.5 bg-slate-900/90 border border-violet-500/30 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-1.5 font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                  <CheckCircle2 size={14} />
                  {readyClientsCount} emails ready to send
                </span>
                {alreadyContactedCount > 0 && (
                  <span className="flex items-center gap-1.5 font-semibold text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                    <AlertTriangle size={14} />
                    {alreadyContactedCount} contacts already contacted and will be skipped
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-400">
                <span>🛡️ Duplicate prevention checks all previous outreach sends</span>
              </div>
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
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-9 gap-3">
          <div className="bg-[var(--bg-card)] border border-[var(--border)] p-4 rounded-xl">
            <span className="text-xs text-slate-400 block font-medium">Total Clients</span>
            <span className="text-xl font-extrabold text-white mt-1 block">{importSummary.totalClients}</span>
          </div>

          <div className="bg-[var(--bg-card)] border border-[var(--border)] p-4 rounded-xl">
            <span className="text-xs text-slate-400 block font-medium">Ready to Send</span>
            <span className="text-xl font-extrabold text-emerald-400 mt-1 block">{readyClientsCount}</span>
          </div>

          <div className="bg-[var(--bg-card)] border border-[var(--border)] p-4 rounded-xl">
            <span className="text-xs text-slate-400 block font-medium">Already Sent</span>
            <span className="text-xl font-extrabold text-amber-400 mt-1 block">{alreadyContactedCount}</span>
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
            <span className="text-xs text-slate-400 block font-medium">Invalid Emails</span>
            <span className="text-xl font-extrabold text-red-400 mt-1 block">{importSummary.invalidEmails}</span>
          </div>

          <div className="bg-[var(--bg-card)] border border-[var(--border)] p-4 rounded-xl">
            <span className="text-xs text-slate-400 block font-medium">Failed</span>
            <span className="text-xl font-extrabold text-rose-500 mt-1 block">{importSummary.failed}</span>
          </div>
        </div>

        {/* Email Composer & Template Section — Fully Editable with Prepared Initial Message */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border)] pb-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileText size={18} className="text-violet-400" />
                Email Template & Composer
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Customize the message below freely. Whatever subject and body you enter will be sent for this campaign.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetToDefaultTemplate}
                title="Restore default prepared outreach template"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-medium transition-colors"
              >
                <Sparkles size={14} className="text-amber-400" /> Reset to Prepared Template
              </button>

              <button
                type="button"
                onClick={() => setIsPreviewOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 border border-[var(--border)] rounded-lg text-xs font-medium transition-colors"
              >
                <Eye size={14} /> Preview Email
              </button>
            </div>
          </div>

          <div className="p-3 bg-violet-500/10 border border-violet-500/20 rounded-xl text-xs text-violet-300 flex items-center justify-between">
            <span>💡 Personalize greetings automatically using tags: <code className="bg-black/30 px-1.5 py-0.5 rounded text-violet-200 font-mono">{`{companyName}`}</code> or <code className="bg-black/30 px-1.5 py-0.5 rounded text-violet-200 font-mono">{`{email}`}</code>. These are replaced per client before dispatch.</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Campaign Name</label>
              <input
                type="text"
                placeholder="e.g. October B2B Outreach"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/5 border border-[var(--border)] rounded-xl text-sm text-white focus:outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Email Subject Line * (Editable)</label>
              <input
                type="text"
                placeholder="e.g. Collaboration with Octoink Studios - {companyName}"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/5 border border-[var(--border)] rounded-xl text-sm text-white focus:outline-none focus:border-violet-500 font-medium"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-400">Email Body (HTML / Text) * (Editable by admin)</label>
              <span className="text-[11px] text-slate-500">Supports standard HTML markup</span>
            </div>
            <textarea
              rows={6}
              placeholder="Write or customize your outreach message here..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-[var(--border)] rounded-xl text-sm text-white focus:outline-none focus:border-violet-500 font-mono leading-relaxed"
            />
          </div>

          {/* Attachments Area */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-400">Attachments (PDFs, Catalogs, Documents)</label>
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
            <div>
              <h3 className="text-base font-bold text-white">Imported Clients List ({filteredClients.length})</h3>
              <p className="text-xs text-slate-400">
                Clients who already received an outreach email are clearly marked as <strong>Already sent</strong> and excluded from sending.
              </p>
            </div>

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
                <option value="ALL" className="bg-[#181825] text-white py-1">All Contacts</option>
                <option value="READY" className="bg-[#181825] text-white py-1">Ready to send</option>
                <option value="ALREADY_SENT" className="bg-[#181825] text-white py-1">Already sent (Skipped)</option>
                <option value="SENT" className="bg-[#181825] text-white py-1">Sent</option>
                <option value="OPENED" className="bg-[#181825] text-white py-1">Opened</option>
                <option value="REPLIED" className="bg-[#181825] text-white py-1">Replied</option>
                <option value="FAILED" className="bg-[#181825] text-white py-1">Failed</option>
              </select>
            </div>
          </div>

          {/* Data Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[850px]">
              <thead>
                <tr className="border-b border-[var(--border)] text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4 w-10">
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={
                        selectedClients.length > 0 &&
                        selectedClients.length === filteredClients.filter(c => !c.alreadySent && c.status !== 'Already Sent' && c.isValidEmail).length
                      }
                      className="rounded border-slate-700 bg-white/5 text-violet-600 focus:ring-0"
                    />
                  </th>
                  <th className="py-3 px-4">Company Name</th>
                  <th className="py-3 px-4">Email Address</th>
                  <th className="py-3 px-4">Outreach Status</th>
                  <th className="py-3 px-4 text-center">Sent</th>
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
                  filteredClients.map((client) => {
                    const isAlreadyContacted = Boolean(client.alreadySent || client.status === 'Already Sent' || client.isDuplicate);

                    return (
                      <tr 
                        key={client._id}
                        onClick={() => setSelectedRecipientForModal(client)}
                        className={`transition-colors cursor-pointer ${
                          isAlreadyContacted ? 'bg-amber-500/[0.03] hover:bg-amber-500/[0.07]' : 'hover:bg-white/5'
                        }`}
                      >
                        <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            disabled={isAlreadyContacted}
                            title={isAlreadyContacted ? 'Already contacted in previous outreach (excluded from sending)' : ''}
                            checked={!isAlreadyContacted && selectedClients.includes(client._id)}
                            onChange={() => handleSelectOne(client._id, isAlreadyContacted)}
                            className={`rounded border-slate-700 bg-white/5 text-violet-600 focus:ring-0 ${
                              isAlreadyContacted ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'
                            }`}
                          />
                        </td>
                        <td className="py-3 px-4 font-semibold text-white">
                          <div className="flex items-center gap-1.5">
                            {isAlreadyContacted && (
                              <span title="Already contacted in previous campaign" className="text-amber-400">⚠</span>
                            )}
                            <span>{client.companyName}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono">
                          <div className="flex items-center gap-1.5">
                            <span className={isAlreadyContacted ? 'text-amber-300/80' : 'text-slate-300'}>
                              {client.email}
                            </span>
                            {isAlreadyContacted && (
                              <span className="text-[10px] text-amber-400 font-sans italic">
                                (Already contacted)
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {isAlreadyContacted ? (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold inline-flex items-center gap-1 bg-amber-500/10 text-amber-300 border border-amber-500/30">
                              <span>⚠ Already sent</span>
                            </span>
                          ) : client.status === 'Sent' ? (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold inline-block bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Sent
                            </span>
                          ) : client.status === 'Opened' ? (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold inline-block bg-violet-500/10 text-violet-400 border border-violet-500/20">
                              Opened
                            </span>
                          ) : client.status === 'Replied' ? (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold inline-block bg-purple-500/10 text-purple-400 border border-purple-500/20">
                              Replied
                            </span>
                          ) : client.status === 'Failed' ? (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold inline-block bg-red-500/10 text-red-400 border border-red-500/20">
                              Failed
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <span>✓ Ready to send</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {client.emailSent ? (
                            <span className="text-emerald-400 font-bold">✓</span>
                          ) : isAlreadyContacted ? (
                            <span className="text-amber-400/60 font-semibold" title="Sent previously">✓ prev</span>
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
                    );
                  })
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

            {(() => {
              const sampleClient = clients.length > 0 ? clients[0] : { clientName: 'Mani', email: 'mani@example.com' };
              const sampleName = sampleClient.clientName || sampleClient.companyName || 'Mani';
              const sampleEmail = sampleClient.email || 'mani@example.com';
              const previewSubject = (subject || '(No Subject)')
                .replace(/\{companyName\}/gi, sampleName)
                .replace(/\{company\}/gi, sampleName)
                .replace(/\{clientName\}/gi, sampleName)
                .replace(/\{name\}/gi, sampleName)
                .replace(/\{email\}/gi, sampleEmail);
              const previewBody = (body || '<p class="text-slate-500 italic">No email body provided yet.</p>')
                .replace(/\{companyName\}/gi, sampleName)
                .replace(/\{company\}/gi, sampleName)
                .replace(/\{clientName\}/gi, sampleName)
                .replace(/\{name\}/gi, sampleName)
                .replace(/\{email\}/gi, sampleEmail);

              return (
                <>
                  <div className="space-y-2 text-xs text-slate-300">
                    <p><strong>From:</strong> hello.octoinkstudios@gmail.com</p>
                    <p><strong>To:</strong> {sampleName} ({sampleEmail})</p>
                    <p><strong>Subject:</strong> {previewSubject}</p>
                    {clients.length > 0 && (
                      <p className="text-[11px] text-emerald-400">
                        Personalized for contact: <strong>{sampleName}</strong> ({`{companyName}`} &rarr; {sampleName})
                      </p>
                    )}
                  </div>

                  <div 
                    className="bg-black/40 border border-[var(--border)] p-4 rounded-xl text-sm text-slate-200 min-h-[150px] max-h-60 overflow-y-auto"
                    dangerouslySetInnerHTML={{ __html: previewBody }}
                  />
                </>
              );
            })()}

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
