
import { AppState, Employee, Project, TimeEntry } from '../types';

declare const XLSX: any;

const STORAGE_KEY = 'worktrack_pro_db_v1';

const DEFAULT_STAFF: Employee[] = [
  { id: '011', name: 'CHAI MIN LEONG' },
  { id: '012', name: 'CHEN FOOK TIEN' },
  { id: '032', name: 'KAN YEE SENG' },
  { id: '169', name: 'LIANG SHITAO' },
  { id: '234', name: 'HTET KO WIN' },
  { id: '320', name: 'CHEN JUAN WOEI' },
  { id: '413', name: 'WANG DONGFENG' },
  { id: '541', name: 'MUHAMMAD QAYYUM BIN ABD HAMID' },
  { id: '577', name: 'MUHAMMAD AZAMUDDIN BIN JASMIN' },
  { id: '583', name: 'LAN ZHANTU' }
];

const DEFAULT_PROJECTS: Project[] = [
  { id: 'P910', name: 'PSV' },
  { id: 'P878', name: 'Petra' }
];

export class DB {
  static save(state: AppState) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error("Database Save Error:", e);
    }
  }

  static load(): AppState {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        return {
          employees: Array.isArray(parsed.employees) && parsed.employees.length > 0 ? parsed.employees : DEFAULT_STAFF,
          projects: Array.isArray(parsed.projects) && parsed.projects.length > 0 ? parsed.projects : DEFAULT_PROJECTS,
          entries: Array.isArray(parsed.entries) ? parsed.entries : []
        };
      }
    } catch (e) {
      console.error("Database Load Error:", e);
    }
    return { 
      employees: DEFAULT_STAFF, 
      projects: DEFAULT_PROJECTS, 
      entries: [] 
    };
  }

  static export(state: AppState) {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `worktrack_db_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  static async import(file: File): Promise<AppState> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const parsed = JSON.parse(content);
          if (parsed.employees && parsed.projects && parsed.entries) {
            resolve(parsed);
          } else {
            reject(new Error("Invalid database format"));
          }
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error("File read error"));
      reader.readAsText(file);
    });
  }

  static exportToExcel(entries: TimeEntry[], mode: 'filtered' | 'today' | 'all' = 'all') {
    if (!entries || entries.length === 0) {
      alert("No entries to export.");
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    
    // Construct Array-of-Arrays (AOA) for exact layout in Image 3
    const aoaData: any[][] = [
      ["TRAILER WELDING RECORD"], // Row 1 (Title)
      [], // Row 2 (Blank spacing)
      ["Part number", "Staff ID", "WPS No.", "Unit #", "Date", "Start Time", "End Time", "Duration", "Remarks"] // Row 3 (Headers)
    ];

    // Sort entries newest first
    const sortedEntries = [...entries].sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

    sortedEntries.forEach(e => {
      const start = new Date(e.startTime);
      const end = e.endTime ? new Date(e.endTime) : null;
      
      // Calculate duration formatted as "Xh Ym"
      let durationStr = 'In Progress';
      if (end) {
        const diffMs = end.getTime() - start.getTime();
        const hrs = Math.floor(diffMs / (1000 * 60 * 60));
        const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        durationStr = `${hrs}h ${mins}m`;
      }

      aoaData.push([
        e.projectId,               // Part number
        e.employeeId,              // Staff ID
        e.weldingType || '---',    // WPS No.
        e.unitNumber || '---',     // Unit #
        e.date,                    // Date
        start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), // Start Time
        end ? end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'In Progress', // End Time
        durationStr,               // Duration
        e.remarks || ''            // Remarks
      ]);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(aoaData);

    // Set merges (Merge A1:I1)
    worksheet['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } }
    ];

    // Configure professional column widths for clarity in Excel
    worksheet['!cols'] = [
      { wch: 18 }, // Part number
      { wch: 12 }, // Staff ID
      { wch: 22 }, // WPS No.
      { wch: 10 }, // Unit #
      { wch: 14 }, // Date
      { wch: 15 }, // Start Time
      { wch: 15 }, // End Time
      { wch: 14 }, // Duration
      { wch: 25 }  // Remarks
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Welding Record");
    
    const fileName = mode === 'today' ? `WeldingRecord_Today_${today}.xlsx` : `WeldingRecord_${today}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  }

  static getStats() {
    const state = this.load();
    const raw = localStorage.getItem(STORAGE_KEY) || '';
    return {
      size: (raw.length / 1024).toFixed(2) + ' KB',
      recordCount: state.entries.length
    };
  }
}
