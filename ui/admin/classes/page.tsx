'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/layout/protected-route';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { AddEditModal } from '@/components/add-edit-modal';
import { ConfirmDeleteModal } from '@/components/confirm-delete-modal';
import { useFirebaseCollection } from '@/hooks/use-firebase-collection';
import { Class } from '@/types';
import { Plus, Pencil, Trash2, ChevronRight, BookOpen } from 'lucide-react';
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

export default function ClassesPage() {
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [deletingClass, setDeletingClass] = useState<Class | null>(null);

  const { items: classes, loading, addItem, updateItem, deleteItem } =
    useFirebaseCollection<Class>({
      collectionName: 'classes',
      orderByField: 'order',
      orderDirection: 'asc',
    });

  const handleAdd = () => { setEditingClass(null); setIsModalOpen(true); };

  const handleEdit = (e: React.MouseEvent, classItem: Class) => {
    e.stopPropagation();
    setEditingClass(classItem);
    setIsModalOpen(true);
  };

  const handleDelete = (e: React.MouseEvent, classItem: Class) => {
    e.stopPropagation();
    setDeletingClass(classItem);
    setIsDeleteModalOpen(true);
  };

  const handleRowClick = (classItem: Class) => router.push(`/classes/${classItem.id}`);

  const handleSave = async (data: any) => {
    try {
      const payload = {
        nameEn: data.nameEn,
        nameSd: data.nameSd,
        order: Number(data.order),
        isActive: data.isActive ?? true,
      };

      if (editingClass) {
        await updateItem(editingClass.id, payload as any);
        toast.success('Class updated');
        // No notification on edit
      } else {
        const ref = await addItem(payload as any);
        toast.success('Class added');

        // ✅ Auto-notify: tap opens this class in the app
        await sendContentNotification('class', data.nameEn, {
          screen: 'class_detail',
          class_id: (ref as any)?.id ?? '',
          class_name: data.nameEn,
        });
      }

      setIsModalOpen(false);
      setEditingClass(null);
    } catch {
      toast.error('Failed to save class');
    }
  };

  const handleConfirmDelete = async () => {
    if (deletingClass) {
      try {
        await deleteItem(deletingClass.id);
        toast.success('Class deleted');
      } catch {
        toast.error('Failed to delete');
      } finally {
        setIsDeleteModalOpen(false);
        setDeletingClass(null);
      }
    }
  };

  const modalFields = [
    { name: 'nameEn', label: 'English Name', type: 'text' as const, required: true, placeholder: 'e.g. Class One' },
    { name: 'nameSd', label: 'Sindhi Name', type: 'text' as const, required: true, placeholder: 'e.g. ڪلاس هڪ' },
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
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Classes</h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Click a class row to manage its subjects → chapters → topics
                </p>
              </div>
              <button onClick={handleAdd}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700">
                <Plus className="h-4 w-4" /> Add Class
              </button>
            </div>

            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    {['Order', 'English Name', 'Sindhi Name', 'Status', 'Actions'].map((h, i) => (
                      <th key={i} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                  {loading ? (
                    [...Array(3)].map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        {[...Array(5)].map((_, j) => (
                          <td key={j} className="px-4 py-3"><div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700" /></td>
                        ))}
                      </tr>
                    ))
                  ) : classes.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                        <BookOpen className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                        No classes yet. Click "Add Class" to get started.
                      </td>
                    </tr>
                  ) : (
                    classes.map((cls) => (
                      <tr key={cls.id} onClick={() => handleRowClick(cls)}
                        className="group cursor-pointer transition-colors hover:bg-indigo-50 dark:hover:bg-gray-700">
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                            {cls.order}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                          <span className="flex items-center gap-2">
                            {cls.nameEn}
                            <ChevronRight className="h-4 w-4 text-gray-300 opacity-0 transition-opacity group-hover:opacity-100" />
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{cls.nameSd}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${cls.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                            {cls.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button onClick={(e) => handleEdit(e, cls)}
                              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-indigo-600 dark:hover:bg-gray-600">
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button onClick={(e) => handleDelete(e, cls)}
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

        <AddEditModal
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); setEditingClass(null); }}
          onSave={handleSave}
          title="Class"
          fields={modalFields}
          initialData={editingClass || undefined}
          isEditing={!!editingClass}
        />
        <ConfirmDeleteModal
          isOpen={isDeleteModalOpen}
          onClose={() => { setIsDeleteModalOpen(false); setDeletingClass(null); }}
          onConfirm={handleConfirmDelete}
          title="Class"
          itemName={deletingClass?.nameEn}
        />
      </div>
    </ProtectedRoute>
  );
}