// src/app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/layout/protected-route';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import {
  BookOpen,
  Video,
  MessageSquare,
  LayoutGrid,
  Smartphone,
  Monitor,
  TrendingUp,
  ArrowRight,
  Activity,
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

interface Stats {
  classes: number;
  topics: number;
  unreadMessages: number;
  sections: number;
}

interface RecentMessage {
  id: string;
  name: string;
  email: string;
  source: 'app' | 'website';
  createdAt: Date;
  isRead: boolean;
  message: string;
}

interface RecentTopic {
  id: string;
  nameEn: string;
  nameSd: string;
  className: string;
  subjectName: string;
  createdAt: Date;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({ classes: 0, topics: 0, unreadMessages: 0, sections: 0 });
  const [recentMessages, setRecentMessages] = useState<RecentMessage[]>([]);
  const [recentTopics, setRecentTopics] = useState<RecentTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchRecentMessages();
    fetchRecentTopics();
  }, []);

  const fetchStats = async () => {
    try {
      const classesSnap = await getDocs(collection(db, 'classes'));
      const sectionsSnap = await getDocs(collection(db, 'other_sections'));
      let topicsCount = 0;
      for (const classDoc of classesSnap.docs) {
        const subjectsSnap = await getDocs(collection(db, 'classes', classDoc.id, 'subjects'));
        for (const subjectDoc of subjectsSnap.docs) {
          const chaptersSnap = await getDocs(collection(db, 'classes', classDoc.id, 'subjects', subjectDoc.id, 'chapters'));
          for (const chapterDoc of chaptersSnap.docs) {
            const topicsSnap = await getDocs(collection(db, 'classes', classDoc.id, 'subjects', subjectDoc.id, 'chapters', chapterDoc.id, 'topics'));
            topicsCount += topicsSnap.size;
          }
        }
      }
      const unreadQ = query(collection(db, 'messages'), where('isRead', '==', false));
      const unreadSnap = await getDocs(unreadQ);
      setStats({ classes: classesSnap.size, topics: topicsCount, unreadMessages: unreadSnap.size, sections: sectionsSnap.size });
    } catch (e) { console.error(e); }
  };

  const fetchRecentMessages = async () => {
    try {
      const q = query(collection(db, 'messages'), orderBy('createdAt', 'desc'), limit(5));
      const snap = await getDocs(q);
      setRecentMessages(snap.docs.map(doc => ({
        id: doc.id, ...doc.data(), createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as RecentMessage[]);
    } catch (e) { console.error(e); }
  };

  const fetchRecentTopics = async () => {
    try {
      const classesSnap = await getDocs(collection(db, 'classes'));
      const topics: RecentTopic[] = [];
      for (const classDoc of classesSnap.docs) {
        const subjectsSnap = await getDocs(collection(db, 'classes', classDoc.id, 'subjects'));
        for (const subjectDoc of subjectsSnap.docs) {
          const chaptersSnap = await getDocs(collection(db, 'classes', classDoc.id, 'subjects', subjectDoc.id, 'chapters'));
          for (const chapterDoc of chaptersSnap.docs) {
            const topicsSnap = await getDocs(collection(db, 'classes', classDoc.id, 'subjects', subjectDoc.id, 'chapters', chapterDoc.id, 'topics'));
            topicsSnap.forEach(doc => {
              const d = doc.data();
              topics.push({ id: doc.id, nameEn: d.name_en, nameSd: d.name_sd, className: classDoc.data().name_en, subjectName: subjectDoc.data().name_en, createdAt: d.createdAt?.toDate() || new Date() });
            });
          }
        }
      }
      topics.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setRecentTopics(topics.slice(0, 5));
      setLoading(false);
    } catch (e) { console.error(e); setLoading(false); }
  };

  const statCards = [
    {
      title: 'Total Classes',
      value: stats.classes,
      icon: BookOpen,
      accent: '#6366f1',
      glow: 'rgba(99,102,241,0.2)',
      bg: 'rgba(99,102,241,0.08)',
      border: 'rgba(99,102,241,0.2)',
      change: '+12%',
      changeLabel: 'this month',
      positive: true,
    },
    {
      title: 'Total Topics',
      value: stats.topics,
      icon: Video,
      accent: '#10b981',
      glow: 'rgba(16,185,129,0.2)',
      bg: 'rgba(16,185,129,0.08)',
      border: 'rgba(16,185,129,0.2)',
      change: '+8%',
      changeLabel: 'this month',
      positive: true,
    },
    {
      title: 'Unread Messages',
      value: stats.unreadMessages,
      icon: MessageSquare,
      accent: '#f43f5e',
      glow: 'rgba(244,63,94,0.2)',
      bg: 'rgba(244,63,94,0.08)',
      border: 'rgba(244,63,94,0.2)',
      change: stats.unreadMessages > 0 ? `${stats.unreadMessages} new` : 'All read',
      changeLabel: '',
      positive: stats.unreadMessages === 0,
    },
    {
      title: 'Active Sections',
      value: stats.sections,
      icon: LayoutGrid,
      accent: '#8b5cf6',
      glow: 'rgba(139,92,246,0.2)',
      bg: 'rgba(139,92,246,0.08)',
      border: 'rgba(139,92,246,0.2)',
      change: '+5%',
      changeLabel: 'this month',
      positive: true,
    },
  ];

  return (
    <ProtectedRoute>
      {/* Background mesh */}
      <div className="mesh-bg" />

      <div className="flex h-screen overflow-hidden">
        <Sidebar />

        <div className={`flex flex-col flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-[72px]' : 'ml-64'}`}>
          <Header onMenuClick={() => setSidebarCollapsed(!sidebarCollapsed)} sidebarCollapsed={sidebarCollapsed} />

          <main className="flex-1 overflow-y-auto mt-16 p-6 space-y-6">

            {/* Welcome row */}
            <div className="animate-fade-up flex items-center justify-between">
              <div>
                <h2 className="text-xl text-theme-primary">Overview</h2>
                <p className="text-sm text-slate-500 mt-0.5">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-white/8 bg-white/5 px-3 py-2">
                <Activity className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-xs font-medium text-emerald-400">System Active</span>
              </div>
            </div>

            {/* Stat cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-theme-primary">
              {statCards.map((card, i) => {
                const Icon = card.icon;
                return (
                  <div
                    key={card.title}
                    className="animate-fade-up card card-glow relative overflow-hidden p-5 cursor-default"
                    style={{
                      animationDelay: `${i * 80}ms`,
                      '--card-accent': card.accent,
                    } as React.CSSProperties}
                  >
                    {/* Accent glow in corner */}
                    <div
                      className="absolute -right-4 -top-4 h-20 w-20 rounded-full blur-2xl"
                      style={{ background: card.glow }}
                    />

                    <div className="relative flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                          {card.title}
                        </p>
                          <p className="mt-2 text-3xl font-bold text-theme-primary font-mono tracking-tight">

                          {loading ? (
                            <span className="skeleton inline-block h-8 w-12 rounded" />
                          ) : card.value}
                        </p>
                        <div className="mt-2 flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" style={{ color: card.positive ? '#10b981' : '#f43f5e' }} />
                          <span className="text-xs font-semibold" style={{ color: card.positive ? '#10b981' : '#f43f5e' }}>
                            {card.change}
                          </span>
                          {card.changeLabel && (
                            <span className="text-[11px] text-slate-600">{card.changeLabel}</span>
                          )}
                        </div>
                      </div>

                      {/* Icon box */}
                      <div
                        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border"
                        style={{ background: card.bg, borderColor: card.border }}
                      >
                        <Icon className="h-5 w-5" style={{ color: card.accent }} />
                      </div>
                    </div>

                    {/* Bottom accent line */}
                    <div
                      className="absolute bottom-0 left-0 right-0 h-[2px] rounded-b-xl"
                      style={{ background: `linear-gradient(90deg, ${card.accent}60, transparent)` }}
                    />
                  </div>
                );
              })}
            </div>

            {/* Content panels */}
            <div className="grid gap-4 lg:grid-cols-2">

              {/* Recent Messages */}
              <div className="animate-fade-up card p-5" style={{ animationDelay: '320ms' }}>
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-theme-primary">Recent Messages</h3>
                    <p className="text-[11px] text-slate-600 mt-0.5">Latest contact submissions</p>
                  </div>
                  <Link
                    href="/messages"
                    className="flex items-center gap-1 rounded-lg border border-white/8 bg-white/5 px-2.5 py-1.5 text-[11px] font-medium text-slate-400 hover:border-white/15 hover:text-slate-200 transition-all"
                  >
                    View All <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>

                <div className="space-y-1">
                  {recentMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 border border-white/8">
                        <MessageSquare className="h-5 w-5 text-slate-600" />
                      </div>
                      <p className="text-sm font-medium text-slate-500">No messages yet</p>
                      <p className="text-xs text-slate-700 mt-1">Messages will appear here</p>
                    </div>
                  ) : (
                    recentMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className="group flex items-start gap-3 rounded-xl p-3 hover:bg-white/4 transition-all cursor-pointer border border-transparent hover:border-white/6"
                      >
                        <div
                          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border"
                          style={{
                            background: msg.source === 'app' ? 'rgba(99,102,241,0.1)' : 'rgba(16,185,129,0.1)',
                            borderColor: msg.source === 'app' ? 'rgba(99,102,241,0.2)' : 'rgba(16,185,129,0.2)',
                          }}
                        >
                          {msg.source === 'app'
                            ? <Smartphone className="h-3.5 w-3.5 text-indigo-400" />
                            : <Monitor className="h-3.5 w-3.5 text-emerald-400" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-slate-200 truncate">{msg.name}</p>
                            <span className="flex-shrink-0 text-[10px] text-slate-600">
                              {format(msg.createdAt, 'MMM d, h:mm a')}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 truncate mt-0.5">{msg.message}</p>
                          <div className="mt-1.5 flex items-center gap-1.5">
                            <span className={`badge text-[10px] py-0.5 ${msg.source === 'app' ? 'badge-indigo' : 'badge-emerald'}`}>
                              {msg.source === 'app' ? 'App' : 'Website'}
                            </span>
                            {!msg.isRead && (
                              <span className="badge badge-rose text-[10px] py-0.5">Unread</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Recently Added Topics */}
              <div className="animate-fade-up card p-5" style={{ animationDelay: '400ms' }}>
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-theme-primary">Recently Added Topics</h3>
                    <p className="text-[11px] text-slate-600 mt-0.5">Latest video lessons uploaded</p>
                  </div>
                  <Link
                    href="/topics"
                    className="flex items-center gap-1 rounded-lg border border-white/8 bg-white/5 px-2.5 py-1.5 text-[11px] font-medium text-slate-400 hover:border-white/15 hover:text-slate-200 transition-all"
                  >
                    View All <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>

                <div className="space-y-1">
                  {recentTopics.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 border border-white/8">
                        <Video className="h-5 w-5 text-slate-600" />
                      </div>
                      <p className="text-sm font-medium text-slate-500">No topics added yet</p>
                      <p className="text-xs text-slate-700 mt-1">Add topics to classes to see them here</p>
                    </div>
                  ) : (
                    recentTopics.map((topic, i) => (
                      <div
                        key={topic.id}
                        className="group flex items-center gap-3 rounded-xl p-3 hover:bg-white/4 transition-all border border-transparent hover:border-white/6"
                      >
                        {/* Index number */}
                        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-white/5 border border-white/8 text-[11px] font-bold text-slate-600 font-mono">
                          {String(i + 1).padStart(2, '0')}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-200 truncate">{topic.nameEn}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="badge badge-indigo text-[10px] py-0.5">{topic.className}</span>
                            <span className="text-[10px] text-slate-700">·</span>
                            <span className="text-[10px] text-slate-600 truncate">{topic.subjectName}</span>
                          </div>
                        </div>
                        <span className="flex-shrink-0 text-[10px] text-slate-600 font-mono">
                          {format(topic.createdAt, 'MMM d')}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}