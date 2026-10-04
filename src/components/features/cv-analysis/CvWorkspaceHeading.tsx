import styles from './CvWorkspace.module.css';
export function CvWorkspaceHeading() {
  return <><header className={styles.hero}>
    <div><span className={styles.eyebrow}>Nexora / CV workspace</span><h1>Hiểu rõ hồ sơ.<br />Mở thêm cơ hội.</h1><p>Đặt CV trong đúng ngữ cảnh nghề nghiệp. Nexora đối chiếu kinh nghiệm, kỹ năng và mục tiêu để giúp bạn biết nên cải thiện điều gì tiếp theo.</p></div>
    <div className={styles.document} aria-hidden="true"><span>CV</span><small>YOUR NEXT CHAPTER</small></div>
  </header><div className={styles.rail} aria-label="Các bước phân tích CV"><span><b>01</b>Chuẩn bị tài liệu</span><span><b>02</b>Chọn ngữ cảnh</span><span><b>03</b>Đọc & cải thiện</span></div></>;
}
