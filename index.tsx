import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import {
  Play, CheckCircle2, Clock, AlertCircle, FileText, Phone, Mail,
  ChevronRight, ChevronDown, ListVideo, X, ArrowUpRight, ExternalLink,
  FolderOpen, Loader2, AlertTriangle, MessageCircle, RefreshCw, Video as VideoIcon
} from "lucide-react";

// ═══════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const TABLES = { clients: "tblvndxiZaqAVGP5O", projets: "Projets", videos: "Vidéos", equipe: "Équipe" };

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════
type Status = string;
interface Client { id: string; companyName: string; logoUrl: string; status: string; type: string; driveUrl?: string; }
interface Project { id: string; name: string; totalVideos: number; deliveredVideos: number; startDate: string; endDate: string; status: string; progressionPercent: number; }
interface Video { id: string; title: string; language: string; status: Status; videoUrl: string; driveUrl: string; shootingDateTime?: string; shootingLocation?: string; priority: string; progress: number; deadline: string; deliveryDate?: string; projectIds: string[]; }
interface TeamMember { id: string; name: string; roles: string[]; email: string; whatsapp: string; photoUrl: string; }

// ═══════════════════════════════════════════
// API
// ═══════════════════════════════════════════
const api = async (action: string, tableName: string, extra: Record<string, any> = {}) => {
  const res = await fetch(`${API_BASE_URL}/airtable`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, tableName, ...extra }) });
  if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Erreur"); }
  return res.json();
};

// ═══════════════════════════════════════════
// MICRO COMPONENTS
// ═══════════════════════════════════════════

const CircularProgress = ({ value, size = 52, stroke = 4 }: { value: number; size?: number; stroke?: number }) => {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="rgba(18,39,85,0.05)" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#122755" strokeWidth={stroke}
        strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)' }} />
    </svg>
  );
};

const StatusPill = ({ status }: { status: string }) => {
  const label = status.replace(/^[^a-zA-ZÀ-ÿ]+/, '').trim();
  const d = status.includes("Livr"); const a = status.includes("Review") || status.includes("Revision");
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-[5px] rounded-full text-[11px] font-semibold leading-none" style={{
      backgroundColor: d ? "#ECFDF5" : a ? "#FFFBEB" : "#F0EEFF",
      color: d ? "#047857" : a ? "#92400E" : "#122755"
    }}>
      <span className={`w-[5px] h-[5px] rounded-full ${a && !d ? 'dot-pulse' : ''}`} style={{
        backgroundColor: d ? "#10B981" : a ? "#F59E0B" : "#122755"
      }} />
      {label}
    </span>
  );
};

const StatusIcon = ({ status }: { status: string }) => {
  if (status.includes("Livrée")) return <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500"><CheckCircle2 size={17} strokeWidth={2.2} /></div>;
  if (status.includes("Review") || status.includes("Revision")) return <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500"><AlertCircle size={17} strokeWidth={2.2} /></div>;
  return <div className="w-9 h-9 rounded-xl bg-[#F0EEFF] flex items-center justify-center text-[#6B7A99]"><Clock size={17} strokeWidth={2.2} /></div>;
};

const SectionHeader = ({ icon: Icon, label, count }: { icon: any; label: string; count: number }) => (
  <div className="flex items-center gap-2.5 mb-5">
    <div className="w-8 h-8 rounded-[10px] flex items-center justify-center bg-[#02143B] text-white">
      <Icon size={15} strokeWidth={2.2} />
    </div>
    <h2 className="text-[15px] font-semibold text-[#02143B]">{label}</h2>
    <span className="text-[13px] text-[#6B7A99]">({count})</span>
  </div>
);

// ═══════════════════════════════════════════
// VIDEO ROW
// ═══════════════════════════════════════════
const VideoRow: React.FC<{ video: Video; onOpen: (v: Video) => void; index: number }> = ({ video, onOpen, index }) => {
  const needsAction = video.status.includes("Review Client");
  const isDelivered = video.status.includes("Livr");
  const pct = Math.round(video.progress * 100);

  return (
    <div onClick={() => onOpen(video)}
      className={`group flex items-center gap-4 md:gap-5 px-5 md:px-6 py-[18px] md:py-5 border-b last:border-0 cursor-pointer transition-all duration-300 hover:bg-[#FAFAFF] enter-up stagger-${Math.min(index + 1, 6)}`}
      style={{ borderColor: 'rgba(18,39,85,0.04)' }}>
      <StatusIcon status={video.status} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <h3 className="font-semibold text-[15px] truncate text-[#02143B] group-hover:text-[#122755] transition-colors">{video.title}</h3>
          {needsAction && (
            <span className="shrink-0 px-2 py-[3px] text-[10px] font-bold rounded-md bg-amber-50 text-amber-600 border border-amber-100">
              Action requise
            </span>
          )}
        </div>
        <p className="text-[12px] text-[#6B7A99] flex items-center gap-1.5">
          {video.language && <span>{video.language}</span>}
          {video.deadline && <><span className="opacity-30">·</span><span>Deadline {new Date(video.deadline).toLocaleDateString('fr-FR')}</span></>}
        </p>
      </div>

      <div className="hidden md:flex items-center gap-4 shrink-0">
        <StatusPill status={video.status} />
      </div>

      <div className="hidden lg:flex items-center gap-3 shrink-0 w-36">
        <div className="flex-1">
          <div className="progress-track">
            <div className={`progress-fill ${!isDelivered ? 'active' : ''}`}
              style={{ width: `${pct}%`, backgroundColor: isDelivered ? '#10B981' : needsAction ? '#F59E0B' : '#122755' }} />
          </div>
        </div>
        <span className="text-[12px] font-semibold tabular-nums text-[#02143B] w-8 text-right">{pct}%</span>
      </div>

      <ChevronRight size={16} className="shrink-0 text-[#E2E0FF] group-hover:text-[#122755] group-hover:translate-x-0.5 transition-all duration-300" />
    </div>
  );
};

// ═══════════════════════════════════════════
// PROJECT CARD (with circular progress)
// ═══════════════════════════════════════════
const ProjectCard = ({ project, index }: { project: Project; index: number }) => {
  if (!project) return null;
  const pct = (project.progressionPercent && isFinite(project.progressionPercent)) ? Math.round(project.progressionPercent * 100) : 0;
  const isActive = project.status === "Actif";
  const consumed = project.totalVideos > 0 ? Math.round((project.deliveredVideos / project.totalVideos) * 100) : 0;

  return (
    <div className={`vv-card overflow-hidden enter-up stagger-${Math.min(index + 1, 6)}`}>
      <div className="flex flex-col lg:flex-row">
        <div className="flex-1 p-6 md:p-7">
          {/* Header */}
          <div className="flex items-start justify-between mb-7">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-[14px] bg-[#02143B] flex items-center justify-center text-white">
                <FileText size={18} strokeWidth={2} />
              </div>
              <div>
                <h3 className="text-[16px] font-semibold text-[#02143B]">{project.name || "Projet"}</h3>
                <p className="text-[12px] text-[#6B7A99] mt-0.5">
                  {project.startDate && new Date(project.startDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                  {project.endDate && ` → ${new Date(project.endDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                </p>
              </div>
            </div>
            <span className={`px-2.5 py-[5px] rounded-full text-[11px] font-semibold leading-none ${isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50 text-gray-500'}`}>
              {project.status}
            </span>
          </div>

          {/* Pack consumption */}
          <div>
            <div className="flex items-end justify-between mb-3">
              <span className="label">Consommation du pack</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-[28px] font-bold tabular-nums leading-none text-[#02143B]">{project.deliveredVideos}</span>
                <span className="text-[13px] font-medium text-[#6B7A99]">/ {project.totalVideos}</span>
              </div>
            </div>
            <div className="progress-track" style={{ height: 8 }}>
              <div className={`progress-fill ${isActive ? 'active' : ''}`}
                style={{ width: `${consumed}%`, background: 'linear-gradient(90deg, #122755 0%, #3E5075 100%)' }} />
            </div>
          </div>
        </div>

        {/* Side panel - info */}
        <div className="border-t lg:border-t-0 lg:border-l" style={{ borderColor: 'rgba(18,39,85,0.05)' }}>
          <div className="lg:w-56 p-6 md:p-7 flex flex-col justify-center gap-5 bg-[#FAFAFF]">
            <div>
              <p className="text-[11px] font-medium text-[#6B7A99] mb-1">Date de début</p>
              <p className="text-[14px] font-semibold text-[#02143B]">{project.startDate ? new Date(project.startDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}</p>
            </div>
            <div>
              <p className="text-[11px] font-medium text-[#6B7A99] mb-1.5">Progression</p>
              <div className="flex items-center gap-2.5">
                <div className="flex-1 progress-track" style={{ height: 5 }}>
                  <div className={`progress-fill ${isActive ? 'active' : ''}`} style={{ width: `${pct}%`, backgroundColor: '#122755' }} />
                </div>
                <span className="text-[13px] font-bold tabular-nums text-[#02143B]">{pct}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════
// CONTACT FOOTER
// ═══════════════════════════════════════════
const ContactFooter = ({ teamMembers }: { teamMembers: TeamMember[] }) => {
  const getInitials = (n: string) => n.split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase();
  if (!teamMembers?.length) return null;

  return (
    <div className="py-4">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-8 h-8 rounded-[10px] flex items-center justify-center bg-[#02143B] text-white">
          <MessageCircle size={15} strokeWidth={2.2} />
        </div>
        <h2 className="text-[15px] font-semibold text-[#02143B]">Votre équipe dédiée</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {teamMembers.map((m, i) => (
          <div key={m.id} className={`vv-card p-5 flex items-center gap-3.5 enter-up stagger-${Math.min(i + 1, 6)}`}>
            {m.photoUrl ? (
              <img src={m.photoUrl} className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-sm" alt={m.name} />
            ) : (
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#F0EEFF] text-[#122755] font-bold text-xs">{getInitials(m.name)}</div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-[#02143B] truncate">{m.name}</p>
              <p className="text-[11px] text-[#6B7A99] truncate">{m.roles.join(', ')}</p>
            </div>
            <div className="flex gap-1 shrink-0">
              {m.email && <a href={`mailto:${m.email}`} className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#F7F8FC] text-[#6B7A99] hover:bg-[#02143B] hover:text-white transition-all duration-200"><Mail size={13} /></a>}
              {m.whatsapp && <a href={`https://wa.me/${m.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#F7F8FC] text-[#6B7A99] hover:bg-[#25D366] hover:text-white transition-all duration-200"><MessageCircle size={13} /></a>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════
// VIDEO MODAL — Cinematic vertical layout
// ═══════════════════════════════════════════
const VideoModal = ({ video, isOpen, onClose, onVideoUpdated, client }: { video: Video | null; isOpen: boolean; onClose: () => void; onVideoUpdated?: () => void; client: Client }) => {
  const [comment, setComment] = useState("");
  const [feedbackType, setFeedbackType] = useState<'validation' | 'modification' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  useEffect(() => { setVideoLoaded(false); setVideoError(false); }, [video?.id]);
  if (!isOpen || !video) return null;

  const isDelivered = video.status.includes("Livrée");
  const isReview = video.status.includes("Review Client");
  const isRevision = video.status.includes("Revision Interne");
  const statusLabel = video.status.replace(/^[^a-zA-ZÀ-ÿ]+/, '').trim();

  const submitFeedback = async () => {
    if (feedbackType === 'modification' && !comment.trim()) { alert("Veuillez saisir un commentaire"); return; }
    setIsSubmitting(true);
    try {
      if (feedbackType === 'modification') await api('create', 'Feedbacks', { fields: { 'Vidéo': [video.id], 'Titre': `Feedback - ${video.title}`, 'Commentaire': comment, 'Type': '🔄 Révision demandée' } });
      await api('update', 'Vidéos', { recordId: video.id, fields: { 'Statut production': feedbackType === 'validation' ? '📦 6. Livrée' : '🔁 5. Revision Interne' } });
      setFeedbackType(null); setComment("");
      alert(feedbackType === 'validation' ? "Vidéo validée !" : "Demande envoyée !");
      onVideoUpdated?.(); onClose();
    } catch (e: any) { alert("Erreur: " + e.message); } finally { setIsSubmitting(false); }
  };

  const getEmbed = (url: string): { url: string; direct: boolean; fallbackUrl?: string } | null => {
    if (!url) return null; let m;
    if ((m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/))) return { url: `https://www.youtube.com/embed/${m[1]}`, direct: false };
    if ((m = url.match(/vimeo\.com\/(\d+)/))) return { url: `https://player.vimeo.com/video/${m[1]}`, direct: false };
    if ((m = url.match(/drive\.google\.com\/file\/d\/([^\/]+)/))) return { url: `https://drive.google.com/uc?export=view&id=${m[1]}`, direct: true, fallbackUrl: `https://drive.google.com/file/d/${m[1]}/preview` };
    if ((m = url.match(/drive\.google\.com\/open\?id=([^&]+)/))) return { url: `https://drive.google.com/uc?export=view&id=${m[1]}`, direct: true, fallbackUrl: `https://drive.google.com/file/d/${m[1]}/preview` };
    if (url.match(/\.(mp4|webm|ogg)$/i)) return { url, direct: true };
    return null;
  };
  const embed = video.videoUrl ? getEmbed(video.videoUrl) : null;
  const useDirect = embed?.direct && !videoError;
  const embedUrl = useDirect ? embed?.url : (embed?.fallbackUrl || embed?.url) || null;
  const isDirect = useDirect ?? false;

  const steps = [
    { label: 'Brief', key: 'Brief reçu' }, { label: 'Pré-prod', key: 'Pré-production' },
    { label: 'Tournage', key: 'Tournage planifié' }, { label: 'Post-prod', key: 'Post-production' },
    { label: 'Review', key: 'Review Client' }, { label: 'Révision', key: 'Revision Interne' },
    { label: 'Livré', key: 'Livrée' }
  ];
  const cur = steps.findIndex(s => video.status.includes(s.key));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4 enter-fade">
      <div className="absolute inset-0 bg-[#040A16]/70 backdrop-blur-md" onClick={onClose} />

      {/* Close button floating */}
      <button onClick={onClose} className="absolute top-4 right-4 md:top-6 md:right-6 z-[60] w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-all backdrop-blur-sm">
        <X size={18} />
      </button>

      {/* Modal — horizontal layout on desktop */}
      <div className="relative w-full max-w-[900px] max-h-[90vh] flex flex-col md:flex-row overflow-hidden rounded-2xl md:rounded-3xl enter-scale" style={{ boxShadow: '0 32px 64px rgba(0,0,0,0.4)' }}>

        {/* LEFT — Video preview */}
        {embedUrl && (
          <div className="relative bg-[#0a0a0a] w-full h-[50vh] md:h-auto md:w-[380px] shrink-0 flex items-center justify-center overflow-hidden">
            {!videoLoaded && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10">
                <svg className="w-8 h-8" viewBox="0 0 40 40" style={{ animation: 'spinRotate 1.1s linear infinite' }}>
                  <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2.5" />
                  <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5" strokeDasharray="60 100" strokeLinecap="round" />
                </svg>
                <style>{`@keyframes spinRotate { to { transform: rotate(360deg); } }`}</style>
              </div>
            )}
            {isDirect ? (
              <video controls preload="auto" className={`w-full h-full object-contain transition-opacity duration-500 ${videoLoaded ? 'opacity-100' : 'opacity-0'}`} src={embedUrl}
                onLoadedData={() => setVideoLoaded(true)} onError={() => { setVideoError(true); setVideoLoaded(false); }} />
            ) : (
              <iframe src={embedUrl} className={`w-full h-full transition-opacity duration-500 ${videoLoaded ? 'opacity-100' : 'opacity-0'}`}
                frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen loading="eager" onLoad={() => setVideoLoaded(true)} />
            )}
            {/* Title overlay at top */}
            <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 via-black/30 to-transparent pointer-events-none z-20">
              <h2 className="text-white font-bold text-[15px] leading-snug">{video.title}</h2>
              <p className="text-white/50 text-[11px] mt-0.5">{video.language}{video.deadline && ` · Deadline ${new Date(video.deadline).toLocaleDateString('fr-FR')}`}</p>
            </div>
          </div>
        )}

        {/* RIGHT — Info panel */}
        <div className="flex-1 bg-white flex flex-col max-h-[90vh] md:max-h-none overflow-hidden">
          {/* Header info */}
          <div className="p-5 md:p-6 shrink-0" style={{ borderBottom: '1px solid rgba(18,39,85,0.06)' }}>
            {!embedUrl && (
              <>
                <h2 className="text-lg font-bold text-[#02143B] mb-1">{video.title}</h2>
                <p className="text-[12px] text-[#6B7A99] mb-4">{video.language}{video.deadline && ` · Deadline ${new Date(video.deadline).toLocaleDateString('fr-FR')}`}</p>
              </>
            )}

            {/* Status + stepper */}
            <div className="flex items-center justify-between mb-4">
              <StatusPill status={video.status} />
              <span className="text-[11px] text-[#6B7A99]">Étape {cur + 1}/{steps.length}</span>
            </div>

            <div className="flex items-center">
              {steps.map((s, i) => {
                const done = i < cur; const active = i === cur;
                return (
                  <React.Fragment key={s.key}>
                    <div className="flex flex-col items-center" style={{ flex: '0 0 auto' }}>
                      <div className={`w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center text-[8px] md:text-[9px] font-bold ${
                        done ? 'bg-[#02143B] text-white' : active ? 'bg-[#02143B] text-white ring-2 ring-[#02143B]/10' : 'bg-[#F0F0F5] text-[#C0C0D0]'
                      }`}>{done ? '✓' : i + 1}</div>
                      <span className={`text-[7px] md:text-[8px] mt-1 font-medium whitespace-nowrap ${done || active ? 'text-[#02143B]' : 'text-[#C0C0D0]'}`}>{s.label}</span>
                    </div>
                    {i < steps.length - 1 && <div className="flex-1 h-[2px] mx-0.5 -mt-3 rounded-full" style={{ backgroundColor: i < cur ? '#02143B' : '#F0F0F5' }} />}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-4">
            {/* Details grid */}
            <div>
              <p className="label mb-3">Détails</p>
              <div className="grid grid-cols-2 gap-2.5">
                {video.language && <DetailItem label="Langue" value={video.language} />}
                {video.deadline && <DetailItem label="Deadline" value={new Date(video.deadline).toLocaleDateString('fr-FR')} />}
                {video.shootingDateTime && <DetailItem label="Tournage" value={new Date(video.shootingDateTime).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })} />}
                {video.shootingLocation && <DetailItem label="Lieu" value={video.shootingLocation} />}
                <DetailItem label="Avancement" value={`${Math.round(video.progress * 100)}%`} />
                <DetailItem label="Statut" value={statusLabel} />
              </div>
            </div>

            {/* Drive link */}
            {video.driveUrl && (
              <a href={video.driveUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-xl border hover:border-[#02143B]/10 hover:bg-[#FAFAFF] transition-all group"
                style={{ borderColor: 'rgba(18,39,85,0.06)' }}>
                <div className="w-8 h-8 rounded-lg bg-[#F0EEFF] text-[#122755] flex items-center justify-center"><FolderOpen size={14} /></div>
                <span className="text-[12px] font-semibold text-[#02143B] flex-1">Dossier vidéo</span>
                <ExternalLink size={12} className="text-[#6B7A99] opacity-0 group-hover:opacity-60 transition-opacity" />
              </a>
            )}

            {/* Status message — concise */}
            {video.status.includes("Brief") && <StatusNote text="Brief en cours de traitement." />}
            {video.status.includes("Pré-production") && <StatusNote text="Pré-production en cours." />}
            {video.status.includes("Tournage") && <StatusNote text="Tournage planifié." />}
            {video.status.includes("Post-production") && <StatusNote text="Montage en cours." />}
            {isRevision && <StatusNote text="Révision interne en cours." />}
            {isReview && !feedbackType && <StatusNote text="En attente de votre validation." accent />}

            {/* Feedback form */}
            {isReview && feedbackType && (
              <div className="space-y-3">
                <p className="text-[12px] font-semibold text-[#02143B]">Modifications souhaitées</p>
                <textarea className="w-full h-24 p-3 rounded-xl border text-[12px] outline-none resize-none transition-all focus:ring-2 focus:ring-[#122755]/10"
                  style={{ borderColor: 'rgba(18,39,85,0.08)', color: '#02143B' }}
                  placeholder="Ex: 00:12 - Modifier le titre..." value={comment} onChange={e => setComment(e.target.value)} autoFocus />
                <div className="flex gap-2">
                  <button onClick={() => { setFeedbackType(null); setComment(""); }}
                    className="px-3 py-2 rounded-lg text-[12px] font-medium border text-[#6B7A99] hover:bg-[#F7F8FC] transition-all" style={{ borderColor: 'rgba(18,39,85,0.08)' }}>Annuler</button>
                  <button onClick={submitFeedback} disabled={isSubmitting || !comment.trim()}
                    className="flex-1 py-2 rounded-lg text-[12px] font-semibold text-white bg-[#02143B] hover:bg-[#122755] transition-all disabled:opacity-30 flex items-center justify-center gap-1.5">
                    {isSubmitting ? <><Loader2 className="animate-spin" size={13} /> Envoi...</> : 'Envoyer'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          {isReview && !feedbackType && (
            <div className="p-4 md:p-5 border-t flex gap-2 shrink-0" style={{ borderColor: 'rgba(18,39,85,0.06)' }}>
              <button onClick={() => setFeedbackType('modification')}
                className="flex-1 py-2.5 rounded-xl text-[12px] font-medium flex items-center justify-center gap-1.5 border text-[#6B7A99] hover:bg-[#F7F8FC] transition-all"
                style={{ borderColor: 'rgba(18,39,85,0.08)' }}>
                <AlertCircle size={14} /> Modifier
              </button>
              <button onClick={async () => { setIsSubmitting(true); try { await api('update', 'Vidéos', { recordId: video.id, fields: { 'Statut production': '📦 6. Livrée' } }); alert("Vidéo validée !"); onVideoUpdated?.(); onClose(); } catch (e: any) { alert("Erreur: " + e.message); } finally { setIsSubmitting(false); } }}
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl text-[12px] font-semibold text-white flex items-center justify-center gap-1.5 transition-all disabled:opacity-30 hover:shadow-md"
                style={{ backgroundColor: '#10B981' }}>
                {isSubmitting ? <Loader2 className="animate-spin" size={13} /> : <><CheckCircle2 size={14} /> Valider</>}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const DetailItem = ({ label, value }: { label: string; value: string }) => (
  <div className="p-3 rounded-xl bg-[#FAFAFF]">
    <p className="text-[10px] font-medium text-[#6B7A99] uppercase tracking-wider mb-0.5">{label}</p>
    <p className="text-[13px] font-semibold text-[#02143B]">{value}</p>
  </div>
);

const StatusNote = ({ text, accent }: { text: string; accent?: boolean }) => (
  <div className={`px-3.5 py-2.5 rounded-xl text-[12px] font-medium ${accent ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-[#FAFAFF] text-[#6B7A99]'}`}>
    {text}
  </div>
);

// ═══════════════════════════════════════════
// APP
// ═══════════════════════════════════════════
const App = () => {
  const [view, setView] = useState<'login' | 'dashboard'>('login');
  const [loading, setLoading] = useState(false);
  const [client, setClient] = useState<Client | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [clientRecordId, setClientRecordId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [historyLimit, setHistoryLimit] = useState(5);
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('client') || new URLSearchParams(window.location.search).get('ref');
    if (id?.startsWith('rec')) { setClientRecordId(id); load(id); }
  }, []);

  useEffect(() => {
    if (!clientRecordId || view !== 'dashboard') return;
    const t = setInterval(() => refresh(true), 60000);
    return () => clearInterval(t);
  }, [clientRecordId, view]);

  const refresh = async (silent = false) => {
    if (!clientRecordId || isRefreshing) return;
    if (!silent) setIsRefreshing(true);
    try { await load(clientRecordId); } catch {} finally { if (!silent) setIsRefreshing(false); }
  };

  const load = async (rid: string) => {
    try {
      setLoading(true);
      const minDelay = new Promise(resolve => setTimeout(resolve, 3500));
      const cr = await api('fetch', TABLES.clients, { filterFormula: `RECORD_ID()='${rid}'` });
      if (!cr.records.length) throw new Error("Client introuvable.");
      const r = cr.records[0];
      const c: Client = { id: r.id, companyName: r.fields['Nom du client'] || "Société", logoUrl: r.fields['Logo']?.[0]?.url || "", status: r.fields['Statut'] || "Actif", type: r.fields['Type de client'] || "", driveUrl: r.fields['Lien Drive'] || "" };
      setClient(c);
      const safe = c.companyName.replace(/'/g, "\\'");

      const [pRes, vRes] = await Promise.all([
        api('fetch', TABLES.projets, { filterFormula: `FIND('${safe}', ARRAYJOIN({Clients})) > 0` }),
        api('fetch', TABLES.videos, { filterFormula: `FIND('${safe}', ARRAYJOIN({Client})) > 0` })
      ]);
      setProjects(pRes.records.map((rec: any) => ({ id: rec.id, name: rec.fields['Nom du projet'] || "", totalVideos: rec.fields['Vidéos prévues'] || 0, deliveredVideos: rec.fields['Vidéos livrées'] || 0, startDate: rec.fields['Date de début'] || "", endDate: rec.fields['Date de fin'] || "", status: rec.fields['Statut projet'] || "Actif", progressionPercent: rec.fields['Progression %'] || 0 })));
      setVideos(vRes.records.map((rec: any) => ({ id: rec.id, title: rec.fields['Titre vidéo'] || "Sans titre", language: rec.fields['Langue'] || "", status: rec.fields['Statut production'] || "📄 0. Brief reçu", videoUrl: rec.fields['Lien vidéo'] || "", driveUrl: rec.fields['Lien dossier vidéo'] || "", shootingDateTime: rec.fields['Date/heure de tournage'] || "", shootingLocation: rec.fields['Lieu de tournage'] || "", priority: rec.fields['Priorité'] || "", progress: rec.fields['% Avancement'] || 0, deadline: rec.fields['Deadline V1'] || "", deliveryDate: rec.fields['Date livraison réelle'] || "", projectIds: rec.fields['Projets'] || [] })));

      const teamIds: string[] = r.fields['Équipe assignée'] || [];
      if (teamIds.length) {
        const tf = teamIds.length === 1 ? `RECORD_ID()='${teamIds[0]}'` : `OR(${teamIds.map(id => `RECORD_ID()='${id}'`).join(',')})`;
        const tRes = await api('fetch', TABLES.equipe, { filterFormula: tf });
        setTeamMembers(tRes.records.map((rec: any) => ({ id: rec.id, name: rec.fields['Nom complet'] || "Membre", roles: rec.fields['Rôles'] || [], email: rec.fields['E-mail'] || "", whatsapp: rec.fields['WhatsApp'] || "", photoUrl: rec.fields['Photo']?.[0]?.url || "" })));
      } else setTeamMembers([]);
      await minDelay;
      setView('dashboard');
    } catch (err: any) { console.error(err); await minDelay; setView('login'); }
    finally { setLoading(false); }
  };

  // ── Login ──
  if (view === 'login' && !loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#F7F8FC]">
      <div className="text-center max-w-sm enter-up">
        <img src="/images/logo-blue-red.svg" alt="Vertical View" className="h-7 w-auto mx-auto mb-16 opacity-50" />
        <div className="w-12 h-12 rounded-2xl bg-[#FEF2F2] flex items-center justify-center mx-auto mb-5"><AlertTriangle size={22} className="text-[#E53B46]" /></div>
        <h1 className="text-xl font-bold text-[#02143B] mb-2">Accès non autorisé</h1>
        <p className="text-[14px] text-[#6B7A99] leading-relaxed">Ce portail est accessible uniquement via un lien personnalisé fourni par Vertical View.</p>
      </div>
    </div>
  );

  if (!client) return (
    <div className="flex h-screen items-center justify-center bg-[#02143B]">
      <div className="flex flex-col items-center gap-8">
        <img src="/images/logo-white-red.svg" alt="Vertical View" className="h-8 w-auto loading-logo" />
        <div className="relative w-10 h-10">
          <svg className="w-10 h-10 loading-spinner" viewBox="0 0 40 40">
            <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2.5" />
            <circle cx="20" cy="20" r="16" fill="none" stroke="url(#spinGrad)" strokeWidth="2.5"
              strokeDasharray="80 100" strokeLinecap="round" />
            <defs>
              <linearGradient id="spinGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#E53B46" />
                <stop offset="100%" stopColor="#E53B46" stopOpacity="0.1" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
      <style>{`
        .loading-logo { animation: logoFade 2s ease infinite alternate; }
        @keyframes logoFade { 0% { opacity:0.5; } 100% { opacity:0.9; } }
        .loading-spinner { animation: spinRotate 1.1s linear infinite; }
        @keyframes spinRotate { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );

  const priority = (s: string) => { if (s.includes("Review Client")) return 0; if (s.includes("Brief")) return 1; if (s.includes("Pré-production")) return 2; if (s.includes("Tournage")) return 3; if (s.includes("Post-production")) return 4; if (s.includes("Revision")) return 5; if (s.includes("Livrée")) return 6; return 10; };
  const titleNum = (t: string) => { const m = t.match(/^(\d+)/); return m ? parseInt(m[1], 10) : null; };
  const ongoing = videos.filter(v => !v.status.includes("Livrée")).sort((a, b) => {
    const na = titleNum(a.title), nb = titleNum(b.title);
    if (na !== null && nb !== null) return nb - na;
    if (na !== null) return -1;
    if (nb !== null) return 1;
    return b.progress - a.progress;
  });
  const delivered = videos.filter(v => v.status.includes("Livrée")).sort((a, b) => {
    const na = titleNum(a.title), nb = titleNum(b.title);
    if (na !== null && nb !== null) return nb - na;
    if (na !== null) return -1;
    if (nb !== null) return 1;
    return (b.deadline ? new Date(b.deadline).getTime() : 0) - (a.deadline ? new Date(a.deadline).getTime() : 0);
  });

  // Group ongoing videos by project
  const ongoingByProject = (() => {
    const groups: { project: Project | null; videos: Video[] }[] = [];
    const projectMap = new Map(projects.map(p => [p.id, p]));
    const grouped = new Map<string, Video[]>();
    const ungrouped: Video[] = [];

    for (const v of ongoing) {
      const pid = v.projectIds?.[0];
      if (pid && projectMap.has(pid)) {
        if (!grouped.has(pid)) grouped.set(pid, []);
        grouped.get(pid)!.push(v);
      } else {
        ungrouped.push(v);
      }
    }

    // Active projects first, then by start date
    const sortedProjectIds = [...grouped.keys()].sort((a, b) => {
      const pa = projectMap.get(a)!; const pb = projectMap.get(b)!;
      const activeA = pa.status === 'Actif' ? 0 : 1; const activeB = pb.status === 'Actif' ? 0 : 1;
      if (activeA !== activeB) return activeA - activeB;
      return (pb.startDate || '').localeCompare(pa.startDate || '');
    });

    for (const pid of sortedProjectIds) {
      groups.push({ project: projectMap.get(pid)!, videos: grouped.get(pid)! });
    }
    if (ungrouped.length) groups.push({ project: null, videos: ungrouped });
    return groups;
  })();

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F8FC]">

      {/* ═══ HEADER ═══ */}
      <header className="bg-[#02143B] relative overflow-hidden">
        {/* Subtle decorative shapes */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -right-32 -top-20 w-[500px] h-[800px] rounded-[60px] border border-white/[0.03] rotate-[-10deg]" />
          <div className="absolute -right-16 top-0 w-[500px] h-[800px] rounded-[60px] border border-white/[0.02] rotate-[-6deg]" />
          <div className="absolute left-1/2 top-0 w-[600px] h-[600px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(226,224,255,0.03) 0%, transparent 70%)', transform: 'translate(-50%, -60%)' }} />
        </div>

        {/* Nav */}
        <div className="relative z-10 flex items-center justify-between px-5 md:px-8 pt-5 pb-0">
          <img src="/images/logo-white-red.svg" alt="Vertical View" className="h-[22px] md:h-6 w-auto enter-fade" />
          <button onClick={() => refresh(false)} disabled={isRefreshing}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/[0.06] transition-all disabled:opacity-20 text-white/30 hover:text-white/60">
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Hero */}
        <div className="relative z-10 flex flex-col items-center text-center pt-10 md:pt-14 pb-10 md:pb-14 px-6">
          {/* Logos side by side */}
          <div className="flex items-center gap-3 mb-5 enter-up">
            {client.logoUrl && (
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-white flex items-center justify-center shadow-lg overflow-hidden">
                <img src={client.logoUrl} alt="" className="w-7 h-7 md:w-9 md:h-9 object-contain" />
              </div>
            )}
            <span className="text-white/15 text-lg font-light">×</span>
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-white/[0.08] backdrop-blur-sm flex items-center justify-center border border-white/[0.06]">
              <img src="/images/icon-white-red.svg" alt="VV" className="w-7 h-7 md:w-8 md:h-8 object-contain" />
            </div>
          </div>

          <h1 className="text-2xl md:text-[32px] lg:text-4xl font-bold text-white tracking-tight leading-tight enter-up stagger-1">
            Bienvenue, {client.companyName}
          </h1>
          <p className="text-[13px] md:text-sm text-white/30 mt-1.5 font-medium tracking-wide enter-up stagger-2">Portail client</p>
        </div>
      </header>

      {/* ═══ CONTENT ═══ */}
      <main className="flex-1 px-4 lg:px-8 pb-16 w-full max-w-[960px] mx-auto pt-8 md:pt-10 space-y-10">

        {/* Videos en cours — groupées par projet */}
        <section className="enter-up stagger-2">
          <SectionHeader icon={ListVideo} label="Vidéos en cours" count={ongoing.length} />

          {ongoing.length > 0 ? (
            <div className="space-y-4">
              {ongoingByProject.map((group, gi) => (
                <div key={group.project?.id || 'ungrouped'} className={`vv-card overflow-hidden enter-up stagger-${Math.min(gi + 1, 6)}`}>
                  {/* Project header */}
                  <div className="px-5 md:px-6 py-3.5 flex items-center gap-3 border-b" style={{ borderColor: 'rgba(18,39,85,0.04)', backgroundColor: '#FAFAFF' }}>
                    <div className="w-7 h-7 rounded-lg bg-[#02143B] flex items-center justify-center text-white shrink-0">
                      <FileText size={13} strokeWidth={2.2} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[13px] font-semibold text-[#02143B] truncate">{group.project?.name || 'Autres vidéos'}</h3>
                      {group.project && (
                        <p className="text-[11px] text-[#6B7A99]">{group.videos.length} vidéo{group.videos.length > 1 ? 's' : ''} en cours</p>
                      )}
                    </div>
                    {group.project && (
                      <span className={`px-2 py-[3px] rounded-full text-[10px] font-semibold shrink-0 ${group.project.status === 'Actif' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50 text-gray-500'}`}>
                        {group.project.status}
                      </span>
                    )}
                  </div>
                  {/* Videos */}
                  {group.videos.map((v, i) => <VideoRow key={v.id} video={v} onOpen={setSelectedVideo} index={i} />)}
                </div>
              ))}
            </div>
          ) : (
            <div className="vv-card py-14 text-center">
              <div className="w-10 h-10 rounded-xl bg-[#F0EEFF] flex items-center justify-center mx-auto mb-3 text-[#6B7A99]"><VideoIcon size={18} /></div>
              <p className="text-[13px] text-[#6B7A99]">Aucune vidéo en cours</p>
            </div>
          )}

          {delivered.length > 0 && (
            <div className="mt-5">
              <button onClick={() => setHistoryOpen(!historyOpen)} className="w-full flex items-center justify-between mb-3 group">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-[10px] flex items-center justify-center bg-emerald-50 text-emerald-500"><CheckCircle2 size={15} strokeWidth={2.2} /></div>
                  <h2 className="text-[15px] font-semibold text-[#02143B]">Historique</h2>
                  <span className="text-[13px] text-[#6B7A99]">({delivered.length})</span>
                </div>
                <ChevronDown size={15} className={`text-[#6B7A99] transition-transform duration-300 ${historyOpen ? 'rotate-180' : ''}`} />
              </button>
              {historyOpen && (
                <>
                  <div className="vv-card overflow-hidden">
                    {delivered.slice(0, historyLimit).map((v, i) => <VideoRow key={v.id} video={v} onOpen={setSelectedVideo} index={i} />)}
                  </div>
                  {delivered.length > historyLimit && (
                    <button onClick={() => setHistoryLimit(p => p + 5)}
                      className="w-full mt-2.5 py-2.5 rounded-xl text-[12px] font-medium text-[#6B7A99] border hover:bg-white hover:border-[#02143B]/8 transition-all" style={{ borderColor: 'rgba(18,39,85,0.06)' }}>
                      Voir plus ({delivered.length - historyLimit})
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </section>

        {/* Projets */}
        <section className="space-y-4 enter-up stagger-3">
          <SectionHeader icon={FileText} label="Projets" count={projects.length} />
          {projects.length > 0 ? (
            [...projects].sort((a, b) => { const d = (a.status === 'Actif' ? 0 : 1) - (b.status === 'Actif' ? 0 : 1); return d || (b.startDate || '').localeCompare(a.startDate || ''); })
              .map((p, i) => <ProjectCard key={p.id} project={p} index={i} />)
          ) : (
            <div className="vv-card py-14 text-center"><p className="text-[13px] text-[#6B7A99]">Aucun projet actif</p></div>
          )}
        </section>

        {/* Team */}
        <ContactFooter teamMembers={teamMembers} />

        {/* Footer */}
        <div className="flex flex-col items-center pt-6 pb-2">
          <img src="/images/logo-blue-red.svg" alt="Vertical View" className="h-4 w-auto opacity-10 mb-1" />
          <p className="text-[9px] tracking-[0.15em] uppercase text-[#6B7A99]/30">Portail Client</p>
        </div>
      </main>

      <VideoModal video={selectedVideo} isOpen={!!selectedVideo} onClose={() => setSelectedVideo(null)} onVideoUpdated={() => refresh(false)} client={client} />
    </div>
  );
};

createRoot(document.getElementById("root")!).render(<App />);
