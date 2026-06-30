
import { AppState, TimeEntry } from '../types';

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

// The Spreadsheet ID provided by the user
const SPREADSHEET_ID = '1mQ6WlFFSPrZdQZCr8OJSbwHxWhGbOw--Usv0VFEkIJU';

// SCOPES required for writing to sheets
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';

let tokenClient: any;
let gapiInited = false;
let gisInited = false;

export const GoogleSheetsService = {
  // Initialize the Google API Client
  init: (apiKey: string, clientId: string) => {
    return new Promise<void>((resolve) => {
      const gapiLoaded = () => {
        window.gapi.load('client', async () => {
          await window.gapi.client.init({
            apiKey: apiKey,
            discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
          });
          gapiInited = true;
          checkAuth();
        });
      };

      const gisLoaded = () => {
        tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: SCOPES,
          callback: '', // defined later
        });
        gisInited = true;
        checkAuth();
      };

      const checkAuth = () => {
        if (gapiInited && gisInited) resolve();
      };

      if (window.gapi) gapiLoaded();
      if (window.google) gisLoaded();
    });
  },

  // Trigger the Login Popup
  login: (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!tokenClient) return reject(new Error("Google API not initialized"));
      
      tokenClient.callback = async (resp: any) => {
        if (resp.error) {
          // resp contains error details (e.g. access_denied)
          // Ensure we create a clean Error object with a string message
          const msg = resp.error_description || resp.error || "Login Failed";
          reject(new Error(typeof msg === 'string' ? msg : JSON.stringify(msg)));
          return;
        }
        resolve();
      };

      // Request access token with prompt if needed
      tokenClient.requestAccessToken({ prompt: 'consent' });
    });
  },

  // Main function to Export Data
  exportData: async (state: AppState) => {
    if (!gapiInited) throw new Error("Google API not initialized");

    const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
    const todayEntries = state.entries.filter(e => e.date === today);

    if (todayEntries.length === 0) {
      console.warn("No entries to export for today.");
      return "No Data";
    }

    try {
      // 1. Check if Sheet (Tab) with today's date exists
      const meta = await window.gapi.client.sheets.spreadsheets.get({
        spreadsheetId: SPREADSHEET_ID
      });

      const sheets = meta.result.sheets;
      let sheetId: number | null = null;
      const sheetExists = sheets?.some((s: any) => {
        if (s.properties.title === today) {
          sheetId = s.properties.sheetId;
          return true;
        }
        return false;
      });

      // 2. If not exists, create the tab
      if (!sheetExists) {
        await window.gapi.client.sheets.spreadsheets.batchUpdate({
          spreadsheetId: SPREADSHEET_ID,
          resource: {
            requests: [
              {
                addSheet: {
                  properties: { title: today }
                }
              }
            ]
          }
        });

        // Add Headers to the new sheet
        await window.gapi.client.sheets.spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_ID,
          range: `${today}!A1`,
          valueInputOption: 'RAW',
          resource: {
            values: [['Employee ID', 'Name', 'Project Code', 'Project Name', 'Start Time', 'End Time', 'Duration']]
          }
        });
      }

      // 3. Prepare Data Rows
      const rows = todayEntries.map(e => {
        const emp = state.employees.find(emp => emp.id === e.employeeId);
        const proj = state.projects.find(p => p.id === e.projectId);
        
        // Calculate duration
        let duration = 'In Progress';
        if (e.endTime) {
          const diff = new Date(e.endTime).getTime() - new Date(e.startTime).getTime();
          const hrs = Math.floor(diff / 3600000);
          const mins = Math.floor((diff % 3600000) / 60000);
          duration = `${hrs}h ${mins}m`;
        }

        return [
          e.employeeId,
          emp?.name || 'Unknown',
          e.projectId,
          proj?.name || 'Unknown',
          new Date(e.startTime).toLocaleTimeString(),
          e.endTime ? new Date(e.endTime).toLocaleTimeString() : '',
          duration
        ];
      });

      // 4. Append Data (Using Append ensures we don't overwrite if multiple exports happen)
      await window.gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${today}!A2`, // Append after headers
        valueInputOption: 'USER_ENTERED',
        resource: { values: rows }
      });

      return "Success";

    } catch (error: any) {
      console.error("Google Sheets API Error", error);
      
      // Robust error message extraction
      let errorMessage = "Export Failed";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error?.result?.error?.message) {
        errorMessage = error.result.error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object') {
        // Prevent [object Object] by stringifying unknown objects
        try {
          errorMessage = JSON.stringify(error.result?.error || error);
        } catch {
          errorMessage = "Unknown Error Object";
        }
      }

      throw new Error(errorMessage);
    }
  }
};
