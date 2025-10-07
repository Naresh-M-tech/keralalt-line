
import React from 'react';
import { ticketsData } from '../../constants';
import { KanbanStatus, type Ticket } from '../../types';

const TicketCard: React.FC<{ ticket: Ticket }> = ({ ticket }) => (
    <div className="bg-gray-700 p-4 rounded-lg shadow-md mb-4 cursor-grab active:cursor-grabbing">
        <h4 className="font-bold text-white mb-2">{ticket.title}</h4>
        <div className="text-xs text-gray-400 space-y-1">
            <p><span className="font-semibold">Ticket:</span> {ticket.id}</p>
            <p><span className="font-semibold">Asset:</span> {ticket.assetId}</p>
            <p><span className="font-semibold">Assigned:</span> {ticket.assignedTo}</p>
            <p><span className="font-semibold">Created:</span> {ticket.created}</p>
        </div>
    </div>
);

const KanbanColumn: React.FC<{ title: KanbanStatus; tickets: Ticket[] }> = ({ title, tickets }) => (
    <div className="bg-gray-800 rounded-lg p-4 flex-1">
        <h3 className="text-lg font-semibold text-white mb-4 flex justify-between">
            <span>{title}</span>
            <span className="bg-gray-600 text-gray-200 text-sm font-bold px-2 py-1 rounded-full">{tickets.length}</span>
        </h3>
        <div>
            {tickets.map(ticket => <TicketCard key={ticket.id} ticket={ticket} />)}
        </div>
    </div>
);

const RepairsView: React.FC = () => {
    const toDoTickets = ticketsData.filter(t => t.status === KanbanStatus.ToDo);
    const inProgressTickets = ticketsData.filter(t => t.status === KanbanStatus.InProgress);
    const doneTickets = ticketsData.filter(t => t.status === KanbanStatus.Done);

    return (
        <div className="flex flex-col md:flex-row gap-6 h-full">
            <KanbanColumn title={KanbanStatus.ToDo} tickets={toDoTickets} />
            <KanbanColumn title={KanbanStatus.InProgress} tickets={inProgressTickets} />
            <KanbanColumn title={KanbanStatus.Done} tickets={doneTickets} />
        </div>
    );
};

export default RepairsView;
