"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useCurrentUser } from '@/hooks/queries/useUser';

const MOCK_ACTIVITIES = [
    { id: 'act-1', type: 'interview', title: 'Phỏng vấn Business Analyst (VinGroup)', difficulty: 'medium', score: '8.5/10', date: '2 ngày trước', icon: 'videocam', link: '/interviews/1/report' },
    { id: 'act-2', type: 'interview', title: 'Phỏng vấn Product Manager (Shopee)', difficulty: 'hard', score: '7.8/10', date: '5 ngày trước', icon: 'videocam', link: '/interviews/2/report' },
    { id: 'act-3', type: 'case', title: 'Case: Tối ưu hóa phễu chuyển đổi E-commerce', difficulty: 'medium', score: 'Đạt', date: '1 tuần trước', icon: 'assignment', link: '/scenarios/ecommerce' },
    { id: 'act-4', type: 'star', title: 'STAR: Xử lý khủng hoảng truyền thông', difficulty: 'easy', score: 'Hoàn thành', date: '10 ngày trước', icon: 'psychology', link: '/star' },
    { id: 'act-5', type: 'interview', title: 'Phỏng vấn Business Analyst (Ahamove)', difficulty: 'medium', score: '8.2/10', date: '2 tuần trước', icon: 'videocam', link: '/interviews/3/report' },
    { id: 'act-6', type: 'case', title: 'Case: Đột phá doanh thu chuỗi trà sữa', difficulty: 'easy', score: 'Đạt', date: '3 tuần trước', icon: 'assignment', link: '/scenarios/milktea' }
];

export default function OverviewPage() {
    const { data: user } = useCurrentUser();
    const [searchQuery, setSearchQuery] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [difficultyFilter, setDifficultyFilter] = useState("all");

    const filteredActivities = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        return MOCK_ACTIVITIES.filter(act => {
            const matchQuery = !query || act.title.toLowerCase().includes(query);
            const matchCat = categoryFilter === 'all' || act.type === categoryFilter;
            const matchDiff = difficultyFilter === 'all' || act.difficulty === difficultyFilter;
            return matchQuery && matchCat && matchDiff;
        });
    }, [searchQuery, categoryFilter, difficultyFilter]);

    const isFiltering = !!searchQuery || categoryFilter !== 'all' || difficultyFilter !== 'all';

    return (
        <main id="main-content" className="mx-auto min-h-[100dvh] w-full max-w-container-max px-margin-mobile pb-12 pt-24 md:pt-28 md:px-margin-desktop md:pb-16">
            <header>
                <h1 className="font-headline-lg text-headline-lg-mobile text-on-surface md:text-headline-lg">
                    Chào mừng trở lại, <span className="text-primary">{user?.displayName || 'bạn'}</span>!
                </h1>
                <p className="mt-2 max-w-[68ch] text-body-md text-on-surface-variant">
                    Theo dõi hành trình luyện phỏng vấn và tiếp tục cải thiện từng kỹ năng cùng Nexora.
                </p>
            </header>

            <section className="dashboard-stats-grid mt-8" aria-label="Tổng quan luyện tập">
                <article className="dashboard-stat-card rounded-xl border border-outline-variant/40 bg-surface">
                    <div className="dashboard-stat-icon grid place-items-center rounded-xl bg-primary text-on-primary">
                        <span className="material-symbols-outlined" aria-hidden="true">videocam</span>
                    </div>
                    <div className="dashboard-stat-content">
                        <p className="dashboard-stat-label text-label-md text-on-surface-variant">Tổng số phỏng vấn</p>
                        <p className="dashboard-stat-value text-[2rem] font-bold leading-none tabular-nums text-on-surface">12</p>
                    </div>
                </article>

                <article className="dashboard-stat-card rounded-xl border border-outline-variant/40 bg-surface">
                    <div className="dashboard-stat-icon grid place-items-center rounded-xl bg-primary-fixed text-primary">
                        <span className="material-symbols-outlined" aria-hidden="true">check_circle</span>
                    </div>
                    <div className="dashboard-stat-content">
                        <p className="dashboard-stat-label text-label-md text-on-surface-variant">Phỏng vấn đã hoàn thành</p>
                        <p className="dashboard-stat-value text-[2rem] font-bold leading-none tabular-nums text-on-surface">8</p>
                    </div>
                </article>

                <article className="dashboard-stat-card rounded-xl border border-outline-variant/40 bg-surface">
                    <div className="dashboard-stat-icon grid place-items-center rounded-xl bg-surface-container-high text-primary">
                        <span className="material-symbols-outlined" aria-hidden="true">assignment</span>
                    </div>
                    <div className="dashboard-stat-content">
                        <p className="dashboard-stat-label text-label-md text-on-surface-variant">Case đã hoàn thành</p>
                        <p className="dashboard-stat-value text-[2rem] font-bold leading-none tabular-nums text-on-surface">4</p>
                    </div>
                </article>

                <article className="dashboard-stat-card rounded-xl border border-outline-variant/40 bg-surface">
                    <div className="dashboard-stat-icon grid place-items-center rounded-xl bg-tertiary-fixed text-tertiary">
                        <span className="material-symbols-outlined" aria-hidden="true">bar_chart</span>
                    </div>
                    <div className="dashboard-stat-content">
                        <p className="dashboard-stat-label text-label-md text-on-surface-variant">Điểm trung bình</p>
                        <p className="dashboard-stat-value text-[2rem] font-bold leading-none tabular-nums text-on-surface">8.2</p>
                    </div>
                </article>
            </section>

            <section className="mt-6 rounded-xl border border-outline-variant/40 bg-surface p-4 md:p-5" aria-labelledby="dashboard-search-title">
                <h2 id="dashboard-search-title" className="sr-only">Tìm kiếm và lọc hoạt động</h2>
                <label htmlFor="dashboard-search" className="sr-only">Tìm kiếm hoạt động</label>
                <div className="relative">
                    <span className="material-symbols-outlined pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-outline" aria-hidden="true">search</span>
                    <input id="dashboard-search" type="search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="min-h-12 w-full rounded-xl border border-outline-variant/50 bg-surface-container-lowest py-3 pl-12 pr-4 text-body-md text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                        placeholder="Tìm kiếm hoạt động luyện tập..." />
                </div>
                <div className="dashboard-filter-row mt-4">
                    <div className="dashboard-select-wrap">
                        <label htmlFor="dashboard-category" className="sr-only">Danh mục</label>
                        <select id="dashboard-category"
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="dashboard-select border border-outline-variant/50 bg-surface-container-lowest text-label-md text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none">
                            <option value="all">Tất cả danh mục</option>
                            <option value="interview">Phỏng vấn AI</option>
                            <option value="case">Case tình huống</option>
                            <option value="star">Luyện tập STAR</option>
                        </select>
                        <span className="dashboard-select-icon material-symbols-outlined" aria-hidden="true">expand_more</span>
                    </div>

                    <div className="dashboard-select-wrap">
                        <label htmlFor="dashboard-difficulty" className="sr-only">Độ khó</label>
                        <select id="dashboard-difficulty"
                            value={difficultyFilter}
                            onChange={(e) => setDifficultyFilter(e.target.value)}
                            className="dashboard-select border border-outline-variant/50 bg-surface-container-lowest text-label-md text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none">
                            <option value="all">Độ khó: Bất kỳ</option>
                            <option value="easy">Dễ</option>
                            <option value="medium">Trung bình</option>
                            <option value="hard">Khó</option>
                        </select>
                        <span className="dashboard-select-icon material-symbols-outlined" aria-hidden="true">expand_more</span>
                    </div>
                </div>
            </section>

            <section className="mt-6 overflow-hidden rounded-xl border border-outline-variant/40 bg-surface" aria-labelledby="recent-activity-title">
                <div className="border-b border-outline-variant/40 px-5 py-4 md:px-6">
                    <h2 id="recent-activity-title" className="font-headline-md text-headline-md text-on-surface">Hoạt động gần đây</h2>
                </div>

                {filteredActivities.length === 0 ? (
                    <div className="flex min-h-72 flex-col items-center justify-center px-5 py-10 text-center">
                        {isFiltering ? (
                            <>
                                <span className="material-symbols-outlined text-[48px] text-outline mb-2">search_off</span>
                                <h3 className="mt-3 font-headline-md text-headline-md text-on-surface">Không tìm thấy hoạt động phù hợp</h3>
                                <p className="mt-2 max-w-[52ch] text-body-md text-on-surface-variant">
                                    Thử thay đổi từ khóa hoặc bộ lọc. Hoạt động mới sẽ xuất hiện sau khi bạn hoàn thành một buổi luyện tập.
                                </p>
                            </>
                        ) : (
                            <>
                                <img className="nx-mascot nx-mascot-dashboard" src="/assets/mascot.png" alt="Mascot Nexora chào đón bạn" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement?.querySelector('.material-symbols-outlined')?.classList.remove('hidden'); }} />
                                <span className="material-symbols-outlined text-[48px] text-outline mb-2 hidden">history</span>
                                <h3 className="mt-3 font-headline-md text-headline-md text-on-surface">Bắt đầu hành trình cùng Nexora</h3>
                                <p className="mt-2 max-w-[52ch] text-body-md text-on-surface-variant">
                                    Các cuộc phỏng vấn và case tình huống bạn hoàn thành sẽ xuất hiện tại đây.
                                </p>
                                <Link href="/interview"
                                    className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 font-label-md text-label-md text-on-primary shadow-[0_4px_8px_rgba(53,37,205,0.22)] hover:bg-primary-container transition">
                                    Bắt đầu luyện tập
                                    <span className="material-symbols-outlined text-[20px]" aria-hidden="true">arrow_forward</span>
                                </Link>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="divide-y divide-outline-variant/30">
                        {filteredActivities.map(act => {
                            let catClass = 'category-interview';
                            let tagClass = 'tag-interview';
                            let badgeClass = 'badge-interview';
                            let categoryText = 'Phỏng vấn AI';

                            if (act.type === 'case') {
                                catClass = 'category-case';
                                tagClass = 'tag-case';
                                badgeClass = 'badge-case';
                                categoryText = 'Case tình huống';
                            } else if (act.type === 'star') {
                                catClass = 'category-star';
                                tagClass = 'tag-star';
                                badgeClass = 'badge-star';
                                categoryText = 'Luyện tập STAR';
                            }

                            let difficultyText = 'Dễ';
                            if (act.difficulty === 'medium') difficultyText = 'Trung bình';
                            else if (act.difficulty === 'hard') difficultyText = 'Khó';

                            return (
                                <div key={act.id} className="dashboard-activity-item">
                                    <div className="dashboard-activity-left">
                                        <div className={`dashboard-activity-icon-box ${catClass}`}>
                                            <span className="material-symbols-outlined text-[24px]">{act.icon}</span>
                                        </div>
                                        <div className="dashboard-activity-details">
                                            <h4 className="dashboard-activity-title">{act.title}</h4>
                                            <div className="dashboard-activity-meta">
                                                <span className={`dashboard-activity-category-tag ${tagClass}`}>{categoryText}</span>
                                                <span>&bull; Độ khó: {difficultyText} &bull; {act.date}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="dashboard-activity-right">
                                        <span className={`dashboard-activity-score-badge ${badgeClass}`}>{act.score}</span>
                                        <Link href={act.link} className="dashboard-activity-btn transition">
                                            {act.type === 'interview' ? 'Chi tiết' : 'Luyện lại'}
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>
        </main>
    );
}
