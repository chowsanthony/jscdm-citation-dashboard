import React, { useMemo, useState, useRef } from 'react';
import { PUBLICATIONS } from './constants';
import { SectionFilter } from './components/SectionFilter';
import { StatCard } from './components/StatCard';
import { SectionPerformanceChart, TopNReport } from './components/Charts';
import { DataTable } from './components/DataTable';
import { BookOpen, Quote, TrendingUp, Award, Upload, AlertCircle, ChevronDown, Calendar, Filter } from 'lucide-react';
import { SectionStat, Publication } from './types';

// Simple CSV parser that handles quoted strings
const parseCSV = (text: string): Publication[] => {
  const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
  if (lines.length < 2) return [];

  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
            current += '"';
            i++;
        } else {
            inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  // Normalize headers to remove whitespace and underscores for matching
  const headers = parseLine(lines[0]).map(h => h.toLowerCase().replace(/[\s_"]/g, ''));
  
  const findCol = (possibles: string[]) => headers.findIndex(h => possibles.some(p => h === p || h.includes(p)));

  const idxMap = {
    doi: findCol(['doi']),
    title: findCol(['title']),
    section: findCol(['section', 'category']),
    featured: findCol(['featuredin', 'featured_in', 'issue', 'journal_issue']),
    max: findCol(['maxcitations', 'max_citations', 'max']),
    crossref: findCol(['crossref']),
    scholar: findCol(['semanticscholar', 'semantic', 'scholar']),
    open: findCol(['opencitations', 'open'])
  };

  // If critical columns missing, return empty or try best effort
  if (idxMap.title === -1) return [];

  return lines.slice(1).map(line => {
    const cols = parseLine(line);
    // Remove surrounding quotes if present
    const clean = (s: string) => s?.replace(/^"|"$/g, '').trim() || '';
    
    return {
      doi: clean(cols[idxMap.doi]) || 'N/A',
      title: clean(cols[idxMap.title]) || 'Untitled',
      section: clean(cols[idxMap.section]) || 'General',
      featured_in: idxMap.featured !== -1 ? (clean(cols[idxMap.featured]) || 'General') : 'General',
      max_citations: parseInt(clean(cols[idxMap.max])) || 0,
      crossref: parseInt(clean(cols[idxMap.crossref])) || 0,
      semantic_scholar: parseInt(clean(cols[idxMap.scholar])) || 0,
      opencitations: parseInt(clean(cols[idxMap.open])) || 0,
    };
  });
};

function App() {
  const [publications, setPublications] = useState<Publication[]>(PUBLICATIONS);
  const [selectedSection, setSelectedSection] = useState('All');
  const [selectedIssue, setSelectedIssue] = useState('All');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsedData = parseCSV(text);
        if (parsedData.length === 0) {
            setUploadError("Could not parse valid publication data from the CSV. Ensure headers include 'Title', 'Section', and citations.");
            setUploadSuccess(null);
            return;
        }
        setPublications(parsedData);
        setSelectedSection('All');
        setSelectedIssue('All');
        setUploadError(null);
        setUploadSuccess(`Successfully loaded ${parsedData.length} records.`);
        
        // Clear success message after 5 seconds
        setTimeout(() => setUploadSuccess(null), 5000);
      } catch (err) {
        setUploadError("Failed to parse CSV file. Please check the file format.");
        setUploadSuccess(null);
      }
    };
    reader.onerror = () => setUploadError("Error reading file.");
    reader.readAsText(file);
    // Reset value to allow re-uploading the same file if needed
    event.target.value = '';
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  // Derive unique sections from current data
  const sections = useMemo(() => {
    const s = new Set(publications.map(p => p.section));
    return Array.from(s).sort().filter(Boolean);
  }, [publications]);

  // Derive and Group unique issues (featured_in) from current data
  const groupedIssues = useMemo(() => {
    const rawIssues = Array.from(new Set(publications.map(p => p.featured_in))).filter((s): s is string => typeof s === 'string' && s.length > 0);
    
    interface IssueMeta {
      original: string;
      isCalendar: boolean;
      year: number;
      season: string;
      seasonOrder: number;
    }

    const seasonMap: Record<string, number> = { 'Spring': 1, 'Summer': 2, 'Fall': 3, 'Winter': 4 };

    const metaList: IssueMeta[] = rawIssues.map(issue => {
      // Regex matches "Season Year" pattern at the start of the string
      // e.g. "Fall 2022" or "Fall 2022 - Something"
      const match = issue.match(/^(Spring|Summer|Fall|Winter)\s+(\d{4})/i);
      
      if (match) {
        const season = match[1]; // e.g. Fall
        const year = parseInt(match[2]); // e.g. 2022
        // If the exact case in data differs, normalize for key (optional), here we use parsed string for logic
        // but we need to capitalize match[1] properly if we want clean display
        const seasonKey = season.charAt(0).toUpperCase() + season.slice(1).toLowerCase();
        
        return {
          original: issue,
          isCalendar: true,
          year,
          season: seasonKey,
          seasonOrder: seasonMap[seasonKey] || 99
        };
      }
      return {
        original: issue,
        isCalendar: false,
        year: 0,
        season: '',
        seasonOrder: 0
      };
    });

    const otherIssues = metaList
      .filter(m => !m.isCalendar)
      .sort((a, b) => a.original.localeCompare(b.original));

    const calendarIssues = metaList
      .filter(m => m.isCalendar)
      .sort((a, b) => {
        // Sort by Year Descending
        if (b.year !== a.year) return b.year - a.year;
        // Then by Season Ascending (Spring -> Winter)
        return a.seasonOrder - b.seasonOrder;
      });

    // Group calendar issues by year
    const byYear: Record<number, IssueMeta[]> = {};
    calendarIssues.forEach(item => {
      if (!byYear[item.year]) byYear[item.year] = [];
      byYear[item.year].push(item);
    });

    return { otherIssues, byYear, years: Object.keys(byYear).map(Number).sort((a, b) => b - a) };
  }, [publications]);

  // Filter data
  const filteredPublications = useMemo(() => {
    return publications.filter(p => {
      const matchSection = selectedSection === 'All' || p.section === selectedSection;
      const matchIssue = selectedIssue === 'All' || p.featured_in === selectedIssue;
      return matchSection && matchIssue;
    });
  }, [selectedSection, selectedIssue, publications]);

  // KPIs
  const kpis = useMemo(() => {
    const totalPapers = filteredPublications.length;
    const totalCitations = filteredPublications.reduce((acc, curr) => acc + curr.max_citations, 0);
    const avgCitations = totalPapers > 0 ? (totalCitations / totalPapers).toFixed(2) : "0";
    
    // Most impactful section (within current filter)
    let topSectionName = selectedSection;
    if (selectedSection === 'All') {
        const sectionMap = new Map<string, number>();
        filteredPublications.forEach(p => {
            sectionMap.set(p.section, (sectionMap.get(p.section) || 0) + p.max_citations);
        });
        const sorted = [...sectionMap.entries()].sort((a, b) => b[1] - a[1]);
        topSectionName = sorted.length > 0 ? sorted[0][0] : '-';
    }

    return { totalPapers, totalCitations, avgCitations, topSectionName };
  }, [filteredPublications, selectedSection]);

  // Data for Section Bar Chart
  const sectionChartData: SectionStat[] = useMemo(() => {
    const map = new Map<string, { count: number; citations: number }>();
    
    // Use currently filtered publications so chart reflects the Issue filter
    filteredPublications.forEach(p => {
      const curr = map.get(p.section) || { count: 0, citations: 0 };
      map.set(p.section, {
        count: curr.count + 1,
        citations: curr.citations + p.max_citations
      });
    });

    return Array.from(map.entries()).map(([name, stats]) => ({
      name,
      count: stats.count,
      citations: stats.citations,
      avgCitations: parseFloat((stats.citations / stats.count).toFixed(1))
    })).sort((a, b) => b.citations - a.citations);
  }, [filteredPublications]);

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Banner Header */}
        <header className="relative bg-indigo-950 rounded-2xl overflow-hidden shadow-lg mb-8 min-h-[160px] flex flex-col justify-center">
            {/* Background Image Layer */}
            <div 
                className="absolute inset-0 z-0"
                style={{ 
                    backgroundImage: `url('/collection-banner.png')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'right bottom',
                    backgroundRepeat: 'no-repeat'
                }} 
            />
            
            {/* Gradient Overlay for text readability on the left */}
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-950 from-10% via-indigo-950/70 via-40% to-transparent z-0 pointer-events-none" />

            {/* Content Layer */}
            <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="max-w-3xl">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="h-1 w-10 bg-indigo-400 rounded-full"></div>
                        <span className="text-indigo-200 font-semibold tracking-wider text-xs uppercase">JSCDM Analytics</span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
                        Editorial Board Dashboard
                    </h1>
                    <p className="text-indigo-100 mt-3 text-lg font-light max-w-xl">
                        Analysis of journal publication impact and citation metrics
                    </p>
                </div>

                <div className="flex flex-col items-start md:items-end gap-3 shrink-0">
                     <div className="flex items-center gap-3">
                       <input 
                          type="file" 
                          ref={fileInputRef} 
                          onChange={handleFileUpload} 
                          accept=".csv" 
                          className="hidden" 
                       />
                       <button 
                          onClick={triggerUpload}
                          className="group flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md px-5 py-2.5 rounded-lg shadow-sm font-medium transition-all"
                       >
                          <Upload size={18} className="text-indigo-200 group-hover:text-white transition-colors" />
                          <span>Upload CSV</span>
                       </button>
                    </div>
                    {uploadSuccess && (
                        <span className="text-xs text-emerald-300 font-medium bg-emerald-900/40 px-3 py-1 rounded-full border border-emerald-500/20 backdrop-blur-md animate-in fade-in">
                            {uploadSuccess}
                        </span>
                    )}
                </div>
            </div>
        </header>

        {uploadError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                <AlertCircle size={20} />
                {uploadError}
            </div>
        )}

        {/* Filters Section */}
        <section className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-slate-800 font-semibold pb-2 border-b border-slate-100">
             <Filter size={20} className="text-indigo-600" />
             <h2>Dashboard Filters</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
             {/* Issue Filter (Dropdown) */}
             <div className="md:col-span-3 lg:col-span-3">
               <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                 Journal Issue
               </label>
               <div className="relative">
                 <select
                   value={selectedIssue}
                   onChange={(e) => setSelectedIssue(e.target.value)}
                   className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 py-2.5 pl-4 pr-10 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-medium transition-all"
                 >
                   <option value="All">All Issues</option>
                   
                   {/* Non-Calendar Issues */}
                   {groupedIssues.otherIssues.length > 0 && (
                     <optgroup label="Collections & Special Issues">
                       {groupedIssues.otherIssues.map(meta => (
                         <option key={meta.original} value={meta.original}>{meta.original}</option>
                       ))}
                     </optgroup>
                   )}

                   {/* Calendar Issues Grouped by Year */}
                   {groupedIssues.years.map(year => (
                     <optgroup key={year} label={year.toString()}>
                       {groupedIssues.byYear[year].map(meta => (
                         <option key={meta.original} value={meta.original}>
                           {meta.year} {meta.season}
                         </option>
                       ))}
                     </optgroup>
                   ))}
                 </select>
                 <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
               </div>
             </div>

             {/* Section Filter (Buttons) */}
             <div className="md:col-span-9 lg:col-span-9">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Article Section
                </label>
                <SectionFilter 
                  sections={sections} 
                  selectedSection={selectedSection} 
                  onSelect={setSelectedSection} 
                />
             </div>
          </div>
        </section>

        {/* KPI Cards */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            label="Total Publications" 
            value={kpis.totalPapers} 
            icon={BookOpen} 
            color="text-blue-600"
          />
          <StatCard 
            label="Total Citations" 
            value={kpis.totalCitations} 
            icon={Quote} 
            color="text-indigo-600"
          />
          <StatCard 
            label="Avg. Citations / Paper" 
            value={kpis.avgCitations} 
            icon={TrendingUp} 
            color="text-emerald-600"
          />
          <StatCard 
            label={
              selectedSection !== 'All' 
                ? "Current Section" 
                : selectedIssue === 'All' 
                  ? "Top Section" 
                  : "Top Section (Filtered)"
            } 
            value={kpis.topSectionName} 
            icon={Award} 
            color="text-amber-600"
            trend={selectedSection === 'All' ? "Highest impact in current view" : undefined}
          />
        </section>

        {/* Charts Row */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Chart 1: Section Overview */}
            <SectionPerformanceChart data={sectionChartData} />
            
            {/* Chart 2: Top N Report */}
            <TopNReport data={filteredPublications} n={10} />
        </section>

        {/* Detailed Table */}
        <section>
          <DataTable data={filteredPublications} />
        </section>

      </div>
    </div>
  );
}

export default App;