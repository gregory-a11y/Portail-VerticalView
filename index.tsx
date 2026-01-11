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
    clients: "tblvndxiZaqAVGP5O", // ID de la table Clients
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

type Status = "📝 1. À brief" | "📋 2. Pré-prod" | "✂️ 3. Post-production" | "✏️4. Review Client" | "🔁 5. Revision Interne" | "☑️ 6. Validé par le client" | "📦 7. Livrée" | "🗄️ 8. Archivée";

interface Client {
  id: string;
  companyName: string;
  logoUrl: string;
  email: string;
  status: string;
  type: string;
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
  priority: string;
  progress: number;
  deadline: string;
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
  if (AIRTABLE_CONFIG.baseId.includes("appXXXXXXXX")) {
    throw new Error("Veuillez configurer l'ID de la base Airtable (BASE_ID) dans le code (ligne 26).");
  }

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

// Créer un enregistrement dans Airtable
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

// Mettre à jour un enregistrement dans Airtable
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
                        <span style={{ color: BRAND.primaryCoral }}>{contract.deliveredVideos} / {contract.totalVideos} vidéos</span>
                    </div>
                    <div className="h-3 w-full rounded-full overflow-hidden" style={{ backgroundColor: "#F0F4FF" }}>
                        <div 
                            className="h-full rounded-full transition-all duration-1000"
                            style={{ width: `${percent}%`, backgroundColor: BRAND.primaryCoral }}
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

const VideoModal = ({ video, isOpen, onClose, onVideoUpdated }: { video: Video | null, isOpen: boolean, onClose: () => void, onVideoUpdated?: () => void }) => {
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

  // Composant pour les liens
  const VideoLinks = () => (
    <div className="space-y-3">
      <h4 className="text-xs font-bold uppercase tracking-wider opacity-60" style={{ color: BRAND.blue }}>
        Liens de la vidéo
      </h4>
      <div className="grid grid-cols-1 gap-3">
        {video.videoUrl && (
          <a 
            href={video.videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-3 p-4 border rounded-xl hover:bg-[#F8FBFF] hover:border-[#E53B46] transition-all group"
            style={{ borderColor: BRAND.coloredWhite }}
          >
            <div className="p-2 bg-[#E53B46] rounded-lg text-white shrink-0">
              <Play size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm" style={{ color: BRAND.darkBlue }}>Voir la vidéo</p>
              <p className="text-xs opacity-60 break-all" style={{ color: BRAND.blue }}>{video.videoUrl}</p>
            </div>
            <ArrowUpRight size={18} className="shrink-0 mt-1" style={{ color: BRAND.primaryCoral }} />
          </a>
        )}

        {video.driveUrl && (
          <a 
            href={video.driveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-3 p-4 border rounded-xl hover:bg-[#F8FBFF] hover:border-[#122755] transition-all group"
            style={{ borderColor: BRAND.coloredWhite }}
          >
            <div className="p-2 bg-[#F0F4FF] rounded-lg shrink-0" style={{ color: BRAND.blue }}>
              <FolderOpen size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm" style={{ color: BRAND.darkBlue }}>Fichiers Drive</p>
              <p className="text-xs opacity-60 break-all" style={{ color: BRAND.blue }}>{video.driveUrl}</p>
            </div>
            <ArrowUpRight size={18} className="shrink-0 mt-1" style={{ color: BRAND.blue }} />
          </a>
        )}

        {!video.videoUrl && !video.driveUrl && (
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
            <div>
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
            </div>
            <button onClick={onClose} className="p-2 hover:bg-[#F4F6FA] rounded-full transition-colors" style={{ color: BRAND.lightBlue }}>
                <X />
            </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
            {/* Liens toujours visibles */}
            <VideoLinks />

            {/* Section spécifique selon le statut */}
            {(isValidated || isDelivered) && (
                <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-emerald-100 text-emerald-600 mx-auto mb-3">
                        <CheckCircle2 size={24} />
                    </div>
                    <h3 className="font-semibold text-emerald-900">
                        {isDelivered ? "Vidéo livrée !" : "Vidéo validée !"}
                    </h3>
                    <p className="text-sm text-emerald-700 mt-1">
                        {isDelivered ? "Cette vidéo a été livrée avec succès." : "Cette vidéo a été approuvée et est prête."}
                    </p>
                </div>
            )}

            {isInInternalReview && (
                <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-xl text-center">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-purple-100 text-purple-600 mx-auto mb-3">
                        <Clock size={24} />
                    </div>
                    <h3 className="font-semibold text-purple-900">Révision interne en cours</h3>
                    <p className="text-sm text-purple-700 mt-1">
                        L'équipe Vertical View finalise la vidéo. Vous serez notifié dès qu'elle sera prête pour validation.
                    </p>
                </div>
            )}

            {isInClientReview && (
                <div className="mt-6">
                    <div className="h-px w-full mb-6" style={{ backgroundColor: BRAND.coloredWhite }}></div>
                    
                    {!feedbackType ? (
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-center">
                            <h3 className="font-semibold text-amber-900 mb-2">Votre avis est requis</h3>
                            <p className="text-sm text-amber-700">
                                Visionnez la vidéo ci-dessus et donnez votre feedback.
                            </p>
                        </div>
                    ) : (
                        // Demande de modification - avec textarea
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
                    )}
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
            type: clientRec.fields['Type de client'] || ""
        };
        setClient(clientData);

        // 2. Fetch Team Members with "Communication Clients" role
        try {
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
        } catch (e) {
            console.warn("Could not fetch team members", e);
        }

        const safeCompanyName = clientData.companyName.replace(/'/g, "\\'");

        // 3. Fetch ALL Contracts - Utiliser le nom du client pour la recherche (linked records)
        try {
            // Petit délai pour respecter la limite API (5 appels/sec)
            await new Promise(resolve => setTimeout(resolve, 250));
            
            const contractRes = await fetchAirtable(AIRTABLE_CONFIG.tables.contrats, `FIND('${safeCompanyName}', {Clients}) > 0`);
            
            if (contractRes.records.length > 0) {
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
            } else {
                setContracts([]);
            }
        } catch (err) {
            console.warn("Contract fetch failed", err);
            setContracts([]);
        }

        // 4. Fetch Videos
        try {
            const videoFormula = `FIND('${safeCompanyName}', ARRAYJOIN({Client (from Sessions de tournage)})) > 0`;
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
                    priority: rec.fields['Priorité'] || "",
                    progress: rec.fields['% Avancement'] || 0,
                    deadline: rec.fields['Deadline V1'] || "",
                    invoiceNumber: rec.fields['N° Facture'] || "",
                    rushUrl: rec.fields['Lien rushes'] || rec.fields['Lien Rushes'] || rec.fields['Lien Rush'] || ""
                };
            });
            setVideos(mappedVideos);
        } catch (err) {
            console.error("Video fetch failed", err);
            setVideos([]);
        }

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

  const ongoingVideos = videos.filter(v => 
    !v.status.includes("Livrée") && !v.status.includes("Archivée")
  );

  return (
    <div className="min-h-screen font-sans flex flex-col" style={{ backgroundColor: BRAND.bgLight }}>
      
      {/* 1. HEADER SECTION */}
      <div className="w-full bg-white pt-12 pb-24 px-6 flex flex-col items-center justify-center text-center relative z-0 border-b" style={{ borderColor: BRAND.coloredWhite }}>
          
          <div className="flex items-center justify-center gap-8 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-forwards">
             <div className="p-2">
                 <img 
                    src="https://raw.githubusercontent.com/gregory-a11y/image/main/logo%20(4).png" 
                    alt="Vertical View" 
                    className="h-14 w-auto object-contain"
                 />
             </div>

             <div style={{ color: BRAND.darkBlue }}>
                 <X size={24} strokeWidth={3} />
             </div>

             <div className="bg-white p-2">
                 {client.logoUrl ? (
                    <img 
                        src={client.logoUrl} 
                        alt={client.companyName} 
                        className="h-14 w-auto object-contain"
                    />
                 ) : (
                    <div className="h-14 w-14 bg-gray-100 rounded-full flex items-center justify-center text-xl font-bold text-gray-400">
                        {client.companyName.charAt(0)}
                    </div>
                 )}
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
             <div className="flex items-center justify-between px-1 mb-3">
                <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: BRAND.darkBlue }}>
                    <ListVideo size={20} className="text-[#E53B46]" />
                    Projets en cours
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
      />

    </div>
  );
};

const container = document.getElementById("root");
const root = createRoot(container!);
root.render(<App />);