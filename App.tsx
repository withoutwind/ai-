import React, { useState } from 'react';
import { PenTool, ShoppingBag, Command, Video } from 'lucide-react';
import CreationTab from './components/CreationTab';
import ProductTab from './components/ProductTab';
import VideoTab from './components/VideoTab';
import { Tab } from './types';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.CREATION);

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center text-white shadow-sm">
              <Command className="w-5 h-5" />
            </div>
            <h1 className="text-lg font-bold text-slate-800 tracking-tight">红薯 AI 助手</h1>
          </div>
          <div className="text-xs text-slate-400 font-medium px-2 py-1 bg-slate-100 rounded">
            v1.0.0
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 pt-8">
        
        {/* Navigation Tabs */}
        <div className="flex p-1 bg-white rounded-xl shadow-sm border border-slate-200 mb-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab(Tab.CREATION)}
            className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === Tab.CREATION
                ? 'bg-red-50 text-red-600 shadow-sm'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
            }`}
          >
            <PenTool className="w-4 h-4" />
            AI 智能创作
          </button>
          <button
            onClick={() => setActiveTab(Tab.PRODUCT)}
            className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === Tab.PRODUCT
                ? 'bg-indigo-50 text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            产品海报生成
          </button>
          <button
            onClick={() => setActiveTab(Tab.VIDEO_EXTRACT)}
            className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === Tab.VIDEO_EXTRACT
                ? 'bg-purple-50 text-purple-600 shadow-sm'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
            }`}
          >
            <Video className="w-4 h-4" />
            视频文案提取
          </button>
        </div>

        {/* Tab Content */}
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          {activeTab === Tab.CREATION && <CreationTab />}
          {activeTab === Tab.PRODUCT && <ProductTab />}
          {activeTab === Tab.VIDEO_EXTRACT && <VideoTab />}
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-slate-400 text-sm mt-12 mb-6">
        <p>© 2024 红薯 AI 工作室。由 Google Gemini 提供支持。</p>
      </footer>
    </div>
  );
}

export default App;