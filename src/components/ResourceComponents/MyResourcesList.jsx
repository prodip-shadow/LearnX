'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Swal from 'sweetalert2';
import {
  Trash2,
  BookOpen,
  Loader2,
  Calendar,
  Search,
  FileText,
  Video,
  Link2,
  Image as ImageIcon,
  Sparkles,
} from 'lucide-react';

export default function MyResourcesList() {
  const { user } = useAuth();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const fetchResources = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        if (!user?.uid) {
          Swal.fire('Error', 'Please log in first', 'error');
          setLoading(false);
          return;
        }

        const response = await fetch(
          `/api/resources/get?teacherId=${user.uid}&page=${page}`,
        );
        const data = await response.json();
        setResources(data.resources || []);
        setPagination(data.pagination);
        setCurrentPage(page);
      } catch (error) {
        console.error('Error fetching resources:', error);
        Swal.fire('Error', 'Failed to load resources', 'error');
      } finally {
        setLoading(false);
      }
    },
    [user?.uid],
  );

  useEffect(() => {
    if (user) {
      fetchResources(1);
    }
  }, [user, fetchResources]);

  const handleDelete = async (resourceId) => {
    const confirmed = await Swal.fire({
      title: 'Delete Resource?',
      text: 'This action cannot be undone',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Delete',
    });

    if (confirmed.isConfirmed) {
      try {
        if (!user?.uid) {
          Swal.fire('Error', 'Please log in first', 'error');
          return;
        }

        const response = await fetch('/api/resources/delete', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            resourceId,
            teacherId: user.uid,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to delete resource');
        }

        Swal.fire('Deleted', 'Resource deleted successfully', 'success');
        fetchResources(currentPage);
      } catch (error) {
        console.error('Error deleting resource:', error);
        Swal.fire('Error', 'Failed to delete resource', 'error');
      }
    }
  };

  const getResourceIcon = (type) => {
    const icons = {
      youtube: <Video className="h-4 w-4" />,
      document: <FileText className="h-4 w-4" />,
      drive: <Link2 className="h-4 w-4" />,
      image: <ImageIcon className="h-4 w-4" />,
      question: <Sparkles className="h-4 w-4" />,
      answer: <Sparkles className="h-4 w-4" />,
    };
    return icons[type] || <BookOpen className="h-4 w-4" />;
  };

  const filteredResources = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const byType =
      typeFilter === 'all'
        ? resources
        : resources.filter((r) => r.type === typeFilter);

    if (!term) return byType;

    return byType.filter((resource) => {
      const searchable = [resource.title, resource.description, resource.type]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchable.includes(term);
    });
  }, [resources, searchTerm, typeFilter]);

  const types = useMemo(() => {
    const set = new Set(resources.map((r) => r.type).filter(Boolean));
    return ['all', ...Array.from(set)];
  }, [resources]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center rounded-3xl bg-white/70 backdrop-blur-sm">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-page p-4 md:p-8 lg:p-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-6 p-6 md:p-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <BookOpen className="h-4 w-4" />
                Teacher Dashboard
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
                  My Resources
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-slate-500 md:text-base">
                  Review, search, and delete the learning materials you have
                  shared.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-96">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                  Total
                </p>
                <p className="mt-2 text-2xl font-black text-slate-900">
                  {pagination?.totalDocs ?? resources.length}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                  Visible
                </p>
                <p className="mt-2 text-2xl font-black text-slate-900">
                  {filteredResources.length}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                  Page
                </p>
                <p className="mt-2 text-2xl font-black text-slate-900">
                  {currentPage}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                  Pages
                </p>
                <p className="mt-2 text-2xl font-black text-slate-900">
                  {pagination?.totalPages ?? 1}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-lg">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by title, description, or type..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="text-sm text-slate-500">
                Showing{' '}
                <span className="font-semibold text-slate-800">
                  {filteredResources.length}
                </span>{' '}
                resource{filteredResources.length === 1 ? '' : 's'}
              </div>

              <button
                onClick={async () => {
                  const confirmed = await Swal.fire({
                    title: 'Delete all resources?',
                    text: 'This will permanently delete ALL your resources. This cannot be undone.',
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#d33',
                    cancelButtonColor: '#3085d6',
                    confirmButtonText: 'Delete All',
                  });

                  if (confirmed.isConfirmed) {
                    try {
                      const resp = await fetch('/api/resources/delete', {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          deleteAll: true,
                          teacherId: user?.uid,
                        }),
                      });

                      const json = await resp.json();
                      if (!resp.ok)
                        throw new Error(json.error || json.message || 'Failed');
                      Swal.fire(
                        'Deleted',
                        json.message || 'All resources deleted',
                        'success',
                      );
                      fetchResources(1);
                    } catch (e) {
                      console.error(e);
                      Swal.fire(
                        'Error',
                        e.message || 'Failed to delete all resources',
                        'error',
                      );
                    }
                  }
                }}
                className="inline-flex items-center gap-2 rounded-full border border-red-100 bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-100"
              >
                <Trash2 className="h-4 w-4" /> Delete All
              </button>
            </div>
          </div>
        </div>

        {/* Type tabs */}
        <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
          <div className="flex gap-2 overflow-x-auto">
            {types.map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-2 rounded-full text-sm font-semibold transition ${
                  typeFilter === t
                    ? 'bg-primary text-white'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {resources.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-sm">
            <BookOpen size={52} className="mx-auto mb-4 text-slate-300" />
            <h2 className="text-xl font-bold text-slate-800">
              No resources added yet
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Add your first resource and it will appear here.
            </p>
          </div>
        ) : filteredResources.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-sm">
            <Search size={52} className="mx-auto mb-4 text-slate-300" />
            <h2 className="text-xl font-bold text-slate-800">
              No matching resources
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Try a different keyword or clear the search.
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredResources.map((resource) => (
                <article
                  key={resource._id}
                  className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-start gap-4 border-b border-slate-100 p-5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      {getResourceIcon(resource.type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
                          {resource.type}
                        </span>
                        <button
                          onClick={() => handleDelete(resource._id)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-red-100 bg-red-50 text-red-600 transition hover:bg-red-100"
                          title="Delete resource"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <h3 className="mt-3 truncate text-lg font-bold text-slate-900">
                        {resource.title}
                      </h3>
                      <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500">
                        {resource.description || 'No description provided.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 px-5 py-4 text-sm text-slate-500">
                    <span className="inline-flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {new Date(resource.createdAt).toLocaleDateString()}
                    </span>
                    <span className="font-medium text-slate-400">
                      Resource #{resource._id?.slice(-4)}
                    </span>
                  </div>
                </article>
              ))}
            </div>

            {pagination && pagination.totalPages > 1 && (
              <div className="mt-8 flex flex-wrap items-center justify-center gap-2 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <button
                  onClick={() => fetchResources(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="btn btn-sm btn-outline"
                >
                  Previous
                </button>
                {Array.from(
                  { length: pagination.totalPages },
                  (_, i) => i + 1,
                ).map((page) => (
                  <button
                    key={page}
                    onClick={() => fetchResources(page)}
                    className={`btn btn-sm ${currentPage === page ? 'btn-primary' : 'btn-outline'}`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => fetchResources(currentPage + 1)}
                  disabled={currentPage === pagination.totalPages}
                  className="btn btn-sm btn-outline"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
