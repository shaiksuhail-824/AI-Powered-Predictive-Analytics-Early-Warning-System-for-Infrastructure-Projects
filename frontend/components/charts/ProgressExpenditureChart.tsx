'use client';

import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { MonthlyMonitoring } from '../../types';

export function ProgressExpenditureChart({ data }: { data: MonthlyMonitoring[] }) {
  const chartData = data.map(d => ({
    month: d.month.split(' ')[0], // just take 'Jan'
    plannedProgress: d.plannedProgress,
    actualProgress: d.actualProgress,
    expenditure: d.monthlyExpenditure
  }));

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
          <CartesianGrid stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} axisLine={false} />
          <YAxis yAxisId="left" tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} axisLine={false} />
          <YAxis yAxisId="right" orientation="right" tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />
          
          <Bar yAxisId="right" dataKey="expenditure" name="Monthly Exp. (₹ Cr)" fill="#fed7aa" radius={[4, 4, 0, 0]} barSize={30} />
          <Line yAxisId="left" type="monotone" dataKey="plannedProgress" name="Planned %" stroke="#cbd5e1" strokeDasharray="5 5" strokeWidth={2} dot={false} />
          <Line yAxisId="left" type="monotone" dataKey="actualProgress" name="Actual %" stroke="#f97316" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
