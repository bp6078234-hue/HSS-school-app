import React, { useState, useRef } from 'react';
import { CampusFacility, UserProfile } from '../../types';
import {
  Camera,
  Upload,
  CheckCircle,
  RefreshCw,
  Trash2,
  Edit3,
  Plus,
  Image as ImageIcon,
  BookOpen,
  FlaskConical,
  Monitor,
  Sparkles,
  Building2,
  Save,
  X
} from 'lucide-react';

interface TeacherPhotoManagerProps {
  user: UserProfile;
  facilities: CampusFacility[];
  onFacilitiesChange: (updated: CampusFacility[]) => void;
  assetVersion: number;
  onUploadSchoolAsset: (targetName: 'logo.jpg' | 'school.jpg', file?: File | null) => void;
}

// Compress and resize large camera/gallery images on the client so uploads are instant and reliable
export async function compressImageFile(file: File, maxWidth = 1280, maxHeight = 960, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (!result) return reject(new Error('Failed to read image file'));

      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(result);
        }
        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      img.onerror = () => resolve(result);
      img.src = result;
    };
    reader.onerror = () => reject(new Error('File read error'));
    reader.readAsDataURL(file);
  });
}

export const TeacherPhotoManager: React.FC<TeacherPhotoManagerProps> = ({
  user,
  facilities,
  onFacilitiesChange,
  assetVersion,
  onUploadSchoolAsset,
}) => {
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'Lab' | 'Library' | 'Classroom' | 'Campus'>('all');
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Editing caption/title state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editCategory, setEditCategory] = useState<'Lab' | 'Library' | 'Classroom' | 'Campus'>('Lab');

  // Add new Lab / Library item state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<'Lab' | 'Library' | 'Classroom' | 'Campus'>('Lab');
  const [newDesc, setNewDesc] = useState('');
  const [newPhotoFile, setNewPhotoFile] = useState<File | null>(null);
  const [newPhotoPreview, setNewPhotoPreview] = useState<string | null>(null);

  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const schoolBuildingInputRef = useRef<HTMLInputElement | null>(null);
  const newFacilityPhotoRef = useRef<HTMLInputElement | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMessage({ text, type });
    setTimeout(() => {
      setStatusMessage((prev) => (prev?.text === text ? null : prev));
    }, 4500);
  };

  const handleSelectFacilityPhoto = async (facility: CampusFacility, file?: File | null) => {
    if (!file) return;
    setUploadingId(facility.id);
    try {
      const dataUrl = await compressImageFile(file);
      const res = await fetch('/api/facilities/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: facility.id,
          title: facility.title,
          category: facility.category,
          desc: facility.desc,
          dataUrl,
          updatedBy: user.name,
        }),
      });

      const data = await res.json();
      if (res.ok && Array.isArray(data.facilities)) {
        onFacilitiesChange(data.facilities);
        try {
          localStorage.setItem('ghss_facilities_cache', JSON.stringify(data.facilities));
        } catch {}
        showToast(`"${facility.title}" photo updated successfully! It is now live on the school homepage.`);
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      showToast(err.message || 'Failed to upload photo. Please try again.', 'error');
    } finally {
      setUploadingId(null);
    }
  };

  const handleSaveDetails = async (facilityId: string) => {
    setUploadingId(facilityId);
    try {
      const res = await fetch('/api/facilities/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: facilityId,
          title: editTitle,
          category: editCategory,
          desc: editDesc,
          updatedBy: user.name,
        }),
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.facilities)) {
        onFacilitiesChange(data.facilities);
        try {
          localStorage.setItem('ghss_facilities_cache', JSON.stringify(data.facilities));
        } catch {}
        setEditingId(null);
        showToast('Facility title and description saved!');
      }
    } catch {
      showToast('Failed to save details.', 'error');
    } finally {
      setUploadingId(null);
    }
  };

  const handleResetPhoto = async (facility: CampusFacility) => {
    setUploadingId(facility.id);
    try {
      const res = await fetch('/api/facilities/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: facility.id,
          resetPhoto: true,
          updatedBy: user.name,
        }),
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.facilities)) {
        onFacilitiesChange(data.facilities);
        try {
          localStorage.setItem('ghss_facilities_cache', JSON.stringify(data.facilities));
        } catch {}
        showToast(`Reset photo for "${facility.title}" to default.`);
      }
    } catch {
      showToast('Failed to reset photo.', 'error');
    } finally {
      setUploadingId(null);
    }
  };

  const handleCreateFacility = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const customId = `${newCategory.toLowerCase()}-${Date.now()}`;
    setUploadingId('new');
    try {
      let dataUrl: string | undefined;
      if (newPhotoFile) {
        dataUrl = await compressImageFile(newPhotoFile);
      }
      const res = await fetch('/api/facilities/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: customId,
          title: newTitle.trim(),
          category: newCategory,
          desc: newDesc.trim() || `${newTitle.trim()} at GHSS Ahamdpur Khaigaon.`,
          dataUrl,
          updatedBy: user.name,
        }),
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.facilities)) {
        onFacilitiesChange(data.facilities);
        try {
          localStorage.setItem('ghss_facilities_cache', JSON.stringify(data.facilities));
        } catch {}
        setNewTitle('');
        setNewDesc('');
        setNewPhotoFile(null);
        setNewPhotoPreview(null);
        setShowAddModal(false);
        showToast(`Added "${newTitle.trim()}" to school Labs & Library gallery!`);
      }
    } catch {
      showToast('Failed to add new facility card.', 'error');
    } finally {
      setUploadingId(null);
    }
  };

  const filteredFacilities = facilities.filter((f) => {
    if (categoryFilter === 'all') return true;
    return f.category === categoryFilter;
  });

  const getCategoryBadge = (category: CampusFacility['category']) => {
    switch (category) {
      case 'Library':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <BookOpen className="w-3 h-3" /> Library (पुस्तकालय)
          </span>
        );
      case 'Lab':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
            <FlaskConical className="w-3 h-3" /> Science / ICT Lab (प्रयोगशाला)
          </span>
        );
      case 'Classroom':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
            <Monitor className="w-3 h-3" /> Smart Classroom
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <Building2 className="w-3 h-3" /> Campus Facility
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header & Instructions Banner */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-purple-950/50 via-slate-900 to-cyan-950/40 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-cyan-400">
            <Camera className="w-3.5 h-3.5" />
            No-Code Visual Photo Manager
          </div>
          <h3 className="text-lg sm:text-xl font-extrabold text-white">
            Labs, Library & Campus Photo Upload (प्रयोगशाला एवं पुस्तकालय फोटो प्रबंधन)
          </h3>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Click the <b>Camera icon</b> or <b>"Change Photo"</b> button on any Lab or Library card below to upload a new photo directly from your mobile or computer—just like changing a profile picture.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="py-2.5 px-4 rounded-2xl bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-bold text-xs shadow-lg flex items-center gap-1.5 shrink-0 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Lab / Room Photo</span>
        </button>
      </div>

      {/* Status Toast Notification */}
      {statusMessage && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs font-semibold animate-fadeIn ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/60 border-rose-500/40 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{statusMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'all' as const, label: `All Photos (${facilities.length})` },
            { id: 'Library' as const, label: 'Library (पुस्तकालय)' },
            { id: 'Lab' as const, label: 'Science & ICT Labs (प्रयोगशालाएं)' },
            { id: 'Classroom' as const, label: 'Smart Classroom' },
            { id: 'Campus' as const, label: 'Campus & Playground' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setCategoryFilter(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition ${
                categoryFilter === tab.id
                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-md'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Labs & Library Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFacilities.map((fac) => {
          const isUploading = uploadingId === fac.id;
          const isEditing = editingId === fac.id;

          return (
            <div
              key={fac.id}
              className="rounded-3xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 overflow-hidden shadow-xl flex flex-col justify-between transition group"
            >
              <div>
                {/* Hidden File Input for this specific Lab / Library card */}
                <input
                  ref={(el) => {
                    fileInputRefs.current[fac.id] = el;
                  }}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleSelectFacilityPhoto(fac, file);
                    }
                    e.target.value = '';
                  }}
                />

                {/* Profile-Picture-Style Clickable Photo Preview Container */}
                <div
                  onClick={() => !isUploading && fileInputRefs.current[fac.id]?.click()}
                  className="relative h-52 w-full bg-slate-950 overflow-hidden cursor-pointer select-none"
                  title="Click to upload or change photo"
                >
                  {fac.imageUrl ? (
                    <img
                      src={fac.imageUrl}
                      alt={fac.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-950 to-purple-950/50 flex flex-col items-center justify-center p-6 text-center space-y-2">
                      <div className="w-16 h-16 rounded-full bg-slate-900/90 border-2 border-dashed border-cyan-500/40 flex items-center justify-center text-cyan-400 group-hover:border-cyan-400 group-hover:scale-110 transition">
                        {fac.category === 'Library' ? (
                          <BookOpen className="w-7 h-7 text-amber-400" />
                        ) : fac.category === 'Lab' ? (
                          <FlaskConical className="w-7 h-7 text-cyan-400" />
                        ) : fac.category === 'Classroom' ? (
                          <Monitor className="w-7 h-7 text-purple-400" />
                        ) : (
                          <ImageIcon className="w-7 h-7 text-emerald-400" />
                        )}
                      </div>
                      <div className="text-xs font-bold text-slate-200">{fac.title}</div>
                      <div className="text-[11px] text-cyan-400 font-medium">
                        Tap to upload photo (फोटो अपलोड करें)
                      </div>
                    </div>
                  )}

                  {/* Top-Left Category Badge */}
                  <div className="absolute top-3 left-3 z-10">
                    {getCategoryBadge(fac.category)}
                  </div>

                  {/* Top-Right Status Badge */}
                  <div className="absolute top-3 right-3 z-10">
                    {fac.imageUrl ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/90 text-slate-950 shadow">
                        Photo Uploaded
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-900/80 text-slate-400 border border-slate-700">
                        Default View
                      </span>
                    )}
                  </div>

                  {/* Hover / Tap Overlay (Just like changing a profile picture) */}
                  <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 text-white">
                    <div className="w-12 h-12 rounded-full bg-cyan-500 text-white flex items-center justify-center shadow-lg">
                      <Camera className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold tracking-wide">
                      {fac.imageUrl ? 'Change Photo (फोटो बदलें)' : 'Upload Photo (फोटो लगाएं)'}
                    </span>
                  </div>

                  {/* Floating Profile-Style Camera Button in Bottom-Right Corner */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRefs.current[fac.id]?.click();
                    }}
                    disabled={isUploading}
                    className="absolute bottom-3 right-3 z-20 w-10 h-10 rounded-full bg-cyan-500 hover:bg-cyan-400 text-white shadow-lg shadow-cyan-950/60 border-2 border-slate-950 flex items-center justify-center transition transform hover:scale-105"
                    title="Change Photo"
                  >
                    {isUploading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Card Body: Title & Description or Inline Editor */}
                <div className="p-5 space-y-3">
                  {isEditing ? (
                    <div className="space-y-2.5 text-xs">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Title (नाम)</label>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Category</label>
                        <select
                          value={editCategory}
                          onChange={(e) => setEditCategory(e.target.value as any)}
                          className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
                        >
                          <option value="Library">Library (पुस्तकालय)</option>
                          <option value="Lab">Lab (प्रयोगशाला)</option>
                          <option value="Classroom">Smart Classroom</option>
                          <option value="Campus">Campus Facility</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Description (विवरण)</label>
                        <textarea
                          rows={2}
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
                        />
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleSaveDetails(fac.id)}
                          className="flex-1 py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1"
                        >
                          <Save className="w-3.5 h-3.5" /> Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-base font-bold text-white leading-snug">
                          {fac.title}
                        </h4>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(fac.id);
                            setEditTitle(fac.title);
                            setEditCategory(fac.category);
                            setEditDesc(fac.desc);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition shrink-0"
                          title="Edit Title or Description"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">{fac.desc}</p>
                      {fac.updatedAt && (
                        <div className="text-[10px] text-slate-500">
                          Last updated: {new Date(fac.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          {fac.updatedBy ? ` by ${fac.updatedBy}` : ''}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Card Action Footer */}
              <div className="px-5 pb-5 pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRefs.current[fac.id]?.click()}
                  disabled={isUploading}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 font-bold text-xs flex items-center justify-center gap-2 transition disabled:opacity-50"
                >
                  {isUploading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>{fac.imageUrl ? 'Change Photo (फोटो बदलें)' : 'Upload Photo (फोटो अपलोड करें)'}</span>
                    </>
                  )}
                </button>

                {fac.imageUrl && (
                  <button
                    type="button"
                    onClick={() => handleResetPhoto(fac)}
                    disabled={isUploading}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-rose-950/60 border border-slate-700 hover:border-rose-500/40 text-slate-400 hover:text-rose-300 transition"
                    title="Remove custom photo and restore default"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Main School Identity Photos Section (Logo & School Building Photo) */}
      <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400">
            Main School Identity Photos
          </span>
          <h4 className="text-base font-bold text-white mt-0.5">
            School Header Logo & Main Building Banner (विद्यालय लोगो एवं मुख्य भवन फोटो)
          </h4>
        </div>

        <input
          ref={logoInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              onUploadSchoolAsset('logo.jpg', file);
              showToast('School Header Logo updated!');
            }
            e.target.value = '';
          }}
        />
        <input
          ref={schoolBuildingInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              onUploadSchoolAsset('school.jpg', file);
              showToast('Official School Building photo updated!');
            }
            e.target.value = '';
          }}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* School Logo Uploader */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div
                onClick={() => logoInputRef.current?.click()}
                className="relative w-16 h-16 rounded-2xl bg-white p-1 border border-slate-700 cursor-pointer group shrink-0"
              >
                <img
                  src={assetVersion ? `/logo.jpg?v=${assetVersion}` : '/logo.jpg'}
                  alt="School Logo"
                  className="w-full h-full object-contain"
                />
                <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-cyan-500 text-white flex items-center justify-center shadow border-2 border-slate-950">
                  <Camera className="w-3.5 h-3.5" />
                </div>
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold text-white">School Logo (विद्यालय लोगो)</div>
                <div className="text-[11px] text-slate-400">Displayed in the top navigation bar</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              className="py-2 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-xs font-semibold shrink-0 transition"
            >
              Change Logo
            </button>
          </div>

          {/* School Building Photo Uploader */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div
                onClick={() => schoolBuildingInputRef.current?.click()}
                className="relative w-20 h-16 rounded-2xl bg-slate-900 overflow-hidden border border-slate-700 cursor-pointer group shrink-0"
              >
                <img
                  src={assetVersion ? `/school.jpg?v=${assetVersion}` : '/school.jpg'}
                  alt="School Building"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-cyan-500 text-white flex items-center justify-center shadow border border-slate-950">
                  <Camera className="w-3 h-3" />
                </div>
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold text-white">Main Building Photo (मुख्य भवन)</div>
                <div className="text-[11px] text-slate-400">Displayed prominently on Home page</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => schoolBuildingInputRef.current?.click()}
              className="py-2 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-xs font-semibold shrink-0 transition"
            >
              Change Photo
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Add New Lab / Library Photo Card */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl p-6 space-y-4 text-xs text-slate-100 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Add New Lab / Library Photo Card</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateFacility} className="space-y-4">
              {/* Photo Picker Box */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Select Photo (फोटो चुनें)</label>
                <input
                  ref={newFacilityPhotoRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setNewPhotoFile(file);
                      const reader = new FileReader();
                      reader.onload = () => setNewPhotoPreview(reader.result as string);
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                <div
                  onClick={() => newFacilityPhotoRef.current?.click()}
                  className="h-40 rounded-2xl bg-slate-950 border-2 border-dashed border-slate-700 hover:border-cyan-500/60 flex flex-col items-center justify-center cursor-pointer overflow-hidden relative transition"
                >
                  {newPhotoPreview ? (
                    <img src={newPhotoPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center space-y-1.5 p-4">
                      <div className="w-10 h-10 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto">
                        <Camera className="w-5 h-5" />
                      </div>
                      <div className="font-semibold text-slate-200">Click to choose photo from gallery</div>
                      <div className="text-[11px] text-slate-500">JPG, PNG, or WEBP</div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Facility / Lab Name (नाम) *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Vocational Healthcare Lab / Reading Library"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Category (श्रेणी)</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white"
                >
                  <option value="Lab">Science / Vocational Lab (प्रयोगशाला)</option>
                  <option value="Library">School Library (पुस्तकालय)</option>
                  <option value="Classroom">Smart Classroom (स्मार्ट कक्ष)</option>
                  <option value="Campus">Campus Facility (परिसर सुविधा)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Short Description (संक्षिप्त विवरण)</label>
                <textarea
                  rows={2}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Describe the equipment, books, or learning activities..."
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadingId === 'new' || !newTitle.trim()}
                  className="py-2.5 px-5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-bold shadow-lg transition disabled:opacity-50"
                >
                  {uploadingId === 'new' ? 'Uploading...' : 'Save & Publish Photo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
