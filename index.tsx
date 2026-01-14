import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { 
  Play, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  FileText, 
  Phone, 
  Mail, 
  ChevronRight,
  ChevronDown,
  ListVideo,
  X,
  ArrowUpRight,
  CreditCard,
  FileVideo,
  Download,
  FolderOpen,
  Loader2,
  LogIn,
  AlertTriangle,
  MessageCircle,
  RefreshCw
} from "lucide-react";

// --- CONFIGURATION AIRTABLE ---
const AIRTABLE_CONFIG = {
  apiKey: import.meta.env.VITE_AIRTABLE_API_KEY || "YOUR_API_KEY_HERE",
  baseId: import.meta.env.VITE_AIRTABLE_BASE_ID || "appT3ZJJUIAPnuHR9",
  tables: {
    clients: "tblvndxiZaqAVGP5O",
    contrats: "Contrats",
    videos: "Vidéos",
    equipe: "Équipe"
  }
};

// --- BRANDING CONFIG ---
const BRAND = {
  primaryCoral: "#E53B46", 
  darkBlue: "#02143B",    
  blue: "#122755",        
  lightBlue: "#3E5075",   
  bgLight: "#F4F7FC",     
  white: "#FFFFFF",
  coloredWhite: "#E2E0FF", 
  success: "#10B981",
  warning: "#F59E0B"
};

// --- TYPES ---

type Status = "📝 1. À brief" | "📋 2. Pré-prod" | "✂️ 3. Post-production" | "📨 4. Review Client" | "✏️4. Review Client" | "🔁 5. Revision Interne" | "☑️ 6. Validé par le client" | "📦 7. Livrée" | "🗄️ 8. Archivée";

interface Client {
  id: string;
  companyName: string;
  logoUrl: string;
  email: string;
  status: string;
  type: string;
  driveTournage?: string;
}

interface Contract {
  id: string;
  name: string;
  type: string;
  totalVideos: number;
  deliveredVideos: number;
  startDate: string;
  endDate: string;
  status: string;
  progressionPercent: number;
  contractFileUrl?: string;
  contractFileName?: string;
}

interface Video {
  id: string;
  title: string;
  format: string;
  language: string;
  status: Status;
  videoUrl: string;
  driveUrl: string;
  driveSessionUrl?: string;
  priority: string;
  progress: number;
  deadline: string;
  deliveryDate?: string;
  invoiceNumber: string;
  rushUrl?: string;
}

interface TeamMember {
  id: string;
  name: string;
  roles: string[];
  email: string;
  whatsapp: string;
  photoUrl: string;
}

// --- API HELPERS ---

const fetchAirtable = async (tableName: string, filterFormula: string = "") => {
  const url = `https://api.airtable.com/v0/${AIRTABLE_CONFIG.baseId}/${encodeURIComponent(tableName)}?filterByFormula=${encodeURIComponent(filterFormula)}`;
  
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${AIRTABLE_CONFIG.apiKey}`
    }
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || "Erreur de connexion Airtable");
  }

  return response.json();
};

const createAirtableRecord = async (tableName: string, fields: Record<string, any>) => {
  const url = `https://api.airtable.com/v0/${AIRTABLE_CONFIG.baseId}/${encodeURIComponent(tableName)}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${AIRTABLE_CONFIG.apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ fields })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || "Erreur lors de la création");
  }

  return response.json();
};

const updateAirtableRecord = async (tableName: string, recordId: string, fields: Record<string, any>) => {
  const url = `https://api.airtable.com/v0/${AIRTABLE_CONFIG.baseId}/${encodeURIComponent(tableName)}/${recordId}`;
  
  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${AIRTABLE_CONFIG.apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ fields })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || "Erreur lors de la mise à jour");
  }

  return response.json();
};

// --- COMPONENTS ---

const StatusIcon = ({ status }: { status: Status }) => {
  if (status.includes("Validé") || status === "📦 7. Livrée") {
    return <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600"><CheckCircle2 size={16} /></div>;
  }
  if (status === "📨 4. Review Client" || status === "🔁 5. Revision Interne") {
    return <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600"><AlertCircle size={16} /></div>;
  }
  if (status === "🗄️ 8. Archivée") {
    return <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600"><CheckCircle2 size={16} /></div>;
  }
  return <div className="w-8 h-8 rounded-full flex items-center justify-center bg-[#EBF1FF]" style={{ color: BRAND.blue }}><Clock size={16} /></div>;
};

const VideoRow: React.FC<{ video: Video; onOpen: (v: Video) => void }> = ({ video, onOpen }) => {
  const getStatusLabel = (status: string) => {
    // Supprime tout ce qui est avant la première lettre (emojis, numéros, points, espaces)
    return status.replace(/^[^a-zA-ZÀ-ÿ]+/, '').trim();
  };

  // Seulement Review Client nécessite une action du client
  const needsClientAction = video.status.includes("Review Client");
  const isValidatedOrDelivered = video.status.includes("Valid") || video.status.includes("Livr");
  const isInProgress = !needsClientAction && !isValidatedOrDelivered;
  
  return (
    <div 
      onClick={() => onOpen(video)}
      className="group flex items-center gap-6 p-5 bg-white border-b hover:bg-[#F8FBFF] transition-colors cursor-pointer last:border-0"
      style={{ borderColor: BRAND.coloredWhite }}
    >
      <div className="shrink-0">
        <StatusIcon status={video.status} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-semibold text-lg truncate group-hover:text-[#E53B46] transition-colors" style={{ color: BRAND.darkBlue }}>
            {video.title}
          </h3>
          {needsClientAction && (
            <span className="px-2 py-0.5 text-xs font-bold rounded bg-amber-100 text-amber-700 animate-pulse">
              ACTION REQUISE
            </span>
          )}
        </div>
        <p className="text-sm" style={{ color: BRAND.lightBlue }}>
          {video.format} {video.language && `• ${video.language}`}
          {video.deadline && <span className="mx-2 opacity-30">|</span>}
          {video.deadline && <span className="font-medium opacity-70">Deadline: {new Date(video.deadline).toLocaleDateString('fr-FR')}</span>}
        </p>
      </div>

      <div className="hidden md:block shrink-0">
        <span className="px-3 py-1 text-xs font-medium rounded-full" style={{ 
          backgroundColor: isValidatedOrDelivered ? "#D1FAE5" : needsClientAction ? "#FEF3C7" : "#EBF1FF",
          color: isValidatedOrDelivered ? "#065F46" : needsClientAction ? "#92400E" : BRAND.blue
        }}>
          {getStatusLabel(video.status)}
        </span>
      </div>

      <div className="hidden lg:block w-32 shrink-0">
         <div className="flex justify-between text-xs font-medium mb-1" style={{ color: BRAND.blue }}>
            <span className="opacity-70">Avancement</span>
            <span style={{ color: BRAND.darkBlue }}>{Math.round(video.progress * 100)}%</span>
         </div>
         <div className="h-2 w-full rounded-full overflow-hidden" style={{ backgroundColor: "#F0F4FF" }}>
            <div 
            className="h-full transition-all duration-500 ease-out rounded-full"
            style={{ 
                width: `${video.progress * 100}%`,
                backgroundColor: isValidatedOrDelivered ? BRAND.success : needsClientAction ? BRAND.warning : BRAND.blue
            }}
            />
        </div>
      </div>

      <div className="shrink-0 transition-colors opacity-30 group-hover:opacity-100" style={{ color: BRAND.primaryCoral }}>
        <ChevronRight size={28} />
      </div>
    </div>
  );
};

const UnifiedContractSection = ({ contract }: { contract: Contract }) => {
  if (!contract) return null;

  const percent = contract.progressionPercent ? Math.round(contract.progressionPercent * 100) : 0;
  const isContractActive = contract.status === "En cours";
  
  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden mb-12" style={{ borderColor: BRAND.coloredWhite }}>
        <div className="flex flex-col lg:flex-row">
            
            <div className="flex-1 p-8">
                 <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#F4F6FA]" style={{ color: BRAND.blue }}>
                            <FileText size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold" style={{ color: BRAND.darkBlue }}>{contract.name || contract.type || "Contrat"}</h3>
                            <p className="text-sm" style={{ color: BRAND.lightBlue }}>
                            {contract.type} • Fin : {contract.endDate ? new Date(contract.endDate).toLocaleDateString('fr-FR') : 'N/A'}
                            </p>
                        </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${isContractActive ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {contract.status}
                    </span>
                </div>

                <div className="space-y-3">
                    <div className="flex justify-between text-sm font-medium">
                        <span className="opacity-70" style={{ color: BRAND.blue }}>Consommation du pack</span>
                        <span style={{ color: BRAND.blue }}>{contract.deliveredVideos} / {contract.totalVideos} vidéos</span>
                    </div>
                    <div className="h-3 w-full rounded-full overflow-hidden" style={{ backgroundColor: "#F0F4FF" }}>
                        <div 
                            className="h-full rounded-full transition-all duration-1000"
                            style={{ width: `${percent}%`, backgroundColor: BRAND.blue }}
                        />
                    </div>
                </div>
            </div>

            <div className="w-full h-px lg:w-px lg:h-auto" style={{ backgroundColor: BRAND.coloredWhite }}></div>

            <div className="lg:w-80 p-8 flex flex-col justify-center bg-[#FAFCFF]">
                 <h3 className="text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2 opacity-60" style={{ color: BRAND.blue }}>
                    <FileText size={14} /> Informations
                </h3>
                <div className="space-y-2 text-sm mb-4" style={{ color: BRAND.blue }}>
                    <div className="flex justify-between">
                        <span className="opacity-70">Type:</span>
                        <span className="font-semibold">{contract.type}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="opacity-70">Début:</span>
                        <span className="font-semibold">{contract.startDate ? new Date(contract.startDate).toLocaleDateString('fr-FR') : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="opacity-70">Progression:</span>
                        <span className="font-semibold">{percent}%</span>
                    </div>
                </div>

                {contract.contractFileUrl && (
                    <a 
                        href={contract.contractFileUrl}
                        download={contract.contractFileName}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2.5 px-4 bg-white border rounded-lg text-sm font-bold hover:bg-[#F8FBFF] hover:border-[#122755] transition-all flex items-center justify-center gap-2 shadow-sm"
                        style={{ color: BRAND.blue, borderColor: BRAND.coloredWhite }}
                    >
                        <Download size={16} />
                        Télécharger le contrat
                    </a>
                )}
            </div>
        </div>
    </div>
  );
};

const ContactFooter = ({ client, teamMembers }: { client: Client, teamMembers: TeamMember[] }) => {
    
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .filter(Boolean)
            .map(n => n[0])
            .slice(0, 2)
            .join('')
            .toUpperCase();
    };

    // Display team members with "Communication Clients" role
    if (teamMembers && teamMembers.length > 0) {
        return (
            <div className="flex flex-col items-center justify-center py-6 mt-10">
                <h4 className="text-xs font-bold uppercase tracking-wider mb-6 opacity-50" style={{ color: BRAND.blue }}>Votre équipe Vertical View</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl">
                    {teamMembers.map(member => (
                        <div key={member.id} className="bg-white border rounded-2xl p-6 flex flex-row gap-5 items-center justify-between hover:shadow-md transition-all" style={{ borderColor: BRAND.coloredWhite }}>
                            <div className="flex items-center gap-4">
                                <div className="relative shrink-0">
                                    {member.photoUrl ? (
                                        <img src={member.photoUrl} className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm" />
                                    ) : (
                                        <div className="w-14 h-14 rounded-full flex items-center justify-center bg-[#F0F4FF] text-[#122755] font-bold text-lg border-2 border-white shadow-sm">
                                            {getInitials(member.name)}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <p className="text-base font-bold" style={{ color: BRAND.darkBlue }}>{member.name}</p>
                                    <p className="text-sm opacity-70" style={{ color: BRAND.blue }}>
                                        {member.roles.join(', ')}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex gap-2">
                                {member.email && (
                                    <a href={`mailto:${member.email}`} className="flex items-center justify-center w-9 h-9 rounded-full bg-[#F0F4FF] hover:bg-[#E53B46] hover:text-white transition-all" style={{ color: BRAND.blue }} title="Envoyer un email">
                                        <Mail size={16} />
                                    </a>
                                )}
                                {member.whatsapp && (
                                    <a 
                                        href={`https://wa.me/${member.whatsapp.replace(/[^0-9]/g, '')}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center w-9 h-9 rounded-full bg-[#F0F4FF] hover:bg-[#25D366] hover:text-white transition-all" 
                                        style={{ color: BRAND.blue }}
                                        title="Contacter sur WhatsApp"
                                    >
                                        <MessageCircle size={16} />
                                    </a>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Fallback if no team members found
    return (
        <div className="flex flex-col items-center justify-center py-6 mt-10">
            <h4 className="text-xs font-bold uppercase tracking-wider mb-6 opacity-50" style={{ color: BRAND.blue }}>Votre équipe Vertical View</h4>
            
            <div className="bg-white border rounded-2xl p-6 flex flex-col sm:flex-row gap-8 items-center max-w-2xl w-full justify-between hover:shadow-md transition-all" style={{ borderColor: BRAND.coloredWhite }}>
                <div className="flex items-center gap-5">
                    <div className="relative">
                        <div className="w-14 h-14 rounded-full flex items-center justify-center bg-[#F0F4FF] text-[#122755] font-bold text-lg border-2 border-white shadow-sm">
                            VV
                        </div>
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>
                    </div>
                    <div>
                        <p className="text-base font-bold" style={{ color: BRAND.darkBlue }}>Équipe Vertical View</p>
                        <p className="text-sm opacity-70" style={{ color: BRAND.blue }}>Support & Production</p>
                    </div>
                </div>
                
                <div className="flex gap-3">
                    <a href="mailto:contact@verticalview.eu" className="flex items-center justify-center w-10 h-10 rounded-full bg-[#F0F4FF] hover:bg-[#E53B46] hover:text-white transition-all" style={{ color: BRAND.blue }}>
                        <Mail size={18} />
                    </a>
                </div>
            </div>
        </div>
    )
}

const VideoModal = ({ video, isOpen, onClose, onVideoUpdated, client }: { video: Video | null, isOpen: boolean, onClose: () => void, onVideoUpdated?: () => void, client: Client }) => {
  const [comment, setComment] = useState("");
  const [feedbackType, setFeedbackType] = useState<'validation' | 'modification' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  if (!isOpen || !video) return null;

  const getStatusLabel = (status: string) => {
    // Supprime tout ce qui est avant la première lettre (emojis, numéros, points, espaces)
    return status.replace(/^[^a-zA-ZÀ-ÿ]+/, '').trim();
  };

  const isValidated = video.status.includes("Validé");
  const isDelivered = video.status.includes("Livrée");
  const isInClientReview = video.status.includes("Review Client");
  const isInInternalReview = video.status.includes("Revision Interne");
  const showValidationButtons = isInClientReview;

  const handleSubmitFeedback = async () => {
    if (feedbackType === 'modification' && !comment.trim()) {
      alert("Veuillez saisir un commentaire pour la demande de modification");
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Déterminer le nouveau statut
      const newStatus = feedbackType === 'validation' 
        ? '☑️ 6. Validé par le client' 
        : '🔁 5. Revision Interne';

      // 1. Si validation, juste mettre à jour le statut (pas de feedback)
      // Si modification, créer un feedback dans Airtable
      if (feedbackType === 'modification') {
        await createAirtableRecord('Feedbacks', {
          'Vidéo': [video.id],
          'Titre': `Feedback - ${video.title}`,
          'Commentaire': comment,
          'Type': '🔄 Révision demandée'
        });
      }

      // 2. Mettre à jour le statut de la vidéo dans Airtable
      await updateAirtableRecord('Vidéos', video.id, {
        'Statut production': newStatus
      });

      setFeedbackType(null);
      setComment("");
      
      if (feedbackType === 'validation') {
        alert("Vidéo validée avec succès ! Le statut a été mis à jour.");
      } else {
        alert("Demande de révision envoyée ! L'équipe Vertical View a été notifiée.");
      }
      
      // Rafraîchir les données
      if (onVideoUpdated) {
        onVideoUpdated();
      }
      
      onClose();
    } catch (error: any) {
      console.error("Erreur:", error);
      alert("Erreur: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fonction pour détecter et convertir l'URL vidéo en embed
  const getEmbedUrl = (url: string) => {
    if (!url) return null;
    
    // YouTube
    const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    }
    
    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }
    
    // Google Drive - Convertir en format preview
    const driveMatch = url.match(/drive\.google\.com\/file\/d\/([^\/]+)/);
    if (driveMatch) {
      return `https://drive.google.com/file/d/${driveMatch[1]}/preview`;
    }
    
    // Google Drive - Format open?id=
    const driveMatch2 = url.match(/drive\.google\.com\/open\?id=([^&]+)/);
    if (driveMatch2) {
      return `https://drive.google.com/file/d/${driveMatch2[1]}/preview`;
    }
    
    // Vidéo directe (.mp4, .webm, etc.)
    if (url.match(/\.(mp4|webm|ogg)$/i)) {
      return url;
    }
    
    return null;
  };

  const embedUrl = video.videoUrl ? getEmbedUrl(video.videoUrl) : null;
  const isDirectVideo = embedUrl && embedUrl === video.videoUrl && embedUrl.match(/\.(mp4|webm|ogg)$/i);

  // Composant pour le player vidéo
  const VideoPlayer = () => {
    if (!embedUrl) return null;
    
    return (
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider opacity-60" style={{ color: BRAND.blue }}>
          Aperçu vidéo
        </h4>
        <div className="aspect-video bg-black rounded-xl overflow-hidden">
          {isDirectVideo ? (
            <video 
              controls 
              className="w-full h-full"
              src={embedUrl}
            >
              Votre navigateur ne supporte pas la lecture vidéo.
            </video>
          ) : (
            <iframe
              src={embedUrl}
              className="w-full h-full"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          )}
        </div>
      </div>
    );
  };

  // Composant pour les liens
  const VideoLinks = () => (
    <div className="space-y-3">
      <h4 className="text-xs font-bold uppercase tracking-wider opacity-60" style={{ color: BRAND.blue }}>
        Lien du drive
      </h4>
      <div className="grid grid-cols-1 gap-3">
        {/* Lien vers le Drive Session de la vidéo */}
        {video.driveSessionUrl && (
          <a 
            href={video.driveSessionUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-3 p-4 border rounded-xl hover:bg-[#F8FBFF] hover:border-[#122755] transition-all group"
            style={{ borderColor: BRAND.coloredWhite }}
          >
            <div className="p-2 bg-[#F0F4FF] rounded-lg shrink-0" style={{ color: BRAND.blue }}>
              <FolderOpen size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm" style={{ color: BRAND.darkBlue }}>Drive Session</p>
              <p className="text-xs opacity-60 break-all" style={{ color: BRAND.blue }}>{video.driveSessionUrl}</p>
            </div>
            <ArrowUpRight size={18} className="shrink-0 mt-1" style={{ color: BRAND.blue }} />
          </a>
        )}

        {!video.driveSessionUrl && (
          <div className="p-4 border rounded-xl text-center opacity-60" style={{ borderColor: BRAND.coloredWhite }}>
            <p className="text-sm" style={{ color: BRAND.blue }}>Aucun lien disponible pour le moment</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#02143B]/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
        
        {/* Header */}
        <div className="p-6 border-b flex justify-between items-start shrink-0" style={{ borderColor: BRAND.coloredWhite }}>
            <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                    <StatusIcon status={video.status} />
                    <span className="px-2 py-1 text-xs font-semibold rounded-full" style={{ 
                      backgroundColor: isDelivered || isValidated ? "#D1FAE5" : isInClientReview || isInInternalReview ? "#FEF3C7" : "#EBF1FF",
                      color: isDelivered || isValidated ? "#065F46" : isInClientReview || isInInternalReview ? "#92400E" : BRAND.blue
                    }}>
                      {getStatusLabel(video.status)}
                    </span>
                </div>
                <h2 className="text-xl font-bold" style={{ color: BRAND.darkBlue }}>{video.title}</h2>
                <div className="flex items-center gap-3 mt-2 text-xs" style={{ color: BRAND.lightBlue }}>
                    {video.format && <span>{video.format}</span>}
                    {video.language && <span>• {video.language}</span>}
                    {video.deadline && <span>• Deadline: {new Date(video.deadline).toLocaleDateString('fr-FR')}</span>}
                </div>
                
                {/* Barre de progression par étapes */}
                <div className="mt-4 px-3 md:px-8">
                  <div className="text-xs mb-2 md:mb-3 font-medium text-center" style={{ color: BRAND.lightBlue }}>Avancement du projet</div>
                  
                  {/* Étapes de production - compact sur mobile */}
                  <div className="relative">
                    {/* Ligne de fond - centrée avec marges égales */}
                    <div className="absolute top-[14px] md:top-[18px] h-0.5 bg-gray-200" style={{ left: '5%', right: '5%' }}></div>
                    
                    {/* Étapes en grid */}
                    <div className="grid grid-cols-7 gap-0">
                      {[
                        { name: 'Brief', key: 'Brief' },
                        { name: 'Pré-prod', key: 'Pré-prod' },
                        { name: 'Tournage', key: 'Tournage' },
                        { name: 'Post-prod', key: 'Post-production' },
                        { name: 'Review', key: 'Review' },
                        { name: 'Validé', key: 'Validé' },
                        { name: 'Livré', key: 'Livrée' }
                      ].map((step, index, array) => {
                        const currentStepIndex = array.findIndex(s => video.status.includes(s.key));
                        const isComplete = index < currentStepIndex;
                        const isCurrent = index === currentStepIndex;
                        
                        return (
                          <div key={step.key} className="flex flex-col items-center">
                            <div 
                              className={`w-7 h-7 md:w-9 md:h-9 rounded-full flex items-center justify-center text-[9px] md:text-xs font-semibold relative z-10 ${
                                isComplete ? 'text-white' : 
                                isCurrent ? 'text-white ring-2 md:ring-4 ring-blue-100' : 
                                'bg-gray-200 text-gray-400'
                              }`}
                              style={{
                                backgroundColor: isComplete || isCurrent ? BRAND.blue : undefined
                              }}
                            >
                              {isComplete ? '✓' : index + 1}
                            </div>
                            <div className={`text-[8px] md:text-[10px] mt-1 md:mt-2 font-medium whitespace-nowrap ${
                              isComplete || isCurrent ? '' : 'text-gray-400'
                            }`}
                            style={{
                              color: isComplete || isCurrent ? BRAND.blue : undefined
                            }}>
                              {step.name}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-[#F4F6FA] rounded-full transition-colors ml-4" style={{ color: BRAND.lightBlue }}>
                <X />
            </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
            {/* Player vidéo si disponible */}
            <VideoPlayer />
            
            {/* Liens */}
            <div className={embedUrl ? 'mt-6' : ''}>
              <VideoLinks />
            </div>

            {/* Section spécifique selon le statut - Messages pour TOUS les statuts */}
            <div className="mt-6">
              {/* Brief reçu */}
              {video.status.includes("Brief") && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <h3 className="font-semibold" style={{ color: BRAND.darkBlue }}>Brief en cours de traitement</h3>
                  <p className="text-sm mt-1" style={{ color: BRAND.blue }}>
                    L'équipe Vertical View analyse votre brief et prépare la stratégie de production.
                  </p>
                </div>
              )}
              
              {/* Pré-production */}
              {(video.status.includes("Pré-prod") || video.status.includes("Pré-production")) && (
                <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
                  <h3 className="font-semibold text-indigo-900">Phase de pré-production</h3>
                  <p className="text-sm text-indigo-700 mt-1">
                    Préparation du tournage : storyboard, planning, et logistique en cours.
                  </p>
                </div>
              )}
              
              {/* Tournage planifié */}
              {video.status.includes("Tournage") && (
                <div className="p-4 bg-cyan-50 border border-cyan-200 rounded-xl">
                  <h3 className="font-semibold text-cyan-900">Tournage planifié</h3>
                  <p className="text-sm text-cyan-700 mt-1">
                    Le tournage est programmé. L'équipe capturera bientôt les images nécessaires.
                  </p>
                </div>
              )}
              
              {/* Post-production */}
              {video.status.includes("Post-production") && (
                <div className="p-4 border rounded-xl" style={{ backgroundColor: "#F0F4FF", borderColor: BRAND.coloredWhite }}>
                  <h3 className="font-semibold" style={{ color: BRAND.darkBlue }}>Montage en cours</h3>
                  <p className="text-sm mt-1" style={{ color: BRAND.blue }}>
                    Nos monteurs travaillent sur votre vidéo. Elle sera bientôt prête pour validation.
                  </p>
                </div>
              )}
              
              {/* Révision interne */}
              {isInInternalReview && (
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl">
                  <h3 className="font-semibold text-purple-900">Révision interne en cours</h3>
                  <p className="text-sm text-purple-700 mt-1">
                    L'équipe Vertical View finalise la vidéo. Vous serez notifié dès qu'elle sera prête pour validation.
                  </p>
                </div>
              )}
              
              {/* Review Client */}
              {isInClientReview && !feedbackType && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <h3 className="font-semibold text-amber-900 mb-2">Votre avis est requis</h3>
                  <p className="text-sm text-amber-700">
                    Visionnez la vidéo ci-dessus et donnez votre feedback.
                  </p>
                </div>
              )}
              
              {/* Validé */}
              {isValidated && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-emerald-100 text-emerald-600">
                      <CheckCircle2 size={20} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-emerald-900">Vidéo validée !</h3>
                      <p className="text-sm text-emerald-700 mt-0.5">
                        Cette vidéo a été approuvée et est prête pour livraison.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Livrée */}
              {isDelivered && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-emerald-100 text-emerald-600">
                      <CheckCircle2 size={20} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-emerald-900">Vidéo livrée !</h3>
                      <p className="text-sm text-emerald-700 mt-0.5">
                        Cette vidéo a été livrée avec succès. Merci pour votre confiance !
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Formulaire de modification */}
            {isInClientReview && feedbackType && (
                <div className="mt-6">
                    <div className="h-px w-full mb-6" style={{ backgroundColor: BRAND.coloredWhite }}></div>
                    
                    {/* Demande de modification - avec textarea */}
                    <div className="space-y-4">
                        <div className="p-4 rounded-xl border bg-amber-50 border-amber-200">
                            <h4 className="font-semibold text-sm text-amber-900">
                                Demander des modifications
                            </h4>
                            <p className="text-xs mt-1 text-amber-700">
                                Décrivez précisément les modifications souhaitées
                            </p>
                        </div>
                        <textarea 
                            className="w-full h-28 p-4 rounded-xl border focus:ring-2 focus:border-transparent transition-all resize-none text-sm outline-none"
                            style={{ 
                                borderColor: BRAND.coloredWhite,
                                color: BRAND.blue 
                            }}
                            placeholder="Ex: 00:12 - Modifier le titre&#10;00:45 - Musique trop forte..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            autoFocus
                        />
                        
                        <div className="flex gap-3">
                            <button 
                                onClick={() => { setFeedbackType(null); setComment(""); }}
                                className="px-4 py-2 bg-white border rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                                style={{ borderColor: BRAND.coloredWhite, color: BRAND.blue }}
                            >
                                Annuler
                            </button>
                            <button 
                                onClick={handleSubmitFeedback}
                                disabled={isSubmitting || !comment.trim()}
                                className="flex-1 py-2 px-4 text-white rounded-lg font-medium shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                style={{ backgroundColor: BRAND.primaryCoral }}
                            >
                                {isSubmitting ? (
                                    <><Loader2 className="animate-spin" size={18} /> Envoi...</>
                                ) : (
                                    <>Envoyer</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* Footer avec boutons d'action */}
        {isInClientReview && !feedbackType && (
            <div className="p-4 border-t bg-[#FAFCFF] flex gap-3 shrink-0" style={{ borderColor: BRAND.coloredWhite }}>
                <button 
                    onClick={() => setFeedbackType('modification')}
                    className="flex-1 py-3 px-4 bg-white border rounded-lg font-medium hover:bg-amber-50 hover:border-amber-300 transition-colors text-sm flex items-center justify-center gap-2" 
                    style={{ borderColor: BRAND.coloredWhite, color: BRAND.blue }}
                >
                    <AlertCircle size={18} />
                    Demander une modification
                </button>
                <button 
                    onClick={async () => {
                        setIsSubmitting(true);
                        try {
                            await updateAirtableRecord('Vidéos', video.id, {
                                'Statut production': '☑️ 6. Validé par le client'
                            });
                            alert("Vidéo validée avec succès !");
                            if (onVideoUpdated) onVideoUpdated();
                            onClose();
                        } catch (error: any) {
                            alert("Erreur: " + error.message);
                        } finally {
                            setIsSubmitting(false);
                        }
                    }}
                    disabled={isSubmitting}
                    className="flex-1 py-3 px-4 text-white rounded-lg font-medium shadow text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
                    style={{ backgroundColor: BRAND.success }}
                >
                    {isSubmitting ? (
                        <><Loader2 className="animate-spin" size={18} /> Validation...</>
                    ) : (
                        <><CheckCircle2 size={18} /> Valider</>
                    )}
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

// --- MAIN APP ---

const App = () => {
  const [view, setView] = useState<'login' | 'dashboard'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Data State
  const [client, setClient] = useState<Client | null>(null);
  const [contracts, setContracts] = useState<Contract[]>([]); // Multiple contracts support
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  
  // Refresh & Cache State
  const [clientRecordId, setClientRecordId] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Pagination pour l'historique
  const [historyLimit, setHistoryLimit] = useState(5);
  const [historyExpanded, setHistoryExpanded] = useState(false);

  // Check for Magic Link (supports ?ref= or ?client=)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const clientId = params.get('client') || params.get('ref'); // Magic link param
    if (clientId && clientId.startsWith('rec')) {
        setClientRecordId(clientId);
        handleMagicLogin(clientId);
    }
  }, []);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    if (!clientRecordId || view !== 'dashboard') return;
    
    const interval = setInterval(() => {
      refreshData(true); // Silent refresh
    }, 60000); // 60 seconds
    
    return () => clearInterval(interval);
  }, [clientRecordId, view]);

  // Manual refresh function with rate limiting
  const refreshData = async (silent = false) => {
    if (!clientRecordId || isRefreshing) return;
    
    if (!silent) setIsRefreshing(true);
    
    try {
      await fetchClientData(clientRecordId);
      setLastRefresh(new Date());
    } catch (err) {
      console.error("Refresh failed:", err);
    } finally {
      if (!silent) setIsRefreshing(false);
    }
  };

  const fetchClientData = async (clientRecordId: string) => {
      try {
        setLoading(true);
        setError(null);

        // 1. Fetch Client
        const clientRes = await fetchAirtable(AIRTABLE_CONFIG.tables.clients, `RECORD_ID()='${clientRecordId}'`);
        if (clientRes.records.length === 0) throw new Error("Client introuvable.");
        
        const clientRec = clientRes.records[0];
        const clientData: Client = {
            id: clientRec.id,
            companyName: clientRec.fields['Nom du client'] || "Société Inconnue",
            logoUrl: clientRec.fields['Logo']?.[0]?.url || "",
            email: clientRec.fields['Email contact principal'] || "",
            status: clientRec.fields['Statut'] || "Actif",
            type: clientRec.fields['Type de client'] || "",
            driveTournage: clientRec.fields['Drive Tournage'] || ""
        };
        setClient(clientData);

        const safeCompanyName = clientData.companyName.replace(/'/g, "\\'");

        // 2. Fetch Contracts
        const contractRes = await fetchAirtable(AIRTABLE_CONFIG.tables.contrats, `FIND('${safeCompanyName}', {Clients}) > 0`);
        const mappedContracts: Contract[] = contractRes.records.map((contractRec: any) => {
            const contractFile = contractRec.fields['Contrat']?.[0];
            return {
                id: contractRec.id,
                name: contractRec.fields['Nom du contrat'] || "",
                type: contractRec.fields['Type de contrat'] || "Contrat Cadre",
                totalVideos: contractRec.fields['Vidéos prévues'] || 0,
                deliveredVideos: contractRec.fields['Vidéos livrées'] || 0,
                startDate: contractRec.fields['Date de début'] || "",
                endDate: contractRec.fields['Date de fin'] || "",
                status: contractRec.fields['Statut du contrat'] || contractRec.fields['Statut contrat'] || "Actif",
                progressionPercent: contractRec.fields['Progression accomplissement du contrat %'] || 0,
                contractFileUrl: contractFile?.url || "",
                contractFileName: contractFile?.filename || "contrat.pdf"
            };
        });
        setContracts(mappedContracts);

        // 3. Fetch Videos
        const videoFormula = `FIND('${safeCompanyName}', ARRAYJOIN({Lien client vidéo})) > 0`;
        const videoRes = await fetchAirtable(AIRTABLE_CONFIG.tables.videos, videoFormula);
        const mappedVideos: Video[] = videoRes.records.map((rec: any) => {
            return {
                id: rec.id,
                title: rec.fields['Titre vidéo'] || "Sans titre",
                format: rec.fields['Format vidéo'] || "",
                language: rec.fields['Langue'] || "",
                status: rec.fields['Statut production'] || "📝 1. À brief",
                videoUrl: rec.fields['Lien Vidéo'] || rec.fields['Lien vidéo'] || rec.fields['Lien Video'] || "",
                driveUrl: rec.fields['Lien Drive'] || rec.fields['Lien drive'] || "",
                driveSessionUrl: rec.fields['Lien Drive Session (from Sessions de tournage)']?.[0] || "",
                priority: rec.fields['Priorité'] || "",
                progress: rec.fields['% Avancement'] || 0,
                deadline: rec.fields['Deadline V1'] || "",
                deliveryDate: rec.fields['Date livraison réelle'] || "",
                invoiceNumber: rec.fields['N° Facture'] || "",
                rushUrl: rec.fields['Lien rushes'] || rec.fields['Lien Rushes'] || rec.fields['Lien Rush'] || ""
            };
        });
        setVideos(mappedVideos);

        // 4. Fetch Team Members
        const teamRes = await fetchAirtable(AIRTABLE_CONFIG.tables.equipe, "FIND('Communication Clients', {Rôles}) > 0");
        const mappedTeam: TeamMember[] = teamRes.records.map((rec: any) => ({
            id: rec.id,
            name: rec.fields['Nom complet'] || "Membre",
            roles: rec.fields['Rôles'] || [],
            email: rec.fields['E-mail'] || "",
            whatsapp: rec.fields['WhatsApp'] || "",
            photoUrl: rec.fields['Photo']?.[0]?.url || ""
        }));
        setTeamMembers(mappedTeam);

        setView('dashboard');

      } catch (err: any) {
          console.error(err);
          setError(err.message || "Impossible de charger les données.");
          setView('login');
      } finally {
          setLoading(false);
      }
  };

  const handleMagicLogin = async (recordId: string) => {
      fetchClientData(recordId);
  };

  // Si pas de client chargé et pas en cours de chargement, afficher message d'erreur
  if (view === 'login' && !loading) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: BRAND.bgLight }}>
          <div className="text-center max-w-md">
            <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={40} className="text-red-500" />
            </div>
            <h1 className="text-2xl font-bold mb-3" style={{ color: BRAND.darkBlue }}>Accès non autorisé</h1>
            <p className="text-base mb-6" style={{ color: BRAND.blue }}>
              Ce portail est accessible uniquement via un lien personnalisé fourni par Vertical View.
            </p>
            <p className="text-sm opacity-60" style={{ color: BRAND.lightBlue }}>
              Si vous êtes client, contactez votre chargé de compte pour obtenir votre lien d'accès.
            </p>
          </div>
        </div>
      );
  }

  if (!client) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-[#E53B46]" size={40}/></div>;

  // Fonction pour obtenir la priorité de tri des statuts (ordre logique de production)
  const getStatusPriority = (status: string) => {
    if (status.includes("Review Client")) return 0; // 1. Action requise
    if (status.includes("Brief")) return 1; // 2. Brief reçu
    if (status.includes("Pré-prod") || status.includes("Pré-production")) return 2; // 3. Pré-production
    if (status.includes("Tournage")) return 3; // 4. Tournage planifié
    if (status.includes("Post-production")) return 4; // 5. Post-production
    if (status.includes("Revision Interne")) return 5; // 6. Révision interne
    if (status.includes("Validé")) return 6; // 7. Validé par le client
    if (status.includes("Livrée")) return 7; // 8. Livrée
    return 10; // Autres statuts à la fin
  };

  // Vidéos en cours, triées par priorité de statut
  const ongoingVideos = videos
    .filter(v => !v.status.includes("Livrée") && !v.status.includes("Archivée"))
    .sort((a, b) => getStatusPriority(a.status) - getStatusPriority(b.status));
  
  // Vidéos livrées pour l'historique (triées par deadline, filtrées à 1 mois max)
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  
  const deliveredVideos = videos
    .filter(v => v.status.includes("Livrée") || v.status.includes("Archivée"))
    .filter(v => {
      // Garder seulement les vidéos avec deadline de moins d'un mois
      if (!v.deadline) return true; // Garder si pas de deadline
      const deadlineDate = new Date(v.deadline);
      return deadlineDate >= oneMonthAgo;
    })
    .sort((a, b) => {
      // Trier par deadline décroissante (plus récent en haut)
      const dateA = a.deadline ? new Date(a.deadline).getTime() : 0;
      const dateB = b.deadline ? new Date(b.deadline).getTime() : 0;
      return dateB - dateA;
    });

  return (
    <div className="min-h-screen font-sans flex flex-col" style={{ backgroundColor: BRAND.bgLight }}>
      
      {/* 1. HEADER SECTION */}
      <div className="w-full bg-white pt-12 pb-24 px-6 flex flex-col items-center justify-center text-center relative z-0 border-b" style={{ borderColor: BRAND.coloredWhite }}>
          
          <div className="flex items-center justify-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-forwards">
             <div className="p-2">
                 <img 
                    src="https://raw.githubusercontent.com/gregory-a11y/image/main/logo%20(4).png" 
                    alt="Vertical View" 
                    className="h-12 w-auto object-contain"
                 />
             </div>
          </div>

          <div className="space-y-1 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150 fill-mode-forwards max-w-2xl">
             <h1 className="text-3xl md:text-4xl font-semibold tracking-tight" style={{ color: BRAND.darkBlue }}>
                Bienvenue, {client.companyName}
             </h1>
             <p className="text-base font-light" style={{ color: BRAND.blue }}>
                Portail client
             </p>
          </div>
          
          {/* Refresh button - discret */}
          <button
            onClick={() => refreshData(false)}
            disabled={isRefreshing}
            className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/80 transition-all disabled:opacity-50 opacity-40 hover:opacity-100"
            style={{ color: BRAND.blue }}
            title="Actualiser les données"
          >
            <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
      </div>

      {/* 2. MAIN CONTENT */}
      <main className="flex-1 px-4 lg:px-8 pb-12 w-full max-w-5xl mx-auto space-y-8 -mt-12 relative z-10">
        
        {/* PROJECTS SECTION */}
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300 fill-mode-forwards">
            {/* En cours */}
            <div className="flex items-center justify-between px-1 mb-3">
                <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: BRAND.darkBlue }}>
                    <ListVideo size={20} className="text-[#E53B46]" />
                    Projets en cours ({ongoingVideos.length})
                </h2>
            </div>
            
            <div className="bg-white rounded-xl overflow-hidden shadow-sm border" style={{ borderColor: BRAND.coloredWhite }}>
                {ongoingVideos.length > 0 ? (
                    ongoingVideos.map(video => (
                        <VideoRow key={video.id} video={video} onOpen={setSelectedVideo} />
                    ))
                ) : (
                    <div className="p-8 text-center text-[#122755] opacity-60">
                        Aucun projet en cours pour le moment.
                    </div>
                )}
            </div>
            
            {/* Historique - Section repliable */}
            {deliveredVideos.length > 0 && (
              <div className="mt-6">
                <button
                  onClick={() => setHistoryExpanded(!historyExpanded)}
                  className="w-full flex items-center justify-between px-1 mb-3 hover:opacity-70 transition-opacity"
                >
                  <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: BRAND.darkBlue }}>
                      <CheckCircle2 size={20} className="text-emerald-500" />
                      Historique ({deliveredVideos.length})
                  </h2>
                  <div className="flex items-center gap-2 text-sm" style={{ color: BRAND.lightBlue }}>
                    <span>{historyExpanded ? 'Masquer' : 'Afficher'}</span>
                    <ChevronDown 
                      size={20} 
                      className={`transform transition-transform ${historyExpanded ? 'rotate-180' : ''}`}
                    />
                  </div>
                </button>
                
                {historyExpanded && (
                  <>
                    <div className="bg-white rounded-xl overflow-hidden shadow-sm border" style={{ borderColor: BRAND.coloredWhite }}>
                        {deliveredVideos.slice(0, historyLimit).map(video => (
                            <VideoRow key={video.id} video={video} onOpen={setSelectedVideo} />
                        ))}
                    </div>
                    
                    {/* Bouton charger plus */}
                    {deliveredVideos.length > historyLimit && (
                      <button
                        onClick={() => setHistoryLimit(prev => prev + 5)}
                        className="w-full mt-3 py-3 px-4 bg-white border rounded-xl text-sm font-medium hover:bg-[#F8FBFF] transition-colors flex items-center justify-center gap-2"
                        style={{ borderColor: BRAND.coloredWhite, color: BRAND.blue }}
                      >
                        Voir plus ({deliveredVideos.length - historyLimit} restantes)
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
        </div>

        {/* CONTRACTS SECTION - All contracts */}
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500 fill-mode-forwards space-y-4">
            <div className="flex items-center justify-between px-1 mb-1">
                <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: BRAND.darkBlue }}>
                    <FileText size={20} className="text-[#E53B46]" />
                    Contrats ({contracts.length})
                </h2>
            </div>
            {contracts.length > 0 ? (
                contracts.map(contract => (
                    <UnifiedContractSection key={contract.id} contract={contract} />
                ))
            ) : (
                <div className="bg-white p-8 rounded-xl border text-center opacity-60" style={{ borderColor: BRAND.coloredWhite }}>
                    Aucun contrat actif lié.
                </div>
            )}
        </div>

        {/* CONTACTS (Footer) */}
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-700 fill-mode-forwards">
            <ContactFooter client={client} teamMembers={teamMembers} />
        </div>

      </main>

      {/* MODAL */}
      <VideoModal 
        video={selectedVideo} 
        isOpen={!!selectedVideo} 
        onClose={() => setSelectedVideo(null)}
        onVideoUpdated={() => refreshData(false)}
        client={client}
      />

    </div>
  );
};

const container = document.getElementById("root");
const root = createRoot(container!);
root.render(<App />);