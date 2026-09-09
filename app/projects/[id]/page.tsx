'use client';

import { mockProjects } from '../../../data/mockData';
import { Card, MetricCard } from '../../../components/ui/Cards';
import { RiskBadge } from '../../../components/ui/RiskBadge';
import { IndianRupee, Activity, CalendarDays, ShieldAlert } from 'lucide-react';

export default function ProjectOverviewPage({ params }: { params: { id: string } }) {
  const project = mockProjects.find(p => p.projectId === params.id);
  
  if (!project) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard 
          title="Physical Progress" 
          value={`${project.physicalProgress}%`} 
          icon={Activity} 
          subtitle="Reported current month" 
        />
        <MetricCard 
          title="Cumulative Expenditure" 
          value={`₹${project.expenditure} Cr`} 
          icon={IndianRupee}
          subtitle={`of ₹${project.revisedCost} Cr (Revised)`}
        />
        <MetricCard 
          title="Overall Risk Score" 
          value={project.riskScore} 
          icon={ShieldAlert}
          trend={project.riskScore > 60 ? 'up' : 'neutral'}
        />
        <Card className="p-5 flex flex-col justify-center items-center gap-2 border-mospi-200 bg-mospi-50">
          <h3 className="text-sm font-medium text-text-secondary">Current Status</h3>
          <span className={`text-xl font-bold ${
            project.status === 'Critical' ? 'text-red-600' :
            project.status === 'Delayed' ? 'text-amber-600' :
            project.status === 'Watch' ? 'text-blue-600' : 'text-emerald-600'
          }`}>
            {project.status}
          </span>
          <RiskBadge level={project.riskLevel} />
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-lg font-bold text-text-primary mb-6">Financial Overview</h2>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-text-secondary">Financial Progress</span>
                <span className="font-bold text-text-primary">{Math.round((project.expenditure / project.revisedCost) * 100)}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5">
                <div className="bg-mospi-500 h-2.5 rounded-full" style={{ width: `${(project.expenditure / project.revisedCost) * 100}%` }}></div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
              <div>
                <p className="text-sm text-text-muted">Original Cost</p>
                <p className="font-semibold text-text-primary">₹{project.originalCost} Cr</p>
              </div>
              <div>
                <p className="text-sm text-text-muted">Revised Cost</p>
                <p className="font-semibold text-text-primary">₹{project.revisedCost} Cr</p>
              </div>
            </div>
            
            {project.revisedCost > project.originalCost && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm p-3 rounded-md">
                <strong>Cost Escalation Detected:</strong> Budget has been revised upwards by ₹{project.revisedCost - project.originalCost} Cr.
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-bold text-text-primary mb-6">Timeline Overview</h2>
          <div className="space-y-6">
             <div className="flex items-start gap-4">
               <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                 <CalendarDays className="text-slate-500" size={20} />
               </div>
               <div>
                 <p className="text-sm text-text-muted">Original Completion Date</p>
                 <p className="font-semibold text-text-primary">{new Date(project.originalCompletionDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
               </div>
             </div>

             <div className="flex items-start gap-4">
               <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${project.revisedCompletionDate !== project.originalCompletionDate ? 'bg-amber-100' : 'bg-emerald-100'}`}>
                 <CalendarDays className={project.revisedCompletionDate !== project.originalCompletionDate ? 'text-amber-600' : 'text-emerald-600'} size={20} />
               </div>
               <div>
                 <p className="text-sm text-text-muted">Revised/Anticipated Date</p>
                 <p className="font-semibold text-text-primary">{new Date(project.revisedCompletionDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
               </div>
             </div>

             {project.revisedCompletionDate !== project.originalCompletionDate && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm p-3 rounded-md">
                <strong>Time Overrun:</strong> Project schedule has been extended.
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
