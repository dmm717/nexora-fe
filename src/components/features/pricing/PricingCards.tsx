'use client';

import React from 'react';
import { CheckCircle2 } from 'lucide-react';

const plans = [
  {
    name: "Free",
    subtitle: "Trải nghiệm",
    price: "0đ",
    period: "",
    badge: "Gói hiện tại",
    features: [
      "Phân tích CV/JD Cơ bản (Keyword)",
      "01 Phiên Phỏng vấn AI mẫu (giới hạn 3 câu/phiên)",
      "Truy cập Case Study Bank: Các câu hỏi phổ biến",
      "Báo cáo Post-Interview: Điểm số tổng quan"
    ],
    cta: "Đang dùng",
    popular: false,
    buttonClass: "border border-purple-100 text-purple-400 font-bold bg-transparent hover:bg-purple-50",
    cardClass: "border-transparent bg-white shadow-sm"
  },
  {
    name: "Basic",
    subtitle: "Sử dụng trong 3 ngày",
    price: "49K",
    period: "/ 3 ngày",
    badge: "",
    features: [
      "01 lượt Phân tích CV/JD Chuyên sâu",
      "03 Phiên Phỏng vấn AI (Full câu hỏi)",
      "Mở khóa Case Study Bank Chuyên ngành",
      "Có truy cập công cụ STAR Builder",
      "Báo cáo chi tiết từng câu & phân tích STAR"
    ],
    cta: "Nâng cấp Basic",
    popular: false,
    buttonClass: "bg-[#8EF322] text-slate-900 font-bold hover:bg-[#82df1f] shadow-md",
    cardClass: "border-transparent bg-white shadow-md"
  },
  {
    name: "Weekly",
    subtitle: "Sử dụng trong 7 ngày",
    price: "189K",
    period: "/ tuần",
    badge: "PHỔ BIẾN NHẤT",
    features: [
      "05 lượt Phân tích CV/JD Chuyên sâu",
      "20 Phiên Phỏng vấn AI (Full câu hỏi)",
      "Case Study Bank & STAR Builder: Không giới hạn",
      "Báo cáo Post-Interview chi tiết"
    ],
    cta: "Nâng cấp Weekly",
    popular: true,
    buttonClass: "bg-[#8EF322] text-slate-900 font-bold hover:bg-[#82df1f] shadow-md",
    cardClass: "border-2 border-purple-600 bg-white shadow-xl relative scale-105 z-10"
  },
  {
    name: "Pro",
    subtitle: "Sử dụng trong 90 ngày",
    price: "599K",
    period: "/ 90 ngày",
    badge: "",
    features: [
      "Phân tích CV/JD Chuyên sâu: Không giới hạn",
      "Phiên Phỏng vấn AI: Không giới hạn",
      "Case Study Bank & STAR Builder: Không giới hạn",
      "Báo cáo phân tích kỹ năng mềm, cảm xúc & tiến bộ cá nhân hóa"
    ],
    cta: "Nâng cấp Pro",
    popular: false,
    buttonClass: "bg-[#8EF322] text-slate-900 font-bold hover:bg-[#82df1f] shadow-md",
    cardClass: "border-transparent bg-white shadow-md"
  }
];

export default function PricingCards() {
  return (
    <section className="relative w-full min-h-screen pt-32 pb-16 px-4 sm:px-6 overflow-hidden bg-gradient-to-br from-[#F5F0FF] via-[#F8F5FE] to-[#EBE4FF]">
      
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-purple-200/50 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-100/40 rounded-full blur-[120px] translate-y-1/4 -translate-x-1/4 pointer-events-none" />
      
      <div className="max-w-[1350px] mx-auto relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <h1 className="text-3xl md:text-4xl font-black text-purple-700 tracking-tight mb-3">
            Sẵn sàng hơn cho mọi buổi phỏng vấn
          </h1>
          <p className="text-sm md:text-base text-slate-700 font-medium leading-relaxed">
            Lựa chọn gói luyện tập, nhận góp ý và cải thiện kỹ năng qua từng buổi.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch pt-2">
          {plans.map((plan, idx) => (
            <div 
              key={idx} 
              className={`rounded-3xl p-5 md:p-6 flex flex-col h-full ${plan.cardClass}`}
            >
              
              {/* Badge for popular plan */}
              {plan.badge && plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-purple-600 rounded-full text-white text-[10px] font-bold tracking-wider uppercase shadow-lg whitespace-nowrap">
                  {plan.badge}
                </div>
              )}
              
              {/* Fixed height container for inline badge to ensure alignment */}
              <div className="h-7 mb-2">
                {plan.badge && !plan.popular && (
                  <div className="inline-block px-3 py-1 bg-purple-100 rounded-full text-purple-600 text-[10px] font-bold w-max">
                    {plan.badge}
                  </div>
                )}
              </div>

              <div>
                <p className="text-[12px] font-medium text-slate-500 mb-0.5">{plan.subtitle}</p>
                <h3 className={`text-lg font-black mb-2 ${plan.popular ? 'text-purple-700' : 'text-slate-900'}`}>{plan.name}</h3>
                
                <div className="flex items-baseline gap-1">
                  <span className="text-[26px] font-black text-purple-700 tracking-tight">{plan.price}</span>
                  {plan.period && <span className="text-slate-500 font-medium text-[11px]">{plan.period}</span>}
                </div>
              </div>

              {/* Separator line */}
              <div className="w-full h-[1px] bg-slate-100 my-4"></div>

              {/* Features List */}
              <div className="mb-4 flex-1">
                <ul className="space-y-2.5">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                      <span className="text-slate-600 font-medium text-[11px] leading-snug">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Button */}
              <button className={`w-full py-2 rounded-full text-[12px] transition-all duration-200 mt-auto ${plan.buttonClass}`}>
                {plan.cta}
              </button>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
