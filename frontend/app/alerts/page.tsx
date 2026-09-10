'use client';

import { mockAlerts, mockActionTickets } from '../../data/mockData';
import { Card } from '../../components/ui/Cards';
import { BellRing, Plus } from 'lucide-react';
import { useState } from 'react';

export default function AlertsPage() {
  const [activeTab, setActiveTab] = useState<'alerts' | 'tickets'>('alerts');

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-3">
          <BellRing className="text-mospi-500" size={28} />
          Early Warning & Actions
        </h1>
        <p className="text-text-secondary mt-1">Manage automated AI alerts and track preventive action tickets.</p>
      </div>

      <div className="flex gap-4 border-b border-border">
        <button 
          onClick={() => setActiveTab('alerts')}
          className={`py-3 px-4 font-medium text-sm transition-colors border-b-2 ${activeTab === 'alerts' ? 'border-mospi-500 text-mospi-600' : 'border-transparent text-text-muted hover:text-text-primary'}`}
        >
          AI Alerts ({mockAlerts.length})
        </button>
        <button 
          onClick={() => setActiveTab('tickets')}
          className={`py-3 px-4 font-medium text-sm transition-colors border-b-2 ${activeTab === 'tickets' ? 'border-mospi-500 text-mospi-600' : 'border-transparent text-text-muted hover:text-text-primary'}`}
        >
          Action Tickets ({mockActionTickets.length})
        </button>
      </div>

      {activeTab === 'alerts' && (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-text-secondary uppercase bg-slate-50 border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-medium">Alert ID</th>
                  <th className="px-6 py-4 font-medium">Project</th>
                  <th className="px-6 py-4 font-medium">Type</th>
                  <th className="px-6 py-4 font-medium">Severity</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-white">
                {mockAlerts.map((alert) => (
                  <tr key={alert.alertId} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-text-primary">{alert.alertId}</td>
                    <td className="px-6 py-4 text-text-secondary">{alert.projectId}</td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-text-primary">{alert.type}</p>
                      <p className="text-xs text-text-muted truncate max-w-xs">{alert.message}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        alert.severity === 'Critical' ? 'bg-red-100 text-red-800' :
                        alert.severity === 'High' ? 'bg-orange-100 text-orange-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {alert.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-text-secondary">{alert.status}</td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-mospi-600 hover:underline font-medium text-sm flex items-center gap-1 justify-end">
                        <Plus size={16} /> Create Ticket
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === 'tickets' && (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-text-secondary uppercase bg-slate-50 border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-medium">Ticket ID</th>
                  <th className="px-6 py-4 font-medium">Project</th>
                  <th className="px-6 py-4 font-medium">Action Required</th>
                  <th className="px-6 py-4 font-medium">Assigned To</th>
                  <th className="px-6 py-4 font-medium">Due Date</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-white">
                {mockActionTickets.map((ticket) => (
                  <tr key={ticket.ticketId} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-text-primary">{ticket.ticketId}</td>
                    <td className="px-6 py-4 text-text-secondary">{ticket.projectId}</td>
                    <td className="px-6 py-4 max-w-sm">
                      <p className="text-sm text-text-primary">{ticket.action}</p>
                      <p className="text-xs text-text-muted mt-1">Ref: {ticket.alertId}</p>
                    </td>
                    <td className="px-6 py-4 text-text-secondary">{ticket.assignedTo}</td>
                    <td className="px-6 py-4 text-text-secondary">
                      {new Date(ticket.dueDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        {ticket.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
