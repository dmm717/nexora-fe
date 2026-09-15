"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Header from "@/components/layouts/Header";
import Footer from "@/components/layouts/Footer";
import { useCurrentUser } from '@/hooks/queries/useUser';
import { useScrollReveal } from "@/hooks/useScrollReveal";

type ViewState = 'setup' | 'live' | 'done';
type PhaseState = 'speak' | 'listen';

export default function Page() {
    useScrollReveal();
    const { data: user } = useCurrentUser();
    const isAuthenticated = !!user;

    const [view, setView] = useState<ViewState>('setup');
    const [phase, setPhase] = useState<PhaseState>('speak');
    const [hasPlan, setHasPlan] = useState(false);
    const [role, setRole] = useState("Business Analyst");
    const [isGenerating, setIsGenerating] = useState(false);
    const [seconds, setSeconds] = useState(0);

    const [isCameraActive, setIsCameraActive] = useState(false);
    const [cameraStatusMsg, setCameraStatusMsg] = useState("Camera đang tắt");
    const [cameraIcon, setCameraIcon] = useState("videocam");
    const [cameraAction, setCameraAction] = useState("Bật camera");
    const [isCameraStarting, setIsCameraStarting] = useState(false);

    const candidateVideoRef = useRef<HTMLVideoElement>(null);
    const aiSpeakingVideoRef = useRef<HTMLVideoElement>(null);
    const aiIdleVideoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    // AI speaking progress simulation
    const [aiProgress, setAiProgress] = useState(0);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (view === 'live') {
            interval = setInterval(() => {
                setSeconds(s => s + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [view]);

    // Handle phase switching and video playback
    useEffect(() => {
        if (view !== 'live') return;

        if (phase === 'speak') {
            setAiProgress(0);
            if (aiIdleVideoRef.current) {
                aiIdleVideoRef.current.pause();
            }
            if (aiSpeakingVideoRef.current) {
                aiSpeakingVideoRef.current.currentTime = 0;
                aiSpeakingVideoRef.current.play().catch(() => {});
            }

            // Simulate progress bar based on a fixed 10s duration for simulation
            const duration = 10000;
            const step = 100;
            let current = 0;
            const progInterval = setInterval(() => {
                current += step;
                const pct = Math.min(100, (current / duration) * 100);
                setAiProgress(pct);
                if (pct >= 100) {
                    clearInterval(progInterval);
                }
            }, step);
            return () => clearInterval(progInterval);

        } else if (phase === 'listen') {
            if (aiSpeakingVideoRef.current) {
                aiSpeakingVideoRef.current.pause();
            }
            if (aiIdleVideoRef.current) {
                aiIdleVideoRef.current.play().catch(() => {});
            }
        }
    }, [phase, view]);

    // Cleanup camera stream on unmount or view change
    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }
        };
    }, []);

    const formatTime = (totalSeconds: number) => {
        const m = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
        const s = String(totalSeconds % 60).padStart(2, '0');
        return `${m}:${s}`;
    };

    const handleGenerate = () => {
        setIsGenerating(true);
        setTimeout(() => {
            setIsGenerating(false);
            setHasPlan(true);
        }, 800);
    };

    const handleStartInterview = () => {
        setView('live');
        setPhase('speak');
        setSeconds(0);
        window.scrollTo(0, 0);
    };

    const finishInterview = () => {
        setView('done');
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (candidateVideoRef.current) {
            candidateVideoRef.current.srcObject = null;
        }
        setIsCameraActive(false);
        setCameraStatusMsg("Camera đang tắt");
        setCameraIcon("videocam");
        setCameraAction("Bật camera");
    };

    const startCamera = async () => {
        if (!navigator.mediaDevices?.getUserMedia) {
            setCameraStatusMsg("Thiết bị không hỗ trợ camera");
            return;
        }
        setIsCameraStarting(true);
        setCameraIcon("progress_activity");
        setCameraAction("Đang xin quyền...");

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
                audio: false
            });
            streamRef.current = stream;
            if (candidateVideoRef.current) {
                candidateVideoRef.current.srcObject = stream;
                await candidateVideoRef.current.play();
            }
            setIsCameraActive(true);
            setCameraIcon("videocam_off");
            setCameraAction("Tắt camera");
        } catch (error: any) {
            const denied = error?.name === 'NotAllowedError' || error?.name === 'SecurityError';
            setCameraStatusMsg(denied ? "Bạn chưa cấp quyền camera" : "Không tìm thấy camera");
            setIsCameraActive(false);
            setCameraIcon("videocam");
            setCameraAction("Bật camera");
        } finally {
            setIsCameraStarting(false);
        }
    };

    const toggleCamera = () => {
        if (isCameraActive || streamRef.current) {
            stopCamera();
        } else {
            startCamera();
        }
    };

    return (
        <div className="bg-background text-on-surface font-body-md antialiased min-h-screen flex flex-col">
            <Header />

            {/* ================= TRẠNG THÁI 1 & 2: THIẾT LẬP ================= */}
            {view === 'setup' && (
            <main data-view="setup" className="flex-grow pt-[80px] pb-12 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-gutter">
                <div className="lg:col-span-5 space-y-stack-lg nx-fade-up">
                    <div>
                        <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-2">Thiết lập phỏng vấn</h1>
                        <p className="font-body-md text-body-md text-on-surface-variant">Tùy chỉnh kịch bản phỏng vấn dựa trên Job Description thực tế.</p>
                    </div>
                    <div className="space-y-stack-sm">
                        <div className="bg-surface-container-lowest p-stack-md rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-outline-variant/30 flex gap-4 items-start">
                            <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-label-md text-label-md flex-shrink-0">1</div>
                            <div className="w-full min-w-0">
                                <h3 className="font-label-md text-label-md text-on-surface font-semibold mb-2">CV sử dụng</h3>
                                <div className="flex items-center gap-3 rounded-xl border border-outline-variant/50 bg-surface p-3">
                                    <span className="material-symbols-outlined text-primary bg-primary-fixed/60 rounded-lg p-2">description</span>
                                    <div className="min-w-0 flex-1">
                                        <p className="font-label-md text-on-surface font-semibold truncate">CV_NguyenVanA_BA_2024.pdf</p>
                                        <p className="text-label-sm text-on-surface-variant">CV đã phân tích</p>
                                    </div>
                                    <button type="button" className="flex-shrink-0 px-3 py-2 rounded-lg border border-primary/30 text-primary font-label-sm hover:bg-primary-fixed/40 transition-colors">Đổi CV</button>
                                </div>
                            </div>
                        </div>
                        <div className="bg-surface-container-lowest p-stack-md rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-outline-variant/30 flex gap-4 items-start">
                            <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-label-md text-label-md flex-shrink-0">2</div>
                            <div className="w-full">
                                <h3 className="font-label-md text-label-md text-on-surface font-semibold mb-2">Dán JD (Job Description)</h3>
                                <textarea 
                                    className="w-full bg-surface border border-outline-variant rounded-lg p-3 font-body-md text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none h-32 resize-none"
                                    placeholder="Dán nội dung JD tại đây..."></textarea>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-sm">
                            <div className="bg-surface-container-lowest p-stack-md rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-outline-variant/30 flex gap-4 items-start">
                                <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-label-md text-label-md flex-shrink-0">3</div>
                                <div className="w-full">
                                    <h3 className="font-label-md text-label-md text-on-surface font-semibold mb-2">Vị trí</h3>
                                    <input type="text" value={role} onChange={e => setRole(e.target.value)}
                                        className="w-full bg-surface border border-outline-variant rounded-lg p-2 font-body-md text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                                        placeholder="VD: Fresher Business Analyst" />
                                </div>
                            </div>
                            <div className="bg-surface-container-lowest p-stack-md rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-outline-variant/30 flex gap-4 items-start">
                                <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-label-md text-label-md flex-shrink-0">4</div>
                                <div className="w-full">
                                    <h3 className="font-label-md text-label-md text-on-surface font-semibold mb-2">Độ khó</h3>
                                    <select className="w-full bg-surface border border-outline-variant rounded-lg p-2 font-body-md text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none" defaultValue="Trung bình">
                                        <option value="Cơ bản">Cơ bản</option>
                                        <option value="Trung bình">Trung bình</option>
                                        <option value="Khó">Khó</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <button onClick={handleGenerate}
                            className="w-full bg-primary text-on-primary font-label-md text-label-md py-4 rounded-xl hover:bg-primary-container/90 transition-all duration-200 shadow-md flex items-center justify-center gap-2 mt-stack-md">
                            <span className="material-symbols-outlined">magic_button</span>
                            {isGenerating ? 'Đang phân tích...' : 'Tạo kịch bản phỏng vấn'}
                        </button>
                    </div>
                </div>

                {/* Panel phải */}
                <div className="lg:col-span-7 bg-surface-container-lowest rounded-2xl shadow-[0px_10px_30px_rgba(0,0,0,0.08)] border border-primary-fixed/50 p-stack-lg relative overflow-hidden nx-fade-up nx-delay-1">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-tertiary-fixed/30 to-transparent rounded-bl-full pointer-events-none"></div>
                    <div className="flex items-center gap-3 mb-stack-md relative z-10">
                        <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                        <h2 className="font-headline-md text-headline-md text-on-surface">Kế hoạch phỏng vấn AI</h2>
                    </div>

                    <div className="grid grid-cols-2 gap-stack-md mb-stack-lg relative z-10">
                        <div className="bg-surface-container p-4 rounded-xl border border-surface-container-high">
                            <p className="font-label-sm text-label-sm text-on-surface-variant mb-1 uppercase tracking-wider">Vị trí ứng tuyển</p>
                            <p className="font-body-lg text-body-lg text-on-surface-variant font-semibold">{hasPlan ? role : 'Chưa chọn'}</p>
                        </div>
                        <div className="bg-surface-container p-4 rounded-xl border border-surface-container-high">
                            <p className="font-label-sm text-label-sm text-on-surface-variant mb-1 uppercase tracking-wider">Mức độ phù hợp CV/JD</p>
                            <div className="flex items-center gap-2">
                                <span className="font-body-lg text-body-lg text-on-surface-variant font-bold">{hasPlan ? '78%' : '0%'}</span>
                                <div className="h-2 flex-grow bg-surface-variant rounded-full overflow-hidden">
                                    <div className="h-full bg-outline-variant rounded-full transition-all duration-700" style={{ width: hasPlan ? '78%' : '0%', backgroundColor: hasPlan ? 'var(--md-sys-color-primary)' : '' }}></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <h3 className="font-label-md text-label-md text-on-surface font-semibold mb-3 relative z-10">Chủ đề &amp; Cấu trúc</h3>
                    <div className="space-y-3 relative z-10 mb-stack-lg">
                        {!hasPlan ? (
                            <div className="flex flex-col items-center justify-center py-12 px-6 text-center border-2 border-dashed border-outline-variant/30 rounded-xl bg-surface-container-low/50">
                                <img className="nx-mascot nx-mascot-interview" src="/assets/mascot.png" alt="Mascot Nexora đang hướng dẫn" />
                                <p className="font-semibold text-on-surface mb-1">Mình sẽ chuẩn bị buổi phỏng vấn cho bạn</p>
                                <p className="text-on-surface-variant font-body-md max-w-md">Hoàn tất chọn CV và dán JD ở bên trái để Nexora tạo kế hoạch phỏng vấn riêng nhé.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="flex items-start gap-3 p-3 rounded-xl border border-outline-variant/30 bg-surface nx-fade-up">
                                    <span className="material-symbols-outlined text-primary mt-0.5">psychology</span>
                                    <div>
                                        <p className="font-label-md text-label-md text-on-surface font-semibold">1. Kiến thức chuyên môn (40%)</p>
                                        <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Hỏi sâu về UML, BPMN và cách viết tài liệu SRS.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-3 rounded-xl border border-outline-variant/30 bg-surface nx-fade-up nx-delay-1">
                                    <span className="material-symbols-outlined text-primary mt-0.5">handshake</span>
                                    <div>
                                        <p className="font-label-md text-label-md text-on-surface font-semibold">2. Kỹ năng giao tiếp &amp; Stakeholder Management (30%)</p>
                                        <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Xử lý tình huống khi requirement thay đổi liên tục.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-3 rounded-xl border border-outline-variant/30 bg-surface nx-fade-up nx-delay-2">
                                    <span className="material-symbols-outlined text-primary mt-0.5">extension</span>
                                    <div>
                                        <p className="font-label-md text-label-md text-on-surface font-semibold">3. Tư duy giải quyết vấn đề (30%)</p>
                                        <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Case study về tối ưu quy trình quản lý kho hàng.</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <button disabled={!hasPlan} onClick={handleStartInterview}
                        className={`w-full font-label-md text-label-md py-4 rounded-xl flex items-center justify-center gap-2 relative z-10 text-lg font-bold transition-all ${
                            hasPlan ? 'bg-primary text-on-primary hover:bg-primary-container hover:shadow-lg cursor-pointer' : 'bg-outline-variant text-on-surface-variant/50 cursor-not-allowed'
                        }`}>
                        {!hasPlan && <span className="material-symbols-outlined">lock</span>}
                        Bắt đầu phỏng vấn
                    </button>

                    {/* Guest blur overlay */}
                    {!isAuthenticated && hasPlan && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center p-6 rounded-2xl overflow-hidden nx-fade-in">
                        <div className="absolute inset-0 bg-surface/40 backdrop-blur-md rounded-2xl"></div>
                        <div className="relative z-30 bg-surface-container-lowest px-8 py-10 rounded-3xl shadow-2xl border border-outline-variant/30 text-center max-w-md w-full">
                            <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-primary-container/30 flex items-center justify-center">
                                <span className="material-symbols-outlined text-primary text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
                            </div>
                            <h3 className="font-headline-md text-[26px] font-bold text-on-surface mb-3 leading-tight">Tính năng giới hạn</h3>
                            <p className="font-body-md text-[14px] text-on-surface-variant mb-6 leading-relaxed">Vui lòng đăng nhập để sử dụng tính năng phỏng vấn mô phỏng với AI</p>
                            <Link href="/auth?mode=login" className="w-full h-12 bg-primary text-on-primary font-label-md text-label-md rounded-xl font-semibold hover:bg-primary/90 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2">
                                <span className="material-symbols-outlined text-[20px]">login</span>
                                Đăng nhập ngay
                            </Link>
                        </div>
                    </div>
                    )}
                </div>
            </main>
            )}

            {/* ================= TRẠNG THÁI 3: LIVE INTERVIEW ================= */}
            {view === 'live' && (
            <main data-view="live" className="flex-1 pt-[80px]">
                <section data-nx-section className="min-h-[calc(100dvh-4rem)] bg-surface-container-low flex flex-col px-margin-mobile md:px-margin-desktop py-5 md:py-6 gap-5 relative nx-fade-up">
                    <div className="flex items-center justify-between flex-shrink-0">
                        <div>
                            <span className="inline-flex items-center px-3 py-1 rounded-lg bg-secondary-container text-on-secondary-container font-label-sm text-label-sm mb-2">Vai trò: <span className="ml-1">{role}</span></span>
                            <h1 className="font-headline-md text-headline-md text-on-surface">Phỏng phỏng vấn AI</h1>
                        </div>
                        <div className="text-right">
                            <p className="font-label-sm text-label-sm text-on-surface-variant">Thời gian thực</p>
                            <p className="font-headline-md text-headline-md text-primary font-mono tracking-wider text-[28px]">{formatTime(seconds)}</p>
                        </div>
                    </div>

                    <div className="ai-avatar-stage relative w-full rounded-2xl overflow-hidden shadow-[0_8px_30px_rgba(37,32,92,0.12)] bg-white border border-outline-variant/30 p-3 md:p-4">
                        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 items-start gap-3 md:gap-4">
                            {/* AI Video */}
                            <div className="interview-video-panel relative overflow-hidden rounded-xl bg-[#111827] border border-outline-variant/30">
                                <video ref={aiSpeakingVideoRef} preload="auto" playsInline poster="/img/interview-room.png"
                                    className={`absolute inset-0 w-full h-full object-contain ${phase === 'speak' ? '' : 'hidden'}`}
                                    src="/assets/video/interviewer-speaking.mp4"></video>
                                <video ref={aiIdleVideoRef} preload="auto" playsInline muted loop poster="/img/interview-room.png"
                                    className={`absolute inset-0 w-full h-full object-contain ${phase === 'listen' ? '' : 'hidden'}`}
                                    src="/assets/video/interviewer-idle.mp4"></video>
                                
                                {phase === 'speak' && (
                                    <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-2 text-white text-label-sm font-bold uppercase tracking-wider border border-white/20">
                                        <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
                                        <span>AI Speaking</span>
                                        <span className="voice-wave h-4 flex items-center gap-[2px] text-primary" aria-hidden="true"><span></span><span></span><span></span><span></span></span>
                                    </div>
                                )}
                                <div className="absolute bottom-3 left-3 px-2.5 py-1 bg-black/50 backdrop-blur-md rounded-md text-xs text-white font-bold">AI Interviewer</div>
                            </div>

                            {/* Candidate Video */}
                            <div className="interview-video-panel relative overflow-hidden rounded-xl border border-outline-variant/30 shadow-inner bg-[#172033]">
                                <div className="absolute top-3 left-3 z-10 px-2.5 py-1 bg-black/40 backdrop-blur-md rounded-md text-xs text-white font-bold">Bạn</div>
                                <button type="button" onClick={toggleCamera} disabled={isCameraStarting}
                                    className="absolute top-3 right-3 z-20 px-3 py-1.5 bg-black/50 hover:bg-black/70 backdrop-blur-md rounded-full text-xs text-white font-bold flex items-center gap-1.5 transition-colors">
                                    <span className={`material-symbols-outlined text-[16px] ${isCameraStarting ? 'animate-spin-slow' : ''}`}>{cameraIcon}</span>
                                    <span>{cameraAction}</span>
                                </button>

                                <video ref={candidateVideoRef} autoPlay muted playsInline 
                                    className={`candidate-camera-video absolute inset-0 w-full h-full object-cover ${isCameraActive ? '' : 'hidden'}`}></video>

                                {!isCameraActive && (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-white/80 bg-[radial-gradient(circle_at_top,_#394564,_#172033_72%)]">
                                        <div className="w-24 h-24 rounded-full bg-white/10 border-2 border-white/20 shadow-[0_8px_30px_rgba(0,0,0,0.2)] flex items-center justify-center">
                                            <span className="material-symbols-outlined text-[64px] text-white/75">person</span>
                                        </div>
                                        <span className="text-sm mt-3">{cameraStatusMsg}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="relative z-10 w-fit mx-auto -mt-5 bg-primary text-white px-6 py-2 rounded-full shadow-lg flex items-center gap-2 nx-scale-in">
                            {phase === 'speak' ? (
                                <>
                                    <span className="material-symbols-outlined animate-spin-slow">record_voice_over</span>
                                    <span className="font-bold">AI đang đặt câu hỏi...</span>
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-green-300">mic</span>
                                    <span className="font-bold">Đến lượt bạn trả lời...</span>
                                </>
                            )}
                        </div>

                        <div className="relative z-10 mt-3 bg-[#111827] rounded-xl p-4 md:p-5 text-white border border-white/10 shadow-lg nx-fade-up nx-delay-1">
                            <div className="flex items-start gap-4">
                                <span className="material-symbols-outlined text-tertiary-fixed-dim text-[24px]">smart_toy</span>
                                <p className="font-body-lg text-body-lg leading-relaxed text-white">
                                    Đó là một cách tiếp cận hợp lý. Tuy nhiên, nếu hệ thống chữ ký số gặp lỗi trong quá trình phê duyệt ở phase 1 khiến giao dịch bị gián đoạn, trong khi stakeholder đang phàn nàn rằng bạn đã không làm tính năng phê duyệt đa cấp ngay từ đầu để tránh lỗi này. Bạn sẽ phản hồi ra sao?
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Progress bar area for speak phase */}
                    {phase === 'speak' && (
                    <div className="px-4 pb-2 nx-fade-in">
                        <div className="flex items-center justify-between mb-1">
                            <span className="font-label-sm text-label-sm text-on-surface-variant">Tiến trình AI</span>
                            <span className="font-label-sm text-label-sm text-on-surface-variant">{Math.round(aiProgress)}%</span>
                        </div>
                        <div className="h-2 bg-surface-variant rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full progress-bar" style={{ width: `${aiProgress}%` }}></div>
                        </div>
                    </div>
                    )}

                    <div className="bg-surface rounded-2xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-outline-variant/20 flex flex-col gap-4 flex-shrink-0 mt-2">
                        <div className="flex items-center justify-between w-full py-2">
                            <div className="flex items-center gap-4">
                                {phase === 'speak' ? (
                                    <>
                                        <button onClick={() => setPhase('listen')} className="w-14 h-14 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center shadow-lg transition-colors hover:bg-secondary-container/80 cursor-pointer">
                                            <span className="material-symbols-outlined text-[32px]">fast_forward</span>
                                        </button>
                                        <div>
                                            <p className="font-label-md text-label-md text-on-surface font-bold">AI đang nói...</p>
                                            <p className="font-label-sm text-label-sm text-on-surface-variant">Bấm để chuyển lượt trả lời</p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <button className="w-14 h-14 rounded-full bg-error text-on-error flex items-center justify-center shadow-lg transition-colors recording-pulse">
                                            <span className="material-symbols-outlined text-[32px]">mic</span>
                                        </button>
                                        <div>
                                            <p className="font-label-md text-label-md text-on-surface font-bold">Đang lắng nghe...</p>
                                            <p className="font-label-sm text-label-sm text-error">00:45 / 03:00</p>
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className="flex items-center gap-4">
                                <button disabled={phase === 'speak'} onClick={finishInterview}
                                    className={`px-6 h-12 rounded-full font-bold flex items-center justify-center gap-2 shadow-none transition-colors ${
                                        phase === 'speak' 
                                            ? 'bg-outline-variant/50 text-on-surface-variant/50 cursor-not-allowed opacity-50' 
                                            : 'bg-green-500 text-white shadow-lg hover:bg-green-600 active:scale-95 cursor-pointer'
                                    }`}>
                                    <span className="material-symbols-outlined text-[20px]">check_circle</span> Chốt câu trả lời
                                </button>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
            )}

            {/* ================= TRẠNG THÁI 4: MODAL HOÀN TẤT ================= */}
            {view === 'done' && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md nx-fade-in">
                    <div className="bg-surface w-full max-w-[500px] rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] overflow-hidden flex flex-col items-center text-center p-8 gap-6 nx-scale-in">
                        <div className="w-16 h-16 rounded-full bg-primary-container flex items-center justify-center">
                            <span className="material-symbols-outlined text-[40px] text-primary">check_circle</span>
                        </div>
                        <div className="space-y-2">
                            <h2 className="font-headline-md text-headline-md text-on-surface">Phỏng vấn hoàn tất!</h2>
                            <p className="text-on-surface-variant font-body-md">Chúc mừng bạn đã hoàn thành buổi phỏng vấn mô phỏng. AI của Nexora đang phân tích kết quả của bạn.</p>
                        </div>
                        <div className="flex flex-col w-full gap-3">
                            <Link href="/report" className="w-full h-12 bg-primary text-white rounded-full font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all active:scale-95">
                                <span className="material-symbols-outlined">analytics</span>
                                Xem báo cáo chi tiết
                            </Link>
                            <Link href="/" className="w-full h-12 border border-outline-variant/30 text-on-surface-variant rounded-full font-bold flex items-center justify-center gap-2 hover:bg-surface-container-low transition-all active:scale-95">
                                Về trang chủ
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {view === 'setup' && <Footer />}
        </div>
    );
}
