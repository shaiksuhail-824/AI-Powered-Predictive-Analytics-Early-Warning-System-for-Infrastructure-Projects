'use client';

import { mockProjects } from '../../../../data/mockData';
import { Card } from '../../../../components/ui/Cards';
import { useState } from 'react';
import { UploadCloud, CheckCircle2 } from 'lucide-react';

export default function MonthlyUpdatePage({ params }: { params: { id: string } }) {
  const project = mockProjects.find(p => p.projectId === params.id);
  const [submitted, setSubmitted] = useState(false);
  const [progress, setProgress] = useState(project?.physicalProgress || 0);
  const [expenditure, setExpenditure] = useState('');

  if (!project) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    // In a real app, this would send data to the backend
  };

  if (submitted) {
    return (
      <Card className="p-8 max-w-2xl mx-auto flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 className="text-emerald-600 w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">Update Submitted Successfully</h2>
        <p className="text-text-secondary mb-6">Your monthly progress update has been recorded. The AI engine is recalculating risk metrics.</p>
        <button onClick={() => setSubmitted(false)} className="text-mospi-600 font-medium hover:underline text-sm">Submit another update</button>
      </Card>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Card className="p-6">
        <h2 className="text-lg font-bold text-text-primary mb-1">Submit Monthly Update</h2>
        <p className="text-sm text-text-muted mb-6">Report the latest physical and financial progress for {project.projectId}.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Reporting Month</label>
              <select className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-mospi-500" required>
                <option value="">Select Month</option>
                <option value="sep-2025">September 2025</option>
                <option value="oct-2025">October 2025</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Overall Physical Progress (%)</label>
              <input 
                type="number" 
                min="0" max="100" 
                value={progress}
                onChange={e => setProgress(Number(e.target.value))}
                className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-mospi-500" 
                required 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Expenditure This Month (₹ Cr)</label>
              <input 
                type="number" 
                min="0"
                value={expenditure}
                onChange={e => setExpenditure(e.target.value)}
                className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-mospi-500" 
                required 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Critical Milestone Status</label>
              <select className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-mospi-500" required>
                <option value="">Select Status</option>
                <option value="on-track">On Track</option>
                <option value="delayed">Delayed</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Remarks / Explanation for Delay</label>
            <textarea 
              rows={4} 
              className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-mospi-500"
              placeholder="Provide details on progress or reasons for delay..."
            ></textarea>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Upload Site Photo / Evidence</label>
            <div className="border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors cursor-pointer">
              <UploadCloud className="text-slate-400 mb-2 w-8 h-8" />
              <p className="text-sm font-medium text-text-primary">Click to upload or drag and drop</p>
              <p className="text-xs text-text-muted mt-1">SVG, PNG, JPG or GIF (max. 5MB)</p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button type="button" className="px-4 py-2 border border-border text-text-secondary font-medium text-sm rounded-md hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-mospi-500 text-white font-medium text-sm rounded-md hover:bg-mospi-600 transition-colors">
              Submit Update
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
