'use client';

import { AIAssistant } from '../../components/ai/AIAssistant';
import { Bot } from 'lucide-react';

export default function AIAssistantPage() {
  return (
    <div className="w-full max-w-4xl flex flex-col h-[calc(100vh-8rem)]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-3">
          <Bot className="text-mospi-500" size={28} />
          Intelligence Assistant
        </h1>
        <p className="text-text-secondary mt-1">Chat with the AI to quickly retrieve insights, risk factors, and project summaries.</p>
      </div>
      
      <div className="flex-1 pb-4">
        <AIAssistant />
      </div>
    </div>
  );
}
