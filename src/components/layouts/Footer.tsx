"use client";
import React from 'react';
import Link from 'next/link';


export default function Footer() {
  return (
    <footer className="nx-footer">
    <div className="nx-footer-panel">
        <div className="nx-footer-brand">
            <Link className="nx-footer-logo" href="/" aria-label="Nexora">
                <img src="/img/logo.png" alt="Nexora" />
            </Link>
            <p className="nx-footer-description">N&#7873;n t&#7843;ng luy&#7879;n ph&#7887;ng v&#7845;n th&#244;ng minh gi&#250;p &#7913;ng vi&#234;n t&#7921; tin h&#417;n trong t&#7915;ng v&#242;ng tuy&#7875;n d&#7909;ng.</p>
            <div className="nx-footer-social" aria-label="Mang xa hoi Nexora">
                <a className="nx-footer-social-link" href="#" aria-label="Facebook">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 8.2V6.5c0-.8.2-1.3 1.3-1.3H17V2.1C16.2 2 15.4 2 14.6 2c-2.5 0-4.2 1.5-4.2 4.3v1.9H7.6v3.5h2.8V22H14V11.7h2.8l.4-3.5H14Z"/></svg>
                </a>
                <a className="nx-footer-social-link" href="#" aria-label="TikTok">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16.7 2c.4 2.4 1.8 3.9 4.1 4.1v3.3c-1.4.1-2.7-.3-4-1.1v6.2c0 5.5-6 7.2-9.5 4.3-2.3-1.9-2.6-5.5-.7-7.8 1.3-1.6 3.3-2.3 5.7-1.8v3.5c-.5-.2-1-.2-1.5-.1-1.4.3-2.2 1.6-1.8 2.9.4 1.4 2 2 3.2 1.2.8-.5 1.1-1.2 1.1-2.6V2h3.4Z"/></svg>
                </a>
                <a className="nx-footer-social-link" href="#" aria-label="LinkedIn">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.9 8.9H3.3V21h3.6V8.9ZM5.1 3C3.9 3 3 3.8 3 4.9s.9 1.9 2.1 1.9 2.1-.8 2.1-1.9S6.3 3 5.1 3Zm15.9 11c0-3.3-1.8-5.4-4.6-5.4-1.6 0-2.7.9-3.2 1.7V8.9H9.7V21h3.6v-6.1c0-1.6.8-2.7 2.2-2.7s2 1 2 2.8v6H21v-7Z"/></svg>
                </a>
                <a className="nx-footer-social-link" href="#" aria-label="YouTube">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21.6 7.1c-.2-.9-.9-1.6-1.8-1.8C18.2 4.9 12 4.9 12 4.9s-6.2 0-7.8.4c-.9.2-1.6.9-1.8 1.8C2 8.7 2 12 2 12s0 3.3.4 4.9c.2.9.9 1.6 1.8 1.8 1.6.4 7.8.4 7.8.4s6.2 0 7.8-.4c.9-.2 1.6-.9 1.8-1.8.4-1.6.4-4.9.4-4.9s0-3.3-.4-4.9ZM10 15.1V8.9l5.4 3.1-5.4 3.1Z"/></svg>
                </a>
                <a className="nx-footer-social-link" href="#" aria-label="Threads">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12.2 2C6.4 2 3.4 5.8 3.4 12.2c0 6.2 3 9.8 8.8 9.8 5 0 8.2-2.8 8.2-7.1 0-3-1.5-5.1-4.2-5.9-.5-2.8-2.1-4.2-4.8-4.2-2.1 0-3.8.9-4.8 2.6l2.5 1.6c.5-.9 1.2-1.4 2.2-1.4 1.2 0 1.8.6 2 1.8h-1.8c-3.2 0-5.1 1.6-5.1 4.1 0 2.3 1.8 3.9 4.5 3.9 2.9 0 4.8-1.8 5.2-5.1 1 .6 1.5 1.5 1.5 2.7 0 2.6-2.1 4.3-5.4 4.3-4 0-6-2.5-6-7.1 0-4.8 2-7.4 6-7.4 2.5 0 4.2 1 5.3 3.1l2.5-1.4C18.4 3.5 15.8 2 12.2 2Zm-.8 12.7c-1.2 0-2-.5-2-1.3 0-.9.7-1.4 2.1-1.4h2c-.2 1.8-.9 2.7-2.1 2.7Z"/></svg>
                </a>
                <a className="nx-footer-social-link" href="#" aria-label="Instagram">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4c0 3.2-2.6 5.8-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8C2 4.6 4.6 2 7.8 2Zm0 2.7c-1.7 0-3.1 1.4-3.1 3.1v8.4c0 1.7 1.4 3.1 3.1 3.1h8.4c1.7 0 3.1-1.4 3.1-3.1V7.8c0-1.7-1.4-3.1-3.1-3.1H7.8Zm4.2 3a4.3 4.3 0 1 1 0 8.6 4.3 4.3 0 0 1 0-8.6Zm0 2.6a1.7 1.7 0 1 0 0 3.4 1.7 1.7 0 0 0 0-3.4Zm4.7-2.9a1 1 0 1 1 0 2.1 1 1 0 0 1 0-2.1Z"/></svg>
                </a>
            </div>
        </div>
        <nav className="nx-footer-column" aria-label="Cho ung vien">
            <h2 className="nx-footer-heading">Cho &#7913;ng vi&#234;n</h2>
            <Link className="nx-footer-link" href="/cv-analysis">Ph&#226;n t&#237;ch CV</Link>
            <Link className="nx-footer-link" href="/interview">Luy&#7879;n ph&#7887;ng v&#7845;n</Link>
            <Link className="nx-footer-link" href="/scenarios">Kho t&#236;nh hu&#7889;ng</Link>
            <Link className="nx-footer-link" href="/star">Ph&#432;&#417;ng ph&#225;p STAR</Link>
        </nav>
        <nav className="nx-footer-column" aria-label="Ho tro">
            <h2 className="nx-footer-heading">H&#7895; tr&#7907;</h2>
            <Link className="nx-footer-link" href="#">&#272;i&#7873;u kho&#7843;n s&#7917; d&#7909;ng</Link>
            <Link className="nx-footer-link" href="#">Ch&#237;nh s&#225;ch b&#7843;o m&#7853;t</Link>
            <Link className="nx-footer-link" href="#">H&#432;&#7899;ng d&#7851;n</Link>
            <Link className="nx-footer-link" href="#">Li&#234;n h&#7879;</Link>
        </nav>
        <div className="nx-footer-column">
            <h2 className="nx-footer-heading">Th&#244;ng tin c&#244;ng ty</h2>
            <p className="nx-footer-text">Nexora AI</p>
            <p className="nx-footer-text">MST: 0109904638</p>
            <p className="nx-footer-text">L&#244; E2a-7, &#272;&#432;&#7901;ng D1, Khu C&#244;ng ngh&#7879; cao, Ph&#432;&#7901;ng T&#259;ng Nh&#417;n Ph&#250;, TP. H&#7891; Ch&#237; Minh</p>
        </div>
    </div>
</footer>
  );
}
