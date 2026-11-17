import React, { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import {
  Search,
  Building2,
  Mail,
  Globe,
  MapPin,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  RotateCw,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  X,
  Filter,
  Sparkles,
  Layers,
  Trash2,
  ExternalLink,
  AlertCircle,
  FolderOpen,
  ArrowRight,
  ShieldCheck,
  Compass,
} from "lucide-react";

const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:4999";

// The 9 specific Manufacturing Categories
const MANUFACTURING_CATEGORIES = [
  "Medal Manufacturers",
  "Coin Manufacturers",
  "Lapel Pin Manufacturers",
  "Enamel Pin Manufacturers",
  "Vector Art Companies",
  "Embroidery Companies",
  "Racing Medal Manufacturers",
  "Die-Cut Ornament Manufacturers",
  "Engraving Companies",
];

// Full searchable list of countries
const ALL_COUNTRIES = [
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "Germany",
  "India",
  "China",
  "France",
  "Italy",
  "Spain",
  "Mexico",
  "Brazil",
  "Japan",
  "Netherlands",
  "Sweden",
  "Switzerland",
  "United Arab Emirates",
  "Singapore",
  "South Africa",
  "New Zealand",
  "Ireland",
  "Poland",
  "Norway",
  "Denmark",
  "Finland",
  "Belgium",
  "Austria",
  "Portugal",
  "Czech Republic",
  "Greece",
  "Hungary",
  "Romania",
  "Bulgaria",
  "Croatia",
  "Slovakia",
  "Slovenia",
  "Estonia",
  "Latvia",
  "Lithuania",
  "Cyprus",
  "Malta",
  "Luxembourg",
  "Iceland",
  "Argentina",
  "Chile",
  "Colombia",
  "Peru",
  "Venezuela",
  "Ecuador",
  "Guatemala",
  "Costa Rica",
  "Panama",
  "Dominican Republic",
  "Puerto Rico",
  "Jamaica",
  "Trinidad and Tobago",
  "Philippines",
  "Malaysia",
  "Indonesia",
  "Thailand",
  "Vietnam",
  "South Korea",
  "Taiwan",
  "Hong Kong",
  "Pakistan",
  "Bangladesh",
  "Sri Lanka",
  "Nepal",
  "Saudi Arabia",
  "Qatar",
  "Kuwait",
  "Oman",
  "Bahrain",
  "Israel",
  "Turkey",
  "Egypt",
  "Morocco",
  "Nigeria",
  "Kenya",
  "Ghana",
  "Ethiopia",
  "Tanzania",
  "Uganda",
  "Algeria",
  "Tunisia",
  "Mauritius",
  "Ukraine",
  "Kazakhstan",
  "Uzbekistan",
  "Georgia",
  "Armenia",
  "Azerbaijan",
];

const LeadFinder = () => {
  // Filter states
  const [selectedCountry, setSelectedCountry] = useState("United States");
  const [countrySearch, setCountrySearch] = useState("");
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);

  const [selectedIndustries, setSelectedIndustries] = useState([
    "Medal Manufacturers",
    "Coin Manufacturers",
  ]);
  const [industrySearch, setIndustrySearch] = useState("");
  const [isIndustryDropdownOpen, setIsIndustryDropdownOpen] = useState(false);

  const [stateFilter, setStateFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");

  // Search & Progress state
  const [activeSearchId, setActiveSearchId] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchProgress, setSearchProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("");
  const [logs, setLogs] = useState([]);
  const [discoveredCount, setDiscoveredCount] = useState(0);
  const [emailsCount, setEmailsCount] = useState(0);

  // Active results display
  const [activeResults, setActiveResults] = useState([]);
  const [activeSearchMeta, setActiveSearchMeta] = useState(null);
  const [tableSearchQuery, setTableSearchQuery] = useState("");

  // History state
  const [historyList, setHistoryList] = useState([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // UI helpers
  const [copiedKey, setCopiedKey] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState("");
  const [showLogsAccordion, setShowLogsAccordion] = useState(true);

  // Refs for closing dropdowns when clicking outside
  const countryDropdownRef = useRef(null);
  const industryDropdownRef = useRef(null);
  const pollingIntervalRef = useRef(null);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        countryDropdownRef.current &&
        !countryDropdownRef.current.contains(e.target)
      ) {
        setIsCountryDropdownOpen(false);
      }
      if (
        industryDropdownRef.current &&
        !industryDropdownRef.current.contains(e.target)
      ) {
        setIsIndustryDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch search history on mount
  useEffect(() => {
    fetchHistory();
    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    };
  }, []);

  const showNotification = (msg) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(""), 4000);
  };

  const copyToClipboard = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Fetch Search History
  const fetchHistory = async () => {
    setIsHistoryLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/lead-finder/history`);
      const data = await res.json();
      if (data.success && Array.isArray(data.history)) {
        setHistoryList(data.history);
      }
    } catch (err) {
      console.error("Error fetching lead history:", err);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  // Start Search Handler
  const handleStartSearch = async () => {
    if (!selectedCountry) {
      alert("Please select a country to search.");
      return;
    }
    if (selectedIndustries.length === 0) {
      alert("Please select at least one manufacturing category.");
      return;
    }

    setIsSearching(true);
    setSearchProgress(5);
    setCurrentStep("Initializing discovery engine...");
    setLogs([]);
    setDiscoveredCount(0);
    setEmailsCount(0);
    setActiveResults([]);
    setActiveSearchMeta({
      country: selectedCountry,
      industries: selectedIndustries,
      state: stateFilter,
      city: cityFilter,
    });

    try {
      const res = await fetch(`${BACKEND_URL}/api/lead-finder/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          country: selectedCountry,
          industries: selectedIndustries,
          state: stateFilter,
          city: cityFilter,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || "Failed to start search");
      }

      const searchId = data.searchId;
      setActiveSearchId(searchId);

      // Start Polling for live status
      startProgressPolling(searchId);
    } catch (err) {
      setIsSearching(false);
      alert(`Search failed to start: ${err.message}`);
    }
  };

  // Live Progress Polling
  const startProgressPolling = (searchId) => {
    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);

    pollingIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(
          `${BACKEND_URL}/api/lead-finder/progress/${searchId}`
        );
        const data = await res.json();

        if (data.success && data.search) {
          const s = data.search;
          setSearchProgress(s.progress || 0);
          setCurrentStep(s.currentStep || "Scanning...");
          setDiscoveredCount(s.totalDiscovered || 0);
          setEmailsCount(s.emailsFound || 0);
          if (Array.isArray(s.logs)) setLogs(s.logs);
          if (Array.isArray(s.results)) setActiveResults(s.results);

          if (s.status === "completed" || s.status === "failed") {
            clearInterval(pollingIntervalRef.current);
            setIsSearching(false);
            fetchHistory(); // Refresh history list
            if (s.status === "completed") {
              showNotification(
                `🎉 Search finished! Discovered ${s.emailsFound || 0} business leads.`
              );
            }
          }
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 1200);
  };

  // Reopen past search results from history
  const handleReopenHistory = async (historyId) => {
    try {
      showNotification("Loading previous search results...");
      const res = await fetch(
        `${BACKEND_URL}/api/lead-finder/history/${historyId}`
      );
      const data = await res.json();
      if (data.success && data.search) {
        const s = data.search;
        setSelectedCountry(s.country);
        setSelectedIndustries(s.industries || []);
        setStateFilter(s.state || "");
        setCityFilter(s.city || "");
        setActiveResults(s.results || []);
        setActiveSearchMeta({
          country: s.country,
          industries: s.industries,
          state: s.state,
          city: s.city,
        });
        setDiscoveredCount(s.totalDiscovered || 0);
        setEmailsCount(s.emailsFound || 0);
        setActiveSearchId(s._id);
        setIsSearching(false);
        showNotification(
          `Reopened search for ${s.country} (${(s.results || []).length} leads loaded).`
        );
        window.scrollTo({ top: 400, behavior: "smooth" });
      }
    } catch (err) {
      console.error("Error reopening history:", err);
      alert("Failed to reopen search results");
    }
  };

  // Delete search history item
  const handleDeleteHistory = async (historyId, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this search record?"))
      return;
    try {
      const res = await fetch(
        `${BACKEND_URL}/api/lead-finder/history/${historyId}`,
        {
          method: "DELETE",
        }
      );
      const data = await res.json();
      if (data.success) {
        setHistoryList((prev) => prev.filter((item) => item._id !== historyId));
        showNotification("Search record deleted.");
      }
    } catch (err) {
      alert("Failed to delete record");
    }
  };

  // Export to Excel (.xlsx)
  const handleExportExcel = (sourceResults = activeResults, meta = activeSearchMeta) => {
    if (!sourceResults || sourceResults.length === 0) {
      alert("No leads available to export.");
      return;
    }

    const countryName = (meta?.country || selectedCountry || "Global").trim();
    const stateName = (meta?.state || stateFilter || "").trim();
    const cityName = (meta?.city || cityFilter || "").trim();
    const industryName =
      meta?.industries && meta.industries[0]
        ? meta.industries[0]
        : "Manufacturing";

    // Deduplicate emails and validate
    const seenEmails = new Set();
    const rows = [];

    sourceResults.forEach((lead) => {
      const email = (lead.email || "").toLowerCase().trim();
      if (!email || seenEmails.has(email)) return;
      if (!lead.companyName) return;
      seenEmails.add(email);

      // Store city, state, country separately without fallback to search filters
      const verifiedCountry = lead.verifiedCountry || lead.country || "Location not verified";
      const verifiedState = lead.verifiedState || lead.state || "";
      const verifiedCity = lead.verifiedCity || lead.city || "";

      rows.push({
        "Company Name": lead.companyName || "",
        "Email": email,
        "Country": verifiedCountry,
        "State": verifiedState,
        "City": verifiedCity,
        "Industry": lead.industry || industryName,
        "Website": lead.website || "",
      });
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);

    // Auto-fit column widths
    worksheet["!cols"] = [
      { wch: 32 }, // Company Name
      { wch: 36 }, // Email
      { wch: 20 }, // Country
      { wch: 22 }, // State
      { wch: 22 }, // City
      { wch: 30 }, // Industry
      { wch: 40 }, // Website
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Collected Leads");

    // Clean filename: e.g. India_Tamil_Nadu_Trichy_Medal_Manufacturers_Leads.xlsx
    const locParts = [countryName, stateName, cityName].filter(Boolean);
    const cleanLocation = locParts.join("_").replace(/[^a-zA-Z0-9]/g, "_").slice(0, 35);
    const cleanIndustry = industryName.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 30);
    const filename = `${cleanLocation}_${cleanIndustry}_Leads.xlsx`;

    XLSX.writeFile(workbook, filename);
    showNotification(`📥 Downloaded ${rows.length} leads to ${filename}`);
  };

  // Export to CSV (.csv)
  const handleExportCSV = (sourceResults = activeResults, meta = activeSearchMeta) => {
    if (!sourceResults || sourceResults.length === 0) {
      alert("No leads available to export.");
      return;
    }

    const countryName = (meta?.country || selectedCountry || "Global").trim();
    const stateName = (meta?.state || stateFilter || "").trim();
    const cityName = (meta?.city || cityFilter || "").trim();
    const industryName =
      meta?.industries && meta.industries[0]
        ? meta.industries[0]
        : "Manufacturing";

    const seenEmails = new Set();
    const rows = [];

    sourceResults.forEach((lead) => {
      const email = (lead.email || "").toLowerCase().trim();
      if (!email || seenEmails.has(email)) return;
      if (!lead.companyName) return;
      seenEmails.add(email);

      // Store city, state, country separately without fallback to search filters
      const verifiedCountry = lead.verifiedCountry || lead.country || "Location not verified";
      const verifiedState = lead.verifiedState || lead.state || "";
      const verifiedCity = lead.verifiedCity || lead.city || "";

      rows.push({
        "Company Name": lead.companyName || "",
        "Email": email,
        "Country": verifiedCountry,
        "State": verifiedState,
        "City": verifiedCity,
        "Industry": lead.industry || industryName,
        "Website": lead.website || "",
      });
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const csvContent = XLSX.utils.sheet_to_csv(worksheet);

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const locParts = [countryName, stateName, cityName].filter(Boolean);
    const cleanLocation = locParts.join("_").replace(/[^a-zA-Z0-9]/g, "_").slice(0, 35);
    const cleanIndustry = industryName.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 30);
    const filename = `${cleanLocation}_${cleanIndustry}_Leads.csv`;

    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification(`📥 Downloaded ${rows.length} leads to ${filename}`);
  };

  // Toggle Industry selection
  const toggleIndustry = (category) => {
    setSelectedIndustries((prev) =>
      prev.includes(category)
        ? prev.filter((item) => item !== category)
        : [...prev, category]
    );
  };

  // Select all categories
  const handleSelectAllIndustries = () => {
    setSelectedIndustries([...MANUFACTURING_CATEGORIES]);
  };

  // Clear all categories
  const handleClearAllIndustries = () => {
    setSelectedIndustries([]);
  };

  // Filter countries by search term
  const filteredCountries = ALL_COUNTRIES.filter((c) =>
    c.toLowerCase().includes(countrySearch.toLowerCase())
  );

  // Filter industries by search term
  const filteredIndustries = MANUFACTURING_CATEGORIES.filter((c) =>
    c.toLowerCase().includes(industrySearch.toLowerCase())
  );

  // Filter active table results by local search input
  const displayResults = activeResults.filter((item) => {
    if (!tableSearchQuery.trim()) return true;
    const q = tableSearchQuery.toLowerCase();
    return (
      (item.companyName && item.companyName.toLowerCase().includes(q)) ||
      (item.email && item.email.toLowerCase().includes(q)) ||
      (item.website && item.website.toLowerCase().includes(q)) ||
      (item.city && item.city.toLowerCase().includes(q)) ||
      (item.state && item.state.toLowerCase().includes(q)) ||
      (item.country && item.country.toLowerCase().includes(q)) ||
      (item.verifiedCity && item.verifiedCity.toLowerCase().includes(q)) ||
      (item.verifiedState && item.verifiedState.toLowerCase().includes(q)) ||
      (item.verifiedCountry && item.verifiedCountry.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-8 pb-16">
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER SECTION
      ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-violet-500/10 border border-violet-500/20 rounded-xl text-violet-400">
              <Compass size={28} className="animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                Octoink Lead Finder
              </h1>
              <p className="text-sm md:text-base text-slate-400 mt-1">
                Automatically discover manufacturing companies and collect their publicly available business email addresses.
              </p>
            </div>
          </div>
        </div>

        {/* Action Toggle for History */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowHistory((prev) => !prev)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border font-medium text-sm transition-all ${
              showHistory
                ? "bg-violet-600 text-white border-violet-500 shadow-lg shadow-violet-500/20"
                : "bg-white/5 border-slate-800 text-slate-300 hover:bg-white/10"
            }`}
          >
            <Clock size={16} />
            <span>Search History</span>
            {historyList.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 text-xs font-semibold">
                {historyList.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Floating feedback toast */}
      {feedbackMsg && (
        <div className="fixed top-24 right-6 z-50 flex items-center gap-2 bg-slate-900 border border-violet-500/40 text-white px-4 py-3 rounded-xl shadow-2xl animate-in fade-in slide-in-from-top-2">
          <Sparkles size={18} className="text-violet-400" />
          <span className="text-sm font-medium">{feedbackMsg}</span>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          2. SEARCH FILTERS SECTION
      ───────────────────────────────────────────────────────────── */}
      <div className="card bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-2 text-white font-semibold text-lg">
            <Filter size={20} className="text-violet-400" />
            <span>Search Filters</span>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Discover verified manufacturing leads with public emails
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* A. Searchable Country Dropdown */}
          <div className="space-y-2 relative" ref={countryDropdownRef}>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Globe size={14} className="text-violet-400" />
              <span>Country Selection *</span>
            </label>

            <button
              type="button"
              onClick={() => setIsCountryDropdownOpen((prev) => !prev)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-slate-950/70 border border-slate-800 text-white hover:border-violet-500/50 transition-all text-sm font-medium"
            >
              <span className="truncate">{selectedCountry || "Select Country"}</span>
              <ChevronDown
                size={16}
                className={`text-slate-400 transition-transform ${
                  isCountryDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isCountryDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 max-h-72 flex flex-col overflow-hidden animate-in fade-in">
                <div className="p-3 border-b border-slate-800 bg-slate-950/50">
                  <div className="relative">
                    <Search
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="text"
                      placeholder="Search country..."
                      value={countrySearch}
                      onChange={(e) => setCountrySearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                      autoFocus
                    />
                  </div>
                </div>

                <div className="overflow-y-auto flex-1 divide-y divide-slate-800/40">
                  {filteredCountries.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => {
                        setSelectedCountry(c);
                        setIsCountryDropdownOpen(false);
                        setCountrySearch("");
                      }}
                      className={`w-full text-left px-4 py-2.5 text-xs font-medium hover:bg-violet-600/10 hover:text-white transition-colors flex items-center justify-between ${
                        selectedCountry === c
                          ? "bg-violet-500/10 text-violet-400 font-bold"
                          : "text-slate-300"
                      }`}
                    >
                      <span>{c}</span>
                      {selectedCountry === c && <Check size={14} className="text-violet-400" />}
                    </button>
                  ))}
                  {filteredCountries.length === 0 && (
                    <div className="p-4 text-center text-xs text-slate-500">
                      No country found matching "{countrySearch}"
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* B. Searchable Multi-Select Industry Dropdown */}
          <div className="space-y-2 relative" ref={industryDropdownRef}>
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 size={14} className="text-violet-400" />
                <span>Manufacturing Categories *</span>
              </label>
              <span className="text-[11px] font-bold text-violet-400">
                {selectedIndustries.length} Selected
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsIndustryDropdownOpen((prev) => !prev)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-slate-950/70 border border-slate-800 text-white hover:border-violet-500/50 transition-all text-sm font-medium"
            >
              <span className="truncate">
                {selectedIndustries.length === 0
                  ? "Select Categories..."
                  : selectedIndustries.length === 1
                  ? selectedIndustries[0]
                  : `${selectedIndustries[0]} +${selectedIndustries.length - 1} more`}
              </span>
              <ChevronDown
                size={16}
                className={`text-slate-400 transition-transform ${
                  isIndustryDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isIndustryDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 max-h-80 flex flex-col overflow-hidden animate-in fade-in min-w-[280px]">
                <div className="p-3 border-b border-slate-800 bg-slate-950/50 space-y-2">
                  <div className="relative">
                    <Search
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="text"
                      placeholder="Filter categories..."
                      value={industrySearch}
                      onChange={(e) => setIndustrySearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                      autoFocus
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <button
                      type="button"
                      onClick={handleSelectAllIndustries}
                      className="text-violet-400 hover:text-violet-300 font-semibold"
                    >
                      Select All (9)
                    </button>
                    <button
                      type="button"
                      onClick={handleClearAllIndustries}
                      className="text-slate-400 hover:text-slate-300 font-medium"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                <div className="overflow-y-auto flex-1 divide-y divide-slate-800/40 p-2 space-y-1">
                  {filteredIndustries.map((cat, idx) => {
                    const isChecked = selectedIndustries.includes(cat);
                    return (
                      <label
                        key={cat}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer text-xs transition-colors ${
                          isChecked
                            ? "bg-violet-600/10 text-white font-semibold"
                            : "text-slate-300 hover:bg-white/5"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleIndustry(cat)}
                          className="rounded border-slate-700 text-violet-600 focus:ring-violet-500 h-4 w-4 bg-slate-800"
                        />
                        <span className="flex-1">{cat}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* C. Optional Location: State */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin size={14} className="text-slate-400" />
              <span>State (Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. California, Texas, Florida"
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-950/70 border border-slate-800 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-violet-500 transition-all font-medium"
            />
          </div>

          {/* D. Optional Location: City */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin size={14} className="text-slate-400" />
              <span>City (Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Los Angeles, Dallas, Orlando"
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-950/70 border border-slate-800 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-violet-500 transition-all font-medium"
            />
          </div>
        </div>

        {/* Selected Industry Badges Preview */}
        {selectedIndustries.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/60">
            <span className="text-xs text-slate-400 font-medium">Selected:</span>
            {selectedIndustries.map((ind) => (
              <span
                key={ind}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-medium"
              >
                <span>{ind}</span>
                <button
                  type="button"
                  onClick={() => toggleIndustry(ind)}
                  className="hover:text-red-400 transition-colors"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Search Action Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800/80">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck size={16} className="text-emerald-400" />
            <span>
              Real automated crawler. Extracts verified publicly available business emails only.
            </span>
          </div>

          <button
            type="button"
            onClick={handleStartSearch}
            disabled={isSearching}
            className={`w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all shadow-lg ${
              isSearching
                ? "bg-slate-800 text-slate-400 cursor-not-allowed"
                : "bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:shadow-violet-500/30 hover:scale-[1.02] active:scale-[0.98]"
            }`}
          >
            {isSearching ? (
              <>
                <RotateCw size={18} className="animate-spin text-violet-400" />
                <span>Searching & Crawling Websites...</span>
              </>
            ) : (
              <>
                <Search size={18} />
                <span>Search Companies</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. SEARCH PROGRESS UI (LIVE SECTION)
      ───────────────────────────────────────────────────────────── */}
      {isSearching && (
        <div className="card bg-slate-900 border border-violet-500/30 rounded-2xl p-6 md:p-8 space-y-6 shadow-2xl relative overflow-hidden animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-violet-500/20 text-violet-400">
                <RotateCw size={22} className="animate-spin" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>Live Search & Crawl Progress</span>
                  <span className="px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 text-xs font-semibold">
                    {searchProgress}%
                  </span>
                </h3>
                <p className="text-xs md:text-sm text-slate-400 mt-0.5">
                  {currentStep}
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowLogsAccordion((prev) => !prev)}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-slate-800"
            >
              <span>{showLogsAccordion ? "Hide Live Feed" : "View Live Feed"}</span>
              {showLogsAccordion ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>

          {/* Animated Progress Bar */}
          <div className="space-y-2">
            <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-800/80 p-0.5">
              <div
                className="bg-gradient-to-r from-violet-600 via-purple-500 to-emerald-400 h-full rounded-full transition-all duration-500 relative"
                style={{ width: `${Math.max(5, searchProgress)}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse" />
              </div>
            </div>
            <div className="flex justify-between text-[11px] font-medium text-slate-400">
              <span>Target: {selectedCountry}</span>
              <span>Discovered: {discoveredCount} companies</span>
              <span>Emails Found: {emailsCount}</span>
            </div>
          </div>

          {/* 6 Formal Progress Steps matching requirement */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: "1. Searching Companies", done: searchProgress >= 20 },
              { label: "2. Discovering Websites", done: searchProgress >= 40 },
              { label: "3. Scanning Contact Pages", done: searchProgress >= 65 },
              { label: "4. Extracting Emails", done: searchProgress >= 80 },
              { label: "5. Removing Duplicates", done: searchProgress >= 90 },
              { label: "6. Saving Results", done: searchProgress >= 100 },
            ].map((step, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs transition-all ${
                  step.done
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300 font-semibold"
                    : searchProgress > (idx * 16)
                    ? "bg-violet-500/10 border-violet-500/30 text-violet-300 font-semibold"
                    : "bg-slate-950/40 border-slate-800 text-slate-500"
                }`}
              >
                {step.done ? (
                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[10px] shrink-0 font-bold">
                    {idx + 1}
                  </div>
                )}
                <span className="truncate">{step.label}</span>
              </div>
            ))}
          </div>

          {/* Real-time Ticker/Logs Feed */}
          {showLogsAccordion && logs.length > 0 && (
            <div className="bg-slate-950 rounded-xl p-4 border border-slate-800/80 font-mono text-xs max-h-40 overflow-y-auto space-y-1.5 scrollbar-thin">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                Live Crawler Feed:
              </div>
              {logs.map((log, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-2 ${
                    log.type === "success"
                      ? "text-emerald-400"
                      : log.type === "warning"
                      ? "text-amber-400"
                      : log.type === "error"
                      ? "text-red-400"
                      : "text-slate-400"
                  }`}
                >
                  <span className="text-slate-600 shrink-0">
                    [{new Date(log.timestamp).toLocaleTimeString()}]
                  </span>
                  <span>{log.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          4. SEARCH HISTORY SECTION (TOGGLEABLE)
      ───────────────────────────────────────────────────────────── */}
      {showHistory && (
        <div className="card bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6 shadow-xl animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <Clock size={20} className="text-violet-400" />
              <h3 className="text-lg font-bold text-white">Search History</h3>
            </div>
            <button
              onClick={() => setShowHistory(false)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X size={18} />
            </button>
          </div>

          {isHistoryLoading ? (
            <div className="py-12 text-center text-slate-400 space-y-3">
              <RotateCw size={24} className="animate-spin mx-auto text-violet-400" />
              <p className="text-sm">Loading search history...</p>
            </div>
          ) : historyList.length === 0 ? (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <FolderOpen size={32} className="mx-auto text-slate-600" />
              <p className="text-sm">No previous searches recorded yet.</p>
              <p className="text-xs text-slate-600">
                Execute a search above to build your saved history.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Search Date</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4">Categories</th>
                    <th className="py-3 px-4">Discovered</th>
                    <th className="py-3 px-4">Emails Collected</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {historyList.map((item) => (
                    <tr
                      key={item._id}
                      className="hover:bg-white/5 transition-colors group cursor-pointer"
                      onClick={() => handleReopenHistory(item._id)}
                    >
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-300">
                        {new Date(item.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}{" "}
                        <span className="text-slate-500">
                          {new Date(item.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-white">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 text-xs">
                          <Globe size={12} className="text-violet-400" />
                          <span>{[item.city, item.state, item.country].filter(Boolean).join(", ")}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {(item.industries || []).slice(0, 2).map((ind, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-md bg-violet-500/10 text-violet-300 text-[11px] truncate max-w-[140px]"
                            >
                              {ind}
                            </span>
                          ))}
                          {(item.industries || []).length > 2 && (
                            <span className="px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-400 text-[11px]">
                              +{(item.industries || []).length - 2}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-300 font-medium">
                        {item.totalDiscovered || 0}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 text-xs">
                          {item.emailsFound || 0} Emails
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => handleReopenHistory(item._id)}
                            className="px-3 py-1.5 rounded-lg bg-violet-500/10 text-violet-300 hover:bg-violet-600 hover:text-white transition-all text-xs font-semibold flex items-center gap-1"
                          >
                            <span>Open</span>
                            <ArrowRight size={12} />
                          </button>

                          <a
                            href={`${BACKEND_URL}/api/lead-finder/export/${item._id}?format=xlsx`}
                            className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-600 hover:text-white transition-all text-xs"
                            title="Download Excel"
                            download
                          >
                            <FileSpreadsheet size={14} />
                          </a>

                          <button
                            type="button"
                            onClick={(e) => handleDeleteHistory(item._id, e)}
                            className="p-1.5 rounded-lg text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-all text-xs"
                            title="Delete Search"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          5. COLLECTED RESULTS SECTION
      ───────────────────────────────────────────────────────────── */}
      {activeResults.length > 0 && (
        <div className="space-y-6 animate-in fade-in">
          {/* A. Results Prominent Header Banner */}
          <div className="card bg-gradient-to-r from-slate-900 via-slate-900 to-violet-950/30 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
              <div>
                <span className="text-xs font-bold text-violet-400 uppercase tracking-widest">
                  Lead Discovery Results
                </span>
                <h2 className="text-2xl md:text-3xl font-extrabold text-white mt-1 flex flex-wrap items-center gap-2">
                  <span>Location:</span>
                  <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                    {[
                      activeSearchMeta?.city || cityFilter,
                      activeSearchMeta?.state || stateFilter,
                      activeSearchMeta?.country || selectedCountry,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </span>
                </h2>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="text-xs text-slate-400">Industries:</span>
                  {(activeSearchMeta?.industries || selectedIndustries).map((ind) => (
                    <span
                      key={ind}
                      className="px-2.5 py-0.5 rounded-md bg-white/5 border border-slate-800 text-slate-300 text-xs font-medium"
                    >
                      {ind}
                    </span>
                  ))}
                </div>
              </div>

              {/* Excel & CSV Export Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleExportExcel()}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <FileSpreadsheet size={18} />
                  <span>Export to Excel</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleExportCSV()}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-slate-800 hover:bg-white/10 text-slate-200 font-semibold text-sm transition-all"
                >
                  <Download size={16} />
                  <span>CSV</span>
                </button>
              </div>
            </div>

            {/* B. Four Required Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Target Location
                </p>
                <p className="text-xl font-extrabold text-white mt-1 truncate">
                  {[
                    activeSearchMeta?.city || cityFilter,
                    activeSearchMeta?.state || stateFilter,
                    activeSearchMeta?.country || selectedCountry,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Total Companies Discovered
                </p>
                <p className="text-xl font-extrabold text-violet-400 mt-1">
                  {discoveredCount || activeResults.length}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Companies with Emails Found
                </p>
                <p className="text-xl font-extrabold text-emerald-400 mt-1">
                  {activeResults.length}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Total Unique Email Addresses
                </p>
                <p className="text-xl font-extrabold text-purple-400 mt-1">
                  {new Set(activeResults.map((r) => r.email)).size}
                </p>
              </div>
            </div>
          </div>

          {/* C. Clean Professional Table */}
          <div className="card bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            {/* Table Header Filter Bar */}
            <div className="p-4 md:p-6 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950/30">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-base">
                  Collected Manufacturing Leads
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
                  {displayResults.length} Ready to Contact
                </span>
              </div>

              <div className="relative w-full sm:w-72">
                <Search
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Filter leads in table..."
                  value={tableSearchQuery}
                  onChange={(e) => setTableSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
                />
              </div>
            </div>

            {/* Main Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-4 px-6 w-16">No.</th>
                    <th className="py-4 px-6">Company Name</th>
                    <th className="py-4 px-6">Business Email</th>
                    <th className="py-4 px-6">Verified Location</th>
                    <th className="py-4 px-6">Website</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {displayResults.map((lead, idx) => {
                    const rowKey = `lead-${idx}`;
                    const locParts = [
                      lead.verifiedCity || lead.city,
                      lead.verifiedState || lead.state,
                      lead.verifiedCountry || lead.country,
                    ].filter(Boolean);
                    const locLabel = locParts.length > 0 ? locParts.join(", ") : "Location not verified";
                    const isLocVerified = locParts.length > 0;

                    return (
                      <tr
                        key={rowKey}
                        className="hover:bg-violet-600/[0.03] transition-colors group"
                      >
                        {/* No. */}
                        <td className="py-4 px-6 text-slate-500 font-mono text-xs font-semibold">
                          {idx + 1}
                        </td>

                        {/* Company Name */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white group-hover:text-violet-300 transition-colors">
                              {lead.companyName}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                copyToClipboard(lead.companyName, `name-${idx}`)
                              }
                              className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-white transition-opacity"
                              title="Copy Company Name"
                            >
                              {copiedKey === `name-${idx}` ? (
                                <Check size={14} className="text-emerald-400" />
                              ) : (
                                <Copy size={14} />
                              )}
                            </button>
                          </div>
                          {lead.industry && (
                            <span className="text-[11px] text-slate-400 block mt-0.5">
                              {lead.industry}
                            </span>
                          )}
                        </td>

                        {/* Business Email */}
                        <td className="py-4 px-6">
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-300 font-mono text-xs font-semibold">
                            <Mail size={13} className="text-violet-400 shrink-0" />
                            <span>{lead.email}</span>
                            <button
                              type="button"
                              onClick={() =>
                                copyToClipboard(lead.email, `email-${idx}`)
                              }
                              className="ml-1 text-slate-400 hover:text-white transition-colors"
                              title="Copy Email Address"
                            >
                              {copiedKey === `email-${idx}` ? (
                                <Check size={14} className="text-emerald-400" />
                              ) : (
                                <Copy size={14} />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Verified Location */}
                        <td className="py-4 px-6">
                          <div
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium ${
                              isLocVerified
                                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                : "bg-slate-800/60 border-slate-700/50 text-slate-400"
                            }`}
                          >
                            <MapPin
                              size={12}
                              className={`shrink-0 ${
                                isLocVerified ? "text-emerald-400" : "text-slate-500"
                              }`}
                            />
                            <span className="truncate max-w-[200px]" title={locLabel}>
                              {locLabel}
                            </span>
                          </div>
                        </td>

                        {/* Website */}
                        <td className="py-4 px-6">
                          {lead.website ? (
                            <a
                              href={lead.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 hover:underline max-w-xs truncate"
                            >
                              <Globe size={13} className="shrink-0" />
                              <span className="truncate">
                                {lead.website.replace(/^https?:\/\/(www\.)?/i, "")}
                              </span>
                              <ExternalLink size={12} className="shrink-0 opacity-60" />
                            </a>
                          ) : (
                            <span className="text-slate-600 text-xs">N/A</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {displayResults.length === 0 && (
              <div className="py-12 text-center text-slate-500 space-y-2">
                <Search size={28} className="mx-auto text-slate-600" />
                <p className="text-sm">No leads match your table filter.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          6. EMPTY STATE OR NO RESULTS MESSAGE
      ───────────────────────────────────────────────────────────── */}
      {!isSearching && activeResults.length === 0 && activeSearchMeta && (
        <div className="card bg-slate-900 border border-amber-500/30 rounded-2xl p-10 md:p-12 text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
            <AlertCircle size={32} />
          </div>
          <div className="max-w-lg mx-auto space-y-2">
            <h3 className="text-xl font-bold text-white">
              No matching companies found for the selected location and industry. Try another city or category.
            </h3>
            <p className="text-sm text-slate-400">
              No verified manufacturing companies were found in{" "}
              <strong className="text-white">
                {[
                  activeSearchMeta.city,
                  activeSearchMeta.state,
                  activeSearchMeta.country,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </strong>{" "}
              for the selected categories.
            </p>
            <p className="text-xs text-slate-500 pt-1">
              Strict location verification ensures only genuine companies in the selected region are returned.
            </p>
          </div>
        </div>
      )}

      {!isSearching && activeResults.length === 0 && !activeSearchMeta && (
        <div className="card bg-slate-900 border border-slate-800 rounded-2xl p-10 md:p-14 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center mx-auto">
            <Search size={32} />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-lg font-bold text-white">
              Ready to Discover Manufacturing Leads
            </h3>
            <p className="text-xs md:text-sm text-slate-400">
              Select your target country and manufacturing categories above, then click <strong>Search Companies</strong>. The crawler will visit official websites, scan public contact pages, and extract verified business emails ready for Excel export.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadFinder;
