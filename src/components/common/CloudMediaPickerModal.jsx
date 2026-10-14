import React, { useState } from 'react';
import { CLOUD_SPORT_ASSETS, uploadMediaFileToCloud } from '../../services/cloudMediaStorage.js';

/**
 * CloudMediaPickerModal: Modal Quản lý và chọn tệp Đa phương tiện Đám mây
 * Hỗ trợ kéo thả tải file từ máy tính, chọn từ kho ảnh đám mây chất lượng cao, hoặc dán link CDN.
 */
export function CloudMediaPickerModal({ isOpen, onClose, onSelectImage, currentImage = '', title = 'Chọn / Tải Lên Hình Ảnh Đám Mây' }) {
  const [activeTab, setActiveTab] = useState('cloud-gallery'); // 'cloud-gallery' | 'upload' | 'url'
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [previewUrl, setPreviewUrl] = useState(currentImage || '');
  const [customUrl, setCustomUrl] = useState(currentImage || '');
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [fileMeta, setFileMeta] = useState(null);

  if (!isOpen) return null;

  const categories = [
    { id: 'all', label: 'Tất cả môn' },
    { id: 'aquatics', label: 'Bơi lội' },
    { id: 'fitness-wellness', label: 'Gym & Yoga' },
    { id: 'team-sports', label: 'Bóng & Vợt' },
    { id: 'combat', label: 'Võ thuật & Boxing' }
  ];

  const filteredAssets = selectedCategory === 'all'
    ? CLOUD_SPORT_ASSETS
    : CLOUD_SPORT_ASSETS.filter(a => a.category === selectedCategory);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadLoading(true);
    setUploadError('');
    try {
      const result = await uploadMediaFileToCloud(file);
      setPreviewUrl(result.url);
      setFileMeta(result);
    } catch (err) {
      setUploadError(err.message || 'Lỗi khi tải ảnh');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleApplyUrl = () => {
    if (!customUrl.trim()) {
      setUploadError('Vui lòng nhập đường dẫn hình ảnh');
      return;
    }
    setPreviewUrl(customUrl.trim());
    setUploadError('');
  };

  const handleConfirm = () => {
    if (!previewUrl) {
      setUploadError('Vui lòng chọn hoặc tải lên một hình ảnh');
      return;
    }
    onSelectImage(previewUrl);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col font-inter">

        {/* Header */}
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-red-600/30">
              <span className="material-symbols-outlined text-[22px]">cloud_upload</span>
            </span>
            <div>
              <span className="font-chivo text-[10px] font-black uppercase tracking-widest text-red-400 block">
                DYNAMIC CONTENT &amp; CLOUD OBJECT STORAGE
              </span>
              <h3 className="font-chivo text-lg font-black uppercase text-white leading-tight mt-0.5">
                {title}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            title="Đóng"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Tab navigation */}
        <div className="flex items-center bg-slate-100 border-b border-slate-200 px-6 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('cloud-gallery')}
            className={`py-3 px-4 font-chivo text-xs font-bold uppercase border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'cloud-gallery'
                ? 'border-red-600 text-red-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[17px]">photo_library</span>
            <span>Kho Ảnh Đám Mây Tuyển Chọn</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`py-3 px-4 font-chivo text-xs font-bold uppercase border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'upload'
                ? 'border-red-600 text-red-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[17px]">upload_file</span>
            <span>Tải Lên Từ Máy Tính</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`py-3 px-4 font-chivo text-xs font-bold uppercase border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'url'
                ? 'border-red-600 text-red-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[17px]">link</span>
            <span>Nhập URL Đám Mây</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {uploadError && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{uploadError}</span>
            </div>
          )}

          {/* TAB 1: KHO ẢNH ĐÁM MÂY */}
          {activeTab === 'cloud-gallery' && (
            <div>
              <div className="flex flex-wrap gap-2 mb-4">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectedCategory === cat.id
                        ? 'bg-red-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[340px] overflow-y-auto p-1">
                {filteredAssets.map(asset => {
                  const isSelected = previewUrl === asset.url;
                  return (
                    <div
                      key={asset.id}
                      onClick={() => {
                        setPreviewUrl(asset.url);
                        setFileMeta({ name: asset.title, dimensions: 'High-Res CDN' });
                      }}
                      className={`group relative rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-red-600 ring-2 ring-red-600/40 shadow-lg scale-95'
                          : 'border-slate-200 hover:border-slate-400'
                      }`}
                    >
                      <div className="aspect-video bg-slate-100 overflow-hidden">
                        <img
                          src={asset.thumb}
                          alt={asset.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      </div>
                      <div className="p-2 bg-white">
                        <span className="text-[10px] font-bold text-red-600 block uppercase">{asset.categoryName}</span>
                        <p className="text-[11px] font-medium text-slate-700 truncate">{asset.title}</p>
                      </div>
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center shadow-md">
                          <span className="material-symbols-outlined text-[16px]">check</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: TẢI LÊN TỪ MÁY */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <label className="border-2 border-dashed border-slate-300 hover:border-red-500 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer bg-slate-50 hover:bg-red-50/20 transition-all">
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/webp, image/jpg"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-3">
                  <span className="material-symbols-outlined text-[32px]">add_photo_alternate</span>
                </div>
                <span className="font-chivo text-sm font-bold text-slate-900 uppercase">
                  Nhấp để tải tệp hoặc kéo thả vào đây
                </span>
                <span className="text-xs text-slate-500 mt-1">
                  Định dạng PNG, JPG, JPEG, WEBP (Tối đa 10MB)
                </span>
                <span className="mt-3 px-3 py-1 rounded bg-slate-200 text-slate-700 text-[11px] font-semibold">
                  Tự động tối ưu nén chuẩn WebP đám mây
                </span>
              </label>

              {uploadLoading && (
                <div className="text-center py-4 text-xs font-semibold text-slate-500 flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                  <span>Đang xử lý và tải lên bộ nhớ đa phương tiện...</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: NHẬP URL ĐÁM MÂY */}
          {activeTab === 'url' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Đường dẫn Cloud Storage URL / Object CDN:
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/... hoặc link S3 / Cloudinary"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <button
                    type="button"
                    onClick={handleApplyUrl}
                    className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase transition-colors"
                  >
                    Xem trước
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Hỗ trợ link trực tiếp từ Cloudinary, AWS S3, Firebase Storage, ImgBB, Unsplash hoặc server tĩnh.
                </p>
              </div>
            </div>
          )}

          {/* Preview Box */}
          {previewUrl && (
            <div className="mt-5 p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-4">
              <div className="w-24 h-16 rounded-lg overflow-hidden bg-slate-200 shrink-0 border border-slate-300">
                <img
                  src={previewUrl}
                  alt="Xem trước ảnh"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold text-slate-800 uppercase">Hình ảnh đang chọn:</span>
                </div>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">{fileMeta?.name || previewUrl}</p>
                {fileMeta?.dimensions && (
                  <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                    Độ phân giải: {fileMeta.dimensions}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-chivo text-xs font-bold uppercase transition-colors"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!previewUrl}
            className="px-6 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-chivo text-xs font-black uppercase tracking-wider rounded-xl shadow-lg shadow-red-600/30 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">done</span>
            <span>Áp Dụng Hình Ảnh Này</span>
          </button>
        </div>
      </div>
    </div>
  );
}
