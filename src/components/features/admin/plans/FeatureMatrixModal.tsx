import React, { useState } from 'react';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { AdminPlanPriceView } from '@/services/adminApi';
import { useAdminFeatureDefinitions, useUpdatePlanPriceFeatures } from '@/hooks/queries/useAdminPlans';

interface FeatureMatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
  price: AdminPlanPriceView | null;
}

interface FeatureFormState {
  featureCode: string;
  enabled: boolean;
  limit: number | null;
}

export function FeatureMatrixModal({ isOpen, onClose, price }: FeatureMatrixModalProps) {
  const { data: featureDefs = [], isLoading: isLoadingDefs } = useAdminFeatureDefinitions();
  const updateFeaturesMutation = useUpdatePlanPriceFeatures();

  const [featuresState, setFeaturesState] = useState<Record<string, FeatureFormState>>({});

  const [prevKey, setPrevKey] = useState<string | null>(null);
  const currentKey = price ? `${price.id}-${featureDefs.length}` : null;

  if (currentKey !== prevKey) {
    setPrevKey(currentKey);
    if (price && featureDefs.length > 0) {
      const initialState: Record<string, FeatureFormState> = {};
      featureDefs.forEach(def => {
        const existing = price.features.find(f => f.code === def.code);
        initialState[def.code] = {
          featureCode: def.code,
          enabled: existing ? existing.enabled : false,
          limit: existing && !existing.unlimited ? (existing.limit || 0) : null,
        };
      });
      setFeaturesState(initialState);
    }
  }

  if (!isOpen || !price) return null;

  const handleToggleEnabled = (code: string, enabled: boolean) => {
    setFeaturesState(prev => ({
      ...prev,
      [code]: { ...prev[code], enabled }
    }));
  };

  const handleToggleUnlimited = (code: string, unlimited: boolean) => {
    setFeaturesState(prev => ({
      ...prev,
      [code]: { ...prev[code], limit: unlimited ? null : 0 }
    }));
  };

  const handleChangeLimit = (code: string, limitStr: string) => {
    const limit = parseInt(limitStr, 10);
    setFeaturesState(prev => ({
      ...prev,
      [code]: { ...prev[code], limit: isNaN(limit) ? 0 : limit }
    }));
  };

  const handleSave = () => {
    const featuresPayload = Object.values(featuresState).map(f => ({
      featureCode: f.featureCode,
      enabled: f.enabled,
      limit: f.limit
    }));

    updateFeaturesMutation.mutate({
      priceId: price.id,
      data: { features: featuresPayload }
    }, {
      onSuccess: () => onClose()
    });
  };

  const isPending = updateFeaturesMutation.isPending;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
      backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', 
      justifyContent: 'center', zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white', borderRadius: '0.75rem', padding: '2rem', 
        width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
            Cấu hình Quyền lợi (Features)
          </h3>
          <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
        </div>
        
        {isLoadingDefs ? (
          <div>Đang tải danh sách tính năng...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <tr>
                  <th style={{ padding: '0.75rem', fontWeight: '600', color: '#374151' }}>Tính năng</th>
                  <th style={{ padding: '0.75rem', fontWeight: '600', color: '#374151', textAlign: 'center' }}>Bật/Tắt</th>
                  <th style={{ padding: '0.75rem', fontWeight: '600', color: '#374151' }}>Giới hạn (Limit)</th>
                </tr>
              </thead>
              <tbody>
                {featureDefs.map(def => {
                  const state = featuresState[def.code];
                  if (!state) return null;
                  const isUnlimited = state.limit === null;

                  return (
                    <tr key={def.code} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '0.75rem' }}>
                        <div style={{ fontWeight: '500', color: '#111827' }}>{def.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{def.code}</div>
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                        <input 
                          type="checkbox" 
                          checked={state.enabled} 
                          onChange={(e) => handleToggleEnabled(def.code, e.target.checked)}
                          style={{ width: '1.25rem', height: '1.25rem' }}
                        />
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        {state.enabled ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem' }}>
                              <input 
                                type="checkbox" 
                                checked={isUnlimited}
                                onChange={(e) => handleToggleUnlimited(def.code, e.target.checked)}
                              />
                              Vô hạn
                            </label>
                            {!isUnlimited && (
                              <Input 
                                label=""
                                type="number" 
                                min="0"
                                value={state.limit !== null ? state.limit : 0} 
                                onChange={(e) => handleChangeLimit(def.code, e.target.value)}
                                style={{ width: '80px', marginTop: 0 }}
                                className="!mt-0"
                              />
                            )}
                          </div>
                        ) : (
                          <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Đã tắt</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
              <Button type="button" onClick={onClose} disabled={isPending} style={{ backgroundColor: 'white', color: '#374151', border: '1px solid #d1d5db' }}>Hủy</Button>
              <Button type="button" onClick={handleSave} disabled={isPending}>
                {isPending ? 'Đang lưu...' : 'Lưu quyền lợi'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
