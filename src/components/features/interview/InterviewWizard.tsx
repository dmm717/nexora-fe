'use client';

import React, { useState } from 'react';
import { Search, Clock, FileText, UploadCloud, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';

export default function InterviewWizard() {
  const [activeTab, setActiveTab] = useState<'interview' | 'history'>('interview');
  const [selectedSource, setSelectedSource] = useState<'analyzed' | 'new'>('new');
  const [isJdExpanded, setIsJdExpanded] = useState(false);

  return (
    <div className="relative w-full min-h-[calc(100vh-80px)] pt-32 pb-24 px-4 sm:px-6 md:px-12 lg:px-20 overflow-hidden bg-gradient-to-br from-[#F5F0FF] via-[#F8F5FE] to-[#EBE4FF]">
      
      {/* Abstract Background Blur */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-purple-200/50 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-100/40 rounded-full blur-[120px] translate-y-1/4 -translate-x-1/4 pointer-events-none" />

      <div className="max-w-[900px] mx-auto relative z-10">
        
        {/* Header Titles */}
        <div className="mb-6">
          <h1 className="text-3xl md:text-[2.25rem] font-black text-[#1C1C28] mb-2 tracking-tight">
            <span className="text-purple-700">Luyện phỏng vấn với AI</span> từ CV của bạn
          </h1>
          <p className="text-slate-600 font-medium text-[14px] max-w-2xl leading-relaxed">
            Từ CV của bạn, Nexora tạo buổi phỏng vấn thử với HR AI và góp ý sau từng câu trả lời để bạn tự tin hơn trước buổi thật.
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-[0_20px_50px_-15px_rgba(147,51,234,0.1)] border border-purple-50/50 overflow-hidden">
          
          {/* Top Tabs */}
          <div className="flex items-center gap-2 p-6 pb-0">
            <button 
              onClick={() => setActiveTab('interview')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
                activeTab === 'interview' 
                  ? 'bg-purple-50 text-purple-700' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              <Search className="w-4 h-4" />
              Phỏng vấn
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
                activeTab === 'history' 
                  ? 'bg-purple-50 text-purple-700' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              <Clock className="w-4 h-4" />
              Lịch sử
            </button>
          </div>

          <div className="p-6 md:p-10 pt-8">
            {/* Stepper */}
            <div className="flex items-center justify-center mb-12">
              <div className="flex items-center gap-2 md:gap-4">
                
                {/* Step 1 */}
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-purple-700 text-white flex items-center justify-center font-bold text-sm shadow-md">
                    1
                  </div>
                  <span className="text-[10px] md:text-xs font-bold text-purple-700 uppercase tracking-wider">Nguồn CV</span>
                </div>

                <div className="w-8 md:w-16 h-[1px] bg-slate-200 -mt-6"></div>

                {/* Step 2 */}
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 rounded-full border-2 border-slate-200 text-slate-400 flex items-center justify-center font-bold text-sm bg-white">
                    2
                  </div>
                  <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">Chọn HR</span>
                </div>

                <div className="w-8 md:w-16 h-[1px] bg-slate-200 -mt-6"></div>

                {/* Step 3 */}
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 rounded-full border-2 border-slate-200 text-slate-400 flex items-center justify-center font-bold text-sm bg-white">
                    3
                  </div>
                  <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">Phỏng vấn</span>
                </div>

              </div>
            </div>

            {/* Step 1 Content */}
            <div className="mb-8">
              <h2 className="text-[17px] font-black text-slate-900 mb-1">Bước 1: Chọn nguồn CV</h2>
              <p className="text-[13px] font-medium text-purple-600 mb-6">AI đọc CV của bạn để tạo bộ câu hỏi phỏng vấn phù hợp.</p>

              {/* Source Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                
                {/* Card 1: Analyzed CV */}
                <div 
                  onClick={() => setSelectedSource('analyzed')}
                  className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-4 ${
                    selectedSource === 'analyzed' 
                      ? 'border-purple-300 bg-purple-50/30' 
                      : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 mt-0.5 flex-shrink-0 flex items-center justify-center ${
                    selectedSource === 'analyzed' ? 'border-purple-600' : 'border-slate-300'
                  }`}>
                    {selectedSource === 'analyzed' && <div className="w-2.5 h-2.5 bg-purple-600 rounded-full" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-[15px] font-bold text-slate-700 mb-1">
                      <FileText className="w-4 h-4 text-slate-400" />
                      CV đã phân tích
                    </div>
                    <p className="text-[11px] font-medium text-slate-400">Cần phân tích CV trước</p>
                  </div>
                </div>

                {/* Card 2: New CV */}
                <div 
                  onClick={() => setSelectedSource('new')}
                  className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-4 ${
                    selectedSource === 'new' 
                      ? 'border-purple-300 bg-purple-50/30' 
                      : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 mt-0.5 flex-shrink-0 flex items-center justify-center ${
                    selectedSource === 'new' ? 'border-purple-600' : 'border-slate-300'
                  }`}>
                    {selectedSource === 'new' && <div className="w-2.5 h-2.5 bg-purple-600 rounded-full" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-[15px] font-bold text-slate-900 mb-1">
                      <UploadCloud className="w-4 h-4 text-purple-600" />
                      Tải CV mới
                    </div>
                    <p className="text-[11px] font-medium text-purple-600/80">Chọn thẻ, rồi upload file trong ô bên dưới</p>
                  </div>
                </div>

              </div>

              {/* Helper text */}
              <p className="text-[11px] font-medium text-slate-500">
                Chưa có phân tích CV. <span className="text-purple-700 font-bold cursor-pointer">Phân tích CV trước</span> hoặc chọn Tải CV mới.
              </p>
            </div>

            {/* Accordion: Job Description */}
            <div className={`w-full border rounded-2xl transition-all mb-8 overflow-hidden ${isJdExpanded ? 'border-purple-200 bg-white shadow-sm' : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50'}`}>
              <div 
                className="p-4 flex items-center justify-between cursor-pointer"
                onClick={() => setIsJdExpanded(!isJdExpanded)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded bg-purple-100 text-purple-600 flex items-center justify-center text-[10px] font-bold">JD</div>
                  <span className={`text-[13px] font-bold transition-colors ${isJdExpanded ? 'text-purple-700' : 'text-slate-700'}`}>
                    Thêm mô tả công việc <span className={`font-medium ${isJdExpanded ? 'text-purple-400' : 'text-slate-400'}`}>(tùy chọn)</span>
                  </span>
                </div>
                {isJdExpanded ? (
                  <ChevronUp className="w-4 h-4 text-purple-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </div>

              {/* Expanded Content */}
              {isJdExpanded && (
                <div className="px-4 pb-4 border-t border-purple-50 pt-4">
                  <p className="text-[12px] font-medium text-purple-600 mb-3">
                    Dán nội dung JD hoặc upload file, AI sẽ bám sát yêu cầu tuyển dụng thực tế khi tạo câu hỏi.
                  </p>
                  
                  <textarea 
                    placeholder="Dán mô tả công việc (Job Description) vào đây..."
                    className="w-full h-24 p-3 text-[13px] text-slate-700 border border-purple-100 rounded-xl bg-white focus:outline-none focus:border-purple-300 focus:ring-1 focus:ring-purple-300 resize-none mb-3 placeholder:text-purple-300/70"
                  />
                  
                  <div className="flex items-center gap-3">
                    <span className="text-[12px] font-medium text-purple-400">hoặc</span>
                    <button className="flex items-center gap-2 px-3 py-1.5 border border-purple-200 rounded-lg text-[12px] font-bold text-purple-700 hover:bg-purple-50 transition-colors">
                      <FileText className="w-3.5 h-3.5" />
                      Upload file JD (PDF)
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Button */}
            <button className="w-full py-4 bg-purple-100 text-purple-500 rounded-2xl font-bold text-[15px] flex items-center justify-center gap-2 hover:bg-purple-200 transition-colors cursor-not-allowed">
              Tiếp tục <ArrowRight className="w-4 h-4" />
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}
