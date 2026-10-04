from pathlib import Path
p=Path('src/components/features/cv-analysis')
(p/'CvWorkspace.module.css').write_text('''
.workspace,.report { max-width:1120px; margin:auto; padding:44px 28px 80px; color:#17294c; }
.workspace:before,.report:before { content:''; position:fixed; inset:64px 0 0; z-index:-1; background:radial-gradient(ellipse at 20% 0,#bfd0f6,transparent 55%),radial-gradient(ellipse at 95% 30%,#d9ddfa,transparent 60%),#edf2fb; }
.hero { display:grid; grid-template-columns:1.3fr .7fr; align-items:center; gap:50px; padding:12px 0 34px; }
.eyebrow { font-size:11px; letter-spacing:.17em; color:#445fa0; font-weight:700; text-transform:uppercase; }
.hero h1 { font-size:clamp(30px,4vw,48px); letter-spacing:-.045em; line-height:1.15; margin:16px 0; max-width:620px; }
.hero p { color:#526586; font-size:15px; line-height:1.8; max-width:530px; }
.document { width:180px; height:220px; position:relative; margin:0 auto; padding:28px 24px; border:1px solid #d2ddf2; border-radius:8px; background:linear-gradient(145deg,white,#f3f6ff); box-shadow:18px 20px 0 -5px #d5def1,0 25px 55px #1c367e20; transform:rotate(-7deg); }
.document:after { content:''; position:absolute; inset:78px 23px 32px; background:repeating-linear-gradient(to bottom,#d0d9ed 0 3px,transparent 3px 17px); }
.document span { font-size:25px; font-weight:800; color:#405cb0; }
.document small { display:block; font-size:8px; letter-spacing:.13em; color:#7185a8; }
.rail { display:flex; padding:18px 0 24px; border-top:1px solid #bfcde5; }
.rail span { flex:1; color:#4c6288; font-size:12px; display:flex; align-items:center; gap:10px; }
.rail b { color:#4a60b4; font-size:10px; background:#dce5f8; width:27px; height:27px; border-radius:50%; display:grid; place-items:center; }
.panel { border:1px solid #cad7ef !important; background:linear-gradient(150deg,#ffffffed,#f6f9ffed) !important; box-shadow:0 8px 24px #2e467208 !important; border-radius:18px !important; }
.upload { min-height:185px; border:1px dashed #7799d7 !important; background:radial-gradient(ellipse at 50% 0,#e6eeff,#f8fbff) !important; border-radius:12px !important; }
.upload:focus-visible { outline:3px solid #465ee2; outline-offset:4px; }
.workspace :global(h2),.workspace :global(h3) { color:#253c69; }
.workspace :global(textarea),.workspace :global(input:not([type=radio]):not([type=checkbox])) { border-color:#becce5; }
.report > :first-child { padding-bottom:24px; border-bottom:1px solid #bfcee8; }
.report :global(.shadow-card) { border-color:#c9d6ec; background:linear-gradient(140deg,#fff,#f5f8ff); box-shadow:0 8px 30px #263f780a; }
.report h1 { color:#193667; letter-spacing:-.035em; }
.public { position:relative; min-height:calc(100svh - 64px); padding:80px max(24px,calc((100vw - 1120px)/2)); background:radial-gradient(ellipse at 80% 0,#bccdf8,transparent 65%),linear-gradient(140deg,#edf4ff,#e5eafa); overflow:hidden; }
.public .hero { grid-template-columns:1.1fr .9fr; gap:72px; min-height:560px; }
.public .document { width:245px; height:320px; padding:38px; box-shadow:24px 28px 0 -6px #c0cfea,0 45px 80px #203b7b24; }
.public .document:after { inset:100px 38px 40px; }
.annotation { margin:28px auto 0; position:relative; width:290px; padding:22px; border:1px solid #c1d0ec; border-radius:12px; background:#ffffffde; box-shadow:0 18px 40px #1c367e15; }
.annotation small { color:#6880a9; font-size:10px; text-transform:uppercase; letter-spacing:.12em; }
.annotation p { margin:12px 0; color:#385174; font-size:13px; }
.actions { display:flex; flex-wrap:wrap; gap:12px; margin-top:28px; }
.actions a { padding:14px 20px; border-radius:10px; background:#334cbd; color:white; font-size:14px; font-weight:650; }
.actions a + a { color:#344f9b; background:#fff; border:1px solid #c5d1ea; }
@media(max-width:640px) { .workspace,.report { padding:26px 18px 60px; } .hero { grid-template-columns:1fr; gap:20px; padding-bottom:25px; } .workspace .document { display:none; } .rail { gap:8px; } .rail span { font-size:10px; gap:5px; align-items:flex-start; } .rail b { flex-shrink:0; width:23px; height:23px; } .public { padding:44px 22px 60px; } .public .hero { grid-template-columns:1fr; gap:50px; } .public .document { width:180px; height:235px; padding:26px; } .public .document:after { inset:82px 26px 30px; } .annotation { width:min(290px,100%); } }
''',encoding='utf-8')
(p/'CvWorkspaceHeading.tsx').write_text('''import styles from './CvWorkspace.module.css';
export function CvWorkspaceHeading() {
  return <><header className={styles.hero}>
    <div><span className={styles.eyebrow}>Nexora / CV workspace</span><h1>Hiểu rõ hồ sơ.<br />Mở thêm cơ hội.</h1><p>Đặt CV trong đúng ngữ cảnh nghề nghiệp. Nexora đối chiếu kinh nghiệm, kỹ năng và mục tiêu để giúp bạn biết nên cải thiện điều gì tiếp theo.</p></div>
    <div className={styles.document} aria-hidden="true"><span>CV</span><small>YOUR NEXT CHAPTER</small></div>
  </header><div className={styles.rail} aria-label="Các bước phân tích CV"><span><b>01</b>Chuẩn bị tài liệu</span><span><b>02</b>Chọn ngữ cảnh</span><span><b>03</b>Đọc & cải thiện</span></div></>;
}
''',encoding='utf-8')
(p/'CvAnalysisHero.tsx').write_text('''"use client";
import { useRef } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import styles from './CvWorkspace.module.css';
gsap.registerPlugin(useGSAP);
export default function CvAnalysisHero() {
  const container = useRef<HTMLElement>(null);
  useGSAP(() => {
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.timeline({ defaults: { ease: 'power3.out', duration: .9 } })
        .from('[data-document]', { rotation: -13, x: 35, scale: .93 })
        .from('[data-annotation]', { x: -25, rotation: 3 }, '-=.65');
    });
    return () => media.revert();
  }, { scope: container });
  return <section ref={container} className={styles.public}><div className={styles.hero}>
    <div><span className={styles.eyebrow}>Nexora / Hiểu hồ sơ của bạn</span><h1>Mỗi kinh nghiệm<br />đều có giá trị.<br />Hãy để CV thể hiện rõ.</h1><p>Phân tích CV với AI theo mô tả công việc hoặc chuẩn năng lực ngành. Nhìn rõ điểm mạnh, khoảng trống và những đề xuất có thể hành động.</p><div className={styles.actions}><Link href="/resume-analyses">Tối ưu CV theo vị trí</Link><Link href="/resume-analyses">Phân tích theo ngành</Link></div></div>
    <div><div data-document className={styles.document} aria-hidden="true"><span>CV</span><small>EXPERIENCE · SKILLS · POTENTIAL</small></div><div data-annotation className={styles.annotation}><small>Minh họa cấu trúc báo cáo</small><p>Điểm mạnh có bằng chứng trong CV</p><p>Kỹ năng cần bổ sung theo mục tiêu</p><p>Đề xuất cải thiện cách trình bày</p></div></div>
  </div></section>;
}
''',encoding='utf-8')
f=Path('src/app/(dashboard)/resume-analyses/page.tsx')
s=f.read_text(encoding='utf-8').replace("import { ProductPageHero } from '@/components/product-visual';", "import { CvWorkspaceHeading } from '@/components/features/cv-analysis/CvWorkspaceHeading';\nimport cvStyles from '@/components/features/cv-analysis/CvWorkspace.module.css';")
start=s.index('      <ProductPageHero')
end=s.index('      />',start)+len('      />')
s=s[:start]+'      <CvWorkspaceHeading />'+s[end:]
s=s.replace('className="max-w-4xl mx-auto px-4 py-8 sm:py-12 space-y-8"','className={`${cvStyles.workspace} space-y-8`}')
s=s.replace('className="space-y-4 bg-white border border-outline-variant/80 shadow-card"','className={`${cvStyles.panel} space-y-4 bg-white border border-outline-variant/80 shadow-card`}')
s=s.replace('htmlFor="cvFile"','className={cvStyles.upload}\n            htmlFor="cvFile"',1) if False else s
# Preserve existing drag/drop handlers and dynamic drag state classes.
s=s.replace('className={`', 'className={`',1)
label=s.index('htmlFor="cvFile"')
pos=s.index('className=',label)
if s[pos:pos+12]=='className={`': s=s[:pos]+s[pos:].replace('className={`','className={`${cvStyles.upload} ',1)
f.write_text(s,encoding='utf-8')
f=Path('src/app/(dashboard)/resume-analyses/[id]/page.tsx')
s=f.read_text(encoding='utf-8')
s=s.replace("import React from 'react';","import React from 'react';\nimport cvStyles from '@/components/features/cv-analysis/CvWorkspace.module.css';")
s=s.replace('className="max-w-5xl mx-auto px-4 py-8 sm:py-12 space-y-8"','className={`${cvStyles.report} space-y-8`}')
s=s.replace('className="max-w-6xl mx-auto px-4 py-8 space-y-8"','className={`${cvStyles.report} space-y-8`}')
f.write_text(s,encoding='utf-8')
