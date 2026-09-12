'use client';

import { getMockHistoricalData } from '../../../../data/mockData';
import { Card } from '../../../../components/ui/Cards';
import { ProgressExpenditureChart } from '../../../../components/charts/ProgressExpenditureChart';
import { Download } from 'lucide-react';

export default function HistoricalDataPage({ params }: { params: { id: string } }) {
  const historyData = getMockHistoricalData(params.id);

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg font-bold text-text-primary">Progress vs Expenditure Trend</h2>
            <p className="text-sm text-text-muted">Last 12 months historical performance</p>
          </div>
          <button className="flex items-center gap-2 text-sm text-mospi-600 font-medium hover:underline border border-border px-3 py-1.5 rounded-md hover:bg-slate-50 transition-colors">
            <Download size={16} /> Export Data
          </button>
        </div>
        
        <ProgressExpenditureChart data={historyData} />
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-border bg-slate-50">
          <h2 className="text-lg font-bold text-text-primary">Monthly Records</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-text-secondary uppercase bg-white border-b border-border">
              <tr>
                <th className="px-6 py-4 font-medium">Month</th>
                <th className="px-6 py-4 font-medium">Planned Progress</th>
                <th className="px-6 py-4 font-medium">Actual Progress</th>
                <th className="px-6 py-4 font-medium">Monthly Exp. (₹ Cr)</th>
                <th className="px-6 py-4 font-medium">Cumul. Exp. (₹ Cr)</th>
                <th className="px-6 py-4 font-medium">Milestone Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-white">
              {historyData.slice().reverse().map((record, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-text-primary whitespace-nowrap">
                    {record.month}
                  </td>
                  <td className="px-6 py-4 text-text-secondary">
                    {record.plannedProgress}%
                  </td>
                  <td className="px-6 py-4 font-medium text-text-primary">
                    <span className={record.actualProgress < record.plannedProgress - 5 ? 'text-amber-600' : ''}>
                      {record.actualProgress}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-text-secondary">
                    {record.monthlyExpenditure}
                  </td>
                  <td className="px-6 py-4 text-text-secondary">
                    {record.cumulativeExpenditure}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs rounded-full font-medium ${
                      record.milestoneStatus === 'Delayed' ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {record.milestoneStatus}
                    </span>
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
