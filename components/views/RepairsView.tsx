import React, { useState, useEffect } from 'react';
import { supabase } from '../../App';
import { KanbanStatus, type Ticket } from '../../types';

// Helper to format timestamps into human-readable relative time
const formatRelativeTime = (timestamp: string): string => {
    const now = new Date();
    const alertTime = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - alertTime.getTime()) / 1000);

    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

    if (diffInSeconds < 60) {
        return rtf.format(-diffInSeconds, 'second');
    }
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
        return rtf.format(-diffInMinutes, 'minute');
    }
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
        return rtf.format(-diffInHours, 'hour');
    }
    const diffInDays = Math.floor(diffInHours / 24);
    return rtf.format(-diffInDays, 'day');
};


const TicketCard: React.FC<{ 
    ticket: Ticket;
    isUpdated: boolean;
    isOperator: boolean;
    onDragStart: (e: React.DragEvent<HTMLDivElement>, ticketId: string) => void;
}> = ({ ticket, isUpdated, isOperator, onDragStart }) => (
    <div 
        draggable={isOperator}
        onDragStart={(e) => onDragStart(e, ticket.id)}
        className={`bg-gray-700 p-4 rounded-lg shadow-md mb-4 transition-transform ${isUpdated ? 'ticket-update-flash' : ''} ${isOperator ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
    >
        <h4 className="font-bold text-white mb-2">{ticket.title}</h4>
        <div className="text-xs text-gray-400 space-y-1">
            <p><span className="font-semibold">Ticket:</span> {ticket.id}</p>
            <p><span className="font-semibold">Asset:</span> {ticket.assetId}</p>
            <p><span className="font-semibold">Assigned:</span> {ticket.assignedTo}</p>
            <p><span className="font-semibold">Created:</span> {formatRelativeTime(ticket.created)}</p>
        </div>
    </div>
);

const KanbanColumn: React.FC<{ 
    title: KanbanStatus; 
    tickets: Ticket[];
    updatedTicketId: string | null;
    isOperator: boolean;
    onDragStart: (e: React.DragEvent<HTMLDivElement>, ticketId: string) => void;
    onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
    onDrop: (e: React.DragEvent<HTMLDivElement>, status: KanbanStatus) => void;
}> = ({ title, tickets, updatedTicketId, isOperator, onDragStart, onDragOver, onDrop }) => (
    <div 
        onDragOver={onDragOver}
        onDrop={(e) => onDrop(e, title)}
        className="bg-gray-800 rounded-lg p-4 flex-1"
    >
        <h3 className="text-lg font-semibold text-white mb-4 flex justify-between">
            <span>{title}</span>
            <span className="bg-gray-600 text-gray-200 text-sm font-bold px-2 py-1 rounded-full">{tickets.length}</span>
        </h3>
        <div className="min-h-[100px]">
            {tickets.map(ticket => <TicketCard key={ticket.id} ticket={ticket} onDragStart={onDragStart} isUpdated={ticket.id === updatedTicketId} isOperator={isOperator} />)}
        </div>
    </div>
);

const ConfirmationModal: React.FC<{
    ticket: Ticket;
    onConfirm: () => void;
    onCancel: () => void;
}> = ({ ticket, onConfirm, onCancel }) => (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50" aria-modal="true" role="dialog">
        <div className="bg-gray-800 p-8 rounded-lg shadow-xl max-w-md w-full">
            <h2 className="text-xl font-bold text-white">Confirm Completion</h2>
            <p className="text-gray-300 mt-4">
                Are you sure you want to mark ticket <strong className="text-white">{ticket.id}</strong> ("{ticket.title}") as complete?
            </p>
            <div className="mt-6 flex justify-end space-x-4">
                <button
                    onClick={onCancel}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
                >
                    Cancel
                </button>
                <button
                    onClick={onConfirm}
                    className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                    Confirm
                </button>
            </div>
        </div>
    </div>
);

const RepairsView: React.FC<{ userRole: string | null }> = ({ userRole }) => {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [ticketToConfirm, setTicketToConfirm] = useState<Ticket | null>(null);
    const [updatedTicketId, setUpdatedTicketId] = useState<string | null>(null);
    const isOperator = userRole === 'operator';

    useEffect(() => {
        const fetchTickets = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('tickets')
                .select('*')
                .order('created', { ascending: false });

            if (error) {
                console.error("Supabase error fetching tickets:", error.message);
                setError(`Failed to fetch tickets: ${error.message}`);
            } else {
                setTickets(data);
            }
            setLoading(false);
        };

        fetchTickets();
    }, []);

    useEffect(() => {
        const channel = supabase.channel('realtime-tickets')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'tickets' },
                (payload) => {
                    console.log('Ticket change received!', payload);
                    if (payload.eventType === 'INSERT') {
                        const newTicket = payload.new as Ticket;
                        setTickets(currentTickets => [newTicket, ...currentTickets]);
                        setUpdatedTicketId(newTicket.id);
                        setTimeout(() => setUpdatedTicketId(null), 1500);
                    } else if (payload.eventType === 'UPDATE') {
                        const updatedTicket = payload.new as Ticket;
                        setTickets(currentTickets =>
                            currentTickets.map(ticket =>
                                ticket.id === updatedTicket.id ? updatedTicket : ticket
                            )
                        );
                        setUpdatedTicketId(updatedTicket.id);
                        setTimeout(() => setUpdatedTicketId(null), 1500);
                    } else if (payload.eventType === 'DELETE') {
                         setTickets(currentTickets =>
                            currentTickets.filter(ticket => ticket.id !== (payload.old as any).id)
                        );
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, ticketId: string) => {
        if (!isOperator) return;
        e.dataTransfer.setData("ticketId", ticketId);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        if (!isOperator) return;
        e.preventDefault();
    };

    const updateTicketStatus = async (ticketId: string, newStatus: KanbanStatus) => {
        const { error } = await supabase
            .from('tickets')
            .update({ status: newStatus })
            .eq('id', ticketId);
        
        if (error) {
            console.error("Error updating ticket status:", error.message);
            // In a real app, you might want to show an error notification here.
        }
        // No need to update local state; the real-time subscription handles it.
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetStatus: KanbanStatus) => {
        if (!isOperator) return;
        e.preventDefault();
        const ticketId = e.dataTransfer.getData("ticketId");
        const draggedTicket = tickets.find(t => t.id === ticketId);

        if (draggedTicket && draggedTicket.status !== targetStatus) {
            if (targetStatus === KanbanStatus.Done) {
                setTicketToConfirm(draggedTicket);
            } else {
                updateTicketStatus(ticketId, targetStatus);
            }
        }
    };
    
    const handleConfirmDone = () => {
        if (ticketToConfirm) {
            updateTicketStatus(ticketToConfirm.id, KanbanStatus.Done);
            setTicketToConfirm(null);
        }
    };
    
    const handleCancelDone = () => {
        setTicketToConfirm(null);
    };
    
    if (loading) {
        return <div className="text-center p-8 text-gray-300">Loading Tickets...</div>;
    }

    if (error) {
        return <div className="text-center p-8 text-red-400 bg-red-900/20 rounded-lg">{error}</div>;
    }

    const toDoTickets = tickets.filter(t => t.status === KanbanStatus.ToDo);
    const inProgressTickets = tickets.filter(t => t.status === KanbanStatus.InProgress);
    const doneTickets = tickets.filter(t => t.status === KanbanStatus.Done);

    return (
        <>
            <div className="flex flex-col md:flex-row gap-6 h-full">
                <KanbanColumn 
                    title={KanbanStatus.ToDo} 
                    tickets={toDoTickets}
                    updatedTicketId={updatedTicketId}
                    isOperator={isOperator}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                />
                <KanbanColumn 
                    title={KanbanStatus.InProgress} 
                    tickets={inProgressTickets}
                    updatedTicketId={updatedTicketId}
                    isOperator={isOperator}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                />
                <KanbanColumn 
                    title={KanbanStatus.Done} 
                    tickets={doneTickets}
                    updatedTicketId={updatedTicketId}
                    isOperator={isOperator}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                />
            </div>
            {ticketToConfirm && (
                <ConfirmationModal 
                    ticket={ticketToConfirm}
                    onConfirm={handleConfirmDone}
                    onCancel={handleCancelDone}
                />
            )}
        </>
    );
};

export default RepairsView;