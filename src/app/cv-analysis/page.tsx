"use client";

import React, { useState } from "react";
import Link from "next/link";
import Header from "@/components/layouts/Header";
import Footer from "@/components/layouts/Footer";
import { useCurrentUser } from '@/hooks/queries/useUser';
import { useScrollReveal } from "@/hooks/useScrollReveal";

export default function Page() {
    const [isAnalyzed, setIsAnalyzed] = useState(false);
    const [hasFile, setHasFile] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const { data: user } = useCurrentUser();
    const isAuthenticated = !!user;

    useScrollReveal();

    return (
        <>
            <Header />
            <main className="flex-grow pt-24 md:pt-28 pb-stack-lg px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto w-full">


        {/*  ============== KẾT QUẢ PHÂN TÍCH ==============  */}
        {isAnalyzed && (
        <section id="analysis-result" className="nx-fade-up">
            {/*  Header  */}
            <header className="mb-stack-lg flex flex-col md:flex-row md:items-end justify-between gap-stack-md">
                <div>
                    <p className="font-label-md text-label-md text-secondary mb-1 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">badge</span>
                        Vị trí: Fresher Business Analyst
                    </p>
                    <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface">
                        Kết quả phân tích độ phù hợp</h1>
                </div>
                <div className="flex gap-stack-sm flex-wrap">
                    {!isAuthenticated ? (
                        <Link className="flex items-center gap-2 bg-surface text-primary border border-primary px-4 py-2 rounded-lg font-label-md text-label-md hover:bg-surface-container-low transition-colors shadow-sm"
                            href="/auth?mode=login">
                            <span className="material-symbols-outlined text-[18px]">login</span>
                            Đăng nhập để chỉnh sửa
                        </Link>
                    ) : (
                        <>
                            <Link className="flex items-center gap-2 bg-surface text-primary border border-primary px-4 py-2 rounded-lg font-label-md text-label-md hover:bg-surface-container-low transition-colors shadow-sm"
                                href="#">
                                <span className="material-symbols-outlined text-[18px]">edit_document</span>
                                Chỉnh sửa CV
                            </Link>
                            <Link className="flex items-center gap-2 bg-primary text-on-primary px-4 py-2 rounded-lg font-label-md text-label-md hover:bg-primary-container shadow-md transition-colors"
                                href="/interview">
                                <span className="material-symbols-outlined text-[18px]">calendar_add_on</span>
                                Tạo kế hoạch phỏng vấn
                            </Link>
                        </>
                    )}
                </div>
            </header>

            {/*  Bento Grid  */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
                {/*  Cột 1: Score & Keywords  */}
                <div className="flex flex-col gap-gutter lg:col-span-1">
                    {/*  Tổng quan điểm  */}
                    <div
                        className="bg-surface-container-lowest rounded-2xl p-stack-md shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-surface-container-high relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <span className="material-symbols-outlined text-[100px] text-primary">analytics</span>
                        </div>
                        <h2 className="font-headline-md text-headline-md text-on-surface mb-stack-sm">Tổng quan</h2>
                        <p className="font-body-md text-body-md text-secondary mb-stack-lg">Mức độ phù hợp với JD</p>
                        <div className="flex justify-center items-center relative mb-stack-md">
                            <div
                                className="w-40 h-40 rounded-full border-[12px] border-surface-container flex items-center justify-center relative">
                                <div className="absolute inset-0 rounded-full"
                                    style={{ background: 'conic-gradient(#4f46e5 73%, transparent 0)', borderRadius: '50%', padding: '12px', WebkitMask: 'radial-gradient(transparent 55%, black 56%)', mask: 'radial-gradient(transparent 55%, black 56%)' }}>
                                </div>
                                <div className="flex flex-col items-center">
                                    <span className="font-display text-display text-primary font-bold">73<span
                                            className="text-headline-md">%</span></span>
                                </div>
                            </div>
                        </div>
                        <div className="bg-surface-container-low rounded-xl p-3 text-center">
                            <p
                                className="font-label-md text-label-md text-on-surface-variant flex items-center justify-center gap-1">
                                <span className="material-symbols-outlined text-primary text-[16px]">check_circle</span>
                                Khá tốt - Cần tối ưu thêm từ khóa
                            </p>
                        </div>
                    </div>

                    {/*  Phân tích từ khóa  */}
                    <div className="glass-card rounded-2xl p-stack-md">
                        <h2
                            className="font-headline-md text-headline-md text-on-surface mb-stack-md flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">key</span>
                            Phân tích từ khóa
                        </h2>
                        <div className="mb-stack-md">
                            <h3
                                className="font-label-md text-label-md text-secondary mb-2 flex items-center gap-1">
                                <span className="material-symbols-outlined text-[16px] text-[#16a34a]">check</span>
                                Từ khóa khớp (Matched)
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                <span className="bg-[#dcfce7] text-[#166534] px-3 py-1 rounded-full font-label-sm text-label-sm">SQL</span>
                                <span className="bg-[#dcfce7] text-[#166534] px-3 py-1 rounded-full font-label-sm text-label-sm">REST API</span>
                                <span className="bg-[#dcfce7] text-[#166534] px-3 py-1 rounded-full font-label-sm text-label-sm">Git</span>
                                <span className="bg-[#dcfce7] text-[#166534] px-3 py-1 rounded-full font-label-sm text-label-sm">Requirement Gathering</span>
                                <span className="bg-[#dcfce7] text-[#166534] px-3 py-1 rounded-full font-label-sm text-label-sm">Teamwork</span>
                            </div>
                        </div>
                        <div>
                            <h3
                                className="font-label-md text-label-md text-secondary mb-2 flex items-center gap-1">
                                <span className="material-symbols-outlined text-[16px] text-error">warning</span>
                                Từ khóa còn thiếu (Missing)
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                <span className="bg-error-container text-on-error-container px-3 py-1 rounded-full font-label-sm text-label-sm border border-error/20">Banking Domain</span>
                                <span className="bg-error-container text-on-error-container px-3 py-1 rounded-full font-label-sm text-label-sm border border-error/20">BPMN</span>
                                <span className="bg-error-container text-on-error-container px-3 py-1 rounded-full font-label-sm text-label-sm border border-error/20">Stakeholder Management</span>
                                <span className="bg-error-container text-on-error-container px-3 py-1 rounded-full font-label-sm text-label-sm border border-error/20">Process Modeling</span>
                                <span className="bg-error-container text-on-error-container px-3 py-1 rounded-full font-label-sm text-label-sm border border-error/20">KPI</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/*  Cột 2 & 3: Chi tiết + Gợi ý  */}
                <div className="flex flex-col gap-gutter lg:col-span-2">
                    {/*  Đánh giá chi tiết  */}
                    <div
                        className="bg-surface-container-lowest rounded-2xl p-stack-md shadow-[0px_4px_20px_rgba(0,0,0,0.05)] h-full">
                        <h2
                            className="font-headline-md text-headline-md text-on-surface mb-stack-md flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">fact_check</span>
                            Đánh giá chi tiết
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-md">
                            {/*  Điểm mạnh  */}
                            <div className="bg-surface-container-low rounded-xl p-stack-md border border-surface-variant">
                                <h3
                                    className="font-label-md text-label-md text-on-surface mb-3 flex items-center gap-2">
                                    <span
                                        className="material-symbols-outlined text-primary bg-primary-fixed p-1 rounded-full text-[16px]">thumb_up</span>
                                    Điểm mạnh
                                </h3>
                                <ul className="space-y-3 font-body-md text-body-md text-secondary">
                                    <li className="flex items-start gap-2">
                                        <span className="material-symbols-outlined text-[18px] text-primary mt-0.5">arrow_right</span>
                                        <span>Có nền tảng kỹ thuật cơ bản (SQL, API) phù hợp với BA.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="material-symbols-outlined text-[18px] text-primary mt-0.5">arrow_right</span>
                                        <span>Đã có kinh nghiệm tham gia các dự án học thuật thực tế.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="material-symbols-outlined text-[18px] text-primary mt-0.5">arrow_right</span>
                                        <span>Bố cục CV trình bày rõ ràng, dễ đọc, mạch lạc.</span>
                                    </li>
                                </ul>
                            </div>
                            {/*  Điểm cần cải thiện  */}
                            <div className="bg-[#fff1f2] rounded-xl p-stack-md border border-[#ffe4e6]">
                                <h3
                                    className="font-label-md text-label-md text-on-surface mb-3 flex items-center gap-2">
                                    <span
                                        className="material-symbols-outlined text-error bg-error-container p-1 rounded-full text-[16px]">trending_up</span>
                                    Điểm cần cải thiện
                                </h3>
                                <ul className="space-y-3 font-body-md text-body-md text-secondary">
                                    <li className="flex items-start gap-2">
                                        <span className="material-symbols-outlined text-[18px] text-error mt-0.5">arrow_right</span>
                                        <span>Thiếu ví dụ thực chiến trong môi trường doanh nghiệp.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="material-symbols-outlined text-[18px] text-error mt-0.5">arrow_right</span>
                                        <span>Chưa thể hiện kết quả công việc bằng số liệu cụ thể (Metrics/Impact).</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="material-symbols-outlined text-[18px] text-error mt-0.5">arrow_right</span>
                                        <span>Cần làm rõ hơn vai trò cá nhân trong các dự án nhóm.</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/*  AI Suggestions  */}
                    <div className="ai-feedback-block rounded-2xl p-stack-md shadow-[0px_4px_20px_rgba(0,0,0,0.05)]">
                        <h2
                            className="font-headline-md text-headline-md text-on-surface mb-stack-md flex items-center gap-2">
                            <span className="material-symbols-outlined ai-gradient-text"
                                style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                            <span className="ai-gradient-text font-bold">Nexora AI</span> Gợi ý chỉnh sửa CV
                        </h2>
                        <div className="space-y-stack-sm">
                            <div
                                className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-outline-variant/30 hover:border-primary-fixed transition-colors">
                                <div className="flex items-start gap-3">
                                    <div
                                        className="bg-primary-container text-on-primary-container w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
                                        1</div>
                                    <div>
                                        <h4 className="font-label-md text-label-md text-on-surface mb-1">Bổ sung Impact
                                            (Tác động) bằng số liệu</h4>
                                        <p className="font-body-md text-body-md text-secondary">Thay vì viết "Tham gia lấy
                                            yêu cầu", hãy sửa thành: "Thu thập yêu cầu từ 3 phòng ban, giúp giảm 15%
                                            thời gian xử lý quy trình nội bộ".</p>
                                    </div>
                                </div>
                            </div>
                            <div
                                className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-outline-variant/30 hover:border-primary-fixed transition-colors">
                                <div className="flex items-start gap-3">
                                    <div
                                        className="bg-primary-container text-on-primary-container w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
                                        2</div>
                                    <div>
                                        <h4 className="font-label-md text-label-md text-on-surface mb-1">Cấu trúc lại
                                            theo phương pháp STAR</h4>
                                        <p className="font-body-md text-body-md text-secondary">Mô tả dự án học thuật theo
                                            dạng: <strong className="text-on-surface">S</strong>ituation (Tình huống) -
                                            <strong className="text-on-surface">T</strong>ask (Nhiệm vụ) -
                                            <strong className="text-on-surface">A</strong>ction (Hành động) -
                                            <strong className="text-on-surface">R</strong>esult (Kết quả).
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div
                                className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-outline-variant/30 hover:border-primary-fixed transition-colors">
                                <div className="flex items-start gap-3">
                                    <div
                                        className="bg-primary-container text-on-primary-container w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
                                        3</div>
                                    <div>
                                        <h4 className="font-label-md text-label-md text-on-surface mb-1">Lồng ghép từ
                                            khóa chuyên ngành</h4>
                                        <p className="font-body-md text-body-md text-secondary">Bổ sung các thuật ngữ như
                                            <span className="bg-surface-container px-2 py-0.5 rounded text-sm">BPMN</span>,
                                            <span className="bg-surface-container px-2 py-0.5 rounded text-sm">Process
                                                Modeling</span> vào phần kỹ năng hoặc mô tả công việc để tăng tỷ lệ pass
                                            vòng lọc hồ sơ.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
        )}

        {/*  ============== FORM UPLOAD (khu vực bắt đầu) ==============  */}
        {!isAnalyzed && (
        <section id="upload-section" data-nx-section className="space-y-stack-md flex flex-col mx-auto max-w-4xl w-full">
            <div>
                <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-stack-sm">
                    Phân tích độ phù hợp</h1>
                <p className="font-body-md text-body-md text-on-surface-variant">Tải lên CV của bạn và mô tả công việc
                    (JD) để Nexora AI đánh giá mức độ tương thích và đưa ra gợi ý tối ưu.</p>
            </div>

            {/*  Upload CV Card  */}
            <div className="glass-panel rounded-[24px] p-stack-md flex flex-col gap-stack-sm relative overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="font-headline-md text-headline-md text-on-surface text-[18px]">1. Tải lên CV</h3>
                    <span
                        className="bg-surface-container-highest text-on-surface-variant px-2 py-1 rounded-full font-label-sm text-label-sm">PDF,
                        DOCX</span>
                </div>
                <div 
                    className={`border-2 border-dashed rounded-xl p-stack-md flex flex-col items-center justify-center text-center gap-stack-sm transition-colors cursor-pointer h-[160px] ${
                        isDragging ? 'border-primary bg-primary-container/10' : 'border-outline-variant hover:border-primary bg-surface/50'
                    }`}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                    onDrop={(e) => { e.preventDefault(); setIsDragging(false); setHasFile(true); }}
                    onClick={() => setHasFile(true)}
                >
                    <div className="bg-primary-container/10 p-3 rounded-full text-primary mb-1">
                        <span className="material-symbols-outlined text-[32px]">upload_file</span>
                    </div>
                    <p className="font-label-md text-label-md text-on-surface font-semibold">Kéo thả file hoặc nhấn để
                        chọn</p>
                    <p className="font-body-md text-body-md text-on-surface-variant text-[13px]">Dung lượng tối đa 5MB</p>
                </div>
                {hasFile && (
                <div
                    className="border border-primary-fixed bg-surface-container-low rounded-xl p-3 flex items-center justify-between mt-2"
                >
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary">description</span>
                        <div>
                            <p className="font-label-md text-label-md text-on-surface">Hoang_Quoc_Bao_CV.pdf</p>
                            <p className="font-body-md text-body-md text-on-surface-variant text-[12px]">1.2 MB</p>
                        </div>
                    </div>
                    <button className="text-error hover:bg-error-container rounded-full p-1 transition-colors"
                        onClick={(e) => { e.stopPropagation(); setHasFile(false); }}>
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
                )}
            </div>

            {/*  JD Card  */}
            <div className="glass-panel rounded-[24px] p-stack-md flex flex-col gap-stack-sm">
                <h3 className="font-headline-md text-headline-md text-on-surface text-[18px]">2. Mô tả công việc (JD)</h3>
                <textarea
                    className="w-full min-h-[180px] bg-surface-container-low border border-outline-variant rounded-xl p-4 font-body-md text-body-md text-on-surface focus:ring-2 focus:ring-primary-fixed-dim focus:border-primary transition-shadow resize-y"
                    placeholder="Dán mô tả công việc vào đây... Ví dụ: Vị trí Business Analyst tại ngân hàng ABC, yêu cầu 2 năm kinh nghiệm BPMN, Stakeholder Management..."></textarea>
            </div>

            {/*  Submit  */}
            <button
                className={`w-full font-label-md text-label-md font-bold rounded-xl py-3 px-4 shadow-md transition-all duration-200 flex justify-center items-center gap-2 ${
                    hasFile 
                        ? 'bg-primary text-on-primary hover:shadow-lg hover:bg-on-primary-fixed-variant active:scale-95 cursor-pointer' 
                        : 'bg-surface-container-high text-on-surface-variant cursor-not-allowed opacity-70'
                }`}
                onClick={() => {
                    if (hasFile) {
                        setIsAnalyzed(true);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                }}
            >
                <span className="material-symbols-outlined">auto_awesome</span>
                Phân tích ngay với AI
            </button>
        </section>
        )}
    
            </main>
            <Footer />
        </>
    );
}
