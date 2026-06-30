
import React, { useState } from 'react';
import { Employee, AppState } from '../types';
import { Search, UserCircle2, HelpCircle, ChevronDown, ChevronUp, BookOpen } from 'lucide-react';
import { Language, translations } from '../src/data/translations';

interface Props {
  state: AppState;
  onSelect: (emp: Employee) => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

const FrontUI: React.FC<Props> = ({ state, onSelect, language, onLanguageChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showInstructions, setShowInstructions] = useState(true);

  const t = translations[language];

  const filteredEmployees = state.employees.filter(emp => 
    emp.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-12 flex flex-col items-center justify-center text-center w-full gap-2 relative">
        {/* Sleek Language Switcher */}
        <div className="flex gap-1.5 mb-4 p-1 bg-slate-50 border border-slate-100 rounded-2xl shadow-sm">
          <button
            type="button"
            onClick={() => onLanguageChange('en')}
            className={`px-5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${
              language === 'en'
                ? 'bg-[#11335D] text-white shadow-md'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            English
          </button>
          <button
            type="button"
            onClick={() => onLanguageChange('zh')}
            className={`px-5 py-1.5 rounded-xl text-xs font-black tracking-wider transition-all duration-300 ${
              language === 'zh'
                ? 'bg-[#11335D] text-white shadow-md'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            中文
          </button>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight px-2">
          {t.title}
        </h1>
        <p className="text-slate-500 font-medium italic text-sm sm:text-xl px-4 mt-1">
          {t.welcome}
        </p>
      </div>

      <div className="relative mb-10 max-w-2xl mx-auto">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-slate-400" />
        </div>
        <input
          type="text"
          placeholder={t.searchPlaceholder}
          className="block w-full pl-12 pr-4 py-5 border-2 border-slate-100 rounded-3xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 text-lg font-bold shadow-sm transition-all"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredEmployees.map((emp) => {
          const activeSession = state.entries.find(e => e.employeeId === emp.id && !e.endTime);
          return (
            <button
              key={emp.id}
              onClick={() => onSelect(emp)}
              className={`flex items-center gap-5 p-6 bg-white rounded-[2rem] border-2 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all text-left group relative overflow-hidden ${
                activeSession ? 'border-emerald-200 ring-4 ring-emerald-50/30' : 'border-slate-50'
              }`}
            >
              <div className={`absolute top-0 right-0 w-16 h-16 rounded-bl-[3rem] -mr-4 -mt-4 transition-colors ${
                activeSession ? 'bg-emerald-50/50 group-hover:bg-emerald-100/50' : 'bg-slate-50/50 group-hover:bg-indigo-50/50'
              }`}></div>
              <div className={`flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center transition-all group-hover:rotate-6 ${
                activeSession 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-slate-50 text-slate-400 group-hover:bg-indigo-600 group-hover:text-white'
              }`}>
                <UserCircle2 className="w-9 h-9" />
              </div>
              <div className="flex-grow z-10 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em]">{t.staff} {emp.id}</span>
                  {activeSession && (
                    <span className="flex items-center gap-1 text-[9px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 uppercase tracking-widest animate-pulse shrink-0">
                      {t.active}
                    </span>
                  )}
                </div>
                <div className="text-xl font-black text-slate-800 tracking-tight leading-tight truncate">{emp.name}</div>
                
                {activeSession && (
                  <div className="mt-2.5 flex flex-col bg-slate-50 border border-slate-100 p-2 rounded-xl">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">
                      {t.ongoingPart}
                    </span>
                    <span className="text-xs font-black text-[#11335D] uppercase tracking-wide truncate mt-0.5">
                      {activeSession.projectId}
                    </span>
                  </div>
                )}
              </div>
            </button>
          );
        })}

        {filteredEmployees.length === 0 && (
          <div className="col-span-full py-20 text-center text-slate-400 bg-slate-50/50 rounded-[3rem] border-4 border-dashed border-slate-100">
            <div className="flex flex-col items-center gap-3">
              <Search size={48} className="text-slate-200" />
              <p className="font-black text-lg">{t.noStaffFound} "{searchTerm}"</p>
              <p className="text-xs uppercase tracking-widest font-bold">{t.checkIdTryAgain}</p>
            </div>
          </div>
        )}
      </div>

      {/* Collapsible User Instructions Section */}
      <div className="mt-12 max-w-4xl mx-auto bg-slate-50 border border-slate-200/60 rounded-[1.8rem] overflow-hidden transition-all duration-300">
        <button
          onClick={() => setShowInstructions(!showInstructions)}
          className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-100/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-black text-slate-800 tracking-tight text-sm sm:text-base">
                {t.instructionsTitle}
              </h4>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {t.instructionsSubtitle}
              </p>
            </div>
          </div>
          <div className="text-slate-400">
            {showInstructions ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </button>

        {showInstructions && (
          <div className="p-6 border-t border-slate-200/40 bg-white grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Step 1 */}
            <div className="p-4 rounded-2xl bg-slate-50/50 border border-slate-100 flex gap-3.5 items-start">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-black shrink-0">
                1
              </div>
              <div>
                <h5 className="font-extrabold text-slate-800 text-sm mb-1">{t.step1Title}</h5>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">{t.step1Desc}</p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-4 rounded-2xl bg-slate-50/50 border border-slate-100 flex gap-3.5 items-start">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-black shrink-0">
                2
              </div>
              <div>
                <h5 className="font-extrabold text-slate-800 text-sm mb-1">{t.step2Title}</h5>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">{t.step2Desc}</p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-4 rounded-2xl bg-slate-50/50 border border-slate-100 flex gap-3.5 items-start">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-black shrink-0">
                3
              </div>
              <div>
                <h5 className="font-extrabold text-slate-800 text-sm mb-1">{t.step3Title}</h5>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">{t.step3Desc}</p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="p-4 rounded-2xl bg-slate-50/50 border border-slate-100 flex gap-3.5 items-start">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-black shrink-0">
                4
              </div>
              <div>
                <h5 className="font-extrabold text-slate-800 text-sm mb-1">{t.step4Title}</h5>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">{t.step4Desc}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FrontUI;
