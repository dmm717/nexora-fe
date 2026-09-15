"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Header from "@/components/layouts/Header";
import Footer from "@/components/layouts/Footer";
import { useCurrentUser } from '@/hooks/queries/useUser';

type StarState = 'empty' | 'loading' | 'result';

export default function Page() {
    const { data: user } = useCurrentUser();
    const isAuthenticated = !!user;

    const [starState, setStarState] = useState<StarState>('empty');
    const [rawInput, setRawInput] = useState('');
    const [copied, setCopied] = useState(false);
    const [saved, setSaved] = useState(false);

    const hasText = rawInput.trim().length > 0;

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            if (params.get('demo') === '1') {
                setRawInput('Em từng làm một dự án ở trường về quản lý thư viện. Lúc đó nhóm em có 4 người nhưng 2 bạn bỏ cuộc giữa chừng. Deadline thì sắp tới mà code chưa xong. Em phải thức đêm code bù phần của các bạn và chia lại task cho bạn còn lại. Cuối cùng tụi em cũng nộp được bài đúng hạn và cô giáo cho điểm A vì giao diện đẹp.');
                setStarState('loading');
                setTimeout(() => {
                    setStarState('result');
                }, 1800);
            }
        }
    }, []);

    const handleImprove = () => {
        if (!hasText) return;
        setStarState('loading');
        setTimeout(() => {
            setStarState('result');
        }, 1800);
    };

    const handleCopy = async () => {
        if (!isAuthenticated) return;
        const text = `Situation (Tình huống):
Trong học kỳ trước, tôi đảm nhận vai trò Trưởng nhóm phát triển phần mềm Quản lý Thư viện cho đồ án môn học. Nhóm ban đầu có 4 thành viên, với thời hạn hoàn thành dự án là 4 tuần. Tuy nhiên, khi dự án mới đi được một nửa chặng đường, 2 thành viên trong nhóm bất ngờ rút lui vì lý do cá nhân.

Task (Nhiệm vụ):
Thử thách đặt ra là tôi và 1 thành viên còn lại phải hoàn thành toàn bộ khối lượng công việc của 4 người trong 2 tuần cuối cùng để đảm bảo nộp đồ án đúng hạn, đồng thời vẫn phải duy trì chất lượng code và giao diện phần mềm.

Action (Hành động):
Để giải quyết khủng hoảng này, tôi đã thực hiện các bước sau:
- Đánh giá & Tái phân bổ: Rà soát lại toàn bộ backlog, loại bỏ các tính năng "nice-to-have" và tập trung vào các tính năng cốt lõi (Core MVP). Tôi chia lại công việc dựa trên thế mạnh của 2 người.
- Quản lý thời gian: Áp dụng phương pháp Pomodoro và thiết lập lịch làm việc cường độ cao (pair-programming vào buổi tối) để tăng tốc độ xử lý bug.
- Chủ động gánh vác: Trực tiếp tiếp quản phần backend phức tạp mà thành viên cũ để lại, đồng thời tinh chỉnh lại giao diện UI/UX để phần mềm trông chuyên nghiệp hơn.

Result (Kết quả):
Kết quả, chúng tôi đã hoàn thành và nộp dự án đúng deadline. Phần mềm hoạt động mượt mà không có bug nghiêm trọng. Giảng viên đã đánh giá xuất sắc (Điểm A) và đặc biệt khen ngợi giao diện người dùng trực quan. Quan trọng hơn, tôi học được kỹ năng quản lý khủng hoảng và khả năng làm việc dưới áp lực cao.`;
        
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };

    const handleSave = () => {
        if (!isAuthenticated) return;
        setSaved(true);
        setTimeout(() => setSaved(false), 1500);
    };

    return (
        <div className="bg-background text-on-surface font-body-md antialiased selection:bg-primary-container selection:text-on-primary-container min-h-screen flex flex-col">
            <Header />

            <main className="flex-grow pt-24 pb-stack-lg max-w-container-max mx-auto w-full px-margin-mobile md:px-margin-desktop grid grid-cols-1 lg:grid-cols-12 gap-gutter" data-nx-stagger>
                {/* Header */}
                <div className="lg:col-span-12 mb-stack-md">
                    <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-stack-sm">
                        Xây dựng câu trả lời STAR
                    </h1>
                    <p className="font-body-lg text-body-lg text-on-surface-variant max-w-3xl">
                        Biến câu chuyện kinh nghiệm của bạn thành một câu trả lời phỏng vấn chuyên nghiệp, có cấu trúc chặt chẽ và sức thuyết phục cao với trợ lý AI.
                    </p>
                </div>

                {/* Left Column: Input */}
                <div className="lg:col-span-5 flex flex-col gap-stack-md">
                    <div className="bg-surface-container-lowest rounded-[24px] p-stack-md shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-outline-variant/30 flex flex-col h-full">
                        <div className="flex items-center gap-2 mb-stack-md">
                            <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 0" }}>edit_document</span>
                            <h2 className="font-headline-md text-[20px] font-semibold text-on-surface">Câu trả lời thô</h2>
                        </div>
                        <p className="font-body-md text-body-md text-on-surface-variant mb-stack-sm">
                            Nhập câu chuyện hoặc kinh nghiệm bạn muốn kể. Đừng quá lo lắng về câu cú, AI sẽ giúp bạn sắp xếp lại.
                        </p>
                        <textarea 
                            value={rawInput}
                            onChange={(e) => setRawInput(e.target.value)}
                            className="w-full flex-grow rounded-xl border border-outline-variant bg-surface-bright p-4 font-body-md text-body-md text-on-surface focus:ring-2 focus:ring-primary focus:border-primary transition-all resize-none min-h-[300px]"
                            placeholder="Nhập câu chuyện của bạn ở đây... Ví dụ: Em từng làm một dự án ở trường về quản lý thư viện..."></textarea>
                        <div className="mt-stack-md flex justify-end">
                            <button 
                                onClick={handleImprove}
                                disabled={!hasText || starState === 'loading'}
                                className={`font-label-md text-label-md px-6 py-3 rounded-xl font-medium transition-colors shadow-sm flex items-center gap-2 ${
                                    hasText && starState !== 'loading' 
                                        ? 'bg-primary text-on-primary hover:bg-primary/90 cursor-pointer' 
                                        : 'bg-primary text-on-primary opacity-50 cursor-not-allowed'
                                }`}>
                                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>auto_fix_high</span>
                                Cải thiện câu trả lời
                            </button>
                        </div>
                    </div>

                    {/* Mẹo viết câu trả lời tốt */}
                    <div className="bg-surface-container-low rounded-xl p-stack-md border border-primary-fixed">
                        <h3 className="font-label-md text-label-md text-primary font-bold mb-3 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[18px]">lightbulb</span>
                            Mẹo viết câu trả lời tốt
                        </h3>
                        <ul className="space-y-2 font-body-md text-[14px] text-on-surface-variant">
                            <li className="flex items-start gap-2">
                                <span className="material-symbols-outlined text-[16px] text-primary mt-0.5 flex-shrink-0">check_circle</span>
                                Tập trung vào <strong>hành động cá nhân</strong> (dùng "Tôi", hạn chế dùng "Chúng tôi").
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="material-symbols-outlined text-[16px] text-primary mt-0.5 flex-shrink-0">check_circle</span>
                                Đưa ra các <strong>con số cụ thể</strong> để chứng minh kết quả (ví dụ: tăng 20%, quản lý 5 người).
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="material-symbols-outlined text-[16px] text-primary mt-0.5 flex-shrink-0">check_circle</span>
                                Nêu bật <strong>bài học rút ra</strong> nếu kết quả không như mong đợi.
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Right Column: STAR Output */}
                <div className="lg:col-span-7 relative">
                    <div className="bg-surface-container-lowest rounded-[24px] p-stack-md shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-primary-fixed h-full bg-gradient-to-br from-white to-surface-container-low/30 relative overflow-hidden">
                        
                        {/* AI Accent Line */}
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-tertiary"></div>

                        <div className="flex items-center justify-between mb-stack-lg pl-3">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
                                <h2 className="font-headline-md text-[20px] font-semibold text-primary">Gợi ý theo STAR</h2>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={handleCopy} className="p-2 text-on-surface-variant hover:bg-surface-container-high rounded-full transition-colors" title="Sao chép">
                                    <span className="material-symbols-outlined text-[20px]">{copied ? 'check' : 'content_copy'}</span>
                                </button>
                                <button onClick={handleSave} className="p-2 text-on-surface-variant hover:bg-surface-container-high rounded-full transition-colors" title="Lưu lại">
                                    <span className="material-symbols-outlined text-[20px]">{saved ? 'bookmark_added' : 'bookmark'}</span>
                                </button>
                            </div>
                        </div>

                        {/* STATE: Empty */}
                        {starState === 'empty' && (
                        <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                            <div className="w-20 h-20 bg-primary-container/10 rounded-full flex items-center justify-center mb-4">
                                <span className="material-symbols-outlined text-primary text-[40px]" style={{ fontVariationSettings: "'FILL' 0" }}>magic_button</span>
                            </div>
                            <h3 className="font-headline-md text-[20px] text-on-surface mb-2">Sẵn sàng tối ưu câu trả lời của bạn</h3>
                            <p className="font-body-md text-on-surface-variant max-w-md">
                                Hãy nhập câu trả lời thô bên trái và nhấn "Cải thiện câu trả lời" để AI giúp bạn cấu trúc theo phương pháp STAR.
                            </p>
                        </div>
                        )}

                        {/* STATE: Loading */}
                        {starState === 'loading' && (
                        <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                            <div className="w-20 h-20 bg-primary-container/10 rounded-full flex items-center justify-center mb-4">
                                <span className="material-symbols-outlined text-primary text-[40px] animate-spin">progress_activity</span>
                            </div>
                            <h3 className="font-headline-md text-[20px] text-on-surface mb-2">AI đang xử lý...</h3>
                            <p className="font-body-md text-on-surface-variant max-w-md">
                                Hệ thống đang phân tích và cấu trúc lại câu trả lời của bạn theo mô hình STAR.
                            </p>
                        </div>
                        )}

                        {/* STATE: Result */}
                        {starState === 'result' && (
                        <div className="space-y-stack-md pl-3">
                            {/* Situation */}
                            <div className="relative pl-6 border-l-2 border-outline-variant/30 pb-4">
                                <div className="absolute -left-[13px] top-0 bg-surface-container-lowest border-2 border-primary text-primary w-6 h-6 rounded-full flex items-center justify-center font-bold text-[12px]">S</div>
                                <h3 className="font-label-md text-label-md font-bold text-on-surface mb-1">Situation (Tình huống)</h3>
                                <p className="font-body-md text-[14px] text-on-surface-variant bg-surface-container px-4 py-3 rounded-lg border border-outline-variant/20">
                                    Trong học kỳ trước, tôi đảm nhận vai trò Trưởng nhóm phát triển phần mềm Quản lý Thư viện cho đồ án môn học. Nhóm ban đầu có 4 thành viên, với thời hạn hoàn thành dự án là 4 tuần. Tuy nhiên, khi dự án mới đi được một nửa chặng đường, 2 thành viên trong nhóm bất ngờ rút lui vì lý do cá nhân.
                                </p>
                            </div>

                            {/* Task */}
                            <div className="relative pl-6 border-l-2 border-outline-variant/30 pb-4">
                                <div className="absolute -left-[13px] top-0 bg-surface-container-lowest border-2 border-tertiary text-tertiary w-6 h-6 rounded-full flex items-center justify-center font-bold text-[12px]">T</div>
                                <h3 className="font-label-md text-label-md font-bold text-on-surface mb-1">Task (Nhiệm vụ)</h3>
                                <p className="font-body-md text-[14px] text-on-surface-variant bg-tertiary-fixed/30 px-4 py-3 rounded-lg border border-tertiary/20">
                                    Thử thách đặt ra là tôi và 1 thành viên còn lại phải hoàn thành toàn bộ khối lượng công việc của 4 người trong 2 tuần cuối cùng để đảm bảo nộp đồ án đúng hạn, đồng thời vẫn phải duy trì chất lượng code và giao diện phần mềm.
                                </p>
                            </div>

                            {/* Action */}
                            <div className="relative pl-6 border-l-2 border-outline-variant/30 pb-4">
                                <div className="absolute -left-[13px] top-0 bg-surface-container-lowest border-2 border-secondary text-secondary w-6 h-6 rounded-full flex items-center justify-center font-bold text-[12px]">A</div>
                                <h3 className="font-label-md text-label-md font-bold text-on-surface mb-1">Action (Hành động)</h3>
                                <div className="font-body-md text-[14px] text-on-surface-variant bg-secondary-fixed/30 px-4 py-3 rounded-lg border border-outline-variant/20 space-y-2">
                                    <p>Để giải quyết khủng hoảng này, tôi đã thực hiện các bước sau:</p>
                                    <ul className="list-disc pl-5 space-y-1">
                                        <li><strong>Đánh giá &amp; Tái phân bổ:</strong> Rà soát lại toàn bộ backlog, loại bỏ các tính năng "nice-to-have" và tập trung vào các tính năng cốt lõi (Core MVP). Tôi chia lại công việc dựa trên thế mạnh của 2 người.</li>
                                        <li><strong>Quản lý thời gian:</strong> Áp dụng phương pháp Pomodoro và thiết lập lịch làm việc cường độ cao (pair-programming vào buổi tối) để tăng tốc độ xử lý bug.</li>
                                        <li><strong>Chủ động gánh vác:</strong> Trực tiếp tiếp quản phần backend phức tạp mà thành viên cũ để lại, đồng thời tinh chỉnh lại giao diện UI/UX để phần mềm trông chuyên nghiệp hơn.</li>
                                    </ul>
                                </div>
                            </div>

                            {/* Result */}
                            <div className="relative pl-6">
                                <div className="absolute -left-[13px] top-0 bg-primary text-on-primary w-6 h-6 rounded-full flex items-center justify-center font-bold text-[12px] shadow-sm">R</div>
                                <h3 className="font-label-md text-label-md font-bold text-on-surface mb-1">Result (Kết quả)</h3>
                                <p className="font-body-md text-[14px] text-on-surface-variant bg-primary-container/10 px-4 py-3 rounded-lg border border-primary/20">
                                    Kết quả, chúng tôi đã hoàn thành và nộp dự án đúng deadline. Phần mềm hoạt động mượt mà không có bug nghiêm trọng. Giảng viên đã đánh giá xuất sắc (Điểm A) và đặc biệt khen ngợi giao diện người dùng trực quan. Quan trọng hơn, tôi học được kỹ năng quản lý khủng hoảng và khả năng làm việc dưới áp lực cao.
                                </p>
                            </div>
                        </div>
                        )}
                    </div>

                    {/* Guest blur overlay */}
                    {!isAuthenticated && starState === 'result' && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center p-6 rounded-[24px] overflow-hidden">
                        <div className="absolute inset-0 bg-surface/40 backdrop-blur-md rounded-[24px]"></div>
                        <div className="relative z-20 bg-surface-container-lowest px-8 py-10 rounded-3xl shadow-2xl border border-outline-variant/30 text-center max-w-md w-full">
                            <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-primary-container/30 flex items-center justify-center">
                                <span className="material-symbols-outlined text-primary text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
                            </div>
                            <h3 className="font-headline-md text-[26px] font-bold text-on-surface mb-3 leading-tight">Tính năng giới hạn</h3>
                            <p className="font-body-md text-[14px] text-on-surface-variant mb-6 leading-relaxed">
                                Vui lòng đăng nhập để sử dụng tính năng tối ưu câu trả lời bằng AI
                            </p>
                            <Link href="/auth?mode=login"
                                className="w-full h-12 bg-primary text-on-primary font-label-md text-label-md rounded-xl font-semibold hover:bg-primary/90 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2">
                                <span className="material-symbols-outlined text-[20px]">login</span>
                                Đăng nhập ngay
                            </Link>
                        </div>
                    </div>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
}
