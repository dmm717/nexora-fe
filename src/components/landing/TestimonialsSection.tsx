'use client';

import React from 'react';

const testimonials = [
    {
        quote: "Nhờ luyện tập với Nexora, mình đã quen với áp lực phòng thi và trả lời trôi chảy các câu hỏi tình huống khó. Mình vừa nhận được offer từ Big4 tuần trước!",
        initial: "M",
        name: "Minh Anh",
        role: "Sinh viên năm cuối, Ngoại Thương",
        colorClass: "text-primary",
        bgClass: "bg-primary-container/20",
    },
    {
        quote: "Tính năng phân tích CV và gợi ý câu hỏi theo JD cực kỳ chính xác. Rất hữu ích cho những người muốn chuyển ngành như mình.",
        initial: "H",
        name: "Hoàng Nam",
        role: "Chuyển ngành IT (Fresher)",
        colorClass: "text-tertiary",
        bgClass: "bg-tertiary-container/20",
    },
    {
        quote: "Phương pháp STAR được AI hướng dẫn rất dễ hiểu. Mình đã tự tin hơn hẳn khi trình bày kinh nghiệm làm việc thực tế.",
        initial: "T",
        name: "Thu Trang",
        role: "Sinh viên UEH",
        colorClass: "text-surface-tint",
        bgClass: "bg-surface-tint/20",
    }
];

export default function TestimonialsSection() {
    return (
        <section data-nx-section className="py-stack-lg bg-surface relative overflow-hidden">
            <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
                <div className="text-center mb-stack-lg">
                    <h2 className="font-headline-lg text-headline-lg text-on-surface mb-4">Câu chuyện thành công</h2>
                    <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto">
                        Hàng ngàn ứng viên đã chinh phục được công việc mơ ước nhờ luyện tập cùng Nexora.
                    </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
                    {testimonials.map((t, i) => (
                        <div key={i} className="bg-surface-container-lowest p-6 rounded-[20px] border border-outline-variant/30 shadow-sm flex flex-col gap-4 relative overflow-hidden hover:shadow-md transition-shadow">
                            <span className="material-symbols-outlined absolute top-4 right-4 text-[48px] text-primary/10" aria-hidden="true">format_quote</span>
                            
                            <div className="flex items-center gap-1 text-primary">
                                {[...Array(5)].map((_, idx) => (
                                    <span key={idx} className="material-symbols-outlined text-[18px]" aria-hidden="true">star</span>
                                ))}
                            </div>
                            
                            <p className="font-body-md text-body-md text-on-surface italic flex-1">"{t.quote}"</p>
                            
                            <div className="flex items-center gap-3 mt-4 border-t border-outline-variant/20 pt-4">
                                <div className={`w-10 h-10 rounded-full ${t.bgClass} flex items-center justify-center font-headline-md ${t.colorClass} shrink-0`}>
                                    {t.initial}
                                </div>
                                <div>
                                    <p className="font-label-md text-label-md text-on-surface">{t.name}</p>
                                    <p className="font-label-sm text-label-sm text-on-surface-variant">{t.role}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
