// /src/electron-api.d.ts

/**
 * Extends the global Window interface to include definitions for the Electron APIs
 * exposed via the preload script. This provides a single source of truth for
 * TypeScript type checking across the entire Angular application.
 */
declare global {
  interface Window {
    electronAPI: {
      // --- MQTT Communication ---
      send: (channel: string, data?: any) => void;
      invoke: (channel: string, data?: any) => Promise<any>;
      on: (channel: string, func: (...args: any[]) => void) => () => void;

      // --- Credential Management ---
      loadCredentials: () => Promise<{
        hostname?: string;
        port?: number;
        protocol?: 'ws' | 'wss';
        tenant?: string;
      } | null>;
      saveCredentials: (credentials: any) => void;

      // --- Configuration Management ---
      'save-config': (config: { key: string, data: any }) => void;
      'load-config': (key: string) => Promise<any>;
    };
  }
}

// This empty export statement is crucial. It turns this file into a module,
// which is necessary for the global declaration to be recognized by TypeScript.
export {};
