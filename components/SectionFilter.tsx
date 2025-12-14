import React from 'react';

interface SectionFilterProps {
  sections: string[];
  selectedSection: string;
  onSelect: (section: string) => void;
}

export const SectionFilter: React.FC<SectionFilterProps> = ({ sections, selectedSection, onSelect }) => {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      <button
        onClick={() => onSelect('All')}
        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
          selectedSection === 'All'
            ? 'bg-indigo-600 text-white shadow-md'
            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
        }`}
      >
        All Sections
      </button>
      {sections.map((section) => (
        <button
          key={section}
          onClick={() => onSelect(section)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            selectedSection === section
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          {section}
        </button>
      ))}
    </div>
  );
};
