'use client';

import React, { useState } from 'react';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { IconButton } from '@/components/ui/IconButton';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { Alert } from '@/components/ui/Alert';
import { RadialScore } from '@/components/ui/RadialScore';
import { AudioWaveform } from '@/components/ui/AudioWaveform';
import { ProductFocusedSurface } from '@/components/ui/ProductFocusedSurface';

export default function DesignSystemShowcase() {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [textareaValue, setTextareaValue] = useState('');
  const [selectValue, setSelectValue] = useState('vi');

  return (
    <div className="min-h-screen bg-surface p-6 sm:p-10 font-sans text-on-surface">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <header className="border-b border-outline-variant/60 pb-6">
          <Badge variant="primary" size="sm" className="mb-2">
            DEV ONLY SHOWCASE
          </Badge>
          <h1 className="text-3xl font-extrabold tracking-tight">Nexora Design Foundation</h1>
          <p className="text-on-surface-variant text-sm mt-1">
            Normalized component primitives, tokens, focus treatments, and surfaces.
          </p>
        </header>

        {/* 1. Typography Hierarchy */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold border-b border-outline-variant/30 pb-2">1. Typography Hierarchy</h2>
          <div className="space-y-3 bg-white p-6 rounded-2xl border border-outline-variant/50">
            <div>
              <span className="text-xs text-outline font-semibold block mb-1">Display Headline</span>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-on-surface">
                Nâng tầm sự nghiệp cùng Nexora AI
              </h1>
            </div>
            <div>
              <span className="text-xs text-outline font-semibold block mb-1">Page Title / H2</span>
              <h2 className="text-2xl font-bold tracking-tight text-on-surface">
                Báo cáo đánh giá năng lực phỏng vấn
              </h2>
            </div>
            <div>
              <span className="text-xs text-outline font-semibold block mb-1">Section Title / H3</span>
              <h3 className="text-lg font-semibold text-on-surface">
                Phân tích cấu trúc câu trả lời theo STAR
              </h3>
            </div>
            <div>
              <span className="text-xs text-outline font-semibold block mb-1">Body Default</span>
              <p className="text-sm leading-relaxed text-on-surface-variant">
                Ứng viên thể hiện khả năng giải quyết xung đột tốt với ví dụ thực tế. Giọng điệu tự tin và cấu trúc rõ ràng.
              </p>
            </div>
            <div>
              <span className="text-xs text-outline font-semibold block mb-1">Caption / Helper</span>
              <p className="text-xs text-outline">Thời gian cập nhật: 10 phút trước • Phiên phỏng vấn #4928</p>
            </div>
          </div>
        </section>

        {/* 2. Button System */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold border-b border-outline-variant/30 pb-2">2. Button System</h2>
          <div className="bg-white p-6 rounded-2xl border border-outline-variant/50 space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="tonal">Tonal</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">Danger</Button>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm">Small (32px)</Button>
              <Button size="md">Medium (40px)</Button>
              <Button size="lg">Large (48px)</Button>
              <Button loading>Đang xử lý</Button>
              <Button disabled>Vô hiệu hóa</Button>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <IconButton aria-label="Cài đặt" icon={<span>⚙</span>} variant="outline" />
              <IconButton aria-label="Thêm mới" icon={<span>+</span>} variant="primary" />
              <IconButton aria-label="Xóa" icon={<span>✕</span>} variant="danger" />
            </div>
          </div>
        </section>

        {/* 3. Badges */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold border-b border-outline-variant/30 pb-2">3. Badges</h2>
          <div className="bg-white p-6 rounded-2xl border border-outline-variant/50 flex flex-wrap gap-2.5">
            <Badge variant="primary">Primary</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="tertiary">Tertiary</Badge>
            <Badge variant="neutral">Neutral</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="success">Hoàn thành (88%)</Badge>
            <Badge variant="warning">Cần chú ý</Badge>
            <Badge variant="error">Chưa đạt</Badge>
            <Badge variant="info">Thông tin</Badge>
          </div>
        </section>

        {/* 4. Form Inputs */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold border-b border-outline-variant/30 pb-2">4. Form Inputs</h2>
          <div className="bg-white p-6 rounded-2xl border border-outline-variant/50 grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Họ và tên"
              placeholder="Nguyễn Văn A"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <Input
              label="Mật khẩu"
              type="password"
              placeholder="••••••••"
              defaultValue="password123"
            />
            <Select
              label="Ngôn ngữ phòng phỏng vấn"
              value={selectValue}
              onChange={(e) => setSelectValue(e.target.value)}
              options={[
                { value: 'vi', label: 'Tiếng Việt (vi-VN)' },
                { value: 'en', label: 'English (en-US)' },
              ]}
              helperText="Ngôn ngữ sử dụng cho AI Interviewer"
            />
            <Textarea
              label="Mô tả kinh nghiệm nổi bật"
              placeholder="Nêu rõ tình huống, hành động và kết quả (STAR)..."
              value={textareaValue}
              onChange={(e) => setTextareaValue(e.target.value)}
              helperText="Tối thiểu 50 từ để đạt độ chuẩn xác cao"
            />
          </div>
        </section>

        {/* 5. Cards & Surface Hierarchy */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold border-b border-outline-variant/30 pb-2">5. Cards & Surface Hierarchy</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card variant="flat">
              <h4 className="font-bold text-sm mb-1">Flat Card</h4>
              <p className="text-xs text-on-surface-variant">Thẻ phẳng viền tiêu chuẩn</p>
            </Card>
            <Card variant="elevated">
              <h4 className="font-bold text-sm mb-1">Elevated Card</h4>
              <p className="text-xs text-on-surface-variant">Thẻ bóng mờ nhẹ</p>
            </Card>
            <Card variant="subtle">
              <h4 className="font-bold text-sm mb-1">Subtle Card</h4>
              <p className="text-xs text-on-surface-variant">Thẻ nền xám nhạt dịu</p>
            </Card>
            <Card variant="interactive">
              <h4 className="font-bold text-sm mb-1">Interactive Card</h4>
              <p className="text-xs text-on-surface-variant">Hover có hiệu ứng nhấc thẻ</p>
            </Card>
            <Card variant="selected">
              <h4 className="font-bold text-sm mb-1 text-primary">Selected Card</h4>
              <p className="text-xs text-on-surface-variant">Thẻ được kích hoạt hoặc đang chọn</p>
            </Card>
          </div>
        </section>

        {/* 6. Alerts & Status */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold border-b border-outline-variant/30 pb-2">6. Alerts & Status</h2>
          <div className="space-y-3">
            <Alert variant="info" title="Hệ thống phỏng vấn">
              Phiên phỏng vấn thử nghiệm hoàn toàn miễn phí cho 3 câu hỏi đầu tiên.
            </Alert>
            <Alert variant="success" title="Cập nhật thành công">
              Hồ sơ năng lực đã đồng bộ với định chuẩn ngành mới nhất.
            </Alert>
            <Alert variant="warning" title="Hạn mức sắp hết">
              Bạn còn 1 lượt phân tích CV miễn phí trong chu kỳ này.
            </Alert>
            <Alert variant="error" title="Không thể kết nối">
              Đường truyền mạng bị gián đoạn. Dữ liệu câu trả lời của bạn đã được lưu tạm.
            </Alert>
          </div>
        </section>

        {/* 7. Radial Score & Audio Waveform */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold border-b border-outline-variant/30 pb-2">7. Data Visual Primitives</h2>
          <div className="bg-white p-6 rounded-2xl border border-outline-variant/50 flex flex-wrap items-center justify-around gap-6">
            <RadialScore score={85} size="sm" label="Kỹ năng STAR" sublabel="85/100" />
            <RadialScore score={72} size="md" label="Điểm tổng quan" sublabel="Phù hợp vị trí Senior" />
            <RadialScore score={45} size="sm" label="Khớp từ khóa" sublabel="Cần tối ưu thêm" />
            <div className="text-center">
              <span className="text-xs text-outline font-semibold block mb-2">Audio Waveform Indicator</span>
              <AudioWaveform isRecording={true} className="justify-center" />
            </div>
          </div>
        </section>

        {/* 8. Empty State & Modal Dialog */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold border-b border-outline-variant/30 pb-2">8. Empty State & Modal</h2>
          <div className="bg-white p-6 rounded-2xl border border-outline-variant/50 space-y-6">
            <EmptyState
              title="Chưa có phiên phỏng vấn nào"
              description="Bắt đầu luyện tập phản xạ phỏng vấn với AI để nhận phản hồi chi tiết theo khung năng lực chuẩn quốc tế."
              action={
                <Button variant="primary" onClick={() => setIsModalOpen(true)}>
                  Mở hộp thoại thử nghiệm
                </Button>
              }
            />

            <Modal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              title="Thử nghiệm Modal Dialog"
              description="Hộp thoại chuẩn có focus trap, đóng phím Escape và chặn cuộn trang."
            >
              <div className="space-y-4">
                <p className="text-sm text-on-surface-variant">
                  Đây là component Modal dùng chung của Nexora, đã được chuẩn hóa theo thiết kế prototype.
                </p>
                <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant/40">
                  <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                    Hủy bỏ
                  </Button>
                  <Button variant="primary" onClick={() => setIsModalOpen(false)}>
                    Xác nhận
                  </Button>
                </div>
              </div>
            </Modal>
          </div>
        </section>

        {/* 9. Scoped Dark World Foundation */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold border-b border-outline-variant/30 pb-2">
            9. Scoped Dark World Foundation (Interview Call Room)
          </h2>
          <ProductFocusedSurface theme="interview" className="p-8 rounded-2xl">
            <div className="max-w-xl mx-auto text-center space-y-4">
              <span className="text-xs tracking-widest text-[#a6edda] uppercase font-bold">
                Scoped Dark Theme Active
              </span>
              <h3 className="text-2xl font-bold text-[#f3f5ff]">Phòng Phỏng Vấn Giả Lập</h3>
              <p className="text-sm text-[#c3cde5] leading-relaxed">
                Theme tối chỉ bao đóng trong ProductFocusedSurface, không làm ô nhiễm trang Dashboard hoặc Landing chung.
              </p>
              <div className="pt-2 flex justify-center gap-3">
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl bg-[#253452] text-[#f3f5ff] text-sm font-semibold hover:bg-[#344766] transition-colors"
                >
                  Kết thúc
                </button>
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl bg-[#d1c6ff] text-[#21194b] text-sm font-semibold hover:bg-[#bbaaff] transition-colors"
                >
                  Ghi âm trả lời
                </button>
              </div>
            </div>
          </ProductFocusedSurface>
        </section>
      </div>
    </div>
  );
}
