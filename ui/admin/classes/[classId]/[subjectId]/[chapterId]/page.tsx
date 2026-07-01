// src/app/classes/[classId]/[subjectId]/[chapterId]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/layout/protected-route';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { DataTable } from '@/components/data-table';
import { AddEditModal } from '@/components/add-edit-modal';
import { ConfirmDeleteModal } from '@/components/confirm-delete-modal';
import { useFirebaseCollection } from '@/hooks/use-firebase-collection';
import { Topic } from '@/types';
import { Plus, ArrowLeft, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

// Extract YouTube ID from full URL or raw ID
function extractYoutubeId(input: string): string {
  if (!input) return '';
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([^&\s]+)/,
    /(?:youtu\.be\/)([^?\s]+)/,
    /(?:youtube\.com\/embed\/)([^?\s]+)/,
  ];
  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match) return match[1];
  }
  // If no URL pattern, assume it's already a raw ID
  return input.trim();
}

export default function TopicsPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params.classId as string;
  const subjectId = params.subjectId as string;
  const chapterId = params.chapterId as string;
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [deletingTopic, setDeletingTopic] = useState<Topic | null>(null);
  const [breadcrumb, setBreadcrumb] = useState({ class: '', subject: '', chapter: '' });

  const { items: topics, loading, addItem, updateItem, deleteItem } =
    useFirebaseCollection<Topic>({
      collectionName: `classes/${classId}/subjects/${subjectId}/chapters/${chapterId}/topics`,
      orderByField: 'order',
      orderDirection: 'asc',
    });

  useEffect(() => {
    const fetchNames = async () => {
      const [classDoc, subjectDoc, chapterDoc] = await Promise.all([
        getDoc(doc(db, 'classes', classId)),
        getDoc(doc(db, 'classes', classId, 'subjects', subjectId)),
        getDoc(doc(db, 'classes', classId, 'subjects', subjectId, 'chapters', chapterId)),
      ]);
      setBreadcrumb({
        class: classDoc.exists() ? classDoc.data().nameEn : '',
        subject: subjectDoc.exists() ? subjectDoc.data().nameEn : '',
        chapter: chapterDoc.exists() ? chapterDoc.data().nameEn : '',
      });
    };
    fetchNames();
  }, [classId, subjectId, chapterId]);

  const handleSave = async (data: any) => {
    try {
      // ✅ Flutter TopicModel reads: nameEn, nameSd, youtubeId, order (int),
      //    durationMinutes (int), isActive (bool), viewCount (int)
      const payload = {
        nameEn: data.nameEn,
        nameSd: data.nameSd,
        youtubeId: extractYoutubeId(data.youtubeId || ''),
        order: Number(data.order),
        durationMinutes: Number(data.durationMinutes || 0),
        isActive: data.isActive ?? true,
        viewCount: editingTopic?.viewCount ?? 0,
        classId,
        subjectId,
        chapterId,
      };
      if (editingTopic) {
        await updateItem(editingTopic.id, payload as any);
        toast.success('Topic updated');
      } else {
        await addItem(payload as any);
        toast.success('Topic added');
      }
      setIsModalOpen(false);
      setEditingTopic(null);
    } catch {
      toast.error('Failed to save topic');
    }
  };

  const handleConfirmDelete = async () => {
    if (deletingTopic) {
      try {
        await deleteItem(deletingTopic.id);
        toast.success('Topic deleted');
      } catch {
        toast.error('Failed to delete');
      } finally {
        setIsDeleteModalOpen(false);
        setDeletingTopic(null);
      }
    }
  };

  const columns = [
    { key: 'order' as keyof Topic, header: 'Order', width: '60px' },
    { key: 'nameEn' as keyof Topic, header: 'English Name' },
    { key: 'nameSd' as keyof Topic, header: 'Sindhi Name' },
    {
      key: 'youtubeId' as keyof Topic,
      header: 'YouTube',
      render: (value: string) =>
        value ? (
          <div className="flex items-center gap-2">
            <img
              src={`https://img.youtube.com/vi/${value}/default.jpg`}
              alt="thumb"
              className="h-8 w-12 rounded object-cover"
            />
            <a
              href={`https://youtube.com/watch?v=${value}`}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-indigo-600 hover:text-indigo-800"
            >
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        ) : (
          <span className="text-xs text-red-500">No ID</span>
        ),
    },
    {
      key: 'durationMinutes' as keyof Topic,
      header: 'Duration',
      render: (value: number) => <span>{value ? `${value} min` : '—'}</span>,
    },
    {
      key: 'isActive' as keyof Topic,
      header: 'Status',
      render: (value: boolean) => (
        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${value ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {value ? 'Active' : 'Inactive'}
        </span>
      ),
    },
  ];

  const modalFields = [
    { name: 'nameEn', label: 'English Name', type: 'text' as const, required: true, placeholder: 'e.g. Digestive System' },
    { name: 'nameSd', label: 'Sindhi Name', type: 'text' as const, required: true, placeholder: 'e.g. هاضمي جو سرشتو' },
    { name: 'youtubeId', label: 'YouTube URL or ID', type: 'text' as const, required: true, placeholder: 'https://youtube.com/watch?v=... or video ID' },
    { name: 'durationMinutes', label: 'Duration (minutes)', type: 'number' as const, required: false, placeholder: '12' },
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
              <ArrowLeft className="h-4 w-4" /> Back to Chapters
            </button>
            <div className="mb-2 text-xs text-gray-400">
              {breadcrumb.class} → {breadcrumb.subject} → {breadcrumb.chapter}
            </div>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Topics — {breadcrumb.chapter}
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  These topics appear as video lectures in the mobile app
                </p>
              </div>
              <button
                onClick={() => { setEditingTopic(null); setIsModalOpen(true); }}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4" /> Add Topic
              </button>
            </div>

            <DataTable
              data={topics}
              columns={columns}
              onEdit={(t) => { setEditingTopic(t); setIsModalOpen(true); }}
              onDelete={(t) => { setDeletingTopic(t); setIsDeleteModalOpen(true); }}
              loading={loading}
              itemsPerPage={20}
              searchable
              searchPlaceholder="Search topics..."
            />
          </div>
        </main>
        <AddEditModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingTopic(null); }}
          onSave={handleSave} title="Topic" fields={modalFields} initialData={editingTopic || undefined} isEditing={!!editingTopic} />
        <ConfirmDeleteModal isOpen={isDeleteModalOpen} onClose={() => { setIsDeleteModalOpen(false); setDeletingTopic(null); }}
          onConfirm={handleConfirmDelete} title="Topic" itemName={deletingTopic?.nameEn} />
      </div>
    </ProtectedRoute>
  );
}