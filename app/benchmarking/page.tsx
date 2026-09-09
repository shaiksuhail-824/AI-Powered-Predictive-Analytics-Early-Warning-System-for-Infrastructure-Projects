'use client';

import { mockProjects } from '../../data/mockData';
import { Card } from '../../components/ui/Cards';
import { RiskBadge } from '../../components/ui/RiskBadge';
import { BarChart3, Layers } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function BenchmarkingPage() {
  const chartData = [
    { name: 'Roads', total: mockProjects.filter(p=>p.sector==='Roads').length, avgRisk: 54 },
    { name: 'Railways', total: mockProjects.filter(p=>p.sector==='Railways').length, avgRisk: 85 },
    { name: 'Power', total: mockProjects.filter(p=>p.sector==='Power').length, avgRisk: 48 },
    { name: 'Urban Transport', total: mockProjects.filter(p=>p.sector==='Urban Transport').length, avgRisk: 60 },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-3">
          <BarChart3 className="text-mospi-500" size={28} />
          Comparative Analytics
        </h1>
        <p className="text-text-secondary mt-1">Benchmark performance across sectors, states, and agencies.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-lg font-bold text-text-primary mb-4">Average Risk by Sector</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="avgRisk" name="Avg Risk Score" fill="#f97316" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-bold text-text-primary mb-4 flex justify-between">
            Top Performing States
            <span className="text-xs font-normal text-text-muted bg-slate-100 px-2 py-1 rounded">Based on avg physical progress</span>
          </h2>
          
          <div className="space-y-5">
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="font-medium text-text-primary">Uttar Pradesh</span>
                <span className="font-bold text-emerald-600">92%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `92%` }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="font-medium text-text-primary">Andhra Pradesh</span>
                <span className="font-bold text-emerald-600">72%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `72%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="font-medium text-text-primary">Maharashtra</span>
                <span className="font-bold text-amber-600">67%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-amber-500 h-2 rounded-full" style={{ width: `67%` }}></div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-border bg-slate-50 flex justify-between items-center">
          <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
            <Layers size={18} /> Direct Project Comparison
          </h2>
          <button className="text-sm border border-border px-3 py-1.5 rounded bg-white hover:bg-slate-50 transition-colors">
            Select Projects
          </button>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-border rounded p-4 bg-slate-50">
              <p className="text-xs font-semibold text-text-muted mb-2 uppercase">Project A</p>
              <h3 className="font-bold text-text-primary mb-4 leading-tight">{mockProjects[0].projectName}</h3>
              <div className="space-y-3">
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-sm text-text-secondary">Progress</span>
                  <span className="text-sm font-medium">{mockProjects[0].physicalProgress}%</span>
                </div>
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-sm text-text-secondary">Risk Score</span>
                  <span className="text-sm font-bold text-red-600">{mockProjects[0].riskScore}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-text-secondary">Status</span>
                  <RiskBadge level={mockProjects[0].riskLevel} />
                </div>
              </div>
            </div>
            
            <div className="border border-border rounded p-4 bg-slate-50 relative">
              <p className="text-xs font-semibold text-text-muted mb-2 uppercase">Project B</p>
              <h3 className="font-bold text-text-primary mb-4 leading-tight">{mockProjects[1].projectName}</h3>
              <div className="space-y-3">
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-sm text-text-secondary">Progress</span>
                  <span className="text-sm font-medium">{mockProjects[1].physicalProgress}%</span>
                </div>
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-sm text-text-secondary">Risk Score</span>
                  <span className="text-sm font-bold text-red-600">{mockProjects[1].riskScore}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-text-secondary">Status</span>
                  <RiskBadge level={mockProjects[1].riskLevel} />
                </div>
              </div>
            </div>

            <div className="border border-dashed border-border rounded p-4 flex flex-col items-center justify-center text-text-muted hover:bg-slate-50 hover:text-mospi-600 transition-colors cursor-pointer min-h-[200px]">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-2">
                <span className="text-xl">+</span>
              </div>
              <p className="text-sm font-medium">Add Project to Compare</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
