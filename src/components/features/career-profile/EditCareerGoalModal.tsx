'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import {
  useCreateCareerGoal,
  useUpdateCareerGoal,
} from '@/hooks/queries/useCareerGoals';
import {
  CAREER_GOAL_SENIORITY_OPTIONS,
  buildUpdateCareerGoalRequest,
  type UpdatableCareerGoalCurrent,
} from '@/services/careerGoalContract';
import { toast } from 'sonner';

export interface CareerGoalModalGoal {
  id: string;
  targetRole: string;
  seniority: string;
  industry?: string | null;
  targetCompany?: string | null;
  targetDate?: string | null;
}

export interface EditCareerGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeGoal?: CareerGoalModalGoal | null;
  goalToEdit?: CareerGoalModalGoal | null;
}

interface CareerGoalFormContentProps {
  activeGoal?: CareerGoalModalGoal | null;
  onClose: () => void;
}

const CareerGoalFormContent: React.FC<CareerGoalFormContentProps> = ({
  activeGoal,
  onClose,
}) => {
  const [targetRole, setTargetRole] = useState(activeGoal?.targetRole || '');
  const [seniority, setSeniority] = useState(activeGoal?.seniority || '');
  const [industry, setIndustry] = useState(activeGoal?.industry || '');
  const [targetCompany, setTargetCompany] = useState(activeGoal?.targetCompany || '');
  const [targetDate, setTargetDate] = useState(
    activeGoal?.targetDate ? activeGoal.targetDate.split('T')[0] : ''
  );
  const [error, setError] = useState<string | null>(null);

  const createMutation = useCreateCareerGoal();
  const updateMutation = useUpdateCareerGoal();
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const isCustomSeniority =
    !!seniority &&
    !CAREER_GOAL_SENIORITY_OPTIONS.some(
      (opt) => opt.value === seniority.toLowerCase().trim()
    );

  const handleSaveGoal = async () => {
    const trimmedRole = targetRole.trim();
    if (trimmedRole.length < 2) {
      setError('Vị trí mục tiêu phải có ít nhất 2 ký tự.');
      return;
    }

    const trimmedSeniority = seniority.trim();
    if (!trimmedSeniority) {
      setError('Vui lòng chọn cấp bậc.');
      return;
    }

    const trimmedIndustry = industry.trim();
    const trimmedCompany = targetCompany.trim();
    const trimmedDate = targetDate.trim();

    try {
      if (activeGoal?.id) {
        const currentGoal: UpdatableCareerGoalCurrent = {
          targetRole: activeGoal.targetRole,
          seniority: activeGoal.seniority,
          industry: activeGoal.industry,
          targetCompany: activeGoal.targetCompany,
          targetDate: activeGoal.targetDate,
        };
        const request = buildUpdateCareerGoalRequest(currentGoal, {
          targetRole: trimmedRole,
          seniority: trimmedSeniority,
          industry: trimmedIndustry,
          targetCompany: trimmedCompany,
          targetDate: trimmedDate,
        });

        if (Object.keys(request).length > 0) {
          await updateMutation.mutateAsync({ id: activeGoal.id, request });
        }
        toast.success('Cập nhật mục tiêu nghề nghiệp thành công!');
      } else {
        await createMutation.mutateAsync({
          targetRole: trimmedRole,
          seniority: trimmedSeniority,
          industry: trimmedIndustry || undefined,
          targetCompany: trimmedCompany || undefined,
          targetDate: trimmedDate || undefined,
        });
        toast.success('Thiết lập mục tiêu nghề nghiệp thành công!');
      }
      onClose();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Không thể lưu mục tiêu nghề nghiệp.';
      setError(message);
      toast.error(message);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 rounded-lg bg-error-container/40 border border-error/30 text-xs text-error font-medium">
          {error}
        </div>
      )}

      <div>
        <label
          htmlFor="targetRoleInput"
          className="block text-xs font-semibold text-on-surface mb-1.5"
        >
          Vị trí mục tiêu <span className="text-red-500">*</span>
        </label>
        <input
          id="targetRoleInput"
          type="text"
          value={targetRole}
          onChange={(e) => {
            setTargetRole(e.target.value);
            if (error) setError(null);
          }}
          placeholder="VD: Backend Engineer, Frontend Developer, Product Owner..."
          className="w-full px-3.5 py-2.5 rounded-lg border border-outline-variant/60 focus:border-primary focus:outline-none text-sm text-on-surface"
          disabled={isSaving}
        />
      </div>

      <div>
        <label
          htmlFor="seniorityInput"
          className="block text-xs font-semibold text-on-surface mb-1.5"
        >
          Cấp bậc <span className="text-red-500">*</span>
        </label>
        <select
          id="seniorityInput"
          value={seniority}
          onChange={(e) => {
            setSeniority(e.target.value);
            if (error) setError(null);
          }}
          className="w-full px-3.5 py-2.5 rounded-lg border border-outline-variant/60 focus:border-primary focus:outline-none text-sm bg-white text-on-surface cursor-pointer"
          disabled={isSaving}
        >
          <option value="">Chọn cấp bậc</option>
          {isCustomSeniority && <option value={seniority}>{seniority}</option>}
          {CAREER_GOAL_SENIORITY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="industryInput"
            className="block text-xs font-semibold text-on-surface mb-1.5"
          >
            Ngành nghề
          </label>
          <input
            id="industryInput"
            type="text"
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            placeholder="VD: Fintech, E-Commerce, SaaS..."
            className="w-full px-3.5 py-2.5 rounded-lg border border-outline-variant/60 focus:border-primary focus:outline-none text-sm text-on-surface"
            disabled={isSaving}
          />
        </div>

        <div>
          <label
            htmlFor="targetCompanyInput"
            className="block text-xs font-semibold text-on-surface mb-1.5"
          >
            Công ty mục tiêu
          </label>
          <input
            id="targetCompanyInput"
            type="text"
            value={targetCompany}
            onChange={(e) => setTargetCompany(e.target.value)}
            placeholder="VD: Google, VNG, Shopee..."
            className="w-full px-3.5 py-2.5 rounded-lg border border-outline-variant/60 focus:border-primary focus:outline-none text-sm text-on-surface"
            disabled={isSaving}
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="targetDateInput"
          className="block text-xs font-semibold text-on-surface mb-1.5"
        >
          Mốc thời gian mục tiêu
        </label>
        <input
          id="targetDateInput"
          type="date"
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-lg border border-outline-variant/60 focus:border-primary focus:outline-none text-sm text-on-surface bg-white"
          disabled={isSaving}
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant/30">
        <Button variant="outline" size="sm" onClick={onClose} disabled={isSaving}>
          Hủy
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={handleSaveGoal}
          loading={isSaving}
        >
          {activeGoal ? 'Lưu thay đổi' : 'Tạo mục tiêu'}
        </Button>
      </div>
    </div>
  );
};

export const EditCareerGoalModal: React.FC<EditCareerGoalModalProps> = ({
  isOpen,
  onClose,
  activeGoal,
  goalToEdit,
}) => {
  if (!isOpen) return null;

  const targetGoal = goalToEdit ?? activeGoal ?? null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        targetGoal
          ? 'Cập nhật Mục tiêu nghề nghiệp'
          : 'Thiết lập Mục tiêu nghề nghiệp'
      }
      maxWidth="md"
    >
      <CareerGoalFormContent
        key={targetGoal?.id ?? 'new-goal'}
        activeGoal={targetGoal}
        onClose={onClose}
      />
    </Modal>
  );
};
