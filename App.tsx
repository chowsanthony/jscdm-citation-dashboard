import React, { useMemo, useState, useRef } from 'react';
import { PUBLICATIONS } from './constants';
import { SectionFilter } from './components/SectionFilter';
import { StatCard } from './components/StatCard';
import { SectionPerformanceChart, TopNReport } from './components/Charts';
import { DataTable } from './components/DataTable';
import { BookOpen, Quote, TrendingUp, Award, Upload, AlertCircle } from 'lucide-react';
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
  const [uploadError, setUploadError] = useState<string | null>(null);
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
            return;
        }
        setPublications(parsedData);
        setSelectedSection('All');
        setUploadError(null);
      } catch (err) {
        setUploadError("Failed to parse CSV file. Please check the file format.");
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

  // Filter data
  const filteredPublications = useMemo(() => {
    return selectedSection === 'All'
      ? publications
      : publications.filter(p => p.section === selectedSection);
  }, [selectedSection, publications]);

  // KPIs
  const kpis = useMemo(() => {
    const totalPapers = filteredPublications.length;
    const totalCitations = filteredPublications.reduce((acc, curr) => acc + curr.max_citations, 0);
    const avgCitations = totalPapers > 0 ? (totalCitations / totalPapers).toFixed(2) : "0";
    
    // Most impactful section
    let topSectionName = selectedSection;
    if (selectedSection === 'All') {
        const sectionMap = new Map<string, number>();
        publications.forEach(p => {
            sectionMap.set(p.section, (sectionMap.get(p.section) || 0) + p.max_citations);
        });
        const sorted = [...sectionMap.entries()].sort((a, b) => b[1] - a[1]);
        topSectionName = sorted.length > 0 ? sorted[0][0] : '-';
    }

    return { totalPapers, totalCitations, avgCitations, topSectionName };
  }, [filteredPublications, selectedSection, publications]);

  // Data for Section Bar Chart
  const sectionChartData: SectionStat[] = useMemo(() => {
    const map = new Map<string, { count: number; citations: number }>();
    
    // Use full dataset for the comparison chart
    publications.forEach(p => {
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
  }, [publications]);

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header with Upload */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
             <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Editorial Board Dashboard</h1>
             <p className="text-slate-500 mt-2 text-lg">Analysis of journal publication impact and citation metrics</p>
          </div>
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
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg shadow-sm font-medium transition-colors"
             >
                <Upload size={18} />
                Upload CSV
             </button>
          </div>
        </header>

        {uploadError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                <AlertCircle size={20} />
                {uploadError}
            </div>
        )}

        {/* Filters */}
        <section>
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Filter Data</h2>
          </div>
          <SectionFilter 
            sections={sections} 
            selectedSection={selectedSection} 
            onSelect={setSelectedSection} 
          />
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
            label={selectedSection === 'All' ? "Most Cited Section" : "Current Section"} 
            value={kpis.topSectionName} 
            icon={Award} 
            color="text-amber-600"
            trend={selectedSection === 'All' ? "Highest cumulative impact" : undefined}
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
