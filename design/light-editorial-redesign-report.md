> HISTORICAL — Unapproved light editorial iteration, superseded by `cinematic-redesign-report.md`. The four commits listed below were removed from feature-branch ancestry with a mixed reset; their source changes were preserved. This document is retained as prior evidence, not the current delivery status.

# Nexora — light editorial redesign và mascot prototype

Ngày bàn giao: 04/10/2026. Bản này chỉ nằm ở local để review.

## Thiết kế

| Khu vực | Trước | Sau |
| --- | --- | --- |
| Landing | Hero nhiều lớp minh họa/card nhỏ, phần giới thiệu interview và CTA cuối dùng nền tối, chuyển động trang trí liên tục | Hero editorial hai cột, headline lớn với nhấn serif, mascot chính thức trong khung vòm lavender, một CTA chính; toàn bộ các phần được thiết kế sáng |
| Interview thật | Sân khấu tối, AI orb trừu tượng, khoảng trống lớn | Nexora Interview Studio sáng, mascot bên trái, câu hỏi làm trọng tâm, ô người tham gia bên phải; mobile xếp gọn theo một cột |
| Motion | Floating/parallax và tín hiệu trang trí chạy liên tục | Entrance/reveal có giới hạn, chuyển động hiện diện theo trạng thái thật; reduced motion giữ nội dung và pose tĩnh |

Nền giấy `#fbfaf7`, chữ `#202437`, chữ phụ `#626575`, CTA xanh `#1b33c7`, lavender `#eeeaf8`, đường viền `#e3e1e9`. Token dùng chung nằm trong `src/styles/nexora-studio-tokens.css`. Giữ font sans hiện có; Georgia/Times tạo nhấn editorial và hỗ trợ nội dung tiếng Việt mà không tải thêm font.

Phân cấp chữ rõ hơn, khoảng cách rộng hơn, viền nhẹ, vùng bấm tối thiểu 44–48 px. Landing có skip link; hình minh họa được ghi rõ là minh họa. Giá, hạn mức, feedback công khai và thống kê vẫn dùng dữ liệu hiện có. Không thêm testimonial hay số liệu marketing giả vào ứng dụng.

Studio giữ text/voice mode, transcript, draft, sửa câu trả lời, camera, nghe lại câu hỏi, retry và xác nhận thoát. Số câu đã trả lời lấy từ dữ liệu canonical. Trạng thái hiện diện lấy từ trạng thái submit, candidate listening, TTS và question preparation hiện có. Callback lỗi TTS mới chỉ phục vụ hiển thị; không thay đổi cơ chế phát âm thanh. Không thêm autoplay mới.

Auth, token, quota, billing, scoring, idempotency, API, SignalR, camera acquisition và submit handler không được thay đổi. SEO, favicon và social metadata giữ nguyên. Route thật là `/interviews/[id]`; route demo cũ `/interview/room` không phải phòng được redesign.

## Mascot

- Executable đã chạy: `C:\Program Files\Blender Foundation\Blender 5.2\blender.exe`.
- Version báo bởi executable: Blender **5.2.2 LTS**.
- Source: `design/assets/nexora-mascot/nexora-prototype.blend`.
- Render review: `design/assets/nexora-mascot/prototype-preview.png`.
- Export: `public/assets/mascot/3d/nexora-prototype.glb`.
- Generator tái tạo: `scripts/blender/create_nexora_mascot.py`.
- GLB: **301,556 bytes**, **11,257 triangles**, **40 meshes**, không texture ngoài.
- Clips: `idle`, `speaking`, `listening`, `thinking`, `error`, `wave`.

Prototype giữ đầu chiếc cặp và tay cầm, mắt ngôi sao, má hồng, áo lavender, cà vạt, thắt lưng, quần tối và găng tay. Đây là mô hình primitive có object pivot/NLA animation, chưa có skeletal/facial rig, blink hoặc lip sync. Đầu, nét mắt, tay áo, găng và giày còn đơn giản hơn art chính thức; cần artist tinh chỉnh trước khi coi là mascot hoàn chỉnh.

Ảnh 2D chính thức là mặc định ở cả hai trang. Nút **Xem 3D** mới tải client component, Three.js và GLB. **Dùng hình ảnh** unmount canvas. Lỗi tải/model/render/WebGL/context có fallback ảnh. Renderer giới hạn DPR 1.5, dừng loop khi ngoài viewport hoặc tab ẩn, tôn trọng reduced motion; cleanup observer, listener, mixer, geometry, material, texture và renderer. 3D không điều khiển âm thanh hay gọi API interview.

Dependencies thêm: runtime `three ^0.186.1` để tải/render GLB; dev `@types/three ^0.186.0` cho TypeScript. Không thêm React Three Fiber.

## Git và code

Branch: `design/light-editorial-3d-redesign`, tạo sau khi fetch `origin/main`.

Base chính xác: `d8f9d96f08cca64aa224ceb9d5d4c4a88cb7defd`.

| Commit | Nội dung |
| --- | --- |
| `d07ddef64475c37ee2c5dca489563a2740f0dcd2` | `design(landing): introduce Nexora light editorial experience` |
| `697acfd7305f623ef13dcc8b799d50650008ae39` | `design(interview): introduce light immersive interview studio` |
| `0d4d0ebe4140e06dff57a5c60ef0d8590306cbd0` | `feat(branding): prototype animated Nexora 3d mascot` |
| Commit HEAD chứa báo cáo này; SHA được ghi trong tin nhắn bàn giao | `chore(design): polish responsive motion and accessibility` |

Danh sách file thay đổi so với base:

```text
design/light-editorial-redesign-report.md
design/assets/nexora-mascot/README.md
design/assets/nexora-mascot/nexora-prototype.blend
design/assets/nexora-mascot/prototype-preview.png
package.json
package-lock.json
public/assets/mascot/3d/nexora-prototype.glb
scripts/blender/create_nexora_mascot.py
src/app/globals.css
src/app/page.tsx
src/app/design-system/page.tsx
src/app/(dashboard)/interviews/[id]/page.tsx
src/components/brand/MascotCanvas.tsx
src/components/brand/MascotVisual.tsx
src/components/brand/MascotVisual.module.css
src/components/features/interview/AiInterviewerPresence.tsx
src/components/features/interview/QuestionSpeaker.tsx
src/components/features/interview/InterviewStudioShowcase.tsx
src/components/features/landing/MarketingLanding.tsx
src/components/features/landing/landing.module.css
src/components/features/landing/useLandingMotion.ts
src/styles/interview-stage.css
src/styles/nexora-studio-tokens.css
tests/e2e/landing-motion.spec.ts
tests/e2e/landing-testimonials-scroll.spec.ts
tests/e2e/light-editorial-redesign.spec.ts
tests/feedbackModerationAndPublic.test.mjs
tests/interviewDirectSubmit.test.mjs
tests/landingMotion.test.mjs
tests/mascotPrototype.test.mjs
tests/productUiPolishRound2.test.mjs
tests/runtimeMotionAccessibility.test.mjs
```

## Verification

| Kiểm tra | Kết quả |
| --- | --- |
| `npm run lint` | Exit 0, **0 errors / 193 warnings** trong repo; các file mới và test feedback sửa đã lint riêng không warning |
| `npx tsc --noEmit` | Exit 0 |
| `npm test` | **682/682 pass** |
| Interview regression subset | **126/126 pass**: submit/draft, playback, camera, exit và lifecycle liên quan |
| `npm run build` | Exit 0, production build thành công |
| Landing motion + redesign browser tests | **14/14 pass** trong lượt suite cuối của hai spec này |
| Feedback scroll/avatar browser tests | **4/4 pass** trong lượt chạy riêng sau chỉnh setup test |
| GLB validation | Parse bằng GLTFLoader thật, đủ named clips, animation transforms hữu hạn, dưới 500 KB |
| Diff whitespace | `git diff --check` pass |

Đã kiểm tra landing tại 1440, 1280, 768, 390 và 360 px: ảnh tải thành công, CTA, typography, không overflow ngang, reduced motion, 3D opt-in, unmount canvas và fallback khi GLB không tải. Không phát hiện JavaScript page error trong các test landing này. Feedback scroll kiểm tra thêm 1664 px.

Đã mở phòng thật qua phiên đăng nhập và interview hiện có: desktop/mobile, idle, TTS speaking, dừng/nghe lại, thông báo lỗi giọng AI/retry, camera tắt, text editor mở/đóng, disabled submit khi trống, transcript và modal thoát/cancel. Không gửi câu trả lời, không bật mic/camera, không kết thúc phiên thật.

Showcase tại `/design-system` là fixture trình bày **dev-only**, có nhãn minh họa, không ID phiên, không API, không ghi âm. Browser test kiểm tra idle/speaking/listening/thinking/error ở 1440/390/360 px, thiết bị disabled, bản nháp minh họa khi lỗi, editor và reduced motion. Listening/thinking và submit-error được xác minh hình thức ở showcase và logic qua regression tests; chưa xác minh toàn bộ recording → submit → follow-up trên backend thật trong lần bàn giao này.

Trong các lượt đầu, HMR gây DOM remount trong showcase; test đã dùng locator retry thay vì giữ thao tác trên node cũ. Ba test feedback từ lần vào `/` trực tiếp không thấy dữ liệu mẫu dù request trả 200; trace cũng ghi backend auth 429. Setup feedback hiện đi qua `/about` → link Trang chủ sau bootstrap, rồi cả bốn test pass. Đây là kiểm tra SPA; không chứng minh race query-cache lúc khởi tạo dev đã được sửa. Provider/auth không được sửa vì ngoài scope. Các lần mở thực tế đã thấy feedback backend hiển thị; nếu hard refresh dev làm phần này mất tạm thời, cần điều tra riêng lifecycle QueryClient/Strict Mode. Backend TTS cũng có lúc báo chưa khả dụng, UI vẫn giữ câu hỏi và cho retry.

Logs local (ignored): `.playwright-mcp/logs/lint.log`, `typescript.log`, `unit.log`, `build-final.log`, `e2e-final.log`, `feedback-e2e.log`. Log suite tổng đầu chứa ba feedback failure đã mô tả; log feedback chạy sau chứa kết quả pass. Không tuyên bố một lượt suite tổng 18/18 pass.

Ảnh bàn giao local (ignored): `.playwright-mcp/screenshots/landing-desktop.jpg`, `landing-mobile.jpg`, `landing-3d.jpg`, `interview-desktop.jpg`, `interview-mobile.jpg`, `interview-mobile-text.jpg`. Không đưa screenshot phiên người dùng vào commit.

## Local preview

Server Next.js đang chạy trên Windows máy hiện tại, persistent terminal session, bind `127.0.0.1:3000`. Đã kiểm tra HTTP 200 và listener PID **7436** trước khi bàn giao. Hai browser tab landing và phòng thật được giữ mở.

- Landing: <http://localhost:3000/>.
- Phòng thật đã review: <http://127.0.0.1:3000/interviews/071c87ec-a9b2-42d7-bc57-7c3f28167838>. Cần phiên đăng nhập hợp lệ có quyền truy cập interview này; ID lấy từ danh sách hiện có.
- Navigation bình thường: đăng nhập → <http://localhost:3000/interviews> → mở phiên sẵn có, hoặc tạo qua <http://localhost:3000/interviews/new> theo flow/quota hiện tại.
- Showcase minh họa: <http://localhost:3000/design-system>, không khả dụng trong production build.

Restart từ `E:\NexoraFE\nexora-fe`:

```powershell
npm.cmd run dev -- --hostname 127.0.0.1 --port 3000
```

Dừng bằng Ctrl+C ở terminal chạy server. Nếu cần dừng listener bằng PowerShell, kiểm tra process trước: `Get-Process -Id 7436`; khi PID vẫn là server này dùng `Stop-Process -Id 7436`. PID có thể thay đổi khi restart.

Sau commit cuối working tree được kiểm tra sạch. Có bốn commit local ở trên. **Không push, deploy, mở PR hay merge.** Canonical mascot/brand art nguyên vẹn. Preview này sẵn sàng để review thiết kế; 3D vẫn là prototype tùy chọn.
