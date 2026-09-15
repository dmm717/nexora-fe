"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useCurrentUser } from '@/hooks/queries/useUser';

export default function LearningPathPage() {
    const { data: user } = useCurrentUser();
    const [currentMonth, setCurrentMonth] = useState("");
    const [calendarDays, setCalendarDays] = useState<any[]>([]);

    useEffect(() => {
        // Initialize Calendar
        const now = new Date();
        const months = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
            'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
        setCurrentMonth(`${months[now.getMonth()]}, ${now.getFullYear()}`);

        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).getDay() || 7;
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const today = now.getDate();

        let days = [];
        // Pre-fill empty cells (Mon=0)
        for (let i = 1; i < firstDay; i++) {
            const d = new Date(now.getFullYear(), now.getMonth(), 1 - i).getDate();
            days.push({ day: d, type: 'empty' });
        }
        
        const activeDays = [1, 2, 3, 5, 6, 7, 9];
        for (let d = 1; d <= daysInMonth; d++) {
            const isToday = d === today;
            const hasSession = activeDays.includes(d);
            const hasDot = (d === 6 || d === 9);
            days.push({ day: d, isToday, hasSession, hasDot, type: 'current' });
        }
        setCalendarDays(days);
    }, []);

    return (
        <div className="flex-1 pb-stack-lg px-margin-mobile md:px-margin-desktop w-full max-w-container-max mx-auto flex flex-col gap-stack-lg bg-[#F5F3FF] pt-24 md:pt-28 min-h-[100dvh]">
            {/* Header */}
            <header className="bg-surface rounded-[24px] p-stack-md md:p-stack-lg shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-outline-variant/20 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-surface-container-highest/40 to-transparent pointer-events-none"></div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-stack-md">
                    <div className="flex flex-col gap-stack-sm">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-tertiary-container/10 text-tertiary font-label-sm text-label-sm font-semibold">Professional Package</span>
                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary-container/10 text-primary font-label-sm text-label-sm font-semibold">
                                <span className="material-symbols-outlined text-[14px] mr-1">trending_up</span>
                                Business Analyst Interview
                            </span>
                        </div>
                        <h1 className="font-headline-lg text-headline-lg-mobile md:text-[32px] text-on-surface">
                            Lộ trình cải thiện cá nhân hóa
                        </h1>
                        <p className="text-secondary font-body-md text-body-md max-w-2xl">
                            Chào <strong>{user?.displayName || 'bạn'}</strong>, dựa trên kết quả phân tích AI từ các buổi phỏng vấn mô phỏng gần đây, chúng tôi đã xây dựng lộ trình này để giúp bạn tối ưu hóa kỹ năng và sẵn sàng cho vị trí <strong>Business Analyst</strong>.
                        </p>
                    </div>
                    <div className="flex items-center gap-stack-sm flex-shrink-0">
                        <button className="flex items-center justify-center px-4 py-2 border border-outline-variant text-secondary rounded-lg hover:bg-surface-container-low transition-colors cursor-pointer shadow-sm bg-surface font-label-md text-label-md">
                            <span className="material-symbols-outlined mr-2 text-[20px]">download</span>
                            Tải PDF
                        </button>
                        <button className="flex items-center justify-center px-4 py-2 bg-primary text-on-primary rounded-lg hover:bg-primary/90 transition-colors cursor-pointer shadow-md font-label-md text-label-md">
                            <span className="material-symbols-outlined mr-2 text-[20px]">play_arrow</span>
                            Tiếp tục học
                        </button>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-stack-lg">
                {/* Left Column: Skills + Roadmap (2/3) */}
                <div className="lg:col-span-2 flex flex-col gap-stack-lg">
                    {/* Tổng quan kỹ năng */}
                    <section className="bg-surface rounded-[24px] p-stack-md md:p-stack-lg shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-outline-variant/20 flex flex-col gap-stack-md">
                        <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4">
                            <h2 className="font-headline-md text-headline-md text-on-surface flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary" style={{fontVariationSettings: "'FILL'1"}}>radar</span>
                                Tổng quan kỹ năng
                            </h2>
                            <span className="text-secondary font-label-sm text-label-sm">Cập nhật: Hôm nay</span>
                        </div>
                        <div className="flex flex-col gap-5">
                            {/* Skill 1 */}
                            <div className="flex flex-col gap-2">
                                <div className="flex justify-between items-center">
                                    <span className="font-label-md text-label-md font-semibold text-on-surface">Giao tiếp & Thuyết trình</span>
                                    <span className="text-secondary font-label-md text-label-md">65% / 80% Mục tiêu</span>
                                </div>
                                <div className="w-full bg-surface-container h-3 rounded-full overflow-hidden">
                                    <div className="bg-primary h-full rounded-full w-[65%] transition-all duration-1000"></div>
                                </div>
                                <p className="text-secondary font-label-sm text-label-sm">Cần cải thiện cấu trúc trả lời và giảm thiểu từ ngữ dư thừa.</p>
                            </div>

                            {/* Skill 2 */}
                            <div className="flex flex-col gap-2">
                                <div className="flex justify-between items-center">
                                    <span className="font-label-md text-label-md font-semibold text-on-surface">Chuyên môn (Business Analysis)</span>
                                    <span className="text-secondary font-label-md text-label-md">85% / 90% Mục tiêu</span>
                                </div>
                                <div className="w-full bg-surface-container h-3 rounded-full overflow-hidden">
                                    <div className="bg-tertiary h-full rounded-full w-[85%] transition-all duration-1000"></div>
                                </div>
                                <p className="text-secondary font-label-sm text-label-sm">Kiến thức nền tảng vững vàng, cần làm rõ hơn quá trình phân tích yêu cầu nghiệp vụ.</p>
                            </div>

                            {/* Skill 3 */}
                            <div className="flex flex-col gap-2">
                                <div className="flex justify-between items-center">
                                    <span className="font-label-md text-label-md font-semibold text-on-surface">Giải quyết vấn đề</span>
                                    <span className="text-secondary font-label-md text-label-md">70% / 85% Mục tiêu</span>
                                </div>
                                <div className="w-full bg-surface-container h-3 rounded-full overflow-hidden">
                                    <div className="bg-primary-container h-full rounded-full w-[70%] transition-all duration-1000"></div>
                                </div>
                                <p className="text-secondary font-label-sm text-label-sm">Khả năng tư duy logic tốt, cần rèn luyện phản xạ với các câu hỏi tình huống bất ngờ.</p>
                            </div>
                        </div>
                    </section>

                    {/* Lộ trình timeline */}
                    <section className="bg-surface rounded-[24px] p-stack-md md:p-stack-lg shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-outline-variant/20 flex flex-col gap-stack-md relative overflow-hidden">
                        <div className="absolute right-0 top-0 w-64 h-64 bg-surface-container-highest/30 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
                        <h2 className="font-headline-md text-headline-md text-on-surface flex items-center gap-2 mb-4 relative z-10">
                            <span className="material-symbols-outlined text-primary" style={{fontVariationSettings: "'FILL'1"}}>route</span>
                            Lộ trình thực hiện
                        </h2>
                        <div className="relative pl-6 md:pl-8 border-l-2 border-surface-container-high flex flex-col gap-stack-lg z-10">
                            {/* Step 1: Đã hoàn thành */}
                            <div className="relative">
                                <div className="absolute -left-[31px] md:-left-[39px] w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-sm">
                                    <span className="material-symbols-outlined text-white text-[12px] font-bold">check</span>
                                </div>
                                <div className="flex flex-col gap-2 bg-surface-container-lowest p-stack-md rounded-xl border border-outline-variant/30 hover:shadow-[0_10px_30px_rgba(0,0,0,0.08)] hover:border-primary-fixed-dim transition-all duration-300">
                                    <div className="flex justify-between items-start flex-wrap gap-2">
                                        <h3 className="font-label-md text-label-md text-on-surface font-semibold">Bước 1: Củng cố kiến thức nền tảng BA</h3>
                                        <span className="bg-surface-container text-on-surface-variant font-label-sm text-label-sm px-2 py-1 rounded-md flex-shrink-0">Tuần 1-2</span>
                                    </div>
                                    <p className="text-secondary font-body-md text-body-md">Ôn tập lại các khái niệm cốt lõi về Business Analysis: Requirements Gathering, UML Modeling và Stakeholder Management.</p>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        <a className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-outline-variant/50 rounded-lg text-primary font-label-sm text-label-sm hover:bg-surface-container-low transition-colors" href="#">
                                            <span className="material-symbols-outlined text-[16px]">school</span>
                                            Khóa học Coursera đề xuất
                                        </a>
                                    </div>
                                </div>
                            </div>

                            {/* Step 2: Đang thực hiện */}
                            <div className="relative">
                                <div className="absolute -left-[31px] md:-left-[39px] w-6 h-6 rounded-full bg-white border-4 border-primary flex items-center justify-center shadow-sm">
                                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                                </div>
                                <div className="flex flex-col gap-2 bg-surface-container-lowest p-stack-md rounded-xl border-2 border-primary shadow-[0_10px_30px_rgba(0,0,0,0.08)] transform scale-[1.02] transition-all duration-300 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 bg-primary text-on-primary font-label-sm text-[10px] px-2 py-1 rounded-bl-lg font-bold uppercase tracking-wider">
                                        Đang thực hiện
                                    </div>
                                    <div className="flex justify-between items-start flex-wrap gap-2 pr-16">
                                        <h3 className="font-label-md text-label-md text-primary font-bold">Bước 2: Rèn luyện kỹ năng trả lời STAR</h3>
                                        <span className="bg-primary-container/10 text-primary font-label-sm text-label-sm px-2 py-1 rounded-md flex-shrink-0">Tuần 3-4</span>
                                    </div>
                                    <p className="text-secondary font-body-md text-body-md">Cấu trúc hóa các câu chuyện kinh nghiệm theo mô hình Situation - Task - Action - Result để tăng tính thuyết phục.</p>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        <Link href="/star" className="inline-flex items-center gap-1 px-4 py-2 bg-primary text-on-primary rounded-lg font-label-md text-label-md hover:bg-primary/90 transition-colors shadow-sm">
                                            <span className="material-symbols-outlined text-[18px]">build</span>
                                            Mở STAR Builder
                                        </Link>
                                    </div>
                                </div>
                            </div>

                            {/* Step 3: Sắp tới */}
                            <div className="relative">
                                <div className="absolute -left-[31px] md:-left-[39px] w-6 h-6 rounded-full bg-surface-variant border-4 border-white flex items-center justify-center shadow-sm"></div>
                                <div className="flex flex-col gap-2 bg-surface-container-lowest p-stack-md rounded-xl border border-outline-variant/30 opacity-70 hover:opacity-100 transition-opacity duration-300">
                                    <div className="flex justify-between items-start flex-wrap gap-2">
                                        <h3 className="font-label-md text-label-md text-on-surface font-semibold">Bước 3: Mô phỏng phỏng vấn nâng cao</h3>
                                        <span className="bg-surface-container text-on-surface-variant font-label-sm text-label-sm px-2 py-1 rounded-md flex-shrink-0">Tuần 5-6</span>
                                    </div>
                                    <p className="text-secondary font-body-md text-body-md">Thực hành với các kịch bản khó do AI tạo ra, tập trung vào áp lực thời gian và câu hỏi xoáy sâu chuyên môn.</p>
                                    <div className="p-3 bg-surface-container-low rounded-lg mt-2 border-l-2 border-tertiary">
                                        <p className="font-label-sm text-label-sm text-secondary flex items-start gap-2">
                                            <span className="material-symbols-outlined text-tertiary text-[16px] mt-0.5 flex-shrink-0">smart_toy</span>
                                            AI sẽ tự động tạo kịch bản dựa trên điểm yếu hiện tại của bạn trong Bước 2.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Right Column: Lịch + Tài nguyên (1/3) */}
                <div className="flex flex-col gap-stack-lg">
                    {/* Lịch luyện tập */}
                    <section className="bg-surface rounded-[24px] p-stack-md shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-outline-variant/20 flex flex-col gap-stack-md">
                        <h2 className="font-headline-md text-headline-md text-on-surface flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary" style={{fontVariationSettings: "'FILL'1"}}>calendar_month</span>
                            Lịch luyện tập
                        </h2>
                        <div className="bg-surface-container-low rounded-xl p-4 flex flex-col gap-4">
                            <div className="flex justify-between items-center">
                                <span className="font-label-md font-semibold text-on-surface">{currentMonth}</span>
                                <div className="flex gap-1">
                                    <button className="p-1 hover:bg-surface-container-high rounded text-secondary"><span className="material-symbols-outlined text-[20px]">chevron_left</span></button>
                                    <button className="p-1 hover:bg-surface-container-high rounded text-secondary"><span className="material-symbols-outlined text-[20px]">chevron_right</span></button>
                                </div>
                            </div>
                            <div className="grid grid-cols-7 gap-1 text-center font-label-sm text-label-sm text-secondary mb-2">
                                <div>T2</div><div>T3</div><div>T4</div><div>T5</div><div>T6</div><div>T7</div><div>CN</div>
                            </div>
                            <div className="grid grid-cols-7 gap-1 text-center font-label-md text-label-md">
                                {calendarDays.map((d, i) => {
                                    if (d.type === 'empty') {
                                        return <div key={i} className="p-1 text-outline font-label-sm">{d.day}</div>;
                                    }
                                    const cls = d.isToday
                                        ? 'bg-primary text-white rounded-full font-bold'
                                        : d.hasSession
                                        ? 'bg-surface-container-high rounded-full font-bold'
                                        : 'p-1';
                                    return (
                                        <div key={i} className={`p-1 relative text-center ${cls}`}>
                                            {d.day}
                                            {d.hasDot && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full"></span>}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="flex flex-col gap-3 mt-2">
                            <h3 className="font-label-md font-semibold text-on-surface">Sắp tới</h3>
                            <div className="flex items-center gap-3 p-3 bg-surface-container-lowest border border-outline-variant/30 rounded-lg hover:border-primary transition-colors cursor-pointer group">
                                <div className="w-10 h-10 rounded-lg bg-primary-container/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-on-primary transition-colors flex-shrink-0">
                                    <span className="material-symbols-outlined text-[20px]">mic</span>
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="font-label-md font-semibold text-on-surface leading-tight">Mock Interview: BA</span>
                                    <span className="font-label-sm text-label-sm text-secondary">Ngày mai, 19:00 - 45 phút</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-surface-container-lowest border border-outline-variant/30 rounded-lg hover:border-tertiary transition-colors cursor-pointer group">
                                <div className="w-10 h-10 rounded-lg bg-tertiary-container/10 flex items-center justify-center text-tertiary group-hover:bg-tertiary group-hover:text-white transition-colors flex-shrink-0">
                                    <span className="material-symbols-outlined text-[20px]">edit_document</span>
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="font-label-md font-semibold text-on-surface leading-tight">Review STAR Framework</span>
                                    <span className="font-label-sm text-label-sm text-secondary">Thứ 6, 20:00 - 30 phút</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Tài nguyên học tập */}
                    <section className="bg-surface rounded-[24px] p-stack-md shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-outline-variant/20 flex flex-col gap-stack-md">
                        <h2 className="font-headline-md text-headline-md text-on-surface flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary" style={{fontVariationSettings: "'FILL'1"}}>local_library</span>
                            Tài nguyên học tập
                        </h2>
                        <div className="flex flex-col gap-4">
                            {/* Resource 1 */}
                            <div className="group border border-outline-variant/30 rounded-xl overflow-hidden hover:shadow-[0_10px_30px_rgba(0,0,0,0.08)] hover:border-primary-fixed-dim transition-all duration-300">
                                <div className="h-24 bg-surface-container-high relative">
                                    <img alt="" className="w-full h-full object-cover opacity-60"
                                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuDO1E_uErf2UtmttKAvS-9aZ_hui44cXSRu_rv3ELAsset6nha1yHtYk_YRpJPydoGYcY-xhqSgrT8RZxbnHmnnr4BVcmPicX5Eo71ev3yR-lYmZxQL_c6v-l2e__4Obq9e0u_i-bTp1LtXxE_nJpP-vOpQypPeMN57xkT2i6y2pHj8SZZR84bb42yvLf_X_M6OrlRE680cCYW1nJI3z3jgo9McgB7Hi6ufXGILwvcxKHsm0GMJ5hrcYQzFcPD1LqQ8CI99XubKvKZK" />
                                    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded text-[10px] font-bold uppercase flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[12px]">verified</span> Affiliate
                                    </div>
                                </div>
                                <div className="p-3 flex flex-col gap-2 bg-surface-container-lowest">
                                    <h3 className="font-label-md text-label-md font-semibold text-on-surface group-hover:text-primary transition-colors line-clamp-1">Business Analysis Fundamentals</h3>
                                    <p className="font-label-sm text-label-sm text-secondary line-clamp-2">Khóa học chuyên sâu giúp ôn tập nhanh các kỹ năng BA cốt lõi.</p>
                                    <a className="text-primary font-label-sm text-label-sm font-semibold hover:underline mt-1 flex items-center gap-1" href="#">
                                        Xem chi tiết <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                                    </a>
                                </div>
                            </div>

                            {/* Resource 2 */}
                            <div className="group border border-outline-variant/30 rounded-xl overflow-hidden hover:shadow-[0_10px_30px_rgba(0,0,0,0.08)] hover:border-primary-fixed-dim transition-all duration-300">
                                <div className="h-24 bg-surface-container relative">
                                    <img alt="" className="w-full h-full object-cover opacity-60"
                                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuCGZibqGBI01PRaVGpRzwXxXRkmISWQ532qF3WbC5_2lfsQs9hKs9BavauLT9R-p8mSVYgVfHXgd7lsScyfo243UCnPjAuNuozwxj18u1hPKP-_4OnKbIUkbEf44VxI2HGILIB6zEYd_aXKJ4h9Niup5FrhtIhqAMPgmAMZwKivdDL6oHYk_kGVLzct3pMqtwEiUEdohPlHBfuOTYWMS4l5qzRTVZ8aXC4YliuUxCybKut_fu-qNKn22akrLsEOmFo5MCxsI1E8yPWk" />
                                    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded text-[10px] font-bold uppercase flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[12px]">verified</span> Affiliate
                                    </div>
                                </div>
                                <div className="p-3 flex flex-col gap-2 bg-surface-container-lowest">
                                    <h3 className="font-label-md text-label-md font-semibold text-on-surface group-hover:text-primary transition-colors line-clamp-1">Mastering the STAR Method</h3>
                                    <p className="font-label-sm text-label-sm text-secondary line-clamp-2">Khóa học ngắn hạn tập trung vào kỹ năng kể chuyện thuyết phục.</p>
                                    <a className="text-primary font-label-sm text-label-sm font-semibold hover:underline mt-1 flex items-center gap-1" href="#">
                                        Xem chi tiết <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
