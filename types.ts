
export enum View {
  Dashboard = 'Dashboard',
  Repairs = 'Repairs & Tickets',
  Analytics = 'Predictive Analytics',
  Control = 'Control Center',
  Map = 'Satellite 3D Map',
}

export enum Severity {
  Critical = 'Critical',
  High = 'High',
  Medium = 'Medium',
  Low = 'Low',
}

export interface Alert {
  id: string;
  type: string;
  severity: Severity;
  timestamp: string;
}

export enum KanbanStatus {
  ToDo = 'To Do',
  InProgress = 'In Progress',
  Done = 'Done',
}

export interface Ticket {
  id: string;
  title: string;
  assetId: string;
  assignedTo: string;
  created: string;
  status: KanbanStatus;
}

export interface Disconnector {
    id: string;
    assetId: string;
    status: 'Connected' | 'Disconnected';
    lastChanged: string;
    operator: string;
}
