// src/app/classes/[classId]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/layout/protected-route';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { AddEditModal } from '@/components/add-edit-modal';
import { ConfirmDeleteModal } from '@/components/confirm-delete-modal';
import { useFirebaseCollection } from '@/hooks/use-firebase-collection';
import { Subject, Class } from '@/types';
import { Plus, ArrowLeft, Pencil, Trash2, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function SubjectsPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params.classId as string;
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [deletingSubject, setDeletingSubject] = useState<Subject | null>(null);
  const [className, setClassName] = useState('');

  const { items: subjects, loading, addItem, updateItem, deleteItem } =
    useFirebaseCollection<Subject>({
      collectionName: `classes/${classId}/subjects`,
      orderByField: 'order',
      orderDirection: 'asc',
    });

  useEffect(() => {
    const fetchClassName = async () => {
      const classDoc = await getDoc(doc(db, 'classes', classId));
      if (classDoc.exists()) {
        setClassName(classDoc.data().nameEn || '');
      }
    };
    fetchClassName();
  }, [classId]);

  const handleSave = async (data: any) => {
    try {
      // ✅ Flutter SubjectModel reads: nameEn, nameSd, iconUrl, order (int), isActive (bool)
      const payload = {
        nameEn: data.nameEn,
        nameSd: data.nameSd,
        iconUrl: data.iconUrl || '',
        order: Number(data.order),
        isActive: data.isActive ?? true,
        classId,
      };
      if (editingSubject) {
        await updateItem(editingSubject.id, payload as any);
        toast.success('Subject updated');
      } else {
        await addItem(payload as any);
        toast.success('Subject added');
      }
      setIsModalOpen(false);
      setEditingSubject(null);
    } catch {
      toast.error('Failed to save subject');
    }
  };

  const handleConfirmDelete = async () => {
    if (deletingSubject) {
      try {
        await deleteItem(deletingSubject.id);
        toast.success('Subject deleted');
      } catch {
        toast.error('Failed to delete');
      } finally {
        setIsDeleteModalOpen(false);
        setDeletingSubject(null);
      }
    }
  };

  const modalFields = [
    { name: 'nameEn', label: 'English Name', type: 'text' as const, required: true, placeholder: 'e.g. Science' },
    { name: 'nameSd', label: 'Sindhi Name', type: 'text' as const, required: true, placeholder: 'e.g. سائنس' },
    { name: 'iconUrl', label: 'Icon URL (optional)', type: 'text' as const, required: false, placeholder: 'https://...' },
    { name: 'order', label: 'Display Order', type: 'number' as const, required: true, placeholder: '1' },
    { name: 'isActive', label: 'Active (visible in app)', type: 'checkbox' as const, defaultValue: true },
  ];

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
        <Sidebar />
        <Header onMenuClick={() => setSidebarCollapsed(!sidebarCollapsed)} sidebarCollapsed={sidebarCollapsed} />
        <main className={`flex-1 overflow-auto transition-all duration-300 ${sidebarCollapsed ? 'ml-20' : 'ml-64'} mt-16`}>
          <div className="p-6">
            <button onClick={() => router.back()} className="mb-4 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
              <ArrowLeft className="h-4 w-4" /> Back to Classes
            </button>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Subjects — {className}</h1>
                <p className="mt-1 text-sm text-gray-500">Click a subject to manage chapters</p>
              </div>
              <button onClick={() => { setEditingSubject(null); setIsModalOpen(true); }}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700">
                <Plus className="h-4 w-4" /> Add Subject
              </button>
            </div>

            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    {['Order', 'English Name', 'Sindhi Name', 'Status', 'Actions'].map((h, i) => (
                      <th key={`sub-h-${i}`} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                  {loading ? (
                    [...Array(3)].map((_, i) => (
                      <tr key={`sk-${i}`} className="animate-pulse">
                        {[...Array(5)].map((_, j) => (
                          <td key={`sk-c-${j}`} className="px-4 py-3"><div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700" /></td>
                        ))}
                      </tr>
                    ))
                  ) : subjects.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No subjects yet. Add one to get started.</td></tr>
                  ) : (
                    subjects.map((sub) => (
                      <tr key={sub.id} onClick={() => router.push(`/classes/${classId}/${sub.id}`)}
                        className="group cursor-pointer transition-colors hover:bg-indigo-50 dark:hover:bg-gray-700">
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">{sub.order}</span>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                          <span className="flex items-center gap-2">{sub.nameEn}
                            <ChevronRight className="h-4 w-4 text-gray-300 opacity-0 group-hover:opacity-100" />
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{sub.nameSd}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${sub.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {sub.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button onClick={(e) => { e.stopPropagation(); setEditingSubject(sub); setIsModalOpen(true); }}
                              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-indigo-600 dark:hover:bg-gray-600">
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); setDeletingSubject(sub); setIsDeleteModalOpen(true); }}
                              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-red-600 dark:hover:bg-gray-600">
                              <Trash2 className="h-4 w-4" />
                            </button>
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
        <AddEditModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingSubject(null); }}
          onSave={handleSave} title="Subject" fields={modalFields} initialData={editingSubject || undefined} isEditing={!!editingSubject} />
        <ConfirmDeleteModal isOpen={isDeleteModalOpen} onClose={() => { setIsDeleteModalOpen(false); setDeletingSubject(null); }}
          onConfirm={handleConfirmDelete} title="Subject" itemName={deletingSubject?.nameEn} />
      </div>
    </ProtectedRoute>
  );
}