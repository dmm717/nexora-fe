"use client";

import React from "react";
import Header from "@/components/layouts/Header";
import Footer from "@/components/layouts/Footer";
import HeroSection from "@/components/landing/HeroSection";
import SocialProofSection from "@/components/landing/SocialProofSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import PricingSection from "@/components/landing/PricingSection";
import { useScrollReveal } from "@/hooks/useScrollReveal";

export default function Home() {
    useScrollReveal();

    return (
        <>
            <Header />
            <main className="pt-24 md:pt-28">
                <HeroSection />
                <SocialProofSection />
                <TestimonialsSection />
                <PricingSection />
            </main>
            <Footer />
        </>
    );
}
