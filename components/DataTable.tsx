import React, { useState } from 'react';
import { Publication } from '../types';
import { Search, ArrowUpDown, Calendar } from 'lucide-react';

interface DataTableProps {
  data: Publication[];
}

export const DataTable: React.FC<DataTableProps> = ({ data }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof Publication>('max_citations');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: keyof Publication) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Helper to display clean issue label
  const getIssueLabel = (fullLabel: string) => {
    // Check for "Season Year" pattern e.g. "Fall 2022 - Something" or "Fall 2022"
    const match = fullLabel.match(/^(Spring|Summer|Fall|Winter)\s+(\d{4})/i);
    if (match) {
        return `${match[1]} ${match[2]}`;
    }
    return fullLabel;
  };

  const filteredData = data
    .filter(item => 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.section.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.featured_in.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue) 
          : bValue.localeCompare(aValue);
      }
      
      // Number comparison
      return sortDirection === 'asc' 
        ? (aValue as number) - (bValue as number) 
        : (bValue as number) - (aValue as number);
    });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
        <h3 className="text-lg font-bold text-slate-800">Detailed Publication Data</h3>
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search title, section, or issue..."
            className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-64"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-slate-900 font-semibold border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('title')}>
                <div className="flex items-center space-x-1">
                    <span>Title</span>
                    <ArrowUpDown size={14} className="text-slate-400"/>
                </div>
              </th>
              <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('featured_in')}>
                <div className="flex items-center space-x-1">
                    <span>Issue</span>
                    <ArrowUpDown size={14} className="text-slate-400"/>
                </div>
              </th>
              <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('section')}>
                <div className="flex items-center space-x-1">
                    <span>Section</span>
                    <ArrowUpDown size={14} className="text-slate-400"/>
                </div>
              </th>
              <th className="px-6 py-4 text-center cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('max_citations')}>
                 <div className="flex items-center justify-center space-x-1">
                    <span>Max Citations</span>
                    <ArrowUpDown size={14} className="text-slate-400"/>
                </div>
              </th>
              <th className="px-6 py-4 text-center hidden md:table-cell text-slate-500 font-normal">Crossref</th>
              <th className="px-6 py-4 text-center hidden md:table-cell text-slate-500 font-normal">Scholar</th>
              <th className="px-6 py-4 text-center hidden md:table-cell text-slate-500 font-normal">OpenCitations</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredData.slice(0, 15).map((paper) => (
              <tr key={paper.doi} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 max-w-md truncate" title={paper.title}>
                    <div className="font-medium text-slate-900">{paper.title}</div>
                    <div className="text-xs text-slate-400 mt-1">{paper.doi}</div>
                </td>
                <td className="px-6 py-4" title={paper.featured_in}>
                   <div className="flex items-center gap-1.5 text-slate-700">
                      <Calendar size={14} className="text-slate-400 flex-shrink-0" />
                      <span className="whitespace-nowrap">{getIssueLabel(paper.featured_in)}</span>
                   </div>
                </td>
                <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-800">
                        {paper.section}
                    </span>
                </td>
                <td className="px-6 py-4 text-center font-bold text-slate-900">{paper.max_citations}</td>
                <td className="px-6 py-4 text-center hidden md:table-cell">{paper.crossref}</td>
                <td className="px-6 py-4 text-center hidden md:table-cell">{paper.semantic_scholar}</td>
                <td className="px-6 py-4 text-center hidden md:table-cell">{paper.opencitations}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredData.length === 0 && (
            <div className="p-8 text-center text-slate-500">No publications found matching your search.</div>
        )}
         {filteredData.length > 15 && (
            <div className="p-4 text-center text-xs text-slate-400 border-t border-slate-100">
                Showing top 15 results of {filteredData.length} matches
            </div>
        )}
      </div>
    </div>
  );
};