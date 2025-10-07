
import { Severity, KanbanStatus, type Alert, type Ticket, type Disconnector } from './types';

export const kpiData = {
    totalAssets: 10000,
    activeFaults: 871,
    transformers: 3000,
    gridHealth: 49.8,
};

export const alertsData: Alert[] = [
    { id: 'TR-0095', type: 'Voltage Sag', severity: Severity.Critical, timestamp: '2024-07-28 14:30:15' },
    { id: 'SUB-0012', type: 'Overload', severity: Severity.Critical, timestamp: '2024-07-28 14:25:02' },
    { id: 'FD-0341', type: 'Phase Imbalance', severity: Severity.High, timestamp: '2024-07-28 13:55:41' },
    { id: 'TR-0188', type: 'High Temperature', severity: Severity.High, timestamp: '2024-07-28 13:40:22' },
];

export const networkHealthData = [
    { name: 'Zone A', health: 65 },
    { name: 'Zone B', health: 80 },
    { name: 'Zone C', health: 45 },
    { name: 'Zone D', health: 72 },
    { name: 'Zone E', health: 58 },
];

export const ticketsData: Ticket[] = [
    { id: 'TKT-0082', title: 'Investigate Voltage Spike on TR-0136', assetId: 'TR-0136', assignedTo: 'Field Team A', created: '2h ago', status: KanbanStatus.ToDo },
    { id: 'TKT-0081', title: 'Transformer Oil Leak at SUB-0045', assetId: 'SUB-0045', assignedTo: 'Maintenance Crew', created: '5h ago', status: KanbanStatus.ToDo },
    { id: 'TKT-0079', title: 'Replace Faulty Insulator on LN-9912', assetId: 'LN-9912', assignedTo: 'Field Team C', created: '1d ago', status: KanbanStatus.InProgress },
    { id: 'TKT-0078', title: 'Calibrate Relay at SUB-0033', assetId: 'SUB-0033', assignedTo: 'John Doe', created: '2d ago', status: KanbanStatus.InProgress },
    { id: 'TKT-0075', title: 'Scheduled Maintenance on TR-0050', assetId: 'TR-0050', assignedTo: 'Field Team B', created: '5d ago', status: KanbanStatus.Done },
];

export const failureForecastData = Array.from({ length: 90 }, (_, i) => ({
    day: i + 1,
    probability: 20 + Math.sin(i / 10) * 10 + Math.random() * 5,
}));

export const highRiskAssetsData = [
    { id: 'TR-0542', risk: 'Critical', probability: 92.5 },
    { id: 'TR-0811', risk: 'Critical', probability: 89.1 },
    { id: 'SUB-0019', risk: 'High', probability: 85.4 },
    { id: 'FD-1102', risk: 'High', probability: 82.0 },
];

export const preventiveActionsData = [
    "Replace aging transformer coils on TR-0542.",
    "Perform dielectric fluid analysis for TR-0811.",
    "Reinforce insulation on feeder line FD-1102.",
];

export const disconnectorData: Disconnector[] = [
    { id: 'DIS-A01', assetId: 'TR-0015', status: 'Connected', lastChanged: '2024-07-28 10:00:00', operator: 'Auto' },
    { id: 'DIS-A02', assetId: 'TR-0015', status: 'Connected', lastChanged: '2024-07-28 10:00:00', operator: 'Auto' },
    { id: 'DIS-B01', assetId: 'SUB-0004', status: 'Disconnected', lastChanged: '2024-07-27 22:15:30', operator: 'Grid Operator' },
    { id: 'DIS-C01', assetId: 'FD-0089', status: 'Connected', lastChanged: '2024-07-28 09:45:10', operator: 'Auto' },
];

// GeoJSON for Map View
export const networkGeoData = {
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "properties": { "id": "SUB-TVM", "type": "Substation", "status": "Healthy" },
            "geometry": { "type": "Point", "coordinates": [76.9366, 8.5241] }
        },
        {
            "type": "Feature",
            "properties": { "id": "SUB-KOC", "type": "Substation", "status": "Warning" },
            "geometry": { "type": "Point", "coordinates": [76.2673, 9.9312] }
        },
        {
            "type": "Feature",
            "properties": { "id": "TVM-LT-001", "type": "LT Line", "status": "Critical" },
            "geometry": { "type": "LineString", "coordinates": [[76.9366, 8.5241], [76.9525, 8.5140]] }
        },
        {
            "type": "Feature",
            "properties": { "id": "KOC-LT-002", "type": "LT Line", "status": "Warning" },
            "geometry": { "type": "LineString", "coordinates": [[76.2673, 9.9312], [76.2750, 9.9400]] }
        },
        {
            "type": "Feature",
            "properties": { "id": "TVM-KOC-HT-01", "type": "HT Line", "status": "Healthy" },
            "geometry": { "type": "LineString", "coordinates": [[76.9366, 8.5241], [76.2673, 9.9312]] }
        }
    ]
};
