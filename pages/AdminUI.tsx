
import React, { useState, useRef } from 'react';
import { AppState, Employee, Project } from '../types';
import { 
  UserPlus, 
  Plus, 
  Trash2, 
  Users, 
  FolderKanban, 
  Download,
  Database,
  Upload,
  HardDrive,
  Trash
} from 'lucide-react';
import { DB } from '../services/db';

interface Props {
  state: AppState;
  updateState: (updater: (prev: AppState) => AppState) => void;
}

type Tab = 'employees' | 'projects' | 'database';

const AdminUI: React.FC<Props> = ({ state, updateState }) => {
  const [activeTab, setActiveTab] = useState<Tab>('employees');
  const [empId, setEmpId] = useState('');
  const [empName, setEmpName] = useState('');
  const [projId, setProjId] = useState('');
  const [projName, setProjName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stats = DB.getStats();

  const isProjectActive = (id: string) => state.entries.some(entry => String(entry.projectId) === String(id));
  const isEmployeeActive = (id: string) => state.entries.some(entry => String(entry.employeeId) === String(id));

  const addEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = empId.trim();
    const cleanName = empName.trim();
    if (!cleanId || !cleanName) return;
    if (state.employees.some(e => String(e.id) === cleanId)) return alert(`Error: ID "${cleanId}" exists.`);
    updateState(prev => ({ ...prev, employees: [...prev.employees, { id: cleanId, name: cleanName }] }));
    setEmpId(''); setEmpName('');
  };

  const addProject = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = projId.trim();
    const cleanName = projName.trim();
    if (!cleanId || !cleanName) return;
    if (state.projects.some(p => String(p.id) === cleanId)) return alert(`Error: ID "${cleanId}" exists.`);
    updateState(prev => ({ ...prev, projects: [...prev.projects, { id: cleanId, name: cleanName }] }));
    setProjId(''); setProjName('');
  };

  const handleRemoveEmployee = (emp: Employee) => {
    if (isEmployeeActive(emp.id)) return alert(`Cannot delete active employee.`);
    if (window.confirm(`Delete ${emp.name}?`)) {
      updateState(prev => ({ ...prev, employees: prev.employees.filter(e => e.id !== emp.id) }));
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const newState = await DB.import(file);
      if (window.confirm("Restore this database backup? Current data will be replaced.")) {
        updateState(() => newState);
        alert("Database restored successfully.");
      }
    } catch (err) {
      alert("Error importing database: " + (err instanceof Error ? err.message : "Invalid file"));
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-500">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">Admin Control Center</h2>
          <p className="text-slate-500">Manage workforce database and system registry.</p>
        </div>
      </div>

      <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl w-fit mb-8 overflow-x-auto">
        <button onClick={() => setActiveTab('employees')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'employees' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}><Users size={18} />Staff Registry</button>
        <button onClick={() => setActiveTab('projects')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'projects' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}><FolderKanban size={18} />Projects</button>
        <button onClick={() => setActiveTab('database')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'database' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}><Database size={18} />Database</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm sticky top-24">
            {activeTab !== 'database' ? (
              <>
                <h3 className="text-lg font-bold mb-5 flex items-center gap-2 text-slate-800">
                  {activeTab === 'employees' ? <UserPlus size={20} className="text-indigo-500" /> : <Plus size={20} className="text-indigo-500" />}
                  New {activeTab === 'employees' ? 'Employee' : 'Project'}
                </h3>
                <form onSubmit={activeTab === 'employees' ? addEmployee : addProject} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 tracking-widest">ID Code</label>
                    <input type="text" required value={activeTab === 'employees' ? empId : projId} onChange={(e) => activeTab === 'employees' ? setEmpId(e.target.value) : setProjId(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none transition-all font-medium" placeholder="ID" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 tracking-widest">Display Name</label>
                    <input type="text" required value={activeTab === 'employees' ? empName : projName} onChange={(e) => activeTab === 'employees' ? setEmpName(e.target.value) : setProjName(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none transition-all font-medium" placeholder="Name" />
                  </div>
                  <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"><Plus size={18} /> Add Entry</button>
                </form>
              </>
            ) : (
              <div className="space-y-6">
                <h3 className="text-lg font-bold flex items-center gap-2 text-slate-800"><HardDrive size={20} className="text-indigo-500" /> DB Health</h3>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                  <div className="flex justify-between items-center"><span className="text-xs text-slate-400 uppercase font-bold tracking-widest">Storage</span><span className="font-mono text-sm font-bold text-slate-700">{stats.size}</span></div>
                  <div className="flex justify-between items-center"><span className="text-xs text-slate-400 uppercase font-bold tracking-widest">Records</span><span className="font-mono text-sm font-bold text-slate-700">{stats.recordCount}</span></div>
                  <div className="flex justify-between items-center"><span className="text-xs text-slate-400 uppercase font-bold tracking-widest">Status</span><span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] rounded-full font-bold">OPTIMIZED</span></div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-8">
          {activeTab === 'database' ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button onClick={() => DB.export(state)} className="flex flex-col items-center justify-center gap-3 p-8 bg-white border border-slate-200 rounded-2xl hover:border-indigo-500 hover:bg-indigo-50 transition-all group">
                  <Download size={32} className="text-slate-400 group-hover:text-indigo-600" />
                  <span className="font-bold text-slate-700">Backup DB (.json)</span>
                  <span className="text-xs text-slate-400 text-center">Download all projects and time logs as a single database file.</span>
                </button>
                <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center justify-center gap-3 p-8 bg-white border border-slate-200 rounded-2xl hover:border-indigo-500 hover:bg-indigo-50 transition-all group text-left">
                  <Upload size={32} className="text-slate-400 group-hover:text-indigo-600" />
                  <span className="font-bold text-slate-700">Restore Database</span>
                  <span className="text-xs text-slate-400 text-center">Load an existing WorkTrack JSON file into the browser.</span>
                  <input type="file" ref={fileInputRef} onChange={handleImport} accept=".json" className="hidden" />
                </button>
              </div>

              <div className="bg-rose-50 border border-rose-100 rounded-2xl p-6">
                <div className="flex items-center gap-2 text-rose-700 font-bold mb-4">
                  <Trash size={18} />
                  Destructive Actions
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <button 
                    onClick={() => {
                      if(confirm("DANGER: This will permanently delete ALL recorded working hours. Continue?")) {
                        updateState(prev => ({ ...prev, entries: [] }));
                        alert("Database logs cleared.");
                      }
                    }}
                    className="w-full sm:w-auto px-6 py-3 bg-white border border-rose-200 text-rose-600 rounded-xl font-bold hover:bg-rose-100 transition-all text-xs"
                  >
                    Clear All Time Logs
                  </button>
                  <button 
                    onClick={() => {
                      if(confirm("DANGER: This will factory reset the entire application. Continue?")) {
                        localStorage.clear();
                        window.location.reload();
                      }
                    }}
                    className="w-full sm:w-auto px-6 py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-all text-xs"
                  >
                    Factory Reset Database
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">ID</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Name</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {(activeTab === 'employees' ? state.employees : state.projects).map(item => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-mono text-indigo-600 font-bold">{item.id}</td>
                      <td className="px-6 py-4 font-semibold text-slate-700">{item.name}</td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => activeTab === 'employees' ? handleRemoveEmployee(item as Employee) : alert("Use DB tab to clear projects")} className="p-2 text-slate-300 hover:text-rose-600 transition-all"><Trash2 size={18} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminUI;
