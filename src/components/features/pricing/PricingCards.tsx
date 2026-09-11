'use client';

import React from 'react';

const plans = [
  {
    name: "Khởi động",
    price: "Miễn phí",
    period: "mãi mãi",
    description: "Hoàn hảo để trải nghiệm sơ bộ các tính năng AI của hệ thống.",
    features: [
      "1 Lượt phân tích CV mỗi tháng",
      "Gợi ý từ khóa cơ bản",
      "Template CV tiêu chuẩn"
    ],
    cta: "Bắt đầu miễn phí",
    popular: false,
    gradient: "from-slate-100 to-slate-50",
    buttonClass: "bg-white border-2 border-slate-200 text-slate-800 hover:border-slate-300 hover:bg-slate-50",
    cardClass: "border-slate-200"
  },
  {
    name: "Chuyên Nghiệp",
    price: "199.000đ",
    period: "/tháng",
    description: "Bộ công cụ toàn diện giúp bạn vượt qua mọi vòng hồ sơ.",
    features: [
      "Phân tích CV không giới hạn",
      "So khớp CV với JD chi tiết",
      "10 Lượt phỏng vấn AI/tháng",
      "Gợi ý sửa CV bằng AI",
      "Hỗ trợ 24/7"
    ],
    cta: "Nâng cấp Pro",
    popular: true,
    gradient: "from-purple-600 to-indigo-600",
    buttonClass: "bg-gradient-to-r from-purple-500 to-indigo-500 text-white border border-transparent shadow-[0_10px_25px_rgba(139,92,246,0.5)] hover:shadow-[0_15px_35px_rgba(139,92,246,0.6)]",
    cardClass: "border-purple-500 relative transform md:-translate-y-4 shadow-[0_30px_60px_-15px_rgba(109,40,217,0.3)] z-10"
  },
  {
    name: "Doanh Nghiệp",
    price: "Liên hệ",
    period: "theo nhu cầu",
    description: "Giải pháp may đo dành cho các trung tâm đào tạo và tổ chức.",
    features: [
      "Tất cả tính năng của Pro",
      "API tích hợp hệ thống",
      "Tạo kịch bản phỏng vấn riêng",
      "Báo cáo thống kê chi tiết",
      "Quản lý tài khoản nhóm"
    ],
    cta: "Liên hệ ngay",
    popular: false,
    gradient: "from-slate-900 to-slate-800",
    buttonClass: "bg-slate-900 text-white hover:bg-slate-800",
    cardClass: "border-slate-200"
  }
];

export default function PricingCards() {
  return (
    <section className="relative w-full min-h-screen py-24 px-6 overflow-hidden bg-[#FAFAFA]">
      
      {/* Background decorations */}
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-purple-50/50 to-transparent pointer-events-none"></div>
      <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-purple-200/40 rounded-full blur-[100px] pointer-events-none mix-blend-multiply"></div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-[13px] font-bold text-purple-600 uppercase tracking-[0.2em] mb-4">Bảng Giá</h2>
          <h1 className="text-4xl md:text-5xl lg:text-[54px] font-black text-slate-900 leading-[1.1] tracking-tight mb-6">
            Đầu tư cho sự nghiệp,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">tỏa sáng trước nhà tuyển dụng.</span>
          </h1>
          <p className="text-lg text-slate-600 font-medium leading-relaxed">
            Chọn gói dịch vụ phù hợp để tối ưu hóa hồ sơ và rèn luyện kỹ năng phỏng vấn cùng AI.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10 items-center">
          {plans.map((plan, idx) => (
            <div 
              key={idx} 
              className={`bg-white rounded-[2.5rem] p-10 border ${plan.cardClass} transition-all duration-300 hover:scale-[1.02] flex flex-col h-full`}
            >
              
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1.5 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full text-white text-[11px] font-bold tracking-wider uppercase shadow-lg">
                  Phổ biến nhất
                </div>
              )}

              <div className="mb-8">
                <h3 className={`text-xl font-bold mb-4 ${plan.popular ? 'text-purple-600' : 'text-slate-900'}`}>{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-3">
                  <span className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">{plan.price}</span>
                  <span className="text-slate-500 font-medium">{plan.period}</span>
                </div>
                <p className="text-slate-600 text-sm font-medium leading-relaxed h-10">
                  {plan.description}
                </p>
              </div>

              <div className="mb-10 flex-1">
                <p className="text-[12px] font-bold uppercase tracking-wider text-slate-400 mb-6">Bao gồm</p>
                <ul className="space-y-4">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${plan.popular ? 'bg-purple-100 text-purple-600' : 'bg-green-100 text-green-600'}`}>
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                      </div>
                      <span className="text-slate-700 font-medium text-[15px]">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button className={`w-full py-4 rounded-full font-bold text-[15px] transition-all duration-200 active:scale-95 ${plan.buttonClass}`}>
                {plan.cta}
              </button>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
