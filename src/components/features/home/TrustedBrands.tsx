import React from 'react';
import styles from './TrustedBrands.module.css';

const TrustedBrands = () => {
  return (
    <section className={styles.brandsSection}>
      <div className={styles.container}>
        <p className={styles.label}>NỀN TẢNG ĐƯỢC XÂY DỰNG TRÊN CÁC CÔNG NGHỆ HÀNG ĐẦU</p>
        <div className={styles.logosRow}>
          <div className={styles.logoItem}>OpenAI</div>
          <div className={styles.logoItem}>Google Cloud</div>
          <div className={styles.logoItem}>HeyGen</div>
          <div className={styles.logoItem}>AWS</div>
          <div className={styles.logoItem}>Whisper</div>
          <div className={styles.logoItem}>VNPay</div>
        </div>
      </div>
    </section>
  );
};

export default TrustedBrands;
