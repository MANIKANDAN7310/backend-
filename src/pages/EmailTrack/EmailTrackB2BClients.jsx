import React, { useState, useEffect } from 'react';
import EmailTrackLayout from '../../components/EmailTrack/EmailTrackLayout';
import { Users, Search, Filter, Eye, X, Calendar, Mail, CheckCircle2, MessageSquare, Clock, ArrowRight } from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:4999';

const EmailTrackB2BClients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedClientModal, setSelectedClientModal] = useState(null);

  const fetchB2BClients = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/email-track/b2b-clients`);
      const data = await res.json();
      if (data.success) {
        setClients(data.clients);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchB2BClients();
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/email-track/b2b-clients/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setClients(prev => prev.map(c => c._id === id ? data.client : c));
        if (selectedClientModal?._id === id) {
          setSelectedClientModal(data.client);
        }
      }
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const filteredClients = clients.filter(c => {
    const matchesSearch = 
      c.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (statusFilter === 'ALL') return matchesSearch;
    return matchesSearch && c.status === statusFilter;
  });

  return (
    <EmailTrackLayout>
      <div className="space-y-6">

        {/* Header section */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="text-violet-400" size={20} />
              B2B Client Relationship Management
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Track B2B clients contacted through email campaigns, view interaction timelines, and manage lead status
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search B2B clients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 bg-white/5 border border-[var(--border)] rounded-xl text-xs text-white focus:outline-none focus:border-violet-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-[#181825] border border-[var(--border)] rounded-xl text-xs text-white focus:outline-none focus:border-violet-500"
            >
              <option value="ALL" className="bg-[#181825] text-white py-1">All Statuses</option>
              <option value="Contacted" className="bg-[#181825] text-white py-1">Contacted</option>
              <option value="Opened" className="bg-[#181825] text-white py-1">Opened</option>
              <option value="Replied" className="bg-[#181825] text-white py-1">Replied</option>
              <option value="Interested" className="bg-[#181825] text-white py-1">Interested</option>
              <option value="Follow-up" className="bg-[#181825] text-white py-1">Follow-up</option>
              <option value="Converted" className="bg-[#181825] text-white py-1">Converted</option>
              <option value="Not Interested" className="bg-[#181825] text-white py-1">Not Interested</option>
            </select>
          </div>
        </div>

        {/* B2B Clients Table */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 shadow-xl space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="border-b border-[var(--border)] text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Company Name</th>
                  <th className="py-3 px-4">Email Address</th>
                  <th className="py-3 px-4">First Contact</th>
                  <th className="py-3 px-4">Last Contact</th>
                  <th className="py-3 px-4 text-center">Emails Recv</th>
                  <th className="py-3 px-4 text-center">Opens</th>
                  <th className="py-3 px-4 text-center">Replies</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-xs text-slate-300">
                {filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-500 italic">
                      No B2B clients found.
                    </td>
                  </tr>
                ) : (
                  filteredClients.map((client) => (
                    <tr key={client._id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 font-bold text-white">{client.companyName}</td>
                      <td className="py-3 px-4 font-mono text-slate-300">{client.email}</td>
                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                        {new Date(client.firstContactDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                        {new Date(client.lastContactDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-center font-bold">{client.emailsReceivedCount}</td>
                      <td className="py-3 px-4 text-center font-bold text-violet-400">{client.openedCount}</td>
                      <td className="py-3 px-4 text-center font-bold text-purple-400">{client.repliesCount}</td>
                      <td className="py-3 px-4">
                        <select
                          value={client.status}
                          onChange={(e) => handleStatusChange(client._id, e.target.value)}
                          className={`px-2.5 py-1 rounded-xl text-xs font-semibold bg-white/5 border border-[var(--border)] focus:outline-none ${
                            client.status === 'Converted' ? 'text-emerald-400 border-emerald-500/30' :
                            client.status === 'Interested' ? 'text-blue-400 border-blue-500/30' :
                            client.status === 'Replied' ? 'text-purple-400 border-purple-500/30' :
                            client.status === 'Opened' ? 'text-violet-400 border-violet-500/30' :
                            'text-slate-300'
                          }`}
                        >
                          <option value="Contacted" className="bg-slate-900 text-slate-200">Contacted</option>
                          <option value="Opened" className="bg-slate-900 text-slate-200">Opened</option>
                          <option value="Replied" className="bg-slate-900 text-slate-200">Replied</option>
                          <option value="Interested" className="bg-slate-900 text-slate-200">Interested</option>
                          <option value="Follow-up" className="bg-slate-900 text-slate-200">Follow-up</option>
                          <option value="Converted" className="bg-slate-900 text-slate-200">Converted</option>
                          <option value="Not Interested" className="bg-slate-900 text-slate-200">Not Interested</option>
                        </select>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedClientModal(client)}
                          className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-violet-300 border border-violet-500/20 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1.5"
                        >
                          <Eye size={14} /> Full Profile & Timeline
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

      {/* Detailed B2B Profile & Timeline Modal */}
      {selectedClientModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl w-full max-w-2xl p-6 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
              <div>
                <h3 className="text-xl font-bold text-white">{selectedClientModal.companyName}</h3>
                <p className="text-sm text-slate-400">{selectedClientModal.email}</p>
              </div>
              <button onClick={() => setSelectedClientModal(null)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-4 gap-3">
              <div className="bg-white/5 border border-[var(--border)] p-3 rounded-xl text-center">
                <span className="text-xs text-slate-400 block">Status</span>
                <span className="text-xs font-bold text-violet-400 mt-1 block">{selectedClientModal.status}</span>
              </div>

              <div className="bg-white/5 border border-[var(--border)] p-3 rounded-xl text-center">
                <span className="text-xs text-slate-400 block">Emails Received</span>
                <span className="text-sm font-bold text-white mt-1 block">{selectedClientModal.emailsReceivedCount}</span>
              </div>

              <div className="bg-white/5 border border-[var(--border)] p-3 rounded-xl text-center">
                <span className="text-xs text-slate-400 block">Opens</span>
                <span className="text-sm font-bold text-violet-400 mt-1 block">{selectedClientModal.openedCount}</span>
              </div>

              <div className="bg-white/5 border border-[var(--border)] p-3 rounded-xl text-center">
                <span className="text-xs text-slate-400 block">Replies</span>
                <span className="text-sm font-bold text-purple-400 mt-1 block">{selectedClientModal.repliesCount}</span>
              </div>
            </div>

            {/* Complete Chronological Timeline */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Chronological Email Timeline</h4>
              
              <div className="relative border-l-2 border-violet-500/30 pl-4 space-y-4 ml-2">
                {selectedClientModal.timeline && selectedClientModal.timeline.length > 0 ? (
                  selectedClientModal.timeline.map((item, idx) => (
                    <div key={idx} className="relative flex items-start gap-3">
                      <div className={`absolute -left-[23px] top-0 w-3 h-3 rounded-full border-2 border-[var(--bg-card)] ${
                        item.type === 'sent' ? 'bg-emerald-500' :
                        item.type === 'opened' ? 'bg-blue-500' :
                        item.type === 'replied' ? 'bg-purple-500' :
                        item.type === 'followup_sent' ? 'bg-violet-500' :
                        'bg-amber-500'
                      }`}></div>

                      <div>
                        <p className="text-xs font-semibold text-white">{item.event}</p>
                        {item.details && <p className="text-[11px] text-slate-400 mt-0.5">{item.details}</p>}
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                          {new Date(item.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 italic">No recorded timeline events.</p>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-[var(--border)]">
              <button
                onClick={() => setSelectedClientModal(null)}
                className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-medium"
              >
                Close Profile
              </button>
            </div>

          </div>
        </div>
      )}

    </EmailTrackLayout>
  );
};

export default EmailTrackB2BClients;
