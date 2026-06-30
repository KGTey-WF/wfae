
import React, { useState, useCallback, useEffect } from 'react';
import { View, Employee, TimeEntry, AppState } from './types';
import FrontUI from './pages/FrontUI';
import WorkerUI from './pages/WorkerUI';
import AdminUI from './pages/AdminUI';
import ReportUI from './pages/ReportUI';
import AdminLogin from './pages/AdminLogin';
import { Settings, BarChart3, Home, Phone, MapPin } from 'lucide-react';
import { DB } from './services/db';
import { Language, translations } from './src/data/translations';

declare const XLSX: any;

const App: React.FC = () => {
  const [view, setView] = useState<View>('FRONT');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('worktrack_language') as Language) || 'en';
  });
  
  const [state, setState] = useState<AppState>(() => DB.load());

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('worktrack_language', lang);
  };

  const updateState = useCallback((updater: (prev: AppState) => AppState) => {
    setState(prev => {
      const next = updater(prev);
      DB.save(next);
      return next;
    });
  }, []);

  const handleSelectEmployee = (emp: Employee) => {
    setSelectedEmployee(emp);
    setView('WORKER');
  };

  const goHome = () => {
    setView('FRONT');
    setSelectedEmployee(null);
  };

  // --- AUTOMATIC 7PM (19:00) JOB END & EXPORT LOGIC ---
  useEffect(() => {
    const checkAutoEnd = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const todayStr = now.toISOString().split('T')[0];
      
      // Check LocalStorage to see if we already ran the routine for today
      // This prevents re-running if the user refreshes the page at 19:05
      const lastRunDate = localStorage.getItem('worktrack_last_run');

      // Trigger condition: Time is 19:00 OR LATER, and we haven't run it for today yet
      if (currentHour >= 19 && lastRunDate !== todayStr) {
        
        console.log("Triggering 7PM Auto-End and Export sequence...");

        // 1. Identify ALL open jobs (regardless of date)
        let hasUpdates = false;
        
        const updatedEntries = state.entries.map(e => {
          if (!e.endTime) {
            hasUpdates = true;
            
            // Calculate the correct 19:00 end time based on the Entry's date
            // This handles cases where a job was started yesterday (or 8/1/26) but not closed.
            // We close it at 19:00 OF THAT DAY, not 19:00 today (which would create huge hours).
            const [y, m, d] = e.date.split('-').map(Number);
            const entryCloseTime = new Date(y, m - 1, d, 19, 0, 0);
            
            return { ...e, endTime: entryCloseTime.toISOString() };
          }
          return e;
        });

        // 2. Update State if needed
        if (hasUpdates) {
          updateState(prev => ({ ...prev, entries: updatedEntries }));
          console.log("Closed active sessions.");
        }

        // 3. Mark today as done in LocalStorage
        localStorage.setItem('worktrack_last_run', todayStr);
        
        // If a worker is currently viewing their screen, force them back home to refresh state visual
        if (view === 'WORKER') {
          goHome();
          alert(translations[language].systemNotice7pm);
        }
      }
    };

    // Check every 10 seconds
    const intervalId = setInterval(checkAutoEnd, 10000);
    
    // Run check immediately on mount as well (to catch if app is opened at 7:30 PM)
    checkAutoEnd();

    return () => clearInterval(intervalId);
  }, [state, updateState, view, language]);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Top Accent Bar */}
      <div className="h-1.5 w-full flex">
        <div className="h-full bg-[#E31E24]" style={{ width: '80%' }}></div>
        <div className="h-full bg-[#11335D]" style={{ width: '20%' }}></div>
      </div>

      {/* Main Branded Header */}
      <header className="pt-6 pb-4 border-b border-slate-100 bg-white">
        <div className="max-w-6xl mx-auto px-4 flex flex-col items-center text-center">
          <div className="flex flex-col items-center mb-3">
            <div className="flex items-center">
              <span className="text-[42px] font-black italic tracking-tighter leading-none text-[#11335D]">W</span>
              <span className="text-[42px] font-black italic tracking-tighter leading-none text-[#E31E24] -ml-2">F</span>
            </div>
            <div className="text-[18px] font-black tracking-[0.2em] text-[#11335D] -mt-1 uppercase">WONG FONG</div>
          </div>

          <div className="space-y-0.5">
            <h1 className="text-base sm:text-lg font-bold text-[#11335D] tracking-wide uppercase">
              WONG FONG ENGINEERING WORKS (1988) PTE LTD
            </h1>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1"><MapPin size={12} /> 79 Joo Koon Circle, Singapore 629107</span>
              <span className="flex items-center gap-1"><Phone size={12} /> Hotline: 8288 8699</span>
            </div>
          </div>

          <nav className="mt-4 sm:mt-6 flex items-center justify-center gap-1 sm:gap-1.5 p-1 sm:p-1.5 bg-slate-50 rounded-xl sm:rounded-[1.8rem] border border-slate-100 max-w-full overflow-x-auto">
            <button 
              onClick={goHome} 
              className={`flex items-center gap-1.5 sm:gap-3 px-3 py-2 sm:px-9 sm:py-3 rounded-lg sm:rounded-2xl text-xs sm:text-lg font-bold transition-all shrink-0 ${view === 'FRONT' ? 'bg-white text-[#11335D] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <Home className="w-4 h-4 sm:w-6 sm:h-6" /> {translations[language].home}
            </button>
            <button 
              onClick={() => setView('REPORT')} 
              className={`flex items-center gap-1.5 sm:gap-3 px-3 py-2 sm:px-9 sm:py-3 rounded-lg sm:rounded-2xl text-xs sm:text-lg font-bold transition-all shrink-0 ${view === 'REPORT' ? 'bg-white text-[#11335D] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <BarChart3 className="w-4 h-4 sm:w-6 sm:h-6" /> {translations[language].reports}
            </button>
            <button 
              onClick={() => setView('ADMIN')} 
              className={`flex items-center gap-1.5 sm:gap-3 px-3 py-2 sm:px-9 sm:py-3 rounded-lg sm:rounded-2xl text-xs sm:text-lg font-bold transition-all shrink-0 ${view === 'ADMIN' ? 'bg-white text-[#11335D] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <Settings className="w-4 h-4 sm:w-6 sm:h-6" /> {translations[language].admin}
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-8 max-w-6xl">
        {view === 'FRONT' && (
          <FrontUI 
            state={state} 
            onSelect={handleSelectEmployee} 
            language={language}
            onLanguageChange={handleLanguageChange}
          />
        )}
        
        {view === 'WORKER' && selectedEmployee && (
          <WorkerUI 
            employee={selectedEmployee}
            projects={state.projects}
            employees={state.employees} 
            entries={state.entries}
            language={language}
            onSave={(entry, newProject) => {
              updateState(prev => {
                let updatedProjects = prev.projects;
                if (newProject && !prev.projects.some(p => p.id === newProject.id)) {
                  updatedProjects = [...prev.projects, newProject];
                }
                return {
                  ...prev,
                  projects: updatedProjects,
                  entries: [...prev.entries, entry]
                };
              });
              goHome();
            }}
            onExit={goHome}
            onUpdateEntries={(newEntries) => {
               updateState(prev => ({ ...prev, entries: newEntries }));
            }}
          />
        )}

        {view === 'ADMIN' && (
          !isAdminAuthenticated ? (
            <AdminLogin onLoginSuccess={() => setIsAdminAuthenticated(true)} />
          ) : (
            <AdminUI 
              state={state} 
              updateState={updateState} 
            />
          )
        )}

        {view === 'REPORT' && (
          <ReportUI state={state} />
        )}
      </main>

      <footer className="bg-white border-t border-slate-100 py-10 mt-auto">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="flex flex-col items-center opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500 mb-6">
            <div className="flex items-center">
              <span className="text-2xl font-black italic tracking-tighter text-[#11335D]">W</span>
              <span className="text-2xl font-black italic tracking-tighter text-[#E31E24] -ml-1.5">F</span>
            </div>
            <div className="text-[10px] font-black tracking-[0.2em] text-[#11335D] -mt-0.5 uppercase">WONG FONG</div>
          </div>
          
          <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
            WorkTrack Pro Management System &bull; Version 1.5.1
          </div>
          <div className="mt-1 text-[9px] text-sky-500 font-semibold">
            Created by KG TEY, 2026
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
