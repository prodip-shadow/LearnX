'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Swal from 'sweetalert2';
import { Plus, Loader2 } from 'lucide-react';

const IMAGEBB_API_KEY = process.env.NEXT_PUBLIC_IMAGEBB_API_KEY;

export default function AddResourceForm() {
  const { user } = useAuth();
  const [resourceType, setResourceType] = useState('youtube');
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [teacherInfo, setTeacherInfo] = useState({ name: '', email: '' });
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    url: '',
    file: null,
  });

  // Fetch teacher info from Firebase
  useEffect(() => {
    if (user?.email && user?.displayName) {
      setTeacherInfo({
        name: user.displayName,
        email: user.email,
      });
    }
  }, [user]);

  const uploadImageToImageBB = async (file) => {
    try {
      setUploadingImage(true);

      if (!IMAGEBB_API_KEY) {
        Swal.fire(
          'Error',
          'Image upload service not configured. Please set NEXT_PUBLIC_IMAGEBB_API_KEY in .env.local',
          'error',
        );
        return null;
      }

      const formDataObj = new FormData();
      formDataObj.append('image', file);

      const response = await fetch(
        `https://api.imgbb.com/1/upload?key=${IMAGEBB_API_KEY}`,
        {
          method: 'POST',
          body: formDataObj,
        },
      );

      const data = await response.json();

      if (!data.success) {
        throw new Error(
          data.error?.message || 'Failed to upload image to imagebb',
        );
      }

      return data.data.url;
    } catch (error) {
      console.error('ImageBB upload error:', error);
      Swal.fire(
        'Error',
        error.message || 'Failed to upload image. Check console for details.',
        'error',
      );
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        Swal.fire({
          title: 'Error',
          text: 'File size must not exceed 5MB',
          icon: 'error',
        });
        e.target.value = '';
        return;
      }
      setFormData((prev) => ({
        ...prev,
        file,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!user?.uid) {
        Swal.fire('Error', 'Please log in first', 'error');
        setLoading(false);
        return;
      }

      if (!formData.title.trim()) {
        Swal.fire('Error', 'Title is required', 'error');
        setLoading(false);
        return;
      }

      const payload = {
        teacherId: user.uid,
        teacherName: teacherInfo.name || user.displayName || 'Unknown',
        teacherEmail: teacherInfo.email || user.email || '',
        title: formData.title,
        type: resourceType,
        description: formData.description,
      };

      // Handle different types
      if (resourceType === 'youtube') {
        if (!formData.url.trim()) {
          Swal.fire('Error', 'YouTube URL is required', 'error');
          setLoading(false);
          return;
        }
        payload.url = formData.url;
      } else if (resourceType === 'drive') {
        if (!formData.url.trim()) {
          Swal.fire('Error', 'Google Drive link is required', 'error');
          setLoading(false);
          return;
        }
        payload.url = formData.url;
      } else if (resourceType === 'document') {
        if (!formData.file) {
          Swal.fire('Error', 'Please select a document', 'error');
          setLoading(false);
          return;
        }
        payload.fileName = formData.file.name;
        payload.fileSize = formData.file.size;
        payload.fileBase64 = await fileToBase64(formData.file);
      } else if (resourceType === 'image') {
        if (!formData.file) {
          Swal.fire('Error', 'Please select an image', 'error');
          setLoading(false);
          return;
        }
        const imageUrl = await uploadImageToImageBB(formData.file);
        if (!imageUrl) {
          setLoading(false);
          return;
        }
        payload.url = imageUrl;
      } else if (['question', 'answer'].includes(resourceType)) {
        if (!formData.url.trim()) {
          Swal.fire('Error', 'Content is required', 'error');
          setLoading(false);
          return;
        }
        payload.url = formData.url;
      }

      const response = await fetch('/api/resources/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create resource');
      }

      Swal.fire({
        title: 'Success',
        text: 'Resource created successfully',
        icon: 'success',
      });

      // Reset form
      setFormData({
        title: '',
        description: '',
        url: '',
        file: null,
      });
      setResourceType('youtube');
    } catch (error) {
      console.error('Error:', error);
      Swal.fire('Error', error.message || 'Failed to create resource', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6 bg-[#f9fafb] min-h-screen p-4 md:p-8 lg:p-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">
          Add Resource
        </h1>
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-2">
          Share Learning Materials with Students
        </p>
      </div>

      <div className="w-full rounded-3xl border border-slate-100 bg-white p-8 md:p-10 shadow-sm">
        {/* Teacher Info Display */}
        <div className="bg-linear-to-r from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-100 mb-8">
          <p className="text-sm text-slate-600">
            <span className="font-semibold">Teacher:</span>{' '}
            {teacherInfo.name || 'Loading...'}
          </p>
          <p className="text-sm text-slate-600 mt-1">
            <span className="font-semibold">Email:</span>{' '}
            {teacherInfo.email || 'Loading...'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Resource Type Tabs */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-3">
              Resource Type *
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                'youtube',
                'document',
                'drive',
                'image',
                'question',
                'answer',
              ].map((type) => (
                <button
                  key={type}
                  type="button"
                  className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                    resourceType === type
                      ? 'bg-primary text-white shadow-md shadow-primary/30'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                  onClick={() => setResourceType(type)}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Common Fields */}
          <div className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Enter resource title"
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Enter resource description (optional)"
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition"
                rows="4"
              />
            </div>

            {/* URL-based resources */}
            {['youtube', 'drive', 'question', 'answer'].includes(
              resourceType,
            ) && (
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  {resourceType === 'youtube' && 'YouTube URL *'}
                  {resourceType === 'drive' && 'Google Drive Link *'}
                  {resourceType === 'question' && 'Content/URL *'}
                  {resourceType === 'answer' && 'Content/URL *'}
                </label>
                <input
                  type="text"
                  name="url"
                  value={formData.url}
                  onChange={handleInputChange}
                  placeholder={`Enter ${resourceType} link`}
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition"
                  required
                />
              </div>
            )}

            {/* File-based resources */}
            {['document', 'image'].includes(resourceType) && (
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  {resourceType === 'document' && 'Upload Document (Max 5MB) *'}
                  {resourceType === 'image' && 'Upload Image (ImageBB) *'}
                </label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept={
                    resourceType === 'document'
                      ? '.pdf,.doc,.docx,.txt'
                      : 'image/*'
                  }
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90"
                  required
                  disabled={uploadingImage}
                />
                {formData.file && (
                  <p className="mt-3 text-sm text-slate-600 flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    {formData.file.name} (
                    {(formData.file.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
                {uploadingImage && (
                  <p className="mt-3 text-sm text-primary flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading image to imagebb...
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-6 border-t border-slate-200">
            <button
              type="submit"
              disabled={loading || uploadingImage}
              className="w-full px-6 py-3 bg-linear-to-r from-primary to-primary/80 text-white font-bold rounded-lg hover:shadow-lg hover:shadow-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  Add Resource
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
