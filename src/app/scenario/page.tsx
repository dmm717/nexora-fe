"use client";

import React, { useState } from "react";
import Link from "next/link";
import Header from "@/components/layouts/Header";
import Footer from "@/components/layouts/Footer";

export default function Page() {
    const [filter, setFilter] = useState("all");

    return (
        <div className="bg-background text-on-background font-body-md antialiased min-h-screen flex flex-col">
            <Header />

            {/* Main Content Canvas */}
            <main className="flex-grow pt-24 md:pt-28 pb-stack-lg px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto w-full">

                {/* Header Section */}
                <div className="mb-stack-lg text-center md:text-left">
                    <h1 className="font-display text-display text-on-background mb-stack-sm">Kho Tình Huống Thực Tế</h1>
                    <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
                        Rèn luyện kỹ năng giải quyết vấn đề với các tình huống (case study) được thiết kế từ dự án thực tế của các
                        doanh nghiệp hàng đầu.
                    </p>
                </div>

                {/* Filters Bento Shell */}
                <div
                    className="bg-surface rounded-xl shadow-sm border border-outline-variant/30 p-stack-sm mb-stack-lg overflow-x-auto no-scrollbar">
                    <div className="flex items-center gap-3 min-w-max">
                        <button onClick={() => setFilter("all")} className={`px-4 py-2 rounded-full font-label-md text-label-md transition-colors ${filter === "all" ? "bg-primary text-on-primary" : "bg-surface-container hover:bg-surface-container-high text-on-surface-variant border border-outline-variant/50"}`}>Tất cả</button>
                        <button onClick={() => setFilter("banking")} className={`px-4 py-2 rounded-full font-label-md text-label-md transition-colors ${filter === "banking" ? "bg-primary text-on-primary" : "bg-surface-container hover:bg-surface-container-high text-on-surface-variant border border-outline-variant/50"}`}>Ngân hàng</button>
                        <button onClick={() => setFilter("ecommerce")} className={`px-4 py-2 rounded-full font-label-md text-label-md transition-colors ${filter === "ecommerce" ? "bg-primary text-on-primary" : "bg-surface-container hover:bg-surface-container-high text-on-surface-variant border border-outline-variant/50"}`}>eCommerce</button>
                        <button onClick={() => setFilter("saas-fintech")} className={`px-4 py-2 rounded-full font-label-md text-label-md transition-colors ${filter === "saas-fintech" ? "bg-primary text-on-primary" : "bg-surface-container hover:bg-surface-container-high text-on-surface-variant border border-outline-variant/50"}`}>SaaS & Fintech</button>
                        <button onClick={() => setFilter("retail")} className={`px-4 py-2 rounded-full font-label-md text-label-md transition-colors ${filter === "retail" ? "bg-primary text-on-primary" : "bg-surface-container hover:bg-surface-container-high text-on-surface-variant border border-outline-variant/50"}`}>Bán lẻ</button>
                        <button onClick={() => setFilter("logistics")} className={`px-4 py-2 rounded-full font-label-md text-label-md transition-colors ${filter === "logistics" ? "bg-primary text-on-primary" : "bg-surface-container hover:bg-surface-container-high text-on-surface-variant border border-outline-variant/50"}`}>Logistics</button>
                    </div>
                </div>

                {/* Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">

                    {/* Card 1: Banking */}
                    {(filter === "all" || filter === "banking") && (
                    <div className="bg-surface rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-outline-variant/20 p-stack-md flex flex-col hover:shadow-[0px_10px_30px_rgba(0,0,0,0.08)] hover:border-primary-fixed transition-all duration-300 group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex gap-2">
                                <span
                                    className="bg-surface-container-high text-on-surface-variant px-2 py-1 rounded-full text-label-sm font-label-sm">Ngân
                                    hàng</span>
                                <span
                                    className="bg-surface-dim text-on-surface px-2 py-1 rounded-full text-label-sm font-label-sm">Trung
                                    bình</span>
                            </div>
                            <span
                                className="material-symbols-outlined text-outline-variant group-hover:text-primary transition-colors">account_balance</span>
                        </div>
                        <h3 className="font-headline-md text-headline-md mb-2 text-on-background line-clamp-2">Luồng onboarding khách
                            hàng mới (eKYC)</h3>
                        <p className="font-body-md text-body-md text-on-surface-variant mb-4 flex-grow line-clamp-3">
                            Phân tích và tối ưu hóa tỷ lệ drop-off trong quá trình định danh điện tử của ứng dụng Mobile Banking.
                        </p>
                        <div className="flex flex-wrap gap-2 mb-stack-md">
                            <span
                                className="text-label-sm font-label-sm text-outline border border-outline-variant/50 px-2 py-1 rounded flex items-center gap-1"><span
                                    className="material-symbols-outlined text-[14px]">psychology</span> Product Sense</span>
                            <span
                                className="text-label-sm font-label-sm text-outline border border-outline-variant/50 px-2 py-1 rounded flex items-center gap-1"><span
                                    className="material-symbols-outlined text-[14px]">schedule</span> 45 Phút</span>
                        </div>
                        <Link href="/case?id=ekyc-onboarding"
                            className="w-full min-h-12 bg-surface-container-high text-primary font-label-md text-label-md py-3 rounded-lg hover:bg-primary hover:text-on-primary transition-colors group-hover:bg-primary-container group-hover:text-on-primary-container inline-flex items-center justify-center">
                            Bắt đầu case
                        </Link>
                    </div>
                    )}

                    {/* Card 2: eCommerce */}
                    {(filter === "all" || filter === "ecommerce") && (
                    <div className="bg-surface rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-outline-variant/20 p-stack-md flex flex-col hover:shadow-[0px_10px_30px_rgba(0,0,0,0.08)] hover:border-primary-fixed transition-all duration-300 group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex gap-2">
                                <span
                                    className="bg-surface-container-high text-on-surface-variant px-2 py-1 rounded-full text-label-sm font-label-sm">eCommerce</span>
                                <span
                                    className="bg-error-container text-on-error-container px-2 py-1 rounded-full text-label-sm font-label-sm">Khó</span>
                            </div>
                            <span
                                className="material-symbols-outlined text-outline-variant group-hover:text-primary transition-colors">shopping_cart</span>
                        </div>
                        <h3 className="font-headline-md text-headline-md mb-2 text-on-background line-clamp-2">Xử lý khủng hoảng đơn
                            hàng bị hủy hàng loạt</h3>
                        <p className="font-body-md text-body-md text-on-surface-variant mb-4 flex-grow line-clamp-3">
                            Hệ thống gặp lỗi trong ngày Mega Sale dẫn đến 10,000 đơn hàng bị hủy nhầm. Đề xuất phương án xử lý kỹ
                            thuật và truyền thông.
                        </p>
                        <div className="flex flex-wrap gap-2 mb-stack-md">
                            <span
                                className="text-label-sm font-label-sm text-outline border border-outline-variant/50 px-2 py-1 rounded flex items-center gap-1"><span
                                    className="material-symbols-outlined text-[14px]">build</span> Crisis Management</span>
                            <span
                                className="text-label-sm font-label-sm text-outline border border-outline-variant/50 px-2 py-1 rounded flex items-center gap-1"><span
                                    className="material-symbols-outlined text-[14px]">schedule</span> 60 Phút</span>
                        </div>
                        <Link href="/case?id=order-crisis"
                            className="w-full min-h-12 bg-surface-container-high text-primary font-label-md text-label-md py-3 rounded-lg hover:bg-primary hover:text-on-primary transition-colors group-hover:bg-primary-container group-hover:text-on-primary-container inline-flex items-center justify-center">
                            Bắt đầu case
                        </Link>
                    </div>
                    )}

                    {/* Card 3: Logistics */}
                    {(filter === "all" || filter === "logistics") && (
                    <div className="bg-surface rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-outline-variant/20 p-stack-md flex flex-col hover:shadow-[0px_10px_30px_rgba(0,0,0,0.08)] hover:border-primary-fixed transition-all duration-300 group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex gap-2">
                                <span
                                    className="bg-surface-container-high text-on-surface-variant px-2 py-1 rounded-full text-label-sm font-label-sm">Logistics</span>
                                <span
                                    className="bg-surface-dim text-on-surface px-2 py-1 rounded-full text-label-sm font-label-sm">Trung
                                    bình</span>
                            </div>
                            <span
                                className="material-symbols-outlined text-outline-variant group-hover:text-primary transition-colors">local_shipping</span>
                        </div>
                        <h3 className="font-headline-md text-headline-md mb-2 text-on-background line-clamp-2">Tối ưu hóa thuật toán
                            ghép cuốc xe</h3>
                        <p className="font-body-md text-body-md text-on-surface-variant mb-4 flex-grow line-clamp-3">
                            Xây dựng logic ghép đơn hàng giao nhận trong thời gian thực để giảm thiểu tỷ lệ xe chạy rỗng.
                        </p>
                        <div className="flex flex-wrap gap-2 mb-stack-md">
                            <span
                                className="text-label-sm font-label-sm text-outline border border-outline-variant/50 px-2 py-1 rounded flex items-center gap-1"><span
                                    className="material-symbols-outlined text-[14px]">functions</span> Algorithms</span>
                            <span
                                className="text-label-sm font-label-sm text-outline border border-outline-variant/50 px-2 py-1 rounded flex items-center gap-1"><span
                                    className="material-symbols-outlined text-[14px]">schedule</span> 45 Phút</span>
                        </div>
                        <Link href="/case?id=ride-matching"
                            className="w-full min-h-12 bg-surface-container-high text-primary font-label-md text-label-md py-3 rounded-lg hover:bg-primary hover:text-on-primary transition-colors group-hover:bg-primary-container group-hover:text-on-primary-container inline-flex items-center justify-center">
                            Bắt đầu case
                        </Link>
                    </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}
