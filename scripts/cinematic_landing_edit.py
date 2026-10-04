"""One-off structural update; all functional handlers remain in MarketingLanding."""
from pathlib import Path
p = Path('src/components/features/landing/MarketingLanding.tsx')
s = p.read_text(encoding='utf-8')
s = s.replace("React, { useEffect, useRef, useState }", "React, { useRef, useState }")
s = s.replace("import { MascotVisual } from '@/components/brand/MascotVisual';", "import { CinematicHero } from './CinematicHero';")
s = s.replace('  Play,\n', '').replace('  CheckCheck,\n', '')
start = s.index('function Meter(')
end = s.index('function SampleLabel', start)
s = s[:start] + s[end:]
start = s.index('function CvPreview(')
end = s.index('function InterviewPreview', start)
s = s[:start] + '''function CvPreview() {
  return (
    <div className={`${styles.productWindow} ${styles.documentPreview}`}>
      <div className={styles.windowTop}><span><FileText size={16} /> Phân tích CV</span><SampleLabel label="Minh họa cấu trúc báo cáo" /></div>
      <div className={styles.documentLayout}>
        <div className={styles.documentArtifact} data-story-panel>
          <span>HỒ SƠ NGHỀ NGHIỆP</span><h3>Câu chuyện<br />của bạn.</h3>
          <div /><div /><div />
          <strong>Kinh nghiệm & dự án</strong><div /><div />
          <strong>Kỹ năng & công nghệ</strong><div /><div />
        </div>
        <div className={styles.documentInsights}>
          <span>Đặt hồ sơ vào đúng bối cảnh.</span>
          <div data-story-panel><b>Kinh nghiệm phù hợp</b><p>Đối chiếu với vị trí hoặc JD bạn chọn.</p></div>
          <div data-story-panel><b>Bằng chứng trong dự án</b><p>Làm rõ hành động và tác động của bạn.</p></div>
          <div data-story-panel><b>Những điều cần bổ sung</b><p>Gợi ý từ nội dung phân tích thực tế.</p></div>
        </div>
      </div>
    </div>
  );
}

''' + s[end:]
hero = s.index('      {/* 1. Hero Section */}')
loop = s.index('      {/* 2. Preparation Loop Section */}')
cv = s.index('      {/* 3. CV Analysis Feature Section */}')
ai = s.index('      {/* 4. AI Interview Section */}')
practice = s.index('      {/* 5. Practice Hub Section */}')
loop_block = s[loop:cv]
cv_block = s[cv:ai].replace('02 / Bắt đầu từ câu chuyện của bạn', '04 / Improve your CV')
report = '''      <section id="report-story" className={`${styles.section} ${styles.featureGrid} ${styles.reportScene}`}>
        <div className={styles.featureCopy} data-reveal>
          <p className={styles.eyebrow}>03 / Understand your performance</p>
          <h2>Không chỉ trả lời.<br /><span>Hiểu vì sao.</span></h2>
          <p>Đọc lại câu trả lời, nhìn rõ bằng chứng và biết phần nào cần luyện tiếp. Báo cáo của Nexora giúp biến một lần thử thành một bước chuẩn bị có cơ sở.</p>
          <Checklist items={['Phản hồi gắn với nội dung bạn đã trả lời.', 'Điểm mạnh và điều cần cải thiện được phân tách rõ.', 'Luyện lại theo cấu trúc STAR hoặc tình huống phù hợp.']} />
          {actionButton('Thử phỏng vấn AI', 'interview', '/interview')}
        </div>
        <div className={styles.evidencePreview} data-reveal aria-label="Minh họa cấu trúc phản hồi, không phải báo cáo người dùng">
          <div className={styles.windowTop}><span><ChartNoAxesCombined size={18} /> Sau cuộc trò chuyện</span><SampleLabel label="Minh họa phản hồi" /></div>
          <div className={styles.evidenceQuote} data-story-panel><span>Từ câu trả lời của bạn</span><p>“Tôi kiểm tra truy vấn chậm, bổ sung index và đo lại thời gian phản hồi…”</p></div>
          <div className={styles.evidenceAxes} aria-hidden="true"><span>Bối cảnh</span><span>Hành động</span><span>Kết quả</span></div>
          <div className={styles.evidenceNote} data-story-panel><span><Check size={17} /> Hành động đã rõ</span><p>Nêu cụ thể cách tiếp cận và giải pháp.</p></div>
          <div className={styles.evidenceNext} data-story-panel><span><ArrowUpRight size={17} /> Bước luyện tiếp theo</span><p>Thêm bằng chứng về kết quả và đóng góp cá nhân.</p></div>
          <small>Ví dụ biên tập để minh họa cách đọc báo cáo. Không phải điểm số hay dữ liệu của người dùng.</small>
        </div>
      </section>

'''
s = s[:hero] + '''      <CinematicHero action={actionButton('Bắt đầu luyện tập', 'interview', '/interview')} />

''' + report + cv_block + loop_block + s[practice:]
s = s.replace('  ArrowRight,', '  ArrowRight,\n  ArrowUpRight,')
s = s.replace('04 / Luyện đúng phần còn thiếu', '05 / Build stronger skills')
s = s.replace('<Meter label="Cấu trúc câu trả lời" value={76} />\n          <Meter label="Chiều sâu chuyên môn" value={68} />\n          <Meter label="Bằng chứng kết quả" value={62} />', '''<div className={styles.skillMap} aria-label="Minh họa các phần trong hồ sơ năng lực">
            {['Cấu trúc câu trả lời', 'Chiều sâu chuyên môn', 'Bằng chứng kết quả'].map(label => <div key={label} data-story-panel><span>{label}</span><i /><i /><i /><i /></div>)}
          </div>''')
s = s.replace('05 / Nhìn thấy bước tiến của bạn', 'Lịch sử luyện tập / Hồ sơ năng lực')
p.write_text(s, encoding='utf-8')
