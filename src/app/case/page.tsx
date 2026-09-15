"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Header from "@/components/layouts/Header";
import Footer from "@/components/layouts/Footer";
import { useCurrentUser } from '@/hooks/queries/useUser';

// Hardcoded case data from case-data.js
const NexoraCaseLibrary: Record<string, any> = {
    'ekyc-onboarding': {
        id: 'ekyc-onboarding',
        title: 'Luồng onboarding khách hàng mới (eKYC)',
        category: 'Ngân hàng',
        difficulty: 'Trung bình',
        duration: '45 phút',
        description: 'Phân tích và tối ưu hóa tỷ lệ drop-off trong quá trình định danh điện tử của ứng dụng Mobile Banking.',
        questions: [
            {
                title: 'Bạn nên bắt đầu phân tích luồng eKYC hiện tại bằng cách nào?',
                helper: 'Chọn cách tiếp cận giúp hiểu hành trình người dùng, dữ liệu và các bên liên quan.',
                options: [
                    'Thiết kế ngay màn hình mới để rút ngắn thời gian triển khai.',
                    'Vẽ lại journey end-to-end, thu thập funnel data và phỏng vấn các nhóm liên quan.',
                    'Chỉ xem log lỗi kỹ thuật vì drop-off luôn đến từ hệ thống.',
                    'Tăng ưu đãi mở tài khoản trước khi biết người dùng rời ở bước nào.'
                ],
                correctAnswer: '1',
                explanation: 'Cần hiểu toàn bộ journey, dữ liệu định lượng và bối cảnh vận hành trước khi kết luận nguyên nhân.'
            },
            {
                title: 'Cách tốt nhất để xác định nguyên nhân chính gây drop-off trong eKYC là gì?',
                helper: 'Chọn phương án giúp kiểm chứng giả thuyết và ưu tiên vấn đề.',
                options: [
                    'So sánh tỷ lệ rời từng bước, xem replay/log lỗi và kiểm chứng bằng phỏng vấn người dùng.',
                    'Hỏi một quản lý sản phẩm rồi chọn nguyên nhân họ nghi ngờ nhất.',
                    'Giả định người dùng rời vì form dài và bỏ qua bước phân tích.',
                    'Chỉ xem tổng số người hoàn tất trong tháng gần nhất.'
                ],
                correctAnswer: '0',
                explanation: 'Phân tích theo bước kết hợp dữ liệu hành vi và insight định tính giúp tìm nguyên nhân có bằng chứng.'
            },
            {
                title: 'Giải pháp nào phù hợp nhất để giảm drop-off nhưng vẫn giữ yêu cầu tuân thủ?',
                helper: 'Cân nhắc trải nghiệm người dùng, độ chính xác và chi phí triển khai.',
                options: [
                    'Bỏ bước chụp giấy tờ để người dùng hoàn tất nhanh hơn.',
                    'Cho phép tiếp tục từ bước dang dở, hướng dẫn lỗi rõ ràng và tối ưu chất lượng ảnh đầu vào.',
                    'Ẩn toàn bộ thông báo lỗi để người dùng không thấy quy trình phức tạp.',
                    'Yêu cầu tất cả người dùng ra chi nhánh để xác minh lại.'
                ],
                correctAnswer: '1',
                explanation: 'Giải pháp tốt giảm ma sát nhưng vẫn giữ kiểm soát nhận diện và tuân thủ.'
            },
            {
                title: 'Bạn nên ưu tiên các giải pháp eKYC theo tiêu chí nào?',
                helper: 'Chọn phương pháp cân bằng tác động và nguồn lực.',
                options: [
                    'Ưu tiên giải pháp do đội kỹ thuật thích nhất.',
                    'Ưu tiên theo impact, effort, risk tuân thủ và mức tự tin của dữ liệu.',
                    'Làm tất cả cùng lúc để không bỏ sót ý tưởng.',
                    'Chỉ chọn giải pháp có giao diện đẹp nhất.'
                ],
                correctAnswer: '1',
                explanation: 'Impact-effort kèm rủi ro tuân thủ giúp ra quyết định thực tế và tránh tối ưu lệch.'
            },
            {
                title: 'Bộ chỉ số nào nên dùng để đo hiệu quả quy trình eKYC mới?',
                helper: 'Chọn nhóm chỉ số chính, chỉ số cảnh báo và kế hoạch thử nghiệm.',
                options: [
                    'Chỉ đo số lượt tải ứng dụng.',
                    'Tỷ lệ hoàn tất eKYC, drop-off từng bước, thời gian hoàn tất, lỗi xác minh và fraud/false approve.',
                    'Chỉ đo số người nhấn nút bắt đầu eKYC.',
                    'Chỉ đo NPS sau khi người dùng đã mở tài khoản.'
                ],
                correctAnswer: '1',
                explanation: 'Cần vừa đo conversion, chất lượng vận hành, vừa theo dõi rủi ro nhận diện.'
            }
        ]
    },
    'order-crisis': {
        id: 'order-crisis',
        title: 'Xử lý khủng hoảng đơn hàng bị hủy hàng loạt',
        category: 'eCommerce',
        difficulty: 'Khó',
        duration: '60 phút',
        description: 'Hệ thống gặp lỗi trong ngày Mega Sale dẫn đến 10.000 đơn hàng bị hủy nhầm. Đề xuất phương án xử lý kỹ thuật và truyền thông.',
        questions: [
            {
                title: 'Trong 30 phút đầu tiên, bạn cần xác minh điều gì trước?',
                helper: 'Chọn thông tin giúp khoanh vùng sự cố và giảm thiệt hại.',
                options: [
                    'Số lượng đơn bị ảnh hưởng, nguyên nhân kích hoạt, thời điểm lỗi và trạng thái thanh toán/tồn kho.',
                    'Mẫu banner xin lỗi khách hàng.',
                    'Danh sách nhân sự cần họp vào tuần sau.',
                    'Doanh thu cả năm của sàn.'
                ],
                correctAnswer: '0',
                explanation: 'Cần khóa phạm vi ảnh hưởng và trạng thái dữ liệu trước khi phục hồi hoặc truyền thông rộng.'
            }
        ]
    },
    'ride-matching': {
        id: 'ride-matching',
        title: 'Tối ưu hóa thuật toán ghép cuốc xe',
        category: 'Logistics',
        difficulty: 'Trung bình',
        duration: '45 phút',
        description: 'Xây dựng logic ghép đơn hàng giao nhận trong thời gian thực để giảm thiểu tỷ lệ xe chạy rỗng.',
        questions: [
            {
                title: 'Bạn nên định nghĩa bài toán ghép cuốc xe như thế nào?',
                helper: 'Chọn cách nêu mục tiêu và ràng buộc vận hành.',
                options: [
                    'Chỉ tối ưu khoảng cách ngắn nhất giữa tài xế và điểm nhận.',
                    'Tối ưu tổng chi phí/thời gian rỗng trong các ràng buộc SLA, năng lực xe, vị trí và trạng thái tài xế.',
                    'Luôn ghép đơn cho tài xế gần nhất bất kể loại đơn.',
                    'Chỉ ưu tiên tài xế có điểm đánh giá cao nhất.'
                ],
                correctAnswer: '1',
                explanation: 'Bài toán matching cần mục tiêu tối ưu rõ và các ràng buộc vận hành, không chỉ khoảng cách.'
            }
        ]
    }
};

function CaseContent() {
    const searchParams = useSearchParams();
    const id = searchParams.get('id');
    const { data: user } = useCurrentUser();

    const [caseData, setCaseData] = useState<any>(null);
    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [isComplete, setIsComplete] = useState(false);
    const [showError, setShowError] = useState(false);
    const [feedback, setFeedback] = useState<any>(null); // { isCorrect: boolean, text: string }

    useEffect(() => {
        if (id && NexoraCaseLibrary[id]) {
            setCaseData(NexoraCaseLibrary[id]);
        } else {
            setCaseData(undefined); // undefined means error/not found
        }
    }, [id]);

    if (caseData === undefined) {
        return (
            <section className="mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-2xl flex-col items-center justify-center px-margin-mobile py-12 text-center md:px-margin-desktop">
                <div className="grid h-16 w-16 place-items-center rounded-2xl bg-error-container text-error">
                    <span className="material-symbols-outlined text-[36px]">search_off</span>
                </div>
                <h1 className="mt-6 font-headline-lg text-headline-lg-mobile text-on-surface md:text-headline-lg">Không tìm thấy case này</h1>
                <p className="mt-3 max-w-[58ch] text-body-md text-on-surface-variant">Case có thể đã được cập nhật hoặc đường dẫn không còn hợp lệ.</p>
                <Link href="/scenarios"
                    className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-label-md font-label-md text-on-primary hover:bg-primary-container">
                    Quay lại Kho tình huống
                </Link>
            </section>
        );
    }

    if (!caseData) return null; // loading

    if (isComplete) {
        let correctCount = 0;
        caseData.questions.forEach((q: any, i: number) => {
            if (answers[i]?.toString() === q.correctAnswer) correctCount++;
        });
        const total = caseData.questions.length;
        const score = Math.round((correctCount / total) * 100);

        return (
            <section className="mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-3xl flex-col items-center justify-center px-margin-mobile py-12 text-center md:px-margin-desktop">
                <div className="grid h-16 w-16 place-items-center rounded-2xl bg-primary-fixed text-primary">
                    <span className="material-symbols-outlined text-[36px]">task_alt</span>
                </div>
                <h1 className="mt-6 font-headline-lg text-headline-lg-mobile text-on-surface md:text-headline-lg">Bạn đã hoàn thành case</h1>
                <p className="mt-3 max-w-[58ch] text-body-md text-on-surface-variant">Tuyệt vời! Bạn đã hoàn thành case "{caseData.title}".</p>
                
                <div className="mt-6 p-6 rounded-xl bg-surface-container border border-outline-variant/30 text-center w-full max-w-md">
                    <div className="text-display text-primary mb-2">{score}%</div>
                    <div className="text-body-md text-on-surface-variant">Đúng {correctCount}/{total} câu</div>
                </div>

                <div className="mt-8 flex w-full max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
                    <button onClick={() => {
                        setIsComplete(false);
                        setCurrentStep(0);
                        setAnswers({});
                        setFeedback(null);
                        setShowError(false);
                    }}
                        className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl border border-primary px-5 text-label-md font-label-md text-primary hover:bg-primary-fixed/60">
                        Làm lại case
                    </button>
                    <Link href="/scenarios"
                        className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-label-md font-label-md text-on-primary hover:bg-primary-container">
                        Về Kho tình huống
                        <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                    </Link>
                </div>
            </section>
        );
    }

    const question = caseData.questions[currentStep];
    const isLast = currentStep === caseData.questions.length - 1;
    const progressPercent = ((currentStep) / caseData.questions.length) * 100;
    
    // We only show feedback if we have answered THIS specific question
    const hasAnsweredCurrent = answers[currentStep] !== undefined;

    const handleNext = () => {
        if (!hasAnsweredCurrent) {
            setShowError(true);
            return;
        }
        setShowError(false);
        setFeedback(null);
        if (isLast) {
            setIsComplete(true);
        } else {
            setCurrentStep(currentStep + 1);
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
            setFeedback(null);
            setShowError(false);
        }
    };

    const handleOptionChange = (idx: number) => {
        const isCorrect = idx.toString() === question.correctAnswer;
        setAnswers({ ...answers, [currentStep]: idx });
        setShowError(false);
        setFeedback({
            isCorrect,
            text: isCorrect ? 'Chính xác! ' + question.explanation : 'Chưa chính xác. ' + question.explanation
        });
    };

    return (
        <section className="mx-auto w-full max-w-5xl px-margin-mobile pb-8 pt-8 md:px-margin-desktop md:pb-12 md:pt-12">
            <Link href="/scenarios"
                className="inline-flex min-h-11 items-center gap-2 rounded-lg pr-3 text-label-md font-label-md text-primary hover:bg-primary-fixed/50 focus-visible:bg-primary-fixed/50">
                <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                Quay lại Kho tình huống
            </Link>

            <header className="mt-5">
                <h1 className="max-w-4xl font-headline-lg text-headline-lg-mobile text-on-surface md:text-headline-lg">{caseData.title}</h1>
                <p className="mt-3 max-w-[70ch] text-body-md text-on-surface-variant">{caseData.description}</p>
                <div className="mt-4 flex flex-wrap items-center gap-2 text-label-sm font-label-sm">
                    <span className="rounded-full bg-surface-container-high px-3 py-1.5 text-on-surface-variant">{caseData.category}</span>
                    <span className="rounded-full bg-primary-fixed px-3 py-1.5 text-on-primary-fixed-variant">{caseData.difficulty}</span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-outline-variant/50 px-3 py-1.5 text-on-surface-variant">
                        <span className="material-symbols-outlined text-[16px]">schedule</span>
                        <span>{caseData.duration}</span>
                    </span>
                </div>
            </header>

            <div className="mt-8 flex items-center gap-4 md:mt-10">
                <p className="shrink-0 text-label-md font-label-md tabular-nums text-on-surface-variant">{currentStep + 1} / {caseData.questions.length}</p>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-primary-fixed">
                    <div className="h-full rounded-full bg-primary transition-[width] duration-200" style={{ width: `${progressPercent}%` }}></div>
                </div>
            </div>

            <section className="mt-8 border-t border-outline-variant/40 pt-8 md:mt-10 md:pt-10">
                <p className="text-label-md font-label-md text-primary">Câu {currentStep + 1}</p>
                <h2 className="mt-3 max-w-[32ch] font-headline-lg text-headline-md text-on-surface md:text-headline-lg">{question.title}</h2>
                <p className="mt-3 max-w-[70ch] text-body-md text-on-surface-variant">{question.helper}</p>

                <div className="mt-7">
                    <fieldset className="case-options flex flex-col gap-3">
                        <legend className="mb-3 block text-label-md font-label-md text-on-surface">Chọn 1 đáp án</legend>
                        {question.options.map((opt: string, idx: number) => {
                            const isSelected = answers[currentStep] === idx;
                            const isCorrect = idx.toString() === question.correctAnswer;
                            const hasAnswered = answers[currentStep] !== undefined;

                            let optionClass = "flex items-start gap-3 rounded-xl border border-outline-variant p-4 transition-all hover:bg-surface-container-high cursor-pointer";
                            if (isSelected) {
                                optionClass += " border-primary bg-primary-fixed/20";
                            }
                            if (hasAnswered && isCorrect) {
                                optionClass += " border-green-500 bg-green-50 dark:bg-green-900/20";
                            } else if (hasAnswered && isSelected && !isCorrect) {
                                optionClass += " border-red-500 bg-red-50 dark:bg-red-900/20";
                            }

                            return (
                                <label key={idx} className={optionClass}>
                                    <input 
                                        type="radio" 
                                        name="case-option" 
                                        value={idx}
                                        checked={isSelected}
                                        onChange={() => handleOptionChange(idx)}
                                        disabled={hasAnswered}
                                        className="mt-1 shrink-0 h-4 w-4 text-primary focus:ring-primary border-outline" 
                                    />
                                    <span className="text-body-md text-on-surface">{opt}</span>
                                </label>
                            );
                        })}
                    </fieldset>
                    <p className="mt-3 text-label-sm text-on-surface-variant">Đáp án đã chọn được lưu tự động trên thiết bị này.</p>
                    
                    {showError && <p className="mt-1 text-label-sm font-label-sm text-error">Hãy chọn một đáp án trước khi tiếp tục.</p>}
                    
                    {feedback && (
                        <div className={`mt-4 p-4 rounded-xl ${feedback.isCorrect ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'}`}>
                            <p className="font-bold mb-1">{feedback.isCorrect ? 'Chính xác!' : 'Chưa chính xác.'}</p>
                            <p>{feedback.text.replace(/^(Chính xác! |Chưa chính xác. )/, '')}</p>
                        </div>
                    )}
                </div>
            </section>

            <div className="sticky bottom-0 mt-8 grid grid-cols-2 gap-x-3 border-t border-outline-variant/40 bg-background/95 pb-[max(16px,env(safe-area-inset-bottom))] pt-4 backdrop-blur-md md:static md:mt-10 md:flex md:items-center md:justify-between md:gap-4 md:bg-transparent md:pb-0 md:backdrop-blur-none">
                <button onClick={handlePrev} disabled={currentStep === 0}
                    className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-primary px-5 text-label-md font-label-md text-primary hover:bg-primary-fixed/60 disabled:cursor-not-allowed disabled:border-outline-variant disabled:text-outline md:w-auto">
                    <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                    Câu trước
                </button>

                <p className="col-span-2 row-start-1 my-2 flex min-h-6 items-center justify-center gap-2 text-label-sm text-on-surface-variant md:my-0">
                    {hasAnsweredCurrent && <><span className="material-symbols-outlined text-[18px]">cloud_done</span><span>Đã lưu tự động</span></>}
                </p>

                <button onClick={handleNext} disabled={!hasAnsweredCurrent && showError}
                    className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 text-label-md font-label-md text-on-primary shadow-[0_4px_8px_rgba(53,37,205,0.22)] hover:bg-primary-container disabled:cursor-not-allowed disabled:bg-primary-fixed disabled:text-on-primary-fixed-variant disabled:shadow-none md:w-auto">
                    <span>{isLast ? 'Hoàn thành' : 'Câu tiếp theo'}</span>
                    {!isLast && <span className="material-symbols-outlined text-[20px]">arrow_forward</span>}
                </button>
            </div>
        </section>
    );
}

export default function Page() {
    return (
        <div className="bg-background text-on-background font-body-md antialiased min-h-[100dvh]">
            <Header />
            <main className="min-h-[100dvh] pt-16">
                <Suspense fallback={<div className="flex justify-center pt-20"><span className="material-symbols-outlined animate-spin text-[32px] text-primary">progress_activity</span></div>}>
                    <CaseContent />
                </Suspense>
            </main>
        </div>
    );
}
