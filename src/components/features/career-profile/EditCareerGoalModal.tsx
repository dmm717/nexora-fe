'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import {
  useCreateCareerGoal,
  useUpdateCareerGoal,
} from '@/hooks/queries/useCareerGoals';
import type { CareerProfileResponse } from '@/services/profileApi';
import type { UpdateCareerGoalRequest } from '@/services/careerGoalContract';
import { toast } from 'sonner';

export interface EditCareerGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeGoal?: CareerProfileResponse['activeCareerGoal'] | null;
}

const SENIORITY_OPTIONS = ['Intern', 'Fresher', 'Junior', 'Middle', 'Senior', 'Lead'] as const;

interface CareerGoalFormContentProps {
  activeGoal?: CareerProfileResponse['activeCareerGoal'] | null;
  onClose: () => void;
}

const CareerGoalFormContent: React.FC<CareerGoalFormContentProps> = ({
  activeGoal,
  onClose,
}) => {
  const [targetRole, setTargetRole] = useState(activeGoal?.targetRole || '');
  const [seniority, setSeniority] = useState(activeGoal?.seniority || 'Middle');
  const [industry, setIndustry] = useState(activeGoal?.industry || '');
  const [error, setError] = useState<string | null>(null);

  const createMutation = useCreateCareerGoal();
  const updateMutation = useUpdateCareerGoal();
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const handleSaveGoal = async () => {
    const trimmedRole = targetRole.trim();
    if (trimmedRole.length < 2) {
      setError('Vị trí mục tiêu phải có ít nhất 2 ký tự.');
      return;
    }

    const trimmedSeniority = seniority.trim();
    if (!trimmedSeniority) {
      setError('Vui lòng chọn cấp bậc mong muốn.');
      return;
    }

    const trimmedIndustry = industry.trim();

    try {
      if (activeGoal?.id) {
        const request: UpdateCareerGoalRequest = {
          targetRoleSpecified: true,
          targetRole: trimmedRole,
          senioritySpecified: true,
          seniority: trimmedSeniority,
          industrySpecified: true,
          industry: trimmedIndustry || null,
        };
        await updateMutation.mutateAsync({ id: activeGoal.id, request });
        toast.success('Cập nhật mục tiêu nghề nghiệp thành công!');
      } else {
        await createMutation.mutateAsync({
          targetRole: trimmedRole,
          seniority: trimmedSeniority,
          industry: trimmedIndustry || undefined,
        });
        toast.success('Thiết lập mục tiêu nghề nghiệp thành công!');
      }
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Không thể lưu mục tiêu nghề nghiệp.';
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
        <label htmlFor="targetRoleInput" className="block text-xs font-semibold text-on-surface mb-1.5">
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
        <label htmlFor="seniorityInput" className="block text-xs font-semibold text-on-surface mb-1.5">
          Cấp bậc <span className="text-red-500">*</span>
        </label>
        <select
          id="seniorityInput"
          value={seniority}
          onChange={(e) => setSeniority(e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-lg border border-outline-variant/60 focus:border-primary focus:outline-none text-sm bg-white text-on-surface cursor-pointer"
          disabled={isSaving}
        >
          {SENIORITY_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="industryInput" className="block text-xs font-semibold text-on-surface mb-1.5">
          Ngành nghề
        </label>
        <input
          id="industryInput"
          type="text"
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          placeholder="VD: Fintech, E-Commerce, Logistics, SaaS..."
          className="w-full px-3.5 py-2.5 rounded-lg border border-outline-variant/60 focus:border-primary focus:outline-none text-sm text-on-surface"
          disabled={isSaving}
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant/30">
        <Button variant="outline" size="sm" onClick={onClose} disabled={isSaving}>
          Hủy
        </Button>
        <Button variant="primary" size="sm" onClick={handleSaveGoal} loading={isSaving}>
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
}) => {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={activeGoal ? 'Cập nhật Mục tiêu nghề nghiệp' : 'Thiết lập Mục tiêu nghề nghiệp'}
      maxWidth="md"
    >
      <CareerGoalFormContent
        key={activeGoal?.id ?? 'new-goal'}
        activeGoal={activeGoal}
        onClose={onClose}
      />
    </Modal>
  );
};
