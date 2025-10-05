// src/types/logTypes.ts


export interface LogEntry {
    id: string;
    action: string;
    message: string;
    content: string | null;
    timestamp: number; // Unix timestamp from chrono
}

export interface LogFilters {
    actions: string[];
    dateRange?: {
        start: number;
        end: number;
    };
    searchQuery?: string;
}
