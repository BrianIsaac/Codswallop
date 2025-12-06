'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import Link from 'next/link';
import clsx from 'clsx';

interface Classroom {
  _id: Id<'classrooms'>;
  name: string;
  description?: string;
  joinCode: string;
  studentCount: number;
  createdAt: number;
}

/**
 * Classroom management page for creating and viewing classrooms.
 *
 * Returns:
 *     The classroom list with create functionality.
 */
export default function ClassroomPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newClassroomName, setNewClassroomName] = useState('');
  const [newClassroomDesc, setNewClassroomDesc] = useState('');

  // For demo purposes, using a mock teacher ID
  // In production, this would come from authentication
  const mockTeacherId = 'demo_teacher' as Id<'users'>;

  const classrooms = useQuery(api.classrooms.getByTeacher, {
    teacherId: mockTeacherId,
  }) as Classroom[] | undefined;

  const createClassroom = useMutation(api.classrooms.create);

  const handleCreate = async () => {
    if (!newClassroomName.trim()) return;

    await createClassroom({
      teacherId: mockTeacherId,
      name: newClassroomName,
      description: newClassroomDesc || undefined,
    });

    setNewClassroomName('');
    setNewClassroomDesc('');
    setShowCreateModal(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Classrooms
          </h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            Manage your classrooms and students
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-vibe-600 text-white rounded-lg hover:bg-vibe-700 transition-colors"
        >
          Create Classroom
        </button>
      </div>

      {classrooms === undefined ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse bg-white dark:bg-gray-700 rounded-xl shadow-sm p-6"
            >
              <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-3/4 mb-4" />
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : classrooms.length === 0 ? (
        <div className="bg-white dark:bg-gray-700 rounded-xl shadow-sm p-12 text-center">
          <svg
            className="w-12 h-12 text-gray-400 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No classrooms yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Create your first classroom to start monitoring student progress
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-vibe-600 text-white rounded-lg hover:bg-vibe-700 transition-colors"
          >
            Create Classroom
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classrooms.map((classroom) => (
            <Link
              key={classroom._id}
              href={`/dashboard/classroom/${classroom._id}`}
              className="block bg-white dark:bg-gray-700 rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {classroom.name}
              </h3>
              {classroom.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">
                  {classroom.description}
                </p>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">
                  {classroom.studentCount} students
                </span>
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-600 rounded font-mono text-xs">
                  {classroom.joinCode}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Create Classroom
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Classroom Name
                </label>
                <input
                  type="text"
                  value={newClassroomName}
                  onChange={(e) => setNewClassroomName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-vibe-500 focus:border-transparent"
                  placeholder="e.g. CS101 - Fall 2024"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={newClassroomDesc}
                  onChange={(e) => setNewClassroomDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-vibe-500 focus:border-transparent"
                  placeholder="Brief description of the class"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!newClassroomName.trim()}
                className={clsx(
                  'px-4 py-2 rounded-lg transition-colors',
                  newClassroomName.trim()
                    ? 'bg-vibe-600 text-white hover:bg-vibe-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                )}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
