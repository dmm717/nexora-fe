'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAdminPlans } from '@/hooks/queries/useAdminPlans';
import { AdminPlanView, AdminPlanPriceView } from '@/services/adminApi';
import { Button } from '@/components/ui/Button/Button';
import { PlanModal } from '@/components/features/admin/plans/PlanModal';
import { PriceModal } from '@/components/features/admin/plans/PriceModal';
import { FeatureMatrixModal } from '@/components/features/admin/plans/FeatureMatrixModal';

export default function AdminPlansPage() {
  const { data: plans = [], isLoading, error } = useAdminPlans();

  // Modal States
  const [isPlanModalOpen, setPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<AdminPlanView | null>(null);

  const [isPriceModalOpen, setPriceModalOpen] = useState(false);
  const [targetPlanId, setTargetPlanId] = useState<string>('');
  const [editingPrice, setEditingPrice] = useState<AdminPlanPriceView | null>(null);

  const [isFeatureModalOpen, setFeatureModalOpen] = useState(false);
  const [targetPrice, setTargetPrice] = useState<AdminPlanPriceView | null>(null);

  const handleCreatePlan = () => {
    setEditingPlan(null);
    setPlanModalOpen(true);
  };

  const handleEditPlan = (plan: AdminPlanView) => {
    setEditingPlan(plan);
    setPlanModalOpen(true);
  };

  const handleAddPrice = (planId: string) => {
    setTargetPlanId(planId);
    setEditingPrice(null);
    setPriceModalOpen(true);
  };

  const handleEditPrice = (planId: string, price: AdminPlanPriceView) => {
    setTargetPlanId(planId);
    setEditingPrice(price);
    setPriceModalOpen(true);
  };

  const handleEditFeatures = (price: AdminPlanPriceView) => {
    setTargetPrice(price);
    setFeatureModalOpen(true);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827' }}>Quản trị hệ thống</h1>
        <Button onClick={handleCreatePlan}>+ Tạo Gói Mới</Button>
      </div>
      
      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem' }}>
        <Link href="/admin/users" style={{ color: '#4b5563', paddingBottom: '0.5rem' }}>Người dùng</Link>
        <Link href="/admin/scenarios" style={{ color: '#4b5563', paddingBottom: '0.5rem' }}>Kịch bản</Link>
        <Link href="/admin/plans" style={{ fontWeight: '600', color: '#0ea5e9', borderBottom: '2px solid #0ea5e9', paddingBottom: '0.5rem' }}>Gói cước</Link>
      </div>

      {isLoading && <div>Đang tải danh sách gói cước...</div>}
      {error && <div style={{ color: 'red' }}>Không thể tải danh sách gói cước.</div>}
      
      {!isLoading && !error && plans.length === 0 && (
        <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#f9fafb', borderRadius: '0.5rem' }}>
          Chưa có dữ liệu gói cước.
        </div>
      )}

      {!isLoading && !error && plans.length > 0 && (
        <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              <tr>
                <th style={{ padding: '1rem', fontWeight: '600', color: '#374151' }}>Thông tin Gói</th>
                <th style={{ padding: '1rem', fontWeight: '600', color: '#374151' }}>Mức giá</th>
                <th style={{ padding: '1rem', fontWeight: '600', color: '#374151' }}>Trạng thái</th>
                <th style={{ padding: '1rem', fontWeight: '600', color: '#374151', textAlign: 'right' }}>Thao tác Gói</th>
              </tr>
            </thead>
            <tbody>
              {plans.map(plan => (
                <tr key={plan.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: '600', color: '#111827' }}>
                      {plan.name} ({plan.code.toUpperCase()})
                    </div>
                    {plan.badge && <div style={{ fontSize: '0.75rem', color: '#0ea5e9', marginTop: '0.25rem' }}>{plan.badge} {plan.isHighlighted && '(Nổi bật)'}</div>}
                  </td>
                  
                  <td style={{ padding: '1rem', color: '#4b5563' }}>
                    {(plan.prices || []).length > 0 ? (
                      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {plan.prices.map(price => (
                          <li key={price.id} style={{ fontSize: '0.875rem', border: '1px solid #e5e7eb', padding: '0.5rem', borderRadius: '0.375rem', backgroundColor: price.isActive ? 'transparent' : '#f9fafb' }}>
                            <div style={{ fontWeight: '500', color: price.isActive ? '#111827' : '#9ca3af' }}>
                              {price.amountMinor.toLocaleString('vi-VN')} {price.currency} 
                              {price.durationDays ? ` / ${price.durationDays} ngày` : ''}
                            </div>
                            <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                              <button onClick={() => handleEditPrice(plan.id, price)} style={{ fontSize: '0.75rem', color: '#0ea5e9', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Sửa giá</button>
                              <span style={{ color: '#d1d5db' }}>|</span>
                              <button onClick={() => handleEditFeatures(price)} style={{ fontSize: '0.75rem', color: '#10b981', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Cấu hình quyền lợi</button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span style={{ fontSize: '0.875rem', color: '#9ca3af' }}>Chưa thiết lập giá</span>
                    )}
                    <button 
                      onClick={() => handleAddPrice(plan.id)}
                      style={{ fontSize: '0.75rem', color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: '0.75rem', fontWeight: '500' }}
                    >
                      + Thêm mức giá mới
                    </button>
                  </td>

                  <td style={{ padding: '1rem' }}>
                    <span style={{ 
                      backgroundColor: plan.isActive ? '#dcfce7' : '#f3f4f6', 
                      color: plan.isActive ? '#166534' : '#4b5563', 
                      padding: '0.25rem 0.5rem', borderRadius: '999px', fontSize: '0.75rem' 
                    }}>
                      {plan.isActive ? 'Đang bán' : 'Đã ẩn'}
                    </span>
                  </td>

                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <Button onClick={() => handleEditPlan(plan)} style={{ backgroundColor: 'white', color: '#374151', border: '1px solid #d1d5db' }}>
                      Sửa Gói
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      <PlanModal 
        isOpen={isPlanModalOpen} 
        onClose={() => setPlanModalOpen(false)} 
        editingPlan={editingPlan} 
      />
      <PriceModal 
        isOpen={isPriceModalOpen} 
        onClose={() => setPriceModalOpen(false)} 
        planId={targetPlanId} 
        editingPrice={editingPrice} 
      />
      <FeatureMatrixModal 
        isOpen={isFeatureModalOpen} 
        onClose={() => setFeatureModalOpen(false)} 
        price={targetPrice} 
      />
    </div>
  );
}
