
import React, { useState, useMemo } from 'react';
import { TimeEntry, AppState } from '../types';
import { 
  FileDown, 
  Filter, 
  Database,
  FileSpreadsheet
} from 'lucide-react';
import { DB } from '../services/db';

declare const XLSX: any;

interface Props {
  state: AppState;
}

const ReportUI: React.FC<Props> = ({ state }) => {
  const [filterEmpId, setFilterEmpId] = useState('');
  const [filterProjId, setFilterProjId] = useState('');
  const [filterMonth, setFilterMonth] = useState(''); 

  const filteredEntries = useMemo(() => {
    return state.entries.filter(entry => {
      const matchEmp = filterEmpId ? entry.employeeId === filterEmpId : true;
      const matchProj = filterProjId ? entry.projectId === filterProjId : true;
      const matchMonth = filterMonth ? entry.date.startsWith(filterMonth) : true;
      return matchEmp && matchProj && matchMonth;
    }).sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }, [state.entries, filterEmpId, filterProjId, filterMonth]);

  const calculateDuration = (entry: TimeEntry) => {
    if (!entry.endTime) return 'In Progress';
    const start = new Date(entry.startTime);
    const end = new Date(entry.endTime);
    const diffMs = end.getTime() - start.getTime();
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${diffHrs}h ${diffMins}m`;
  };

  const exportToExcel = (mode: 'filtered' | 'today' = 'filtered') => {
    let targetEntries = filteredEntries;
    const today = new Date().toISOString().split('T')[0];

    if (mode === 'today') {
      targetEntries = state.entries.filter(e => e.date === today);
      if (targetEntries.length === 0) return alert("No entries found for today.");
    }

    DB.exportToExcel(targetEntries, mode);
  };

  return (
    <div className="animate-in fade-in duration-500 pb-20">
      <div className="mb-6 sm:mb-10 flex flex-col lg:flex-row lg:items-end justify-between gap-4 sm:gap-6">
        <div>
          <h2 className="text-2xl sm:text-4xl font-black text-[#11335D] mb-2 tracking-tight">Reports & Analytics</h2>
          <p className="text-slate-500 font-medium text-xs sm:text-base">Review, filter, and save your daily hours locally in Excel format.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => exportToExcel('today')}
            className="flex items-center justify-center gap-2 bg-[#1D6F42] text-white px-4 py-3 sm:px-8 sm:py-4 rounded-xl sm:rounded-2xl text-xs sm:text-base font-black hover:bg-[#155231] transition-all shadow-xl shadow-green-100"
          >
            <FileSpreadsheet size={16} className="sm:size-[20px]" />
            Export Today's Excel
          </button>
          <button
            onClick={() => exportToExcel('filtered')}
            disabled={filteredEntries.length === 0}
            className="flex items-center justify-center gap-2 bg-[#11335D] text-white px-4 py-3 sm:px-8 sm:py-4 rounded-xl sm:rounded-2xl text-xs sm:text-base font-black hover:bg-[#0a2342] transition-all disabled:opacity-50 shadow-xl shadow-blue-100"
          >
            <FileDown size={16} className="sm:size-[20px]" />
            Export Selected
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 sm:mb-10">
        <div className="bg-white border-2 border-slate-100 rounded-[1.5rem] sm:rounded-[2.5rem] p-6 sm:p-8 flex flex-col justify-center items-center text-center col-span-3">
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-indigo-50 text-indigo-600 rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4">
            <Database size={24} className="sm:size-[28px]" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Local Records</p>
          <div className="text-3xl sm:text-4xl font-black text-[#11335D]">{state.entries.length}</div>
          <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Total logs in browser</p>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] border border-slate-100 shadow-sm mb-6 sm:mb-10">
        <div className="flex items-center gap-2 mb-6 sm:mb-8 text-[#11335D] font-black uppercase tracking-widest text-xs">
          <Filter size={14} />
          Data Refinement Tool
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <div className="space-y-1 sm:space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Staff Member</label>
            <select
              className="w-full px-3 py-3 sm:px-4 sm:py-4 bg-slate-50 border border-slate-100 rounded-xl sm:rounded-2xl focus:ring-4 focus:ring-indigo-50 outline-none font-bold text-xs sm:text-base text-slate-700 transition-all"
              value={filterEmpId}
              onChange={(e) => setFilterEmpId(e.target.value)}
            >
              <option value="">All Staff</option>
              {state.employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1 sm:space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Project Code</label>
            <select
              className="w-full px-3 py-3 sm:px-4 sm:py-4 bg-slate-50 border border-slate-100 rounded-xl sm:rounded-2xl focus:ring-4 focus:ring-indigo-50 outline-none font-bold text-xs sm:text-base text-slate-700 transition-all"
              value={filterProjId}
              onChange={(e) => setFilterProjId(e.target.value)}
            >
              <option value="">All Projects</option>
              {state.projects.map(proj => (
                <option key={proj.id} value={proj.id}>{proj.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1 sm:space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Target Month</label>
            <input
              type="month"
              className="w-full px-3 py-3 sm:px-4 sm:py-4 bg-slate-50 border border-slate-100 rounded-xl sm:rounded-2xl focus:ring-4 focus:ring-indigo-50 outline-none font-bold text-xs sm:text-base text-slate-700 transition-all"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-[1.5rem] sm:rounded-[2.5rem] border border-slate-100 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-4 py-4 sm:px-8 sm:py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee Information</th>
                <th className="px-4 py-4 sm:px-8 sm:py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Project Details</th>
                <th className="px-4 py-4 sm:px-8 sm:py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Date</th>
                <th className="px-4 py-4 sm:px-8 sm:py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredEntries.map(entry => (
                <tr key={entry.id} className="hover:bg-indigo-50/30 transition-colors group">
                  <td className="px-4 py-4 sm:px-8 sm:py-6">
                    <div className="font-black text-slate-800 uppercase tracking-tight text-xs sm:text-base">
                      {state.employees.find(emp => emp.id === entry.employeeId)?.name || 'Deleted User'}
                    </div>
                    <div className="text-[9px] sm:text-[10px] font-bold text-indigo-500 uppercase">ID: {entry.employeeId}</div>
                  </td>
                  <td className="px-4 py-4 sm:px-8 sm:py-6">
                    <div className="flex flex-col gap-1 sm:gap-1.5 items-start">
                      <span className="bg-white border border-slate-200 text-[#11335D] px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-black uppercase shadow-sm truncate max-w-[150px] sm:max-w-none">
                        {state.projects.find(p => p.id === entry.projectId)?.name || entry.projectId}
                      </span>
                      {entry.weldingType && (
                        <span className="text-[9px] sm:text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 border border-emerald-200/50 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg flex items-center gap-1 sm:gap-1.5">
                          Weld: {entry.weldingType} {entry.unitNumber && `(Unit #${entry.unitNumber})`}
                        </span>
                      )}
                      {entry.remarks && (
                        <span className="text-[10px] sm:text-xs font-medium text-slate-500 italic mt-0.5 sm:mt-1 block max-w-[150px] sm:max-w-xs truncate bg-slate-50 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded border border-slate-100" title={entry.remarks}>
                          Note: "{entry.remarks}"
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 sm:px-8 sm:py-6 text-center text-slate-600 font-bold font-mono text-xs sm:text-sm">
                    {entry.date}
                  </td>
                  <td className="px-4 py-4 sm:px-8 sm:py-6 text-right">
                    <span className={`text-sm sm:text-lg font-black tracking-tighter ${entry.endTime ? 'text-slate-900' : 'text-amber-500 italic animate-pulse'}`}>
                      {calculateDuration(entry)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReportUI;
