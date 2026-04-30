'use client';

import Image from 'next/image';
import { useState, useEffect, useCallback } from 'react';
import Swal from 'sweetalert2';
import {
  BookOpen,
  Loader2,
  Calendar,
  Download,
  ExternalLink,
  Users,
  Zap,
  Send,
  Check,
  Eye,
  FileText,
} from 'lucide-react';

export default function StudentResourcesView() {
  const [allTeachers, setAllTeachers] = useState([]);
  const [visibleTeachers, setVisibleTeachers] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [resources, setResources] = useState([]);
  const [filteredResources, setFilteredResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingResources, setLoadingResources] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [previewImage, setPreviewImage] = useState(null);

  const resourceTypes = [
    { id: 'all', label: 'All' },
    { id: 'youtube', label: 'YouTube' },
    { id: 'document', label: 'Documents' },
    { id: 'drive', label: 'Drive' },
    { id: 'image', label: 'Images' },
    { id: 'question', label: 'Questions' },
    { id: 'answer', label: 'Answers' },
  ];

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const [teachersRes, adminsRes] = await Promise.all([
        fetch('/api/users?role=teacher'),
        fetch('/api/users?role=admin'),
      ]);

      const teachersData = (await teachersRes.json()) || [];
      const adminsData = (await adminsRes.json()) || [];

      const allUsers = [
        ...teachersData.map((u) => ({ ...u, type: 'teacher' })),
        ...adminsData.map((u) => ({ ...u, type: 'admin' })),
      ].sort((a, b) => a.name.localeCompare(b.name));

      setAllTeachers(allUsers);
      setVisibleTeachers(allUsers);
    } catch (error) {
      console.error('Error fetching teachers/admins:', error);
      Swal.fire('Error', 'Failed to load instructors', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchResourcesForTeacher = useCallback(async () => {
    if (!selectedTeacher?.email) return;
    try {
      setLoadingResources(true);
      const response = await fetch(
        `/api/resources/get?teacherEmail=${encodeURIComponent(selectedTeacher.email)}&page=1`,
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || 'Failed to fetch resources');
      setResources(data.resources || []);
      filterResources(data.resources || [], 'all');
      setActiveTab('all');
    } catch (error) {
      console.error('Error fetching resources:', error);
      Swal.fire('Error', 'Failed to load resources. ' + error.message, 'error');
    } finally {
      setLoadingResources(false);
    }
  }, [selectedTeacher]);

  useEffect(() => {
    if (selectedTeacher) fetchResourcesForTeacher();
  }, [selectedTeacher, fetchResourcesForTeacher]);

  const filterResources = (allResources, tabId) => {
    if (tabId === 'all') setFilteredResources(allResources);
    else setFilteredResources(allResources.filter((r) => r.type === tabId));
    setActiveTab(tabId);
  };

  const handleTabChange = (tabId) => filterResources(resources, tabId);

  const downloadImage = async (imageUrl, imageName) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = imageName || 'image.jpg';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
      Swal.fire('Error', 'Failed to download image', 'error');
    }
  };

  const downloadBase64 = (base64, filename) => {
    try {
      let cleaned = base64;
      const dataUrlMatch = /^data:([\w/+-\.]+);base64,/.exec(base64);
      let mime = 'application/octet-stream';
      if (dataUrlMatch) {
        mime = dataUrlMatch[1];
        cleaned = base64.split(',')[1];
      } else {
        const ext = (filename || '').split('.').pop()?.toLowerCase();
        if (ext === 'pdf') mime = 'application/pdf';
        else if (ext === 'png') mime = 'image/png';
        else if (ext === 'jpg' || ext === 'jpeg') mime = 'image/jpeg';
        else if (ext === 'txt') mime = 'text/plain';
      }
      const byteChars = atob(cleaned);
      const byteNumbers = new Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++)
        byteNumbers[i] = byteChars.charCodeAt(i);
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mime });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || 'file';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Download error:', err);
      Swal.fire('Error', 'Failed to download file', 'error');
    }
  };

  const getResourceContent = (resource) => {
    switch (resource.type) {
      case 'youtube':
        return (
          <div className="aspect-video">
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${extractYouTubeId(resource.url)}`}
              title={resource.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        );
      case 'image':
        return (
          <div className="space-y-3">
            <div
              className="relative h-48 w-full rounded-lg overflow-hidden cursor-pointer"
              onClick={() => setPreviewImage(resource.url)}
            >
              <Image
                src={resource.url}
                alt={resource.title}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover"
                quality={75}
                unoptimized={true}
              />
            </div>

            <div className="flex gap-2 justify-center">
              <button
                onClick={() => setPreviewImage(resource.url)}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-md text-sm font-semibold bg-primary text-white shadow"
                title="Preview"
              >
                <Eye className="w-4 h-4" />
                <span className="hidden sm:inline">Preview</span>
              </button>
              <button
                onClick={() => downloadImage(resource.url, resource.title)}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-md text-sm font-semibold bg-slate-100 text-slate-800 border border-slate-200"
                title="Download"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Download</span>
              </button>
            </div>
          </div>
        );
      case 'drive':
        return (
          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 btn btn-primary btn-sm"
          >
            <ExternalLink className="w-3 h-3" />
            Open in Drive
          </a>
        );
      case 'document':
        return (
          <div className="space-y-3">
            <div className="relative h-48 w-full rounded-lg overflow-hidden bg-slate-50 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <FileText className="w-12 h-12 text-slate-400" />
                <p className="text-sm font-semibold text-slate-800 line-clamp-1">
                  {resource.fileName || 'Document'}
                </p>
                <p className="text-xs text-slate-500">
                  {resource.fileSize
                    ? `(${(resource.fileSize / 1024 / 1024).toFixed(2)} MB)`
                    : ''}
                </p>
              </div>
            </div>

            <div className="flex gap-2 justify-center">
              {resource.fileBase64 ? (
                <button
                  onClick={() =>
                    downloadBase64(resource.fileBase64, resource.fileName)
                  }
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-md text-sm font-semibold bg-primary text-white shadow"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Download</span>
                </button>
              ) : resource.url ? (
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-md text-sm font-semibold bg-primary text-white shadow"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span className="hidden sm:inline">Open</span>
                </a>
              ) : (
                <div className="text-xs text-slate-500">No file available</div>
              )}
            </div>
          </div>
        );
      case 'question':
      case 'answer':
        return (
          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 btn btn-primary btn-sm"
          >
            <ExternalLink className="w-3 h-3" />
            View Content
          </a>
        );
      default:
        return null;
    }
  };

  const extractYouTubeId = (url) => {
    const match = url.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    );
    return match ? match[1] : '';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-slate-600">Loading instructors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-page min-h-screen p-4 md:p-8 lg:p-12 w-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">
          Learning Resources
        </h1>
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-2">
          Browse materials from instructors
        </p>
      </div>

      <div className="space-y-8">
        {/* Instructor Selection */}
        <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-2">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800">
                Select Instructor
              </h2>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                Choose from teachers & admins
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search instructor by name..."
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  onChange={(e) => {
                    const q = e.target.value.toLowerCase();
                    if (!q) return setVisibleTeachers(allTeachers);
                    setVisibleTeachers(
                      allTeachers.filter((u) =>
                        u.name.toLowerCase().includes(q),
                      ),
                    );
                  }}
                />
              </div>
              <div className="text-xs text-slate-500">Tap a name to select</div>
            </div>

            {allTeachers.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="text-slate-600">No instructors available</p>
              </div>
            ) : (
              <div className="overflow-x-auto py-1">
                <div className="flex items-center gap-2 w-max">
                  {visibleTeachers.length === 0 ? (
                    <div className="text-sm text-slate-500 px-3 py-2">
                      No matches
                    </div>
                  ) : (
                    visibleTeachers.map((u) => (
                      <button
                        key={u._id}
                        onClick={() => setSelectedTeacher(u)}
                        className={`px-3 py-1 rounded-full text-sm font-semibold transition flex items-center gap-2 ${
                          selectedTeacher?._id === u._id
                            ? u.type === 'teacher'
                              ? 'bg-blue-600 text-white shadow'
                              : 'bg-amber-600 text-white shadow'
                            : 'bg-white text-slate-700 border border-slate-200 hover:shadow-sm'
                        }`}
                        title={u.name}
                      >
                        {u.name}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {selectedTeacher && (
          <div className="space-y-6">
            <div
              className={`rounded-2xl border-l-4 p-6 ${
                selectedTeacher.type === 'teacher'
                  ? 'bg-blue-50 border-l-blue-500 border border-blue-100'
                  : 'bg-amber-50 border-l-amber-500 border border-amber-100'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-lg font-black text-slate-800">
                      {selectedTeacher.name}
                    </p>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-bold ${selectedTeacher.type === 'teacher' ? 'bg-blue-200 text-blue-800' : 'bg-amber-200 text-amber-800'}`}
                    >
                      {selectedTeacher.type === 'teacher'
                        ? '👨‍🏫 Teacher'
                        : '⚡ Admin'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {loadingResources ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-slate-600">Loading resources...</p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap gap-2">
                  {resourceTypes.map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                        activeTab === type.id
                          ? 'bg-primary text-white shadow-md shadow-primary/30'
                          : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                      }`}
                      onClick={() => handleTabChange(type.id)}
                    >
                      {type.label}
                      <span className="ml-2 text-xs opacity-75">
                        (
                        {type.id === 'all'
                          ? resources.length
                          : resources.filter((r) => r.type === type.id).length}
                        )
                      </span>
                    </button>
                  ))}
                </div>

                <div>
                  {filteredResources.length === 0 ? (
                    <div className="rounded-2xl bg-white border border-slate-100 p-12 text-center shadow-sm">
                      <BookOpen className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                      <p className="text-slate-500 font-medium">
                        No resources in this category
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {filteredResources.map((resource) => (
                        <div
                          key={resource._id}
                          className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all hover:shadow-md hover:border-slate-200"
                        >
                          <div className="bg-slate-50 p-4 border-b border-slate-100">
                            {getResourceContent(resource)}
                          </div>
                          <div className="p-5">
                            <h3 className="truncate text-lg font-bold text-slate-800">
                              {resource.title}
                            </h3>
                            <p className="line-clamp-2 text-sm text-slate-600 mt-2">
                              {resource.description}
                            </p>
                            <div className="mt-4 flex items-center justify-between">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                                {resource.type}
                              </span>
                              <time className="flex items-center gap-1 text-xs text-slate-500">
                                <Calendar className="w-3 h-3" />
                                {new Date(
                                  resource.createdAt,
                                ).toLocaleDateString()}
                              </time>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative rounded-2xl bg-white shadow-2xl p-4 max-w-[98vw] max-h-[98vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-3 right-3 z-10 p-2 rounded-md bg-black/20 hover:bg-black/40 text-white transition"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <div className="flex items-center justify-center">
              <div className="relative w-[95vw] h-[85vh] sm:w-[80vw] sm:h-[85vh]">
                <Image
                  src={previewImage}
                  alt="Preview"
                  fill
                  className="object-contain"
                  unoptimized={true}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
