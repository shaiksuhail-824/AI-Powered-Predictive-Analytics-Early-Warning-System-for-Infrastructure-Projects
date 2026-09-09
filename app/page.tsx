import Link from 'next/link';
import { Card } from '../components/ui/Cards';
import Navbar from '../components/layout/Navbar';
import { ShieldAlert, TrendingDown, Clock, Activity, Target, ShieldCheck } from 'lucide-react';
import { SectorCarousel } from '../components/ui/SectorCarousel';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-mospi-50 border-b border-mospi-100 pt-20 pb-24 px-6 relative overflow-hidden">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-12 relative z-10">
          <div className="flex-1 space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold text-text-primary leading-tight">
              AI-Powered Infrastructure <span className="text-mospi-600">Project Monitoring</span>
            </h1>
            <p className="text-xl text-text-secondary font-medium">Predict. Explain. Prioritize. Act.</p>
            <p className="text-text-muted max-w-lg leading-relaxed">
              An intelligent project-monitoring platform that uses historical and current project data to predict cost and schedule risks, explain their drivers, and support early intervention.
            </p>
            <div className="flex gap-4 pt-4">
              <Link href="/projects/public" className="bg-mospi-500 hover:bg-mospi-600 text-white px-6 py-3 rounded-md font-medium transition-colors shadow-sm">
                Explore Projects
              </Link>
              <Link href="/login" className="bg-white hover:bg-panel-hover border border-border text-text-primary px-6 py-3 rounded-md font-medium transition-colors shadow-sm">
                Login
              </Link>
            </div>
          </div>
          <div className="flex-1 relative hidden md:block">
            {/* Simple abstract infrastructure graphic */}
            <div className="w-full aspect-video bg-white rounded-lg border border-border shadow-card p-6 flex flex-col gap-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-mospi-100 rounded-bl-full opacity-50"></div>
              <div className="h-4 w-3/4 bg-slate-200 rounded"></div>
              <div className="h-4 w-1/2 bg-slate-200 rounded"></div>
              <div className="flex-1 border-t border-dashed border-slate-300 mt-4 pt-4 flex items-end gap-2">
                <div className="w-12 h-1/3 bg-slate-200 rounded-t"></div>
                <div className="w-12 h-1/2 bg-slate-200 rounded-t"></div>
                <div className="w-12 h-3/4 bg-slate-200 rounded-t"></div>
                <div className="w-12 h-full bg-mospi-400 rounded-t"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sectors Carousel Section */}
      <section className="py-20 px-6 bg-slate-50 border-b border-border overflow-hidden">
        <div className="max-w-6xl mx-auto text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">10 Key Infrastructure Sectors</h2>
          <p className="text-xl text-mospi-600 font-medium">Building a Stronger, Smarter India</p>
        </div>
        <SectorCarousel />
      </section>

      {/* Why Section */}
      <section className="py-20 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-text-primary mb-4">Why this platform?</h2>
          <p className="text-text-secondary max-w-2xl mx-auto">
            Infrastructure projects can face cost overruns, time overruns, milestone delays, and implementation risks. This platform adds a predictive and explainable AI layer to project-monitoring information to help authorities identify risks earlier.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card className="p-6">
            <TrendingDown className="text-mospi-500 w-10 h-10 mb-4" />
            <h3 className="text-lg font-bold mb-2">Cost Overrun Prediction</h3>
            <p className="text-text-muted text-sm">Forecast budget shortfalls based on current expenditure velocity and physical progress gaps.</p>
          </Card>
          <Card className="p-6">
            <Clock className="text-mospi-500 w-10 h-10 mb-4" />
            <h3 className="text-lg font-bold mb-2">Time Overrun Prediction</h3>
            <p className="text-text-muted text-sm">Predict schedule slippages using historical performance data and milestone tracking.</p>
          </Card>
          <Card className="p-6">
            <ShieldAlert className="text-mospi-500 w-10 h-10 mb-4" />
            <h3 className="text-lg font-bold mb-2">Project Risk Scoring</h3>
            <p className="text-text-muted text-sm">Comprehensive multi-dimensional risk framework prioritizing projects requiring immediate intervention.</p>
          </Card>
          <Card className="p-6">
            <Activity className="text-mospi-500 w-10 h-10 mb-4" />
            <h3 className="text-lg font-bold mb-2">Early Warning Alerts</h3>
            <p className="text-text-muted text-sm">Automated alert generation for critical deviations triggered by predefined risk thresholds.</p>
          </Card>
          <Card className="p-6">
            <Target className="text-mospi-500 w-10 h-10 mb-4" />
            <h3 className="text-lg font-bold mb-2">Explainable AI (XAI)</h3>
            <p className="text-text-muted text-sm">Understand exactly why a project is flagged as high risk with detailed escalation driver analysis.</p>
          </Card>
          <Card className="p-6">
            <ShieldCheck className="text-mospi-500 w-10 h-10 mb-4" />
            <h3 className="text-lg font-bold mb-2">Preventive Action</h3>
            <p className="text-text-muted text-sm">AI-assisted actionable recommendations to mitigate identified risks before they materialize.</p>
          </Card>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="bg-white py-20 px-6 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-text-primary text-center mb-16">How It Works</h2>
          
          <div className="flex flex-col md:flex-row justify-between items-center relative">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-mospi-100 -translate-y-1/2 hidden md:block"></div>
            
            {[
              { step: '1', title: 'Project Data' },
              { step: '2', title: 'AI Prediction' },
              { step: '3', title: 'Risk Scoring' },
              { step: '4', title: 'Explainability' },
              { step: '5', title: 'Early Warning' },
              { step: '6', title: 'Preventive Action' }
            ].map((item, i) => (
              <div key={i} className="relative z-10 flex flex-col items-center gap-4 bg-white p-2">
                <div className="w-12 h-12 rounded-full bg-mospi-500 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                  {item.step}
                </div>
                <div className="text-sm font-semibold text-text-primary w-24 text-center">{item.title}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-8 h-10 bg-white/10 border border-white/20 rounded flex items-center justify-center">
              <span className="text-white font-bold text-xs">GOI</span>
            </div>
            <div>
              <p className="font-semibold text-white">Ministry of Statistics and Programme Implementation</p>
              <p className="text-sm text-slate-400">Government of India</p>
            </div>
          </div>
          <div className="flex gap-6 text-sm">
            <Link href="#" className="hover:text-white transition-colors">About</Link>
            <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-white transition-colors">Contact</Link>
            <Link href="#" className="hover:text-white transition-colors">Disclaimer</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
