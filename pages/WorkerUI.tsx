import React, { useState, useEffect } from 'react';
import { Employee, Project, TimeEntry } from '../types';
import { 
  Clock, 
  Briefcase, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  Eraser, 
  Play, 
  Square,
  Timer,
  FileSpreadsheet,
  Download,
  Video,
  Camera,
  RefreshCw,
  X,
  FileText,
  ChevronRight,
  ArrowLeft
} from 'lucide-react';
import { TRAILER_PARTS } from '../src/data/parts';
import { DB } from '../services/db';
import wps001Img from '../src/assets/images/wps_001_butt_weld_1782435466807.jpg';
import wps002aImg from '../src/assets/images/wps_002a_multipass_1782435486685.jpg';
import wps002bImg from '../src/assets/images/wps_002b_singlepass_1782435498163.jpg';
import wps003Img from '../src/assets/images/wps_003_partial_penetration_tjoint_1782436059169.jpg';
import wps004aImg from '../src/assets/images/wps_004a_thick_plate_bush_1782435520999.jpg';
import wps004bImg from '../src/assets/images/wps_004b_thin_plate_bush_1782435534473.jpg';

import { Language, translations } from '../src/data/translations';

declare const XLSX: any;

interface Props {
  employee: Employee;
  projects: Project[];
  employees: Employee[]; // Needed for export report
  entries: TimeEntry[];
  language: Language;
  onSave: (entry: TimeEntry, newProject?: Project) => void;
  onExit: () => void;
  onUpdateEntries: (entries: TimeEntry[]) => void;
}

type WorkerStep = 'SCAN' | 'CONFIRMATION' | 'WELDING_SELECTION' | 'UNIT_SELECTION' | 'JOB_RECORDED';

const WorkerUI: React.FC<Props> = ({ 
  employee, 
  projects, 
  employees, 
  entries, 
  language,
  onSave, 
  onExit, 
  onUpdateEntries 
}) => {
  const t = translations[language];

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [inProgressEntry, setInProgressEntry] = useState<TimeEntry | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  
  // Multi-step worker workflow state
  const [step, setStep] = useState<WorkerStep>('SCAN');
  const [selectedWeldingType, setSelectedWeldingType] = useState<string>('');
  const [pendingSaveData, setPendingSaveData] = useState<{ entry: TimeEntry; project?: Project } | null>(null);
  const [manualPage, setManualPage] = useState<1 | 2>(1);
  const [selectedUnitNumber, setSelectedUnitNumber] = useState<string>('');

  // Clear selectedUnitNumber when step changes
  useEffect(() => {
    if (step !== 'UNIT_SELECTION') {
      setSelectedUnitNumber('');
    }
  }, [step]);

  // State for End-Of-Day prompt
  const [showDailyReportPrompt, setShowDailyReportPrompt] = useState(false);
  const [remarks, setRemarks] = useState('');

  // Manual Input State
  const [manualInput, setManualInput] = useState<string>('');

  // When component mounts, find if this user has an active session
  useEffect(() => {
    const active = entries.find(e => e.employeeId === employee.id && !e.endTime);
    if (active) {
      setInProgressEntry(active);
      const proj = projects.find(p => p.id === active.projectId) || { id: active.projectId, name: active.projectId };
      if (proj) {
        setSelectedProject(proj);
        setShowPrompt(true); 
      }
    }
  }, [entries, employee.id, projects]);

  const handleStart = (weldingType: string, unitNumber?: string) => {
    if (!selectedProject || inProgressEntry || isSaving) return;
    
    setIsSaving(true);
    const now = new Date();
    
    const newEntry: TimeEntry = {
      id: Math.random().toString(36).substr(2, 9),
      employeeId: employee.id,
      projectId: selectedProject.id,
      startTime: now.toISOString(),
      date: now.toISOString().split('T')[0],
      weldingType: weldingType,
      unitNumber: unitNumber
    };
    
    const isNew = !projects.some(p => p.id === selectedProject.id);
    setPendingSaveData({
      entry: newEntry,
      project: isNew ? selectedProject : undefined
    });
    setIsSaving(false);
    setStep('JOB_RECORDED');
  };

  const handleConfirmSave = () => {
    if (pendingSaveData) {
      onSave(pendingSaveData.entry, pendingSaveData.project);
      setPendingSaveData(null);
    }
    setSelectedWeldingType('');
    setStep('SCAN');
  };

  const handleEnd = () => {
    if (!inProgressEntry || isSaving) return;

    setIsSaving(true);
    const now = new Date();
    
    const updatedEntries = entries.map(e => 
        e.id === inProgressEntry.id ? { ...e, endTime: now.toISOString(), remarks: remarks.trim() || undefined } : e
    );
    
    onUpdateEntries(updatedEntries);
    setIsSaving(false);
    setRemarks('');
    setInProgressEntry(null); 
    setShowDailyReportPrompt(true);
  };

  const handleClear = () => {
    if (inProgressEntry) return;
    setSelectedProject(null);
    setManualInput('');
    setStep('SCAN');
  };

  const exportDailyExcel = () => {
    const today = new Date().toISOString().split('T')[0];
    let currentEntries = [...entries];
    
    if (inProgressEntry) {
        const now = new Date();
         currentEntries = currentEntries.map(e => 
            e.id === inProgressEntry.id ? { ...e, endTime: now.toISOString(), remarks: remarks.trim() || undefined } : e
        );
    }
    
    const todayEntries = currentEntries.filter(e => e.date === today);

    DB.exportToExcel(todayEntries, 'today');
    
    setTimeout(onExit, 500);
  };

  // Helper to resolve drawing descriptions
  const getDrawingDescription = (code: string) => {
    const clean = code.toUpperCase();
    if (clean.includes('P905-01-01-000B') || clean.includes('P905')) {
      return t.descEndCarriage;
    }
    if (clean.includes('P910')) {
      return t.descHeavyBase;
    }
    if (clean.includes('P878')) {
      return t.descHydraulicArm;
    }
    if (clean.includes('PART-104')) {
      return t.descOutrigger;
    }
    return t.descStructural;
  };

  return (
    <div className="max-w-3xl mx-auto animate-in slide-in-from-bottom-4 duration-500 pb-12">

      {/* End of Day Prompt */}
      {showDailyReportPrompt && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-300 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#5B51D8] to-[#11335D]"></div>
                <div className="w-20 h-20 bg-indigo-50 text-[#5B51D8] rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <CheckCircle2 size={40} className="text-[#5B51D8]" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">{t.allTasksCompleted}</h3>
                <p className="text-slate-500 text-sm mb-8 font-medium leading-relaxed">
                    {t.jobEndedDesc}
                </p>
                <div className="space-y-3">
                    <button 
                        onClick={onExit}
                        className="w-full py-4 bg-[#5B51D8] hover:bg-[#483ec7] text-white rounded-xl font-black text-lg transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-2 active:scale-95"
                    >
                        {t.thankYou}
                    </button>
                </div>
           </div>
        </div>
      )}

      {/* Session Prompt Modal */}
      {showPrompt && inProgressEntry && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl border border-amber-100 animate-in zoom-in-95 duration-300 text-center">
             <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
               <Timer size={48} className="animate-pulse" />
             </div>
             <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">{t.ongoingJobTitle}</h3>
             <p className="text-slate-500 text-sm mb-8 leading-relaxed">
               {t.ongoingJobDesc.replace('{project}', selectedProject?.name || '')}
             </p>
             <button 
               onClick={() => setShowPrompt(false)}
               className="w-full py-5 bg-[#5B51D8] text-white rounded-2xl font-black text-lg hover:bg-[#483ec7] transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-2"
             >
               {t.ok} <CheckCircle2 size={24} />
             </button>
          </div>
        </div>
      )}

      {/* Primary Container */}
      <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100">
        
         {/* Worker Header Card - Consistent on top */}
        <div className="bg-[#5B51D8] px-4 py-6 sm:px-8 sm:py-10 text-white relative">
          <div className="flex justify-between items-start gap-4">
            <div className="min-w-0">
              <p className="text-indigo-200 text-[10px] font-black uppercase tracking-[0.2em] mb-1">{t.workerTerminal}</p>
              <h2 className="text-2xl sm:text-4xl font-black tracking-tight uppercase truncate">{employee.name}</h2>
              <p className="text-indigo-200 mt-1.5 text-[11px] sm:text-xs font-bold opacity-90 truncate">
                {t.empId}: {employee.id} &bull; {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
            <button className="w-10 h-10 sm:w-14 sm:h-14 bg-white/10 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all hover:bg-white/20 shrink-0">
              <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-white/80" />
            </button>
          </div>

          {inProgressEntry && (
             <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 bg-amber-400 text-amber-950 rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-amber-300 shadow-xl animate-in slide-in-from-left-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="shrink-0 w-6 h-6 sm:w-8 sm:h-8 animate-bounce" />
                  <div className="min-w-0">
                    <p className="font-black text-[9px] uppercase tracking-widest opacity-70">{t.activeSession}</p>
                    <div className="text-lg sm:text-xl font-black tracking-tight uppercase leading-tight truncate">
                      {selectedProject?.name}
                    </div>
                  </div>
                </div>
                <div className="flex-grow">
                  {inProgressEntry.weldingType && (
                    <div className="text-[11px] sm:text-xs font-black bg-amber-500/20 px-2 py-0.5 rounded w-fit border border-amber-500/30">
                      {t.weldingType}: {inProgressEntry.weldingType} {inProgressEntry.unitNumber && `(Unit #${inProgressEntry.unitNumber})`}
                    </div>
                  )}
                </div>
                <div className="flex justify-between sm:block border-t border-amber-500/20 pt-2 sm:pt-0 sm:border-t-0 text-right shrink-0">
                  <span className="text-[9px] uppercase font-black opacity-50 sm:hidden self-center">{t.startedAt}</span>
                  <div>
                    <p className="text-[9px] uppercase font-black opacity-50 hidden sm:block">{t.startedAt}</p>
                    <p className="font-mono font-black text-sm sm:text-lg">
                      {new Date(inProgressEntry.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
             </div>
          )}
        </div>

        {/* ------------------- STEP 1: CLICKABLE TRAILER PARTS MANUAL ------------------- */}
        {step === 'SCAN' && !inProgressEntry && (
          <div className="p-4 sm:p-8">
            {/* Title exactly matching design intent */}
            <div className="text-center mb-6 sm:mb-8">
              <h3 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight mb-1 uppercase">
                {t.selectTrailerPart}
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 font-bold uppercase tracking-wider">
                {t.clickPartHint}
              </p>
            </div>

            {/* Page 1 / Page 2 Tabs */}
            <div className="flex justify-center gap-2 sm:gap-3 mb-6 sm:mb-8">
              <button
                type="button"
                onClick={() => setManualPage(1)}
                className={`px-4 py-2.5 sm:px-8 sm:py-3.5 rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-wider sm:tracking-widest transition-all duration-300 border-2 ${
                  manualPage === 1
                    ? 'bg-[#11335D] text-white border-[#11335D] shadow-lg shadow-blue-100'
                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {t.trailerPage1}
              </button>
              <button
                type="button"
                onClick={() => setManualPage(2)}
                className={`px-4 py-2.5 sm:px-8 sm:py-3.5 rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-wider sm:tracking-widest transition-all duration-300 border-2 ${
                  manualPage === 2
                    ? 'bg-[#11335D] text-white border-[#11335D] shadow-lg shadow-blue-100'
                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {t.trailerPage2}
              </button>
            </div>

            {/* 3-Column Solid/Polished Grid of Parts */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6 mb-8 sm:mb-10">
              {TRAILER_PARTS.filter(p => p.page === manualPage).map((part) => (
                <div
                  key={part.id}
                  onClick={() => {
                    setSelectedProject({ id: part.id, name: part.name });
                    setStep('CONFIRMATION');
                    // Short high-pitched beep sound for click feedback
                    try {
                      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
                      const osc = context.createOscillator();
                      osc.type = "sine";
                      osc.frequency.setValueAtTime(800, context.currentTime);
                      osc.connect(context.destination);
                      osc.start();
                      osc.stop(context.currentTime + 0.12);
                    } catch (e) {
                      console.log("Audio feedback failed:", e);
                    }
                  }}
                  className="bg-white border-2 border-slate-200/80 hover:border-[#11335D] rounded-2xl sm:rounded-3xl overflow-hidden cursor-pointer hover:shadow-2xl transition-all duration-300 flex flex-col group active:scale-[0.98] h-40 sm:h-64"
                >
                  <div className="flex-grow p-2 sm:p-4 bg-slate-50/50 flex items-center justify-center border-b border-slate-100 group-hover:bg-white transition-colors">
                    <div className="w-full h-full max-h-24 sm:max-h-36 flex items-center justify-center group-hover:scale-105 transition-all duration-300">
                      <img 
                        src={part.imageUrl} 
                        alt={part.id} 
                        referrerPolicy="no-referrer"
                        className="max-w-full max-h-24 sm:max-h-36 object-contain"
                      />
                    </div>
                  </div>
                  <div className="p-2 sm:p-4 text-center bg-white flex flex-col justify-center shrink-0">
                    <span className="text-[11px] sm:text-sm font-black text-[#11335D] tracking-wide uppercase truncate">
                      {part.id}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Compact Manual Fallback Box */}
            <div className="mb-6 sm:mb-10 max-w-sm mx-auto bg-slate-50 border border-slate-200/60 rounded-2xl sm:rounded-3xl p-4 sm:p-5">
              <label className="block text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 sm:mb-2">
                {t.orEnterManually}
              </label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="e.g. P905-01-01-000B"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  className="flex-grow px-3 py-2 bg-white border border-slate-200 rounded-lg sm:rounded-xl font-bold text-slate-700 placeholder-slate-400 outline-none text-[11px] sm:text-xs focus:border-[#5B51D8] transition-all uppercase"
                />
                <button
                  type="button"
                  onClick={() => {
                    const clean = manualInput.trim().toUpperCase();
                    if (clean) {
                      setSelectedProject({ id: clean, name: clean });
                      setStep('CONFIRMATION');
                    }
                  }}
                  className="bg-[#5B51D8] text-white px-4 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-black hover:bg-indigo-700 transition-all active:scale-95 uppercase tracking-wider"
                >
                  OK
                </button>
              </div>
            </div>

            {/* Logout button */}
            <div className="flex justify-center">
              <button
                type="button"
                onClick={onExit}
                className="flex items-center gap-2 px-6 py-3 bg-rose-50 text-rose-600 rounded-2xl font-black text-xs uppercase hover:bg-rose-100 transition-all"
              >
                <XCircle size={16} /> {t.logout}
              </button>
            </div>
          </div>
        )}

        {/* ------------------- STEP 2: DRAWING CONFIRMATION ------------------- */}
        {step === 'CONFIRMATION' && selectedProject && !inProgressEntry && (() => {
          const selectedPart = TRAILER_PARTS.find(p => p.id === selectedProject.id);
          const partDesc = selectedPart ? selectedPart.name : getDrawingDescription(selectedProject.id);
          return (
            <div className="p-0 flex flex-col items-center">
              {/* Top Back/Reset button bar */}
              <div className="w-full px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <button 
                  onClick={() => { setSelectedProject(null); setStep('SCAN'); }}
                  className="flex items-center gap-1.5 text-xs font-black text-slate-500 uppercase tracking-wider hover:text-slate-800 transition-all"
                >
                  <ArrowLeft size={16} /> {t.reScan}
                </button>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-200/50 px-2.5 py-1 rounded-md">
                  {t.step1of2}
                </span>
              </div>

              {/* Custom Card exactly matching the first attached mockup */}
              <div className="w-full bg-[#6F92FE] p-4 sm:p-8 text-white flex flex-col items-center">
                <span className="text-[11px] font-black tracking-[0.2em] text-blue-100 uppercase mb-1">
                  WF ENGINEERING
                </span>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-1 uppercase">
                  {selectedProject.id}
                </h2>
                {partDesc && (
                  <p className="text-xs sm:text-sm text-blue-100 font-semibold mb-6 sm:mb-8 text-center px-4">
                    {partDesc}
                  </p>
                )}
                {!partDesc && <div className="mb-6 sm:mb-8" />}

                {/* Captured Thumbnail Card displaying the captured image & part number */}
                <div className="w-full max-w-md bg-white rounded-3xl p-4 sm:p-6 flex flex-col items-center justify-center shadow-xl mb-6 sm:mb-8">
                  <div className="w-full max-w-[340px] aspect-[4/3] bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center justify-center">
                    {selectedPart ? (
                      <img 
                        src={selectedPart.imageUrl} 
                        alt={selectedPart.id} 
                        referrerPolicy="no-referrer"
                        className="max-w-full max-h-48 sm:max-h-56 object-contain"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-300">
                        <FileText size={48} className="text-slate-400 mb-2" />
                        <span className="text-[10px] font-black uppercase text-slate-400">
                          {language === 'zh' ? '自定义图纸' : 'Custom Drawing'}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="text-center mt-4">
                    <span className="text-[10px] font-black text-[#11335D] tracking-widest uppercase block mb-1">
                      {t.capturedPartNumber}
                    </span>
                    <span className="text-sm sm:text-base font-black text-slate-800 uppercase block">
                      {selectedProject.id}
                    </span>
                    {partDesc && (
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-tight block mt-0.5">
                        {partDesc}
                      </span>
                    )}
                  </div>
                </div>

                {/* Prominent Next Action button */}
                <button 
                  onClick={() => setStep('WELDING_SELECTION')}
                  className="mt-6 sm:mt-8 px-6 py-3.5 sm:px-8 sm:py-4 bg-white text-[#5B51D8] hover:bg-slate-50 font-black rounded-2xl text-sm sm:text-base shadow-xl transition-all flex items-center gap-2 tracking-wide uppercase active:scale-95"
                >
                  {t.proceedToWelding} <ChevronRight size={20} />
                </button>
              </div>
            </div>
          );
        })()}

        {/* ------------------- STEP 3: WELDING SELECTION ------------------- */}
        {step === 'WELDING_SELECTION' && selectedProject && !inProgressEntry && (
          <div className="p-4 sm:p-10 w-full">
            {/* Top back button to confirmation screen */}
            <div className="mb-4 sm:mb-6">
              <button 
                onClick={() => setStep('CONFIRMATION')}
                className="flex items-center gap-1.5 text-xs font-black text-slate-400 uppercase tracking-wider hover:text-slate-600 transition-all"
              >
                <ArrowLeft size={16} /> {t.backToPdf}
              </button>
            </div>

            {/* Drawing Number in Red-Border Block exactly matching image */}
            <div className="flex justify-center mb-6 sm:mb-8">
              <div className="border-2 border-red-500 bg-red-50/10 px-4 py-2 sm:px-8 sm:py-3.5 rounded-none font-bold text-lg sm:text-2xl text-[#11335D] tracking-wider text-center uppercase shadow-sm">
                {t.drawing} : {selectedProject.id}
              </div>
            </div>

            {/* Title exact matching: "Select type of welding:" */}
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 mb-6 sm:mb-8 border-b-2 border-slate-800 pb-2 sm:pb-2.5 underline underline-offset-8 decoration-2">
              {t.selectWeldingType}
            </h3>
 
            {/* 6-grid welding menu matching second mockup image */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 mb-10">
              
              {/* CARD 1: WFP/WPS/2026/001 */}
              <div 
                onClick={() => { setSelectedWeldingType('WFP/WPS/2026/001'); setStep('UNIT_SELECTION'); }}
                className="bg-white border-2 border-slate-200/80 hover:border-[#11335D] rounded-2xl sm:rounded-3xl overflow-hidden cursor-pointer hover:shadow-2xl transition-all duration-300 flex flex-col group active:scale-[0.98]"
              >
                <div className="bg-[#11335D] text-white px-4 py-3 sm:px-6 sm:py-4 flex flex-col gap-0.5">
                  <span className="text-[10px] sm:text-xs font-black tracking-wider text-slate-300">WFP/WPS/2026/001</span>
                  <span className="text-sm sm:text-lg font-black text-white">MIG - Butt Weld</span>
                </div>
                <div className="p-0 bg-[#F1F5F9] flex-grow flex flex-col items-center justify-center relative min-h-[140px] sm:min-h-[220px] overflow-hidden">
                  <img 
                    src={wps001Img} 
                    alt="WFP/WPS/2026/001: MIG - Butt Joint" 
                    className="w-full h-[140px] sm:h-[220px] object-contain group-hover:scale-[1.03] transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
 
              {/* CARD 2: WFP/WPS/2026/002A */}
              <div 
                onClick={() => { setSelectedWeldingType('WFP/WPS/2026/002A'); setStep('UNIT_SELECTION'); }}
                className="bg-white border-2 border-slate-200/80 hover:border-[#11335D] rounded-2xl sm:rounded-3xl overflow-hidden cursor-pointer hover:shadow-2xl transition-all duration-300 flex flex-col group active:scale-[0.98]"
              >
                <div className="bg-[#11335D] text-white px-4 py-3 sm:px-6 sm:py-4 flex flex-col gap-0.5">
                  <span className="text-[10px] sm:text-xs font-black tracking-wider text-slate-300">WFP/WPS/2026/002A</span>
                  <span className="text-sm sm:text-lg font-black text-white">MIG - Fillet Multipass</span>
                </div>
                <div className="p-0 bg-[#F1F5F9] flex-grow flex flex-col items-center justify-center relative min-h-[140px] sm:min-h-[220px] overflow-hidden">
                  <img 
                    src={wps002aImg} 
                    alt="WFP/WPS/2026/002A: MIG - Fillet Multipass" 
                    className="w-full h-[140px] sm:h-[220px] object-contain group-hover:scale-[1.03] transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
 
              {/* CARD 3: WFP/WPS/2026/002B */}
              <div 
                onClick={() => { setSelectedWeldingType('WFP/WPS/2026/002B'); setStep('UNIT_SELECTION'); }}
                className="bg-white border-2 border-slate-200/80 hover:border-[#11335D] rounded-2xl sm:rounded-3xl overflow-hidden cursor-pointer hover:shadow-2xl transition-all duration-300 flex flex-col group active:scale-[0.98]"
              >
                <div className="bg-[#11335D] text-white px-4 py-3 sm:px-6 sm:py-4 flex flex-col gap-0.5">
                  <span className="text-[10px] sm:text-xs font-black tracking-wider text-slate-300">WFP/WPS/2026/002B</span>
                  <span className="text-sm sm:text-lg font-black text-white">MIG - Fillet Singlepass</span>
                </div>
                <div className="p-0 bg-[#F1F5F9] flex-grow flex flex-col items-center justify-center relative min-h-[140px] sm:min-h-[220px] overflow-hidden">
                  <img 
                    src={wps002bImg} 
                    alt="WFP/WPS/2026/002B: MIG - Fillet Singlepass" 
                    className="w-full h-[140px] sm:h-[220px] object-contain group-hover:scale-[1.03] transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
 
              {/* CARD 4: WFP/WPS/2026/003 */}
              <div 
                onClick={() => { setSelectedWeldingType('WFP/WPS/2026/003'); setStep('UNIT_SELECTION'); }}
                className="bg-white border-2 border-slate-200/80 hover:border-[#11335D] rounded-2xl sm:rounded-3xl overflow-hidden cursor-pointer hover:shadow-2xl transition-all duration-300 flex flex-col group active:scale-[0.98]"
              >
                <div className="bg-[#11335D] text-white px-4 py-3 sm:px-6 sm:py-4 flex flex-col gap-0.5">
                  <span className="text-[10px] sm:text-xs font-black tracking-wider text-slate-300">WFP/WPS/2026/003</span>
                  <span className="text-sm sm:text-lg font-black text-white">MIG - Partial Penetration</span>
                </div>
                <div className="p-0 bg-[#F1F5F9] flex-grow flex flex-col items-center justify-center relative min-h-[140px] sm:min-h-[220px] overflow-hidden">
                  <img 
                    src={wps003Img} 
                    alt="WFP/WPS/2026/003: MIG - Partial Penetration" 
                    className="w-full h-[140px] sm:h-[220px] object-contain group-hover:scale-[1.03] transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
 
              {/* CARD 5: WFP/WPS/2026/004A */}
              <div 
                onClick={() => { setSelectedWeldingType('WFP/WPS/2026/004A'); setStep('UNIT_SELECTION'); }}
                className="bg-white border-2 border-slate-200/80 hover:border-[#11335D] rounded-2xl sm:rounded-3xl overflow-hidden cursor-pointer hover:shadow-2xl transition-all duration-300 flex flex-col group active:scale-[0.98]"
              >
                <div className="bg-[#11335D] text-white px-4 py-3 sm:px-6 sm:py-4 flex flex-col gap-0.5">
                  <span className="text-[10px] sm:text-xs font-black tracking-wider text-slate-300">WFP/WPS/2026/004A</span>
                  <span className="text-xs sm:text-lg font-black text-white truncate">TIG - Plate 30mm to bush Dia25</span>
                </div>
                <div className="p-0 bg-[#F1F5F9] flex-grow flex flex-col items-center justify-center relative min-h-[140px] sm:min-h-[220px] overflow-hidden">
                  <img 
                    src={wps004aImg} 
                    alt="WFP/WPS/2026/004A: TIG - Plate 30mm weld to bush Dia25" 
                    className="w-full h-[140px] sm:h-[220px] object-contain group-hover:scale-[1.03] transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
 
              {/* CARD 6: WFP/WPS/2026/004B */}
              <div 
                onClick={() => { setSelectedWeldingType('WFP/WPS/2026/004B'); setStep('UNIT_SELECTION'); }}
                className="bg-white border-2 border-slate-200/80 hover:border-[#11335D] rounded-2xl sm:rounded-3xl overflow-hidden cursor-pointer hover:shadow-2xl transition-all duration-300 flex flex-col group active:scale-[0.98]"
              >
                <div className="bg-[#11335D] text-white px-4 py-3 sm:px-6 sm:py-4 flex flex-col gap-0.5">
                  <span className="text-[10px] sm:text-xs font-black tracking-wider text-slate-300">WFP/WPS/2026/004B</span>
                  <span className="text-xs sm:text-lg font-black text-white truncate">TIG - Plate 3mm to bush Dia25</span>
                </div>
                <div className="p-0 bg-[#F1F5F9] flex-grow flex flex-col items-center justify-center relative min-h-[140px] sm:min-h-[220px] overflow-hidden">
                  <img 
                    src={wps004bImg} 
                    alt="WFP/WPS/2026/004B: TIG - Plate 3mm weld to bush Dia25" 
                    className="w-full h-[140px] sm:h-[220px] object-contain group-hover:scale-[1.03] transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
 
            </div>
          </div>
        )}

        {/* ------------------- STEP 4: UNIT SELECTION ------------------- */}
        {step === 'UNIT_SELECTION' && selectedProject && !inProgressEntry && (
          <div className="p-4 sm:p-10 flex flex-col items-center bg-white min-h-[500px] sm:min-h-[600px] w-full">
            {/* Top back button to welding selection screen */}
            <div className="mb-4 sm:mb-6 self-start">
              <button 
                onClick={() => setStep('WELDING_SELECTION')}
                className="flex items-center gap-1.5 text-xs font-black text-slate-400 uppercase tracking-wider hover:text-slate-600 transition-all"
              >
                <ArrowLeft size={16} /> {t.backToWelding}
              </button>
            </div>

            {/* Image 2 Style Tabular Layout */}
            <div className="w-full max-w-lg mx-auto flex flex-col gap-2 mb-6 sm:mb-10 text-sm sm:text-xl font-bold">
              {/* Row 1: Drawing */}
              <div className="flex flex-row items-stretch gap-1 sm:gap-4 w-full">
                <div className="bg-[#C4C4C4] text-black px-3 py-2 sm:px-6 sm:py-3 flex items-center w-[45%] sm:w-64 shrink-0 select-none">
                  <span className="underline underline-offset-2 sm:underline-offset-4 font-black truncate">{t.drawing} :</span>
                </div>
                <div className="bg-[#E3F2FD] text-slate-800 px-3 py-2 sm:px-6 sm:py-3 flex items-center flex-grow font-black tracking-wide text-sm sm:text-xl truncate">
                  {selectedProject.id || 'P905-01-01-000B'}
                </div>
              </div>

              {/* Row 2: Select Unit Number */}
              <div className="flex flex-row items-stretch gap-1 sm:gap-4 w-full">
                <div className="bg-[#C4C4C4] text-black px-3 py-2 sm:px-6 sm:py-3 flex items-center w-[45%] sm:w-64 shrink-0 select-none">
                  <span className="underline underline-offset-2 sm:underline-offset-4 font-black truncate">
                    {t.selectUnitNumber.endsWith(':') ? t.selectUnitNumber : t.selectUnitNumber + ':'}
                  </span>
                </div>
                <div className="bg-[#E3F2FD] text-blue-700 px-3 py-2 sm:px-6 sm:py-3 flex items-center flex-grow font-black text-base sm:text-2xl truncate">
                  {selectedUnitNumber}
                </div>
              </div>
            </div>

            {/* 3-column Unit Number Table Grid with solid black borders matching mockup exactly */}
            <div className="grid grid-cols-3 border-t border-l border-black bg-white w-full max-w-md mx-auto">
              {Array.from({ length: 20 }, (_, i) => i + 1).map((num) => {
                const isSelected = selectedUnitNumber === String(num);
                return (
                  <button
                    key={num}
                    type="button"
                    onClick={() => {
                      setSelectedUnitNumber(String(num));
                      // Play short click feedback sound
                      try {
                        const context = new (window.AudioContext || (window as any).webkitAudioContext)();
                        const osc = context.createOscillator();
                        osc.type = "sine";
                        osc.frequency.setValueAtTime(800, context.currentTime);
                        osc.connect(context.destination);
                        osc.start();
                        osc.stop(context.currentTime + 0.1);
                      } catch (e) {}
                    }}
                    className={`border-b border-r border-black font-extrabold text-lg sm:text-3xl py-3 sm:py-6 transition-all flex items-center justify-center cursor-pointer ${
                      isSelected
                        ? 'bg-blue-100 text-blue-700 font-black scale-[0.98]'
                        : 'bg-white text-red-600 hover:bg-slate-50 active:bg-slate-100'
                    }`}
                  >
                    {num}
                  </button>
                );
              })}
              {/* Empty cell to complete the grid layout exactly like mockup */}
              <div className="border-b border-r border-black py-3 sm:py-6 bg-white" />
            </div>

            {/* Start Job Button shown when a number is selected */}
            {selectedUnitNumber && (
              <button
                type="button"
                onClick={() => handleStart(selectedWeldingType, selectedUnitNumber)}
                className="mt-6 sm:mt-10 px-6 py-3.5 sm:px-10 sm:py-4 bg-[#11335D] hover:bg-indigo-950 text-white font-black rounded-2xl text-sm sm:text-lg shadow-xl shadow-blue-100 transition-all flex items-center gap-2 tracking-wide uppercase active:scale-95 animate-in fade-in slide-in-from-bottom-2 duration-300"
              >
                {t.startWeldingJob.replace('{unit}', selectedUnitNumber)} <ChevronRight size={22} />
              </button>
            )}
          </div>
        )}

        {/* ------------------- STEP 5: JOB RECORDED ------------------- */}
        {step === 'JOB_RECORDED' && (
          <div className="flex flex-col items-center justify-center py-20 px-6 bg-white select-none animate-in fade-in duration-300">
            {/* Outlined text style for JOB RECORDED */}
            <h2 className="text-5xl sm:text-6xl font-black text-transparent tracking-wide mb-14 text-center select-none uppercase"
                style={{ WebkitTextStroke: '2.5px #5B51D8', textShadow: '0 0 1px #5B51D8' }}>
              {t.jobRecorded}
            </h2>

            {/* Diamond WORK SAFE Sign */}
            <button 
              onClick={handleConfirmSave}
              className="relative w-64 h-64 bg-[#FFE800] border-[12px] border-black rounded-[2.5rem] flex items-center justify-center transform rotate-45 cursor-pointer shadow-2xl hover:shadow-indigo-100/50 hover:scale-105 active:scale-[0.98] transition-all duration-300 select-none overflow-hidden"
            >
              {/* Inner details to match real diamond safety sign */}
              <div className="transform -rotate-45 flex flex-col items-center justify-center text-black font-sans leading-none select-none">
                <span className="text-[44px] font-[950] tracking-wide leading-none uppercase mb-1">{t.work}</span>
                <span className="text-[44px] font-[950] tracking-wide leading-none uppercase">{t.safe}</span>
              </div>
            </button>
          </div>
        )}

        {/* ------------------- BOTTOM ACTIONS (RESET / END ACTIVE JOB) ------------------- */}
        {inProgressEntry && (
          <div className="p-10 border-t border-slate-100 bg-slate-50/50">
            <div className="text-center mb-6">
              <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest bg-amber-100/80 px-3 py-1.5 rounded-full border border-amber-200">
                {t.jobInProgress}: {selectedProject?.name}
              </span>
            </div>

            <div className="max-w-lg mx-auto mb-5 text-left bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
              <label className="block text-xs font-black text-slate-400 uppercase mb-2 tracking-widest">
                {t.jobRemarks}
              </label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder={t.remarksPlaceholder}
                rows={2}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:bg-white transition-all font-medium text-slate-700 text-sm placeholder:text-slate-300 resize-none"
              />
            </div>

            <div className="max-w-lg mx-auto">
              <button
                onClick={handleEnd}
                disabled={isSaving}
                className="w-full flex items-center justify-center gap-4 py-5 rounded-[1.8rem] font-black text-lg tracking-tight transition-all active:scale-[0.98] bg-amber-400 text-amber-950 hover:bg-amber-500 shadow-xl shadow-amber-100/50"
              >
                <Square size={22} fill="currentColor" />
                {t.endCurrentJob}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default WorkerUI;
