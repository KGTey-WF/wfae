
export interface Employee {
  id: string;
  name: string;
}

export interface Project {
  id: string;
  name: string;
}

export interface TimeEntry {
  id: string;
  employeeId: string;
  projectId: string;
  startTime: string; // ISO string
  endTime?: string;  // ISO string
  date: string;      // YYYY-MM-DD
  weldingType?: string; // e.g. WFP/WPS/2026/001
  unitNumber?: string; // e.g. "1", "2"
  remarks?: string;    // e.g. notes or comments
}

export type View = 'FRONT' | 'WORKER' | 'ADMIN' | 'REPORT';

export interface AppState {
  employees: Employee[];
  projects: Project[];
  entries: TimeEntry[];
}
