'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/layout/protected-route';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { db } from '@/lib/firebase';
import {
  collection, getDocs, query, orderBy, addDoc,
  updateDoc, deleteDoc, doc, serverTimestamp,
} from 'firebase/firestore';
import { Plus, Pencil, Trash2, ChevronRight, Search } from 'lucide-react';
import toast from 'react-hot-toast';

// ── FCM helper ─────────────────────────────────────────────────────────────
async function sendContentNotification(
  type: string,
  contentName: string,
  data: Record<string, string> = {}
) {
  try {
    await fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, contentName, data }),
    });
  } catch (err) {
    console.error('FCM notify failed:', err);
  }
}
// ──────────────────────────────────────────────────────────────────────────

interface ChapterRow {
  id: string; classId: string; subjectId: string;
  className: string; subjectName: string;
  nameEn: string; nameSd: string; order: number; isActive: boolean;
}
interface SelectOption { id: string; nameEn: string; }
interface SubjectOption extends SelectOption { classId: string; }

export default function ChaptersDirectPage() {
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [chapters, setChapters] = useState<ChapterRow[]>([]);
  const [classes, setClasses] = useState<SelectOption[]>([]);
  const [allSubjects, setAllSubjects] = useState<SubjectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<ChapterRow | null>(null);
  const [form, setForm] = useState({ classId: '', subjectId: '', nameEn: '', nameSd: '', order: 1, isActive: true });
  const [filteredSubjectsForModal, setFilteredSubjectsForModal] = useState<SubjectOption[]>([]);

  useEffect(() => {
    if (form.classId) {
      setFilteredSubjectsForModal(allSubjects.filter(s => s.classId === form.classId));
    }
  }, [form.classId, allSubjects]);

  const loadAll = async () => {
    setLoading(true);
    const classSnap = await getDocs(query(collection(db, 'classes'), orderBy('order')));
    const classMap: Record<string, string> = {};
    const classArr: SelectOption[] = [];
    classSnap.forEach(d => { classMap[d.id] = d.data().nameEn; classArr.push({ id: d.id, nameEn: d.data().nameEn }); });
    setClasses(classArr);

    const allSubs: SubjectOption[] = [];
    const all: ChapterRow[] = [];

    for (const cls of classArr) {
      const subSnap = await getDocs(query(collection(db, 'classes', cls.id, 'subjects'), orderBy('order')));
      for (const sub of subSnap.docs) {
        const subData = sub.data();
        allSubs.push({ id: sub.id, nameEn: subData.nameEn, classId: cls.id });

        const chSnap = await getDocs(
          query(collection(db, 'classes', cls.id, 'subjects', sub.id, 'chapters'), orderBy('order'))
        );
        chSnap.forEach(ch => {
          const d = ch.data();
          all.push({
            id: ch.id, classId: cls.id, subjectId: sub.id,
            className: classMap[cls.id], subjectName: subData.nameEn,
            nameEn: d.nameEn || '', nameSd: d.nameSd || '',
            order: d.order || 0, isActive: d.isActive ?? true,
          });
        });
      }
    }
    setAllSubjects(allSubs);
    setChapters(all);
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, []);

  const openAdd = () => {
    const firstClass = classes[0]?.id || '';
    const firstSubject = allSubjects.find(s => s.classId === firstClass)?.id || '';
    setEditing(null);
    setForm({ classId: firstClass, subjectId: firstSubject, nameEn: '', nameSd: '', order: 1, isActive: true });
    setIsModalOpen(true);
  };

  const openEdit = (e: React.MouseEvent, ch: ChapterRow) => {
    e.stopPropagation();
    setEditing(ch);
    setForm({ classId: ch.classId, subjectId: ch.subjectId, nameEn: ch.nameEn, nameSd: ch.nameSd, order: ch.order, isActive: ch.isActive });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.classId || !form.subjectId || !form.nameEn || !form.nameSd) {
      toast.error('Fill all required fields'); return;
    }
    try {
      const payload = {
        nameEn: form.nameEn, nameSd: form.nameSd,
        order: Number(form.order), isActive: form.isActive,
        classId: form.classId, subjectId: form.subjectId,
        updatedAt: serverTimestamp(),
      };

      if (editing) {
        await updateDoc(
          doc(db, 'classes', editing.classId, 'subjects', editing.subjectId, 'chapters', editing.id),
          payload
        );
        toast.success('Chapter updated');
        // No notification on edit
      } else {
        const ref = await addDoc(
          collection(db, 'classes', form.classId, 'subjects', form.subjectId, 'chapters'),
          { ...payload, createdAt: serverTimestamp() }
        );
        toast.success('Chapter added');

        // ✅ Auto-notify: tap opens the class screen where user sees the new chapter
        const className  = classes.find(c => c.id === form.classId)?.nameEn ?? '';
        const subjectName = allSubjects.find(s => s.id === form.subjectId)?.nameEn ?? '';
        await sendContentNotification('chapter', form.nameEn, {
          screen: 'chapter_topics',
          class_id:    form.classId,
          subject_id:  form.subjectId,
          chapter_id:  ref.id,
          class_name:   className,
          subject_name: subjectName,
          chapter_name: form.nameEn,
        });
      }

      setIsModalOpen(false);
      loadAll();
    } catch { toast.error('Failed to save'); }
  };

  const handleDelete = async (e: React.MouseEvent, ch: ChapterRow) => {
    e.stopPropagation();
    if (!confirm(`Delete "${ch.nameEn}"?`)) return;
    try {
      await deleteDoc(doc(db, 'classes', ch.classId, 'subjects', ch.subjectId, 'chapters', ch.id));
      toast.success('Deleted'); loadAll();
    } catch { toast.error('Failed'); }
  };

  const filtered = chapters.filter(ch => {
    const matchSearch = ch.nameEn.toLowerCase().includes(search.toLowerCase()) || ch.nameSd.includes(search);
    const matchClass = !filterClass || ch.classId === filterClass;
    return matchSearch && matchClass;
  });

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
        <Sidebar />
        <Header onMenuClick={() => setSidebarCollapsed(!sidebarCollapsed)} sidebarCollapsed={sidebarCollapsed} />
        <main className={`flex-1 overflow-auto transition-all duration-300 ${sidebarCollapsed ? 'ml-20' : 'ml-64'} mt-16`}>
          <div className="p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Chapters</h1>
                <p className="mt-1 text-sm text-gray-500">Manage chapters across all subjects</p>
              </div>
              <button onClick={openAdd}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700">
                <Plus className="h-4 w-4" /> Add Chapter
              </button>
            </div>

            <div className="mb-4 flex gap-3">
              <div className="relative max-w-xs flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search chapters..."
                  className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
              </div>
              <select value={filterClass} onChange={e => setFilterClass(e.target.value)}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                <option value="">All Classes</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.nameEn}</option>)}
              </select>
            </div>

            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    {['Class / Subject', 'Order', 'English Name', 'Sindhi Name', 'Status', 'Actions'].map((h, i) => (
                      <th key={i} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                  {loading ? (
                    [...Array(4)].map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        {[...Array(6)].map((_, j) => (
                          <td key={j} className="px-4 py-3"><div className="h-4 w-20 rounded bg-gray-200 dark:bg-gray-700" /></td>
                        ))}
                      </tr>
                    ))
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No chapters found.</td></tr>
                  ) : (
                    filtered.map(ch => (
                      <tr key={`${ch.classId}-${ch.subjectId}-${ch.id}`}
                        onClick={() => router.push(`/classes/${ch.classId}/${ch.subjectId}/${ch.id}`)}
                        className="group cursor-pointer transition-colors hover:bg-indigo-50 dark:hover:bg-gray-700">
                        <td className="px-4 py-3 text-xs text-gray-500">
                          <div className="flex flex-col gap-0.5">
                            <span className="rounded bg-gray-100 px-1.5 py-0.5 dark:bg-gray-700">{ch.className}</span>
                            <span className="text-gray-400">{ch.subjectName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">{ch.order}</span>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                          <span className="flex items-center gap-1">{ch.nameEn}
                            <ChevronRight className="h-3 w-3 text-gray-300 opacity-0 group-hover:opacity-100" />
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{ch.nameSd}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${ch.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {ch.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <button onClick={e => openEdit(e, ch)} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-indigo-600 dark:hover:bg-gray-600"><Pencil className="h-4 w-4" /></button>
                            <button onClick={e => handleDelete(e, ch)} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-red-600 dark:hover:bg-gray-600"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>

        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800">
              <h2 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">{editing ? 'Edit' : 'Add'} Chapter</h2>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Class *</label>
                  <select value={form.classId}
                    onChange={e => setForm(f => ({ ...f, classId: e.target.value, subjectId: '' }))}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white">
                    {classes.map(c => <option key={c.id} value={c.id}>{c.nameEn}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Subject *</label>
                  <select value={form.subjectId}
                    onChange={e => setForm(f => ({ ...f, subjectId: e.target.value }))}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white">
                    <option value="">Select Subject</option>
                    {filteredSubjectsForModal.map(s => <option key={s.id} value={s.id}>{s.nameEn}</option>)}
                  </select>
                </div>
                {[
                  { key: 'nameEn', label: 'English Name *', placeholder: 'e.g. Chapter 1' },
                  { key: 'nameSd', label: 'Sindhi Name *', placeholder: 'e.g. باب 1' },
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">{label}</label>
                    <input value={(form as any)[key]}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      placeholder={placeholder}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
                  </div>
                ))}
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Order *</label>
                  <input type="number" value={form.order}
                    onChange={e => setForm(f => ({ ...f, order: Number(e.target.value) }))}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input type="checkbox" checked={form.isActive}
                    onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="rounded" />
                  Active (visible in app)
                </label>
              </div>
              <div className="mt-5 flex justify-end gap-3">
                <button onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300">Cancel</button>
                <button onClick={handleSave}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700">{editing ? 'Update' : 'Add'} Chapter</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}