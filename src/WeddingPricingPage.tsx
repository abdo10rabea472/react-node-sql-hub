import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Plus, Edit3, Trash2, DollarSign, X, Save, AlertCircle, Loader, BookOpen, Video, Camera, Image, Ruler } from 'lucide-react';
import { useSettings } from './SettingsContext';
import { getWeddingAlbums, createWeddingAlbum, updateWeddingAlbum, deleteWeddingAlbum, getWeddingVideos, createWeddingVideo, updateWeddingVideo, deleteWeddingVideo } from './api';

interface Album { id: number; description: string; price: number; photo_count: number; size: string; color: string; }
interface VideoPricing { id: number; camera_type: string; quality: string; price_per_hour: number; color: string; }

const COLORS = ['#f43f5e', '#ec4899', '#a855f7', '#0ea5e9', '#10b981'];

const translations = {
  ar: {
    albumsTitle: 'ألبومات الزفاف', albumsSubtitle: 'إدارة ألبومات التصوير وأسعارها', addAlbum: 'إضافة ألبوم', editAlbum: 'تعديل الألبوم',
    description: 'وصف الألبوم', price: 'السعر', photoCount: 'عدد الصور', size: 'المقاس', save: 'حفظ', cancel: 'إلغاء',
    placeholderDesc: 'مثال: ألبوم فاخر مع تغليف جلدي...', placeholderSize: 'مثال: 20x30 سم',
    emptyAlbums: 'لا توجد ألبومات حالياً', loading: 'جاري التحميل...',
    videosTitle: 'أسعار الفيديو', videosSubtitle: 'إدارة أسعار تصوير الفيديو', addVideo: 'إضافة سعر فيديو', editVideo: 'تعديل سعر الفيديو',
    cameraType: 'نوع الكاميرا', quality: 'الجودة', pricePerHour: 'السعر للساعة',
    placeholderCamera: 'مثال: Sony A7III, Canon R5...', placeholderQuality: 'مثال: 4K, Full HD...',
    emptyVideos: 'لا توجد أسعار فيديو حالياً', photos: 'صورة', perHour: '/ ساعة',
  },
  en: {
    albumsTitle: 'Wedding Albums', albumsSubtitle: 'Manage photography albums and pricing', addAlbum: 'Add Album', editAlbum: 'Edit Album',
    description: 'Album Description', price: 'Price', photoCount: 'Photo Count', size: 'Size', save: 'Save', cancel: 'Cancel',
    placeholderDesc: 'e.g. Premium leather-bound album...', placeholderSize: 'e.g. 20x30 cm',
    emptyAlbums: 'No albums yet', loading: 'Loading...',
    videosTitle: 'Video Pricing', videosSubtitle: 'Manage video shooting prices', addVideo: 'Add Video Price', editVideo: 'Edit Video Price',
    cameraType: 'Camera Type', quality: 'Quality', pricePerHour: 'Price Per Hour',
    placeholderCamera: 'e.g. Sony A7III, Canon R5...', placeholderQuality: 'e.g. 4K, Full HD...',
    emptyVideos: 'No video pricing yet', photos: 'photos', perHour: '/ hour',
  },
};

const WeddingPricingPage: React.FC = () => {
  const { settings } = useSettings();
  const lang = settings.lang;
  const cur = settings.currency;
  const t = translations[lang];

  const [albums, setAlbums] = useState<Album[]>([]);
  const [videos, setVideos] = useState<VideoPricing[]>([]);
  const [loading, setLoading] = useState(true);

  // Album modal
  const [albumModal, setAlbumModal] = useState(false);
  const [editAlbum, setEditAlbum] = useState<Album | null>(null);
  const [aDesc, setADesc] = useState('');
  const [aPrice, setAPrice] = useState<number>(0);
  const [aPhotos, setAPhotos] = useState<number>(0);
  const [aSize, setASize] = useState('');

  // Video modal
  const [videoModal, setVideoModal] = useState(false);
  const [editVideo, setEditVideoState] = useState<VideoPricing | null>(null);
  const [vCamera, setVCamera] = useState('');
  const [vQuality, setVQuality] = useState('');
  const [vPrice, setVPrice] = useState<number>(0);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [a, v] = await Promise.all([getWeddingAlbums(), getWeddingVideos()]);
      setAlbums(a.data);
      setVideos(v.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  // Album handlers
  const openAlbumModal = (a?: Album) => {
    if (a) { setEditAlbum(a); setADesc(a.description); setAPrice(a.price); setAPhotos(a.photo_count); setASize(a.size || ''); }
    else { setEditAlbum(null); setADesc(''); setAPrice(0); setAPhotos(0); setASize(''); }
    setAlbumModal(true);
  };
  const saveAlbum = async () => {
    const data = { description: aDesc, price: aPrice, photo_count: aPhotos, size: aSize, color: editAlbum?.color || COLORS[albums.length % COLORS.length] };
    try { if (editAlbum) await updateWeddingAlbum(editAlbum.id, data); else await createWeddingAlbum(data); fetchData(); setAlbumModal(false); } catch (err) { console.error(err); }
  };
  const removeAlbum = async (id: number) => { if (!window.confirm(lang === 'ar' ? 'هل أنت متأكد؟' : 'Are you sure?')) return; try { await deleteWeddingAlbum(id); fetchData(); } catch (err) { console.error(err); } };

  // Video handlers
  const openVideoModal = (v?: VideoPricing) => {
    if (v) { setEditVideoState(v); setVCamera(v.camera_type); setVQuality(v.quality); setVPrice(v.price_per_hour); }
    else { setEditVideoState(null); setVCamera(''); setVQuality(''); setVPrice(0); }
    setVideoModal(true);
  };
  const saveVideo = async () => {
    const data = { camera_type: vCamera, quality: vQuality, price_per_hour: vPrice, color: editVideo?.color || COLORS[(videos.length + 2) % COLORS.length] };
    try { if (editVideo) await updateWeddingVideo(editVideo.id, data); else await createWeddingVideo(data); fetchData(); setVideoModal(false); } catch (err) { console.error(err); }
  };
  const removeVideo = async (id: number) => { if (!window.confirm(lang === 'ar' ? 'هل أنت متأكد؟' : 'Are you sure?')) return; try { await deleteWeddingVideo(id); fetchData(); } catch (err) { console.error(err); } };

  const inputClass = "w-full px-3.5 py-2.5 bg-muted border border-border rounded-lg text-foreground text-sm outline-none focus:border-pink-500/50 focus:ring-2 focus:ring-pink-500/10 transition-all font-cairo";

  if (loading) return <div className="flex flex-col items-center justify-center min-h-[400px] gap-3"><Loader className="animate-spin text-pink-500" size={28} /><p className="text-muted-foreground text-sm">{t.loading}</p></div>;

  return (
    <div className="animate-fade-in space-y-10">
      {/* ===== ALBUMS SECTION ===== */}
      <section>
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-5">
          <div>
            <div className="flex items-center gap-2 text-pink-500 text-xs font-extrabold uppercase tracking-widest mb-1"><Heart size={16} /><span>{lang === 'ar' ? 'قسم الزفاف' : 'Wedding Section'}</span></div>
            <h1 className="text-xl font-extrabold text-foreground">{t.albumsTitle}</h1>
            <p className="text-sm text-muted-foreground mt-1">{t.albumsSubtitle}</p>
          </div>
          <button onClick={() => openAlbumModal()} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg font-semibold text-sm hover:opacity-90 transition-all shadow-md shadow-pink-500/20"><Plus size={18} />{t.addAlbum}</button>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {albums.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center min-h-[200px] gap-3 text-muted-foreground"><AlertCircle size={40} /><p>{t.emptyAlbums}</p></div>
          ) : albums.map((album, idx) => (
            <motion.div key={album.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.08 }}
              className="bg-card border border-border rounded-xl p-5 hover:-translate-y-1 hover:shadow-lg transition-all relative overflow-hidden group"
              style={{ borderTopColor: album.color, borderTopWidth: 3 }}>
              <div className="absolute top-3 end-3 flex gap-1.5">
                <button onClick={() => openAlbumModal(album)} className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"><Edit3 size={14} /></button>
                <button onClick={() => removeAlbum(album.id)} className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"><Trash2 size={14} /></button>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: `${album.color}15`, color: album.color }}><BookOpen size={20} /></div>
              <h3 className="font-bold text-foreground text-lg mb-1">{album.description}</h3>
              <div className="flex items-baseline gap-1.5 mb-4"><span className="text-3xl font-extrabold text-foreground tracking-tight">{album.price}</span><span className="text-base font-semibold text-muted-foreground">{cur}</span></div>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2"><Image size={14} style={{ color: album.color }} /><span>{album.photo_count} {t.photos}</span></div>
                {album.size && <div className="flex items-center gap-2"><Ruler size={14} style={{ color: album.color }} /><span>{album.size}</span></div>}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ===== VIDEO PRICING SECTION ===== */}
      <section>
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-5">
          <div>
            <div className="flex items-center gap-2 text-purple-500 text-xs font-extrabold uppercase tracking-widest mb-1"><Video size={16} /><span>{lang === 'ar' ? 'قسم الفيديو' : 'Video Section'}</span></div>
            <h1 className="text-xl font-extrabold text-foreground">{t.videosTitle}</h1>
            <p className="text-sm text-muted-foreground mt-1">{t.videosSubtitle}</p>
          </div>
          <button onClick={() => openVideoModal()} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500 to-violet-500 text-white rounded-lg font-semibold text-sm hover:opacity-90 transition-all shadow-md shadow-purple-500/20"><Plus size={18} />{t.addVideo}</button>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center min-h-[200px] gap-3 text-muted-foreground"><AlertCircle size={40} /><p>{t.emptyVideos}</p></div>
          ) : videos.map((vid, idx) => (
            <motion.div key={vid.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.08 }}
              className="bg-card border border-border rounded-xl p-5 hover:-translate-y-1 hover:shadow-lg transition-all relative overflow-hidden group"
              style={{ borderTopColor: vid.color || '#a855f7', borderTopWidth: 3 }}>
              <div className="absolute top-3 end-3 flex gap-1.5">
                <button onClick={() => openVideoModal(vid)} className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"><Edit3 size={14} /></button>
                <button onClick={() => removeVideo(vid.id)} className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"><Trash2 size={14} /></button>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: `${vid.color || '#a855f7'}15`, color: vid.color || '#a855f7' }}><Video size={20} /></div>
              <h3 className="font-bold text-foreground text-lg mb-1">{vid.camera_type}</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4"><Camera size={14} /><span>{vid.quality}</span></div>
              <div className="flex items-baseline gap-1.5"><span className="text-3xl font-extrabold text-foreground tracking-tight">{vid.price_per_hour}</span><span className="text-base font-semibold text-muted-foreground">{cur} {t.perHour}</span></div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Album Modal */}
      <AnimatePresence>
        {albumModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[2000] flex items-center justify-center p-5" onClick={() => setAlbumModal(false)}>
            <motion.div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center px-6 py-4 border-b border-border"><h2 className="font-bold text-foreground flex items-center gap-2"><BookOpen size={18} className="text-pink-500" />{editAlbum ? t.editAlbum : t.addAlbum}</h2><button onClick={() => setAlbumModal(false)} className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition-all"><X size={20} /></button></div>
              <div className="p-6 space-y-4">
                <div><label className="block text-xs font-semibold text-foreground mb-1.5">{t.description}</label><input value={aDesc} onChange={e => setADesc(e.target.value)} placeholder={t.placeholderDesc} className={inputClass} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs font-semibold text-foreground mb-1.5">{t.price} ({cur})</label><div className="flex items-center gap-2.5 bg-muted border border-border rounded-lg px-3.5 h-11 focus-within:border-pink-500/50 focus-within:ring-2 focus-within:ring-pink-500/10"><DollarSign size={16} className="text-muted-foreground" /><input type="number" value={aPrice} onChange={e => setAPrice(Number(e.target.value))} className="flex-1 bg-transparent border-none outline-none text-foreground text-sm" /></div></div>
                  <div><label className="block text-xs font-semibold text-foreground mb-1.5">{t.photoCount}</label><div className="flex items-center gap-2.5 bg-muted border border-border rounded-lg px-3.5 h-11 focus-within:border-pink-500/50 focus-within:ring-2 focus-within:ring-pink-500/10"><Image size={16} className="text-muted-foreground" /><input type="number" value={aPhotos} onChange={e => setAPhotos(Number(e.target.value))} className="flex-1 bg-transparent border-none outline-none text-foreground text-sm" /></div></div>
                </div>
                <div><label className="block text-xs font-semibold text-foreground mb-1.5">{t.size}</label><div className="flex items-center gap-2.5 bg-muted border border-border rounded-lg px-3.5 h-11 focus-within:border-pink-500/50 focus-within:ring-2 focus-within:ring-pink-500/10"><Ruler size={16} className="text-muted-foreground" /><input value={aSize} onChange={e => setASize(e.target.value)} placeholder={t.placeholderSize} className="flex-1 bg-transparent border-none outline-none text-foreground text-sm font-cairo" /></div></div>
              </div>
              <div className="flex justify-end gap-2.5 px-6 py-4 border-t border-border bg-muted/30">
                <button onClick={() => setAlbumModal(false)} className="px-4 py-2.5 border border-border rounded-lg text-sm font-semibold text-muted-foreground hover:bg-muted transition-all">{t.cancel}</button>
                <button onClick={saveAlbum} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-all"><Save size={16} />{t.save}</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Video Modal */}
      <AnimatePresence>
        {videoModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[2000] flex items-center justify-center p-5" onClick={() => setVideoModal(false)}>
            <motion.div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center px-6 py-4 border-b border-border"><h2 className="font-bold text-foreground flex items-center gap-2"><Video size={18} className="text-purple-500" />{editVideo ? t.editVideo : t.addVideo}</h2><button onClick={() => setVideoModal(false)} className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition-all"><X size={20} /></button></div>
              <div className="p-6 space-y-4">
                <div><label className="block text-xs font-semibold text-foreground mb-1.5">{t.cameraType}</label><div className="flex items-center gap-2.5 bg-muted border border-border rounded-lg px-3.5 h-11 focus-within:border-purple-500/50 focus-within:ring-2 focus-within:ring-purple-500/10"><Camera size={16} className="text-muted-foreground" /><input value={vCamera} onChange={e => setVCamera(e.target.value)} placeholder={t.placeholderCamera} className="flex-1 bg-transparent border-none outline-none text-foreground text-sm font-cairo" /></div></div>
                <div><label className="block text-xs font-semibold text-foreground mb-1.5">{t.quality}</label><input value={vQuality} onChange={e => setVQuality(e.target.value)} placeholder={t.placeholderQuality} className={inputClass} /></div>
                <div><label className="block text-xs font-semibold text-foreground mb-1.5">{t.pricePerHour} ({cur})</label><div className="flex items-center gap-2.5 bg-muted border border-border rounded-lg px-3.5 h-11 focus-within:border-purple-500/50 focus-within:ring-2 focus-within:ring-purple-500/10"><DollarSign size={16} className="text-muted-foreground" /><input type="number" value={vPrice} onChange={e => setVPrice(Number(e.target.value))} className="flex-1 bg-transparent border-none outline-none text-foreground text-sm" /></div></div>
              </div>
              <div className="flex justify-end gap-2.5 px-6 py-4 border-t border-border bg-muted/30">
                <button onClick={() => setVideoModal(false)} className="px-4 py-2.5 border border-border rounded-lg text-sm font-semibold text-muted-foreground hover:bg-muted transition-all">{t.cancel}</button>
                <button onClick={saveVideo} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500 to-violet-500 text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-all"><Save size={16} />{t.save}</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WeddingPricingPage;
