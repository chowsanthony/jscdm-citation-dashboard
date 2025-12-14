import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell
} from 'recharts';
import { SectionStat, Publication } from '../types';

interface SectionPerformanceChartProps {
  data: SectionStat[];
}

export const SectionPerformanceChart: React.FC<SectionPerformanceChartProps> = ({ data }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-96">
      <h3 className="text-lg font-bold text-slate-800 mb-4">Citation Impact by Section</h3>
      <ResponsiveContainer width="100%" height="90%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis 
            dataKey="name" 
            tick={{ fill: '#64748b', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            interval={0}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis 
            tick={{ fill: '#64748b', fontSize: 12 }} 
            axisLine={false}
            tickLine={false}
          />
          <Tooltip 
            cursor={{ fill: '#f1f5f9' }}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Legend wrapperStyle={{ paddingTop: '20px' }}/>
          <Bar name="Total Citations" dataKey="citations" fill="#4f46e5" radius={[4, 4, 0, 0]} />
          <Bar name="Avg Citations / Paper" dataKey="avgCitations" fill="#93c5fd" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

interface TopNReportProps {
  data: Publication[];
  n?: number;
}

const CustomYAxisTick = ({ x, y, payload }: any) => {
  const fullTitle = payload.value as string;
  const maxLength = 35;
  const displayTitle = fullTitle.length > maxLength 
    ? `${fullTitle.substring(0, maxLength)}...` 
    : fullTitle;

  return (
    <g transform={`translate(${x},${y})`}>
      <text 
        x={0} 
        y={0} 
        dy={4} 
        textAnchor="end" 
        fill="#475569" 
        fontSize={11} 
        fontWeight={500}
      >
        {displayTitle}
        <title>{fullTitle}</title>
      </text>
    </g>
  );
};

export const TopNReport: React.FC<TopNReportProps> = ({ data, n = 10 }) => {
  // Sort descending by max_citations and take top N
  const topData = [...data]
    .sort((a, b) => b.max_citations - a.max_citations)
    .slice(0, n);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-[32rem]">
      <h3 className="text-lg font-bold text-slate-800 mb-1">Top {n} Most Cited Publications</h3>
      <p className="text-sm text-slate-500 mb-4">Based on highest citation count across all indices</p>
      
      <ResponsiveContainer width="100%" height="90%">
        <BarChart
          layout="vertical"
          data={topData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
          <XAxis type="number" tick={{ fill: '#64748b' }} axisLine={false} tickLine={false}/>
          <YAxis 
            dataKey="title" 
            type="category" 
            width={250} 
            tick={<CustomYAxisTick />}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip 
             contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', maxWidth: '400px' }}
             formatter={(value: number) => [value, 'Citations']}
             labelFormatter={(label) => <span className="font-semibold text-slate-800">{label}</span>}
          />
          <Bar dataKey="max_citations" fill="#4f46e5" radius={[0, 4, 4, 0]}>
             {topData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={index < 3 ? '#4f46e5' : '#818cf8'} />
              ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
