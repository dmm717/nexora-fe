"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCurrentUser } from '@/hooks/queries/useUser';
import { authApi } from '@/services/authApi';
import styles from './account.module.css';

export default function AccountPage() {
    const { data: user } = useCurrentUser();
    const router = useRouter();
    
    const [activeTab, setActiveTab] = useState<'profile' | 'history'>('profile');
    
    // Accordion state
    const [openAcc, setOpenAcc] = useState<Record<string, boolean>>({});
    
    // Notification toggles
    const [notifEmail, setNotifEmail] = useState(true);
    const [notifSystem, setNotifSystem] = useState(true);
    const [notifPromo, setNotifPromo] = useState(false);
    
    // Avatar state
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

    // Modal state
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    // Form inputs
    const [name, setName] = useState(user?.displayName || "");
    const [phone, setPhone] = useState("");
    const [dob, setDob] = useState("");
    const [bio, setBio] = useState("");
    
    const [displayLanguage, setDisplayLanguage] = useState("vi");

    const toggleAccordion = (id: string) => {
        setOpenAcc(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
            alert('Ảnh vượt quá 2MB');
            return;
        }
        const reader = new FileReader();
        reader.onload = (ev) => {
            if (ev.target?.result) {
                setAvatarUrl(ev.target.result as string);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleLogout = async () => {
        try {
            await authApi.logout();
            router.push('/');
        } catch (e) {
            console.error(e);
        }
    };

    const handleDeleteAccount = async () => {
        try {
            await authApi.logout();
            router.push('/');
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="mx-auto w-full max-w-container-max px-margin-mobile pb-16 pt-24 md:px-margin-desktop md:pt-28">
            <div className="flex flex-col">
                <span className="font-label-lg text-label-lg text-on-surface">{user?.displayName || "Người dùng"}</span>
                <span className="font-body-md text-body-md text-on-surface-variant">{user?.email || "Email chưa cập nhật"}</span>
            </div>

            <div className="mb-6 flex items-center gap-2" role="tablist">
                <button 
                    className={`${styles.acTab} ${activeTab === 'profile' ? styles.acTabActive : ''}`} 
                    onClick={() => setActiveTab('profile')}
                    aria-selected={activeTab === 'profile'}
                >
                    <span className="material-symbols-outlined" style={{fontSize: '17px'}}>manage_accounts</span>
                    Chỉnh sửa hồ sơ
                </button>
                <button 
                    className={`${styles.acTab} ${activeTab === 'history' ? styles.acTabActive : ''}`} 
                    onClick={() => setActiveTab('history')}
                    aria-selected={activeTab === 'history'}
                >
                    <span className="material-symbols-outlined" style={{fontSize: '17px'}}>receipt_long</span>
                    Lịch sử mua hàng
                </button>
            </div>

            {activeTab === 'profile' && (
                <div className="grid grid-cols-1 lg:grid-cols-[440px_1fr] gap-5 items-start">
                    {/* LEFT CARD */}
                    <div className={styles.acCard} style={{padding: '24px'}}>
                        <div className={styles.acSectionHead}>
                            <span className="material-symbols-outlined">person</span>
                            <h2>Thông tin hồ sơ</h2>
                        </div>

                        <div style={{display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '22px'}}>
                            <div className={styles.acAvatarWrap}>
                                <div className={styles.acAvatar} style={avatarUrl ? { backgroundImage: `url(${avatarUrl})` } : {}}>
                                    {!avatarUrl && (user?.displayName?.charAt(0).toUpperCase() || 'U')}
                                </div>
                                <label htmlFor="avatar-input" className={styles.acAvatarCam} title="Đổi ảnh">
                                    <span className="material-symbols-outlined">photo_camera</span>
                                </label>
                                <input id="avatar-input" type="file" accept="image/*" style={{display: 'none'}} onChange={handleAvatarChange} />
                            </div>
                            <div>
                                <p style={{fontSize: '13.5px', fontWeight: 600, color: '#1c1b2e', margin: '0 0 3px'}}>Ảnh hồ sơ</p>
                                <p style={{fontSize: '12px', color: '#9896b4', margin: 0}}>JPG, PNG hoặc GIF. Tối đa 2MB</p>
                            </div>
                        </div>

                        <form onSubmit={(e) => e.preventDefault()} style={{display: 'flex', flexDirection: 'column', gap: '14px'}}>
                            <div>
                                <label htmlFor="input-name" className={styles.acLabel}>Họ và tên <span style={{color: '#3525cd'}}>*</span></label>
                                <input id="input-name" type="text" className={styles.acInput} placeholder="Nguyễn Văn A" value={name} onChange={e => setName(e.target.value)} />
                            </div>

                            <div>
                                <label htmlFor="input-email" className={styles.acLabel}>Email</label>
                                <input id="input-email" type="email" className={styles.acInput} disabled value={user?.email || ""} />
                                <p className={styles.acHint}>Không thể thay đổi email</p>
                            </div>

                            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px'}}>
                                <div>
                                    <label htmlFor="input-phone" className={styles.acLabel}>Điện thoại</label>
                                    <input id="input-phone" type="tel" className={styles.acInput} placeholder="0901 234 567" value={phone} onChange={e => setPhone(e.target.value)} />
                                </div>
                                <div>
                                    <label htmlFor="input-dob" className={styles.acLabel}>Ngày sinh</label>
                                    <input id="input-dob" type="date" className={styles.acInput} value={dob} onChange={e => setDob(e.target.value)} />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="input-bio" className={styles.acLabel}>Giới thiệu</label>
                                <textarea id="input-bio" className={styles.acInput} rows={3} maxLength={1000} placeholder="Viết vài dòng về bản thân..." value={bio} onChange={e => setBio(e.target.value)}></textarea>
                                <p className={styles.acHint}>Tối đa 1000 ký tự</p>
                            </div>

                            <div style={{display: 'flex', justifyContent: 'flex-end', paddingTop: '4px'}}>
                                <button type="button" className={styles.acBtnPrimary} onClick={() => alert('Đã lưu')}>
                                    <span className="material-symbols-outlined">save</span>
                                    Lưu thay đổi
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* RIGHT STACK */}
                    <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                        <section className={`${styles.acCard} ${styles.acPlanCard}`} aria-labelledby="account-plan-title">
                            <div className={styles.acPlanInner}>
                                <div className={styles.acPlanTop}>
                                    <div>
                                        <div className={styles.acPlanKicker}>
                                            <span className="material-symbols-outlined" aria-hidden="true">workspace_premium</span>
                                            <span>Gói của bạn</span>
                                        </div>
                                        <h2 id="account-plan-title" className={styles.acPlanName}>Nexora</h2>
                                    </div>
                                    <div className={styles.acPlanPercent}>
                                        <strong>0%</strong>
                                        <span>lượt còn lại</span>
                                    </div>
                                </div>

                                <div className={styles.acPlanMeter} role="progressbar" aria-label="Dung lượng gói còn lại">
                                    <span style={{width: '0%'}}></span>
                                </div>

                                <div className={styles.acPlanMeta}>
                                    <div className={styles.acPlanStat}>
                                        <b>0</b>
                                        <span>Phỏng vấn đã dùng</span>
                                    </div>
                                    <div className={styles.acPlanStat}>
                                        <b>0</b>
                                        <span>Lượt còn lại</span>
                                    </div>
                                    <div className={styles.acPlanStat}>
                                        <b>—</b>
                                        <span>Thời hạn gói</span>
                                    </div>
                                </div>

                                <div className={styles.acPlanFoot}>
                                    <p className={styles.acPlanNote}>Theo dõi số lượt luyện tập còn lại trong chu kỳ hiện tại.</p>
                                    <Link className={styles.acPlanLink} href="/pricing">Nâng cấp gói</Link>
                                </div>
                            </div>
                        </section>

                        <div className={styles.acAccWrap}>
                            <button className={styles.acAccTrigger} aria-expanded={openAcc['lang'] ? "true" : "false"} onClick={() => toggleAccordion('lang')}>
                                <span className={styles.acAccTriggerLeft}>
                                    <span className="material-symbols-outlined">translate</span>
                                    <span className="label">Cài đặt ngôn ngữ</span>
                                </span>
                                <span className={`material-symbols-outlined ${styles.acAccChevron}`}>expand_more</span>
                            </button>
                            <div className={`${styles.acAccBody} ${openAcc['lang'] ? styles.open : ''}`}>
                                <div>
                                    <div className={styles.acAccInner} style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                                        <div>
                                            <label htmlFor="select-language" className={styles.acLabel}>Ngôn ngữ hiển thị</label>
                                            <select id="select-language" className={styles.acInput} value={displayLanguage} onChange={e => setDisplayLanguage(e.target.value)}>
                                                <option value="vi">🇻🇳 Tiếng Việt</option>
                                                <option value="en">🇺🇸 English</option>
                                            </select>
                                        </div>
                                        <div style={{display: 'flex', justifyContent: 'flex-end'}}>
                                            <button className={styles.acBtnPrimary} style={{height: '38px', padding: '0 18px', fontSize: '13px'}} onClick={() => alert('Đã lưu ngôn ngữ')}>
                                                Lưu ngôn ngữ
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className={styles.acAccWrap}>
                            <button className={styles.acAccTrigger} aria-expanded={openAcc['pwd'] ? "true" : "false"} onClick={() => toggleAccordion('pwd')}>
                                <span className={styles.acAccTriggerLeft}>
                                    <span className="material-symbols-outlined">lock</span>
                                    <span className="label">Đổi mật khẩu</span>
                                </span>
                                <span className={`material-symbols-outlined ${styles.acAccChevron}`}>expand_more</span>
                            </button>
                            <div className={`${styles.acAccBody} ${openAcc['pwd'] ? styles.open : ''}`}>
                                <div>
                                    <div className={styles.acAccInner} style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                                        <div>
                                            <label htmlFor="current-password" className={styles.acLabel}>Mật khẩu hiện tại</label>
                                            <input id="current-password" type="password" className={styles.acInput} placeholder="••••••••" />
                                        </div>
                                        <div>
                                            <label htmlFor="new-password" className={styles.acLabel}>Mật khẩu mới</label>
                                            <input id="new-password" type="password" className={styles.acInput} placeholder="••••••••" />
                                        </div>
                                        <div>
                                            <label htmlFor="confirm-password" className={styles.acLabel}>Xác nhận mật khẩu</label>
                                            <input id="confirm-password" type="password" className={styles.acInput} placeholder="••••••••" />
                                        </div>
                                        <div style={{display: 'flex', justifyContent: 'flex-end'}}>
                                            <button className={styles.acBtnPrimary} style={{height: '38px', padding: '0 18px', fontSize: '13px'}} onClick={() => alert('Đã đổi mật khẩu')}>
                                                Đổi mật khẩu
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className={styles.acAccWrap}>
                            <button className={styles.acAccTrigger} aria-expanded={openAcc['notif'] ? "true" : "false"} onClick={() => toggleAccordion('notif')}>
                                <span className={styles.acAccTriggerLeft}>
                                    <span className="material-symbols-outlined">notifications</span>
                                    <span className="label">Tùy chọn thông báo</span>
                                </span>
                                <span className={`material-symbols-outlined ${styles.acAccChevron}`}>expand_more</span>
                            </button>
                            <div className={`${styles.acAccBody} ${openAcc['notif'] ? styles.open : ''}`}>
                                <div>
                                    <div className={styles.acAccInner}>
                                        <div className={styles.acNotifRow}>
                                            <div>
                                                <p className="title">Email thông báo</p>
                                                <p className="sub">Nhận cập nhật và báo cáo qua email</p>
                                            </div>
                                            <button className={`${styles.acToggle} ${notifEmail ? styles.on : ''}`} onClick={() => setNotifEmail(!notifEmail)}></button>
                                        </div>
                                        <div className={styles.acNotifRow}>
                                            <div>
                                                <p className="title">Thông báo hệ thống</p>
                                                <p className="sub">Nhận thông báo quan trọng từ Nexora</p>
                                            </div>
                                            <button className={`${styles.acToggle} ${notifSystem ? styles.on : ''}`} onClick={() => setNotifSystem(!notifSystem)}></button>
                                        </div>
                                        <div className={styles.acNotifRow}>
                                            <div>
                                                <p className="title">Thông báo khuyến mãi</p>
                                                <p className="sub">Nhận ưu đãi và tin tức mới nhất</p>
                                            </div>
                                            <button className={`${styles.acToggle} ${notifPromo ? styles.on : ''}`} onClick={() => setNotifPromo(!notifPromo)}></button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className={styles.acActionRow}>
                            <div className={styles.acActionRowIcon}>
                                <span className="material-symbols-outlined">logout</span>
                            </div>
                            <div className={styles.acActionRowText} style={{flex: 1}}>
                                <p className="title">Đăng xuất</p>
                                <p className="font-body-md text-body-md text-on-surface font-semibold">{user?.displayName || "Người dùng"}</p>
                            </div>
                            <button onClick={handleLogout} className={styles.acBtnOutline}>Đăng xuất</button>
                        </div>

                        <div className={styles.acDangerZone}>
                            <div className={styles.acDangerHeader}>
                                <span className="material-symbols-outlined">warning</span>
                                <span className="txt">Hành động không thể hoàn tác</span>
                            </div>
                            <div className={styles.acDangerRow}>
                                <div style={{minWidth: 0}}>
                                    <p className="title">Xóa tài khoản</p>
                                    <p className="sub">Khi bạn xóa tài khoản, không thể khôi phục lại. Vui lòng cân nhắc kỹ.</p>
                                </div>
                                <button onClick={() => setShowDeleteModal(true)} className={styles.acBtnDanger}>Xóa tài khoản</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'history' && (
                <div className={styles.acCard} style={{overflow: 'hidden'}}>
                    <div style={{padding: '16px 20px', borderBottom: '1px solid rgba(71,68,91,.12)'}}>
                        <h2 style={{fontSize: '15px', fontWeight: 700, color: '#1c1b2e', margin: 0}}>Lịch sử mua hàng</h2>
                    </div>
                    <div style={{overflowX: 'auto'}}>
                        <table className={styles.acTable} style={{minWidth: '500px'}}>
                            <thead>
                                <tr>
                                    <th>Mã đơn</th>
                                    <th>Gói dịch vụ</th>
                                    <th>Ngày mua</th>
                                    <th>Số tiền</th>
                                    <th>Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td colSpan={5} style={{textAlign: 'center', padding: '60px 16px'}}>
                                        <div style={{width: '52px', height: '52px', borderRadius: '14px', background: '#f0effa', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px'}}>
                                            <span className="material-symbols-outlined" style={{fontSize: '26px', color: '#3525cd'}}>receipt</span>
                                        </div>
                                        <p style={{fontSize: '15px', fontWeight: 600, color: '#1c1b2e', margin: '0 0 6px'}}>Chưa có lịch sử mua hàng</p>
                                        <p style={{fontSize: '13px', color: '#9896b4', margin: 0}}>Các gói dịch vụ bạn mua sẽ xuất hiện ở đây.</p>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {showDeleteModal && (
                <div className={styles.acModal} style={{display: 'flex'}}>
                    <div className={styles.acModalBox}>
                        <div style={{display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '18px'}}>
                            <div className={styles.acModalIcon}>
                                <span className="material-symbols-outlined">warning</span>
                            </div>
                            <div>
                                <h3 style={{fontSize: '16px', fontWeight: 700, color: '#1c1b2e', margin: '0 0 6px'}}>Xác nhận xóa tài khoản</h3>
                                <p style={{fontSize: '13.5px', color: '#6b6882', margin: 0, lineHeight: 1.55}}>
                                    Hành động này <strong style={{color: '#1c1b2e'}}>không thể hoàn tác</strong>.
                                    Toàn bộ dữ liệu của bạn sẽ bị xóa vĩnh viễn.
                                </p>
                            </div>
                        </div>
                        <div style={{display: 'flex', justifyContent: 'flex-end', gap: '10px'}}>
                            <button onClick={() => setShowDeleteModal(false)} className={styles.acBtnOutline} style={{height: '40px'}}>Hủy bỏ</button>
                            <button onClick={handleDeleteAccount} style={{height: '40px', padding: '0 20px', borderRadius: '10px', background: '#ba1a1a', color: '#fff', fontSize: '13.5px', fontWeight: 600, border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(186,26,26,.28)'}}>
                                Xóa tài khoản
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
