'use client';

import { useEffect } from 'react';

export const useAutoTranslate = () => {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Force Google Translate to translate from English to Vietnamese
    document.cookie = 'googtrans=/en/vi; path=/';
    
    // Add global CSS to hide all Google Translate UI elements and prevent layout shifts
    if (!document.getElementById('google-translate-style')) {
      const style = document.createElement('style');
      style.id = 'google-translate-style';
      style.innerHTML = `
        #google_translate_element { display: none !important; }
        .skiptranslate > iframe.skiptranslate { display: none !important; visibility: hidden !important; }
        body { top: 0 !important; }
        font { background-color: transparent !important; box-shadow: none !important; }
      `;
      document.head.appendChild(style);
    }

    // Inject the Google Translate script
    if (!document.getElementById('google-translate-script')) {
      const script = document.createElement('script');
      script.id = 'google-translate-script';
      script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.body.appendChild(script);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).googleTranslateElementInit = () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        new (window as any).google.translate.TranslateElement({
          pageLanguage: 'en',
          includedLanguages: 'vi',
          autoDisplay: false
        }, 'google_translate_element');
      };
    }
  }, []);
};
