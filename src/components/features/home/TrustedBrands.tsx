import React from 'react';
import styles from './TrustedBrands.module.css';

const textItems = [
  "EMPOWERING LEADERS",
  "TRUSTED GLOBALLY",
  "AI DRIVEN SUCCESS",
  "REDEFINING INTERVIEWS",
  "TOP TIER TALENT"
];

const TrustedBrands = () => {
  return (
    <section className={styles.brandsSection}>
      <div className={styles.marqueeWrapper}>
        <div className={styles.marquee}>
          <div className={styles.marqueeTrack}>
            {/* Duplicated for infinite effect */}
            {[...textItems, ...textItems, ...textItems].map((text, i) => (
              <div key={i} className={styles.textItem}>
                {text}
                <span className={styles.separator}>/</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustedBrands;
