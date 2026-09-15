"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import Header from "@/components/layouts/Header";
import Footer from "@/components/layouts/Footer";
import PricingSection from "@/components/landing/PricingSection";

export default function Page() {
    useEffect(() => {
        // Re-initialize any JS animations or logic if needed
    }, []);

    return (
        <div className="bg-background text-on-background font-body-md min-h-screen flex flex-col">
            <Header />

            {/* Main Content */}
            <main className="flex-grow pt-24 pb-stack-lg">

                {/* Hero Section */}
                <section
                    className="text-center px-margin-mobile md:px-margin-desktop py-stack-lg md:py-[64px] max-w-3xl mx-auto">
                    <h1 className="font-display text-display text-on-surface mb-stack-sm md:mb-stack-md leading-tight">
                        Đầu tư thông minh cho<br /><span className="text-primary">sự nghiệp của bạn</span>
                    </h1>
                    <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto">
                        Chọn gói dịch vụ phù hợp để mở khóa sức mạnh của Nexora AI. Chuẩn bị hoàn hảo cho mọi vòng phỏng vấn và giành lấy công việc mơ ước.
                    </p>
                </section>

                <PricingSection />
            </main>

            <Footer />
        </div>
    );
}
