'use client';

import { mockUsers } from '../../../data/mockData';
import { Card } from '../../../components/ui/Cards';
import { Users as UsersIcon, Plus, Search } from 'lucide-react';

export default function UsersManagementPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-3">
            <UsersIcon className="text-mospi-500" size={28} />
            User Management
          </h1>
          <p className="text-text-secondary mt-1">Manage system access for officials and contractors.</p>
        </div>
        <button className="bg-mospi-500 hover:bg-mospi-600 text-white px-4 py-2 rounded-md font-medium text-sm flex items-center gap-2 transition-colors">
          <Plus size={18} /> Add User
        </button>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-border bg-slate-50 flex justify-between items-center">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4" />
            <input type="text" placeholder="Search users..." className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-mospi-500" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-text-secondary uppercase bg-white border-b border-border">
              <tr>
                <th className="px-6 py-4 font-medium">Name</th>
                <th className="px-6 py-4 font-medium">Email</th>
                <th className="px-6 py-4 font-medium">Role</th>
                <th className="px-6 py-4 font-medium">Organization</th>
                <th className="px-6 py-4 font-medium">Assigned Projects</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-white">
              {mockUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-text-primary">
                    {user.name}
                  </td>
                  <td className="px-6 py-4 text-text-secondary">
                    {user.email}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
                      {user.role.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-text-secondary">
                    {user.organizationId || '-'}
                  </td>
                  <td className="px-6 py-4 text-text-secondary">
                    {user.assignedProjectIds ? user.assignedProjectIds.length : 'All'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-mospi-600 hover:underline font-medium text-sm">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
