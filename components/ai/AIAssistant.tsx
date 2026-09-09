'use client';

import { useState } from 'react';
import { Card } from '../ui/Cards';
import { Bot, Send, User as UserIcon } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export function AIAssistant() {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<{role: 'user'|'ai', text: string}[]>([
    { role: 'ai', text: 'Hello. I am your MoSPI AI Intelligence Assistant. I can help you analyze project risks, compare states, and identify bottlenecks. How can I assist you today?' }
  ]);
  const { user } = useAuthStore();

  const handleSend = () => {
    if (!query.trim()) return;
    
    // Add user message
    const newMessages = [...messages, { role: 'user' as const, text: query }];
    setMessages(newMessages);
    setQuery('');

    // Mock AI response
    setTimeout(() => {
      let aiResponse = "I'm analyzing the project data...";
      const q = query.toLowerCase();
      
      if (q.includes('high risk') && q.includes('andhra pradesh')) {
        aiResponse = "Based on current data, there are 2 high/critical risk projects in Andhra Pradesh: \n\n1. Polavaram Irrigation Project (Critical, 92/100)\n2. NH-44 Highway Expansion (High, 78/100).\n\nBoth show significant schedule slippage and cost escalation.";
      } else if (q.includes('why') && q.includes('high risk')) {
        aiResponse = "Projects are typically flagged as high risk when the AI detects a combination of factors: \n- Expenditure velocity exceeding physical progress\n- Repeated failure to meet critical path milestones\n- Prolonged schedule slippage (>6 months)";
      } else if (q.includes('highest number') && q.includes('ministry')) {
        aiResponse = "Currently, the Ministry of Road Transport and Highways and Ministry of Housing and Urban Affairs have the highest number of projects on the watch list or higher.";
      } else {
        aiResponse = "I've logged your query. In the full version, I will dynamically analyze the centralized project database to provide a specific answer. Would you like to check specific high-risk projects in the meantime?";
      }
      
      setMessages([...newMessages, { role: 'ai', text: aiResponse }]);
    }, 800);
  };

  return (
    <Card className="flex flex-col h-full max-h-[700px] overflow-hidden border-mospi-200">
      <div className="bg-mospi-50 border-b border-mospi-200 p-4 flex items-center gap-3">
        <div className="bg-mospi-500 text-white w-10 h-10 rounded-full flex items-center justify-center">
          <Bot size={24} />
        </div>
        <div>
          <h2 className="font-bold text-mospi-900 leading-tight">Project Intelligence Assistant</h2>
          <p className="text-xs text-mospi-600 font-medium">Powered by MoSPI Data Lake</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-slate-200 text-slate-600' : 'bg-mospi-100 text-mospi-600 border border-mospi-200'}`}>
              {msg.role === 'user' ? <UserIcon size={16} /> : <Bot size={16} />}
            </div>
            <div className={`p-3 rounded-lg text-sm max-w-[80%] whitespace-pre-line ${
              msg.role === 'user' 
                ? 'bg-mospi-500 text-white rounded-tr-none' 
                : 'bg-white border border-border shadow-sm text-text-primary rounded-tl-none'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-white border-t border-border">
        {/* Suggested Queries */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-1 no-scrollbar">
          {user?.role === 'ADMIN' ? (
            <>
              <button onClick={() => setQuery("Show all high-risk projects in Andhra Pradesh.")} className="text-xs whitespace-nowrap bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-full transition-colors border border-slate-200">Show all high-risk projects in Andhra Pradesh.</button>
              <button onClick={() => setQuery("Which ministry has the highest number of high-risk projects?")} className="text-xs whitespace-nowrap bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-full transition-colors border border-slate-200">Which ministry has the highest risk?</button>
            </>
          ) : (
             <button onClick={() => setQuery("Which of my projects require immediate attention?")} className="text-xs whitespace-nowrap bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-full transition-colors border border-slate-200">Which of my projects require attention?</button>
          )}
        </div>
        
        <div className="flex gap-2">
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about project risks, delays, or compare data..." 
            className="flex-1 border border-border rounded-md px-4 py-2 focus:outline-none focus:ring-1 focus:ring-mospi-500 text-sm"
          />
          <button 
            onClick={handleSend}
            className="bg-mospi-500 hover:bg-mospi-600 text-white w-10 h-10 rounded-md flex items-center justify-center transition-colors flex-shrink-0"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </Card>
  );
}
