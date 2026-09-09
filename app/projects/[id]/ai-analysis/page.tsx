'use client';

import { mockRiskAnalysis } from '../../../../data/mockData';
import { Card } from '../../../../components/ui/Cards';
import { RiskTrendChart } from '../../../../components/charts/RiskTrendChart';
import { AlertCircle, TrendingUp, Lightbulb, ShieldAlert, Cpu } from 'lucide-react';

export default function AIAnalysisPage({ params }: { params: { id: string } }) {
  // Try to find specific mock analysis, otherwise generate a generic one for demo
  let analysis = mockRiskAnalysis.find(a => a.projectId === params.id);
  
  if (!analysis) {
    analysis = {
      projectId: params.id,
      costRisk: 45,
      timeRisk: 30,
      overallRisk: 38,
      riskLevel: 'Medium',
      predictedDelay: 2,
      riskTrend: [25, 28, 30, 32, 35, 38],
      drivers: [
        { factor: 'Slight deviation in physical progress vs planned', impact: 40 },
        { factor: 'Minor milestone delay', impact: 20 },
      ],
      recommendations: [
        'Monitor next month progress closely.',
        'Ensure contractor submits revised micro-plan.'
      ]
    };
  }

  return (
    <div className="space-y-6">
      
      <div className="bg-slate-900 rounded-lg p-6 text-white relative overflow-hidden shadow-card">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Cpu size={120} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="text-center md:text-left flex-1 border-b md:border-b-0 md:border-r border-slate-700 pb-6 md:pb-0 md:pr-6">
            <p className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-2">AI Overall Risk Score</p>
            <div className="flex items-end gap-3 justify-center md:justify-start">
              <span className={`text-6xl font-bold ${
                analysis.riskLevel === 'Critical' ? 'text-red-400' :
                analysis.riskLevel === 'High' ? 'text-orange-400' :
                analysis.riskLevel === 'Medium' ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {analysis.overallRisk}
              </span>
              <span className="text-slate-400 text-xl mb-2">/ 100</span>
            </div>
            <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-800 border border-slate-700">
               {analysis.riskLevel} Risk Category
            </div>
          </div>
          
          <div className="flex-1 w-full grid grid-cols-2 gap-4">
            <div className="bg-slate-800/50 rounded p-4 border border-slate-700">
              <p className="text-slate-400 text-sm mb-1 flex items-center gap-2"><TrendingUp size={14}/> Cost Overrun Risk</p>
              <p className="text-2xl font-bold">{analysis.costRisk}%</p>
            </div>
            <div className="bg-slate-800/50 rounded p-4 border border-slate-700">
              <p className="text-slate-400 text-sm mb-1 flex items-center gap-2"><AlertCircle size={14}/> Time Overrun Risk</p>
              <p className="text-2xl font-bold">{analysis.timeRisk}%</p>
              {analysis.predictedDelay > 0 && <p className="text-xs text-orange-400 mt-1">Est. delay: {analysis.predictedDelay} months</p>}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
            <ShieldAlert className="text-mospi-500" size={20} />
            Key Risk Drivers (Explainability)
          </h2>
          <p className="text-sm text-text-muted mb-6">AI analysis identified the following primary factors contributing to the current risk score.</p>
          
          <div className="space-y-5">
            {analysis.drivers.map((driver, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-medium text-text-primary">{driver.factor}</span>
                  <span className="text-text-secondary">{driver.impact}% Impact</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-mospi-500 h-2 rounded-full" style={{ width: `${driver.impact}%` }}></div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-8 p-4 bg-slate-50 border border-border rounded text-sm text-text-secondary leading-relaxed">
            <strong>AI Summary:</strong> The project is showing increasing risk primarily because {analysis.drivers[0].factor.toLowerCase()}.
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-bold text-text-primary mb-4">Risk Trajectory</h2>
          <p className="text-sm text-text-muted mb-6">Historical AI risk score tracking over the last 6 months.</p>
          <RiskTrendChart data={analysis.riskTrend} />
        </Card>
      </div>

      <Card className="p-6 border-mospi-200 bg-mospi-50">
        <h2 className="text-lg font-bold text-mospi-900 mb-4 flex items-center gap-2">
          <Lightbulb className="text-mospi-600" size={20} />
          AI-Powered Preventive Action Recommendations
        </h2>
        <ul className="space-y-3">
          {analysis.recommendations.map((rec, idx) => (
            <li key={idx} className="flex gap-3 text-sm text-mospi-800">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-mospi-100 border border-mospi-300 flex items-center justify-center font-bold text-mospi-700 text-xs">
                {idx + 1}
              </span>
              <span className="mt-0.5">{rec}</span>
            </li>
          ))}
        </ul>
        <div className="mt-6 pt-4 border-t border-mospi-200">
          <button className="bg-white border border-mospi-300 text-mospi-700 hover:bg-mospi-100 px-4 py-2 rounded-md font-medium text-sm transition-colors shadow-sm">
            Create Action Ticket based on Recommendation
          </button>
        </div>
      </Card>
    </div>
  );
}
