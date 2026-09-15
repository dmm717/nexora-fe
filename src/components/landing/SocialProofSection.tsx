'use client';

import React from 'react';


const companies = [
    { src: '/img/shopee.png', alt: 'Shopee', isWide: false, isBrandLockup: false },
    { src: '/img/grab.png', alt: 'Grab', isWide: false, isBrandLockup: false },
    { src: '/img/momo.png', alt: 'MoMo', isWide: false, isBrandLockup: false },
    { src: '/img/fpt-software.png', alt: 'FPT Software', isWide: false, isBrandLockup: false },
    { src: '/img/vng.png', alt: 'VNG', isWide: false, isBrandLockup: false },
    { src: '/img/vinai.png', alt: 'VinAI', isWide: false, isBrandLockup: false },
    { src: '/img/google-wordmark.svg', alt: 'Google', isWide: true, isBrandLockup: false },
    { src: '/img/apple.svg', alt: 'Apple', isWide: false, isBrandLockup: false },
    { src: '/img/samsung.svg', alt: 'Samsung', isWide: false, isBrandLockup: false },
    { src: '/img/meta.svg', alt: 'Meta', isWide: false, isBrandLockup: false },
    { src: '/img/tiktok-color.svg', alt: 'TikTok', isWide: true, isBrandLockup: true, label: 'TikTok' },
    { src: '/img/nvidia.svg', alt: 'NVIDIA', isWide: false, isBrandLockup: false },
];

export default function SocialProofSection() {
    return (
        <section data-nx-section className="py-7 border-y border-outline-variant/30 bg-surface-container-lowest overflow-hidden">
            <div className="text-center">
                <p className="font-label-md text-label-md text-on-surface-variant mb-5 uppercase tracking-[0.14em] font-semibold">
                    Được tin dùng bởi ứng viên ứng tuyển vào
                </p>
                <div className="nx-logo-marquee" aria-label="Các doanh nghiệp mục tiêu của ứng viên Nexora">
                    <div className="nx-logo-marquee-track">
                        
                        <div className="nx-logo-group">
                            {companies.map((company, index) => (
                                <span key={index} className={`nx-logo-item ${company.isWide ? 'nx-logo-wide' : ''}`}>
                                    {company.isBrandLockup ? (
                                        <span className="nx-brand-lockup">
                                            <img src={company.src} alt="" width={24} height={24} />
                                            <strong>{company.label}</strong>
                                        </span>
                                    ) : (
                                        <img src={company.src} alt={company.alt} width={80} height={32} className="object-contain" />
                                    )}
                                </span>
                            ))}
                        </div>

                        {/* Duplicate for infinite marquee effect */}
                        <div className="nx-logo-group" aria-hidden="true">
                            {companies.map((company, index) => (
                                <span key={`dup-${index}`} className={`nx-logo-item ${company.isWide ? 'nx-logo-wide' : ''}`}>
                                    {company.isBrandLockup ? (
                                        <span className="nx-brand-lockup">
                                            <img src={company.src} alt="" width={24} height={24} />
                                            <strong>{company.label}</strong>
                                        </span>
                                    ) : (
                                        <img src={company.src} alt="" width={80} height={32} className="object-contain" />
                                    )}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
