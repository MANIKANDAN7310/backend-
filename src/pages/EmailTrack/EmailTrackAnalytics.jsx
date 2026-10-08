import React, { useState, useEffect } from 'react';
import EmailTrackLayout from '../../components/EmailTrack/EmailTrackLayout';
import { 
  BarChart3, 
  Calendar, 
  Send, 
  Eye, 
  EyeOff, 
  MessageSquare, 
  RotateCw, 
  AlertTriangle, 
  TrendingUp, 
  Filter,
  Users,
  X
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend 
} from 'recharts';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:4999';

const EmailTrackAnalytics = () => {
  const [dateRange, setDateRange] = useState('last30');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState(new Date().getFullYear().toString());

  const [analytics, setAnalytics] = useState({
    summary: {
      totalSent: 0,
      opened: 0,
      notOpened: 0,
      replies: 0,
      followUpsSent: 0,
      failed: 0,
      openRate: 0,
      replyRate: 0,
    },
    chartData: [],
    campaigns: [],
  });

  const [loading, setLoading] = useState(true);

  // Clickable card modal filter state
  const [activeCardFilter, setActiveCardFilter] = useState(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      let query = `dateRange=${dateRange}`;
      if (dateRange === 'custom' && startDate && endDate) {
        query = `dateRange=custom&startDate=${startDate}&endDate=${endDate}`;
      } else if (month && year) {
        query = `month=${month}&year=${year}`;
      }

      const res = await fetch(`${BACKEND_URL}/api/email-track/analytics?${query}`);
      const data = await res.json();
      if (data.success) {
        setAnalytics({
          summary: data.summary,
          chartData: data.chartData || [],
          campaigns: data.campaigns || [],
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange, startDate, endDate, month, year]);

  const { summary, chartData, campaigns } = analytics;

  const pieData = [
    { name: 'Opened', value: summary.opened, color: '#8b5cf6' },
    { name: 'Not Opened', value: summary.notOpened, color: '#475569' },
  ];

  return (
    <EmailTrackLayout>
      <div className="space-y-6">

        {/* Filters Header Bar */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <BarChart3 className="text-violet-400" size={20} />
                Email Campaign Analytics & Intelligence
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time open rates, reply rates, timeline graphs, and campaign performance breakdown
              </p>
            </div>

            {/* Date Range Selector */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 bg-white/5 border border-[var(--border)] p-1 rounded-xl">
                {['today', 'yesterday', 'last7', 'last30'].map((range) => (
                  <button
                    key={range}
                    onClick={() => {
                      setDateRange(range);
                      setMonth('');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                      dateRange === range
                        ? 'bg-[var(--primary)] text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {range === 'last7' ? '7 Days' : range === 'last30' ? '30 Days' : range}
                  </button>
                ))}
              </div>

              {/* Month / Year Selectors */}
              <div className="flex items-center gap-2">
                <select
                  value={month}
                  onChange={(e) => {
                    setMonth(e.target.value);
                    setDateRange('');
                  }}
                  className="px-3 py-2 bg-[#181825] border border-[var(--border)] rounded-xl text-xs text-white focus:outline-none focus:border-violet-500"
                >
                  <option value="" className="bg-[#181825] text-white">Select Month</option>
                  <option value="1" className="bg-[#181825] text-white">January</option>
                  <option value="2" className="bg-[#181825] text-white">February</option>
                  <option value="3" className="bg-[#181825] text-white">March</option>
                  <option value="4" className="bg-[#181825] text-white">April</option>
                  <option value="5" className="bg-[#181825] text-white">May</option>
                  <option value="6" className="bg-[#181825] text-white">June</option>
                  <option value="7" className="bg-[#181825] text-white">July</option>
                  <option value="8" className="bg-[#181825] text-white">August</option>
                  <option value="9" className="bg-[#181825] text-white">September</option>
                  <option value="10" className="bg-[#181825] text-white">October</option>
                  <option value="11" className="bg-[#181825] text-white">November</option>
                  <option value="12" className="bg-[#181825] text-white">December</option>
                </select>

                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="px-3 py-2 bg-[#181825] border border-[var(--border)] rounded-xl text-xs text-white focus:outline-none focus:border-violet-500"
                >
                  {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map((yr) => (
                    <option key={yr} value={String(yr)} className="bg-[#181825] text-white">
                      {yr}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Clickable Analytics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          
          <div 
            onClick={() => setActiveCardFilter('SENT')}
            className="bg-[var(--bg-card)] border border-[var(--border)] p-4 rounded-xl cursor-pointer hover:border-violet-500/50 transition-all shadow-md group"
          >
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-medium">Emails Sent</span>
              <Send size={14} className="text-blue-400 group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-2xl font-extrabold text-white block">{summary.totalSent}</span>
            <span className="text-[10px] text-violet-400 hover:underline mt-1 block">Click to inspect</span>
          </div>

          <div 
            onClick={() => setActiveCardFilter('OPENED')}
            className="bg-[var(--bg-card)] border border-[var(--border)] p-4 rounded-xl cursor-pointer hover:border-violet-500/50 transition-all shadow-md group"
          >
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-medium">Emails Opened</span>
              <Eye size={14} className="text-violet-400 group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-2xl font-extrabold text-violet-400 block">{summary.opened}</span>
            <span className="text-[10px] text-violet-400 hover:underline mt-1 block">Click to inspect</span>
          </div>

          <div 
            onClick={() => setActiveCardFilter('NOT_OPENED')}
            className="bg-[var(--bg-card)] border border-[var(--border)] p-4 rounded-xl cursor-pointer hover:border-violet-500/50 transition-all shadow-md group"
          >
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-medium">Not Opened</span>
              <EyeOff size={14} className="text-slate-400 group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-2xl font-extrabold text-slate-400 block">{summary.notOpened}</span>
            <span className="text-[10px] text-violet-400 hover:underline mt-1 block">Click to inspect</span>
          </div>

          <div 
            onClick={() => setActiveCardFilter('REPLIES')}
            className="bg-[var(--bg-card)] border border-[var(--border)] p-4 rounded-xl cursor-pointer hover:border-violet-500/50 transition-all shadow-md group"
          >
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-medium">Replies</span>
              <MessageSquare size={14} className="text-purple-400 group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-2xl font-extrabold text-purple-400 block">{summary.replies}</span>
            <span className="text-[10px] text-violet-400 hover:underline mt-1 block">Click to inspect</span>
          </div>

          <div 
            onClick={() => setActiveCardFilter('FOLLOWUPS')}
            className="bg-[var(--bg-card)] border border-[var(--border)] p-4 rounded-xl cursor-pointer hover:border-violet-500/50 transition-all shadow-md group"
          >
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-medium">Follow-ups</span>
              <RotateCw size={14} className="text-amber-400 group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-2xl font-extrabold text-amber-400 block">{summary.followUpsSent}</span>
            <span className="text-[10px] text-violet-400 hover:underline mt-1 block">Click to inspect</span>
          </div>

          <div 
            onClick={() => setActiveCardFilter('FAILED')}
            className="bg-[var(--bg-card)] border border-[var(--border)] p-4 rounded-xl cursor-pointer hover:border-violet-500/50 transition-all shadow-md group"
          >
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-medium">Failed</span>
              <AlertTriangle size={14} className="text-rose-500 group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-2xl font-extrabold text-rose-500 block">{summary.failed}</span>
            <span className="text-[10px] text-violet-400 hover:underline mt-1 block">Click to inspect</span>
          </div>

          <div className="bg-[var(--bg-card)] border border-[var(--border)] p-4 rounded-xl shadow-md">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-medium">Open Rate</span>
              <TrendingUp size={14} className="text-emerald-400" />
            </div>
            <span className="text-2xl font-extrabold text-emerald-400 block">{summary.openRate}%</span>
            <span className="text-[10px] text-slate-500 block">Opened / Sent</span>
          </div>

          <div className="bg-[var(--bg-card)] border border-[var(--border)] p-4 rounded-xl shadow-md">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-medium">Reply Rate</span>
              <TrendingUp size={14} className="text-purple-400" />
            </div>
            <span className="text-2xl font-extrabold text-purple-400 block">{summary.replyRate}%</span>
            <span className="text-[10px] text-slate-500 block">Replies / Sent</span>
          </div>

        </div>

        {/* Dashboard Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Daily Email Volume & Activity Chart */}
          <div className="lg:col-span-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white">Emails Sent & Tracked Over Time</h3>

            <div className="h-72 w-full">
              {chartData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-500 italic text-sm">
                  No activity data recorded for selected period.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorOpened" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
                    <Legend />
                    <Area type="monotone" dataKey="sent" name="Emails Sent" stroke="#3b82f6" fillOpacity={1} fill="url(#colorSent)" />
                    <Area type="monotone" dataKey="opened" name="Opened" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorOpened)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Opened vs Not Opened Donut Chart */}
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white">Opened vs Not Opened</h3>

            <div className="h-72 w-full flex items-center justify-center">
              {summary.totalSent === 0 ? (
                <div className="text-slate-500 italic text-sm">No campaign data yet</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

        </div>

        {/* Campaign Comparison Matrix */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="text-base font-bold text-white">Campaign Performance Comparison</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-[var(--border)] text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Campaign ID</th>
                  <th className="py-3 px-4">Campaign Name</th>
                  <th className="py-3 px-4 text-center">Total Sent</th>
                  <th className="py-3 px-4 text-center">Opened</th>
                  <th className="py-3 px-4 text-center">Open Rate</th>
                  <th className="py-3 px-4 text-center">Replies</th>
                  <th className="py-3 px-4 text-center">Reply Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-xs text-slate-300">
                {campaigns.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-slate-500 italic">
                      No campaigns found for selected date filter.
                    </td>
                  </tr>
                ) : (
                  campaigns.map((cmp) => {
                    const cOpenRate = cmp.emailsSent > 0 ? ((cmp.openedCount / cmp.emailsSent) * 100).toFixed(1) : '0.0';
                    const cReplyRate = cmp.emailsSent > 0 ? ((cmp.replyCount / cmp.emailsSent) * 100).toFixed(1) : '0.0';

                    return (
                      <tr key={cmp._id} className="hover:bg-white/5 transition-colors">
                        <td className="py-3 px-4 font-mono text-violet-400 font-bold">{cmp.campaignId}</td>
                        <td className="py-3 px-4 font-semibold text-white">{cmp.name}</td>
                        <td className="py-3 px-4 text-center font-bold">{cmp.emailsSent}</td>
                        <td className="py-3 px-4 text-center font-bold text-violet-400">{cmp.openedCount}</td>
                        <td className="py-3 px-4 text-center font-bold text-emerald-400">{cOpenRate}%</td>
                        <td className="py-3 px-4 text-center font-bold text-purple-400">{cmp.replyCount}</td>
                        <td className="py-3 px-4 text-center font-bold text-purple-400">{cReplyRate}%</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Clickable Card Filter Inspection Modal */}
      {activeCardFilter && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl w-full max-w-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h3 className="text-lg font-bold text-white">
                Inspecting Filter: {activeCardFilter}
              </h3>
              <button onClick={() => setActiveCardFilter(null)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Filtering records for metric <strong className="text-violet-400">{activeCardFilter}</strong> during selected period.
            </p>

            <div className="bg-black/30 border border-[var(--border)] p-4 rounded-xl text-xs text-slate-300">
              Showing total count: <strong className="text-white font-bold">{
                activeCardFilter === 'SENT' ? summary.totalSent :
                activeCardFilter === 'OPENED' ? summary.opened :
                activeCardFilter === 'NOT_OPENED' ? summary.notOpened :
                activeCardFilter === 'REPLIES' ? summary.replies :
                activeCardFilter === 'FOLLOWUPS' ? summary.followUpsSent :
                summary.failed
              }</strong>
            </div>

            <div className="flex justify-end pt-3">
              <button
                onClick={() => setActiveCardFilter(null)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-medium"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

    </EmailTrackLayout>
  );
};

export default EmailTrackAnalytics;
