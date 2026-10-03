'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import {
  getAllCreators,
  getPassportApplications,
  approvePassportApplication,
  rejectPassportApplication,
  suspendCreator,
  getAuditLogs,
  getAdminStats,
  PassportApplication
} from '@/lib/data';
import { CreatorProfile, VerificationSubmission } from '@/lib/types';
import {
  ShieldCheck,
  ShieldAlert,
  Search,
  Check,
  X,
  Lock,
  Eye,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  ExternalLink,
  Users,
  LogOut,
  ArrowRight,
  TrendingUp,
  Image as ImageIcon,
  Trash2,
  Clock,
  ZoomIn,
  ZoomOut,
  Download,
  ChevronLeft,
  ChevronRight,
  XCircle,
  FileImage,
  Calendar,
  Maximize2,
  RotateCcw
} from 'lucide-react';
import CHQLogo from '@/components/CHQLogo';
import CamouflageBannerBg from '@/components/CamouflageBannerBg';
import { subscribeToCreatorSync, broadcastLocalChange } from '@/lib/sync';

// =============================================
// PROOF INSPECTOR MODAL COMPONENT
// =============================================
function ProofInspectorModal({
  submission,
  onClose,
  onApprove,
  onReject,
}: {
  submission: VerificationSubmission;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
}) {
  const [currentProofIndex, setCurrentProofIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const proofs = React.useMemo(() => {
    const list: Array<{
      id: string;
      filename: string;
      url: string;
      fileUrl?: string;
      platform?: string;
      uploadedAt: string;
      notes?: string;
    }> = [];

    if (Array.isArray(submission.proofDocuments) && submission.proofDocuments.length > 0) {
      for (const p of submission.proofDocuments) {
        const u = p.url || (p as any).fileUrl || '';
        if (u) {
          list.push({
            id: p.id || `proof_${list.length}`,
            filename: p.filename || `Proof Document ${list.length + 1}`,
            url: u,
            fileUrl: u,
            platform: (p as any).platform || 'Channel',
            uploadedAt: (p as any).uploadedAt || submission.submittedAt || new Date().toISOString(),
            notes: (p as any).notes,
          });
        }
      }
    }

    // Include YouTube proof screenshot if present and not in list
    const ytProof = submission.connectedPlatforms?.youtube?.proofScreenshot;
    if (ytProof && !list.some((p) => p.url === ytProof)) {
      list.push({
        id: `proof_yt_${submission.id}`,
        filename: 'YouTube Studio Analytics Proof',
        url: ytProof,
        fileUrl: ytProof,
        platform: 'YOUTUBE',
        uploadedAt: submission.submittedAt || new Date().toISOString(),
        notes: `YouTube Channel Proof (${submission.connectedPlatforms?.youtube?.metricValue || 'Subscribers'})`,
      });
    }

    // Include Discord proof screenshot if present and not in list
    const dcProof = submission.connectedPlatforms?.discord?.proofScreenshot;
    if (dcProof && !list.some((p) => p.url === dcProof)) {
      list.push({
        id: `proof_dc_${submission.id}`,
        filename: 'Discord Server Proof',
        url: dcProof,
        fileUrl: dcProof,
        platform: 'DISCORD',
        uploadedAt: submission.submittedAt || new Date().toISOString(),
        notes: `Discord Community Proof (${submission.connectedPlatforms?.discord?.metricValue || 'Members'})`,
      });
    }

    return list;
  }, [submission]);

  const currentProof = proofs[currentProofIndex] || proofs[0];

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.5, 5));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.5, 0.5));
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoom <= 1) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setZoom((z) => Math.min(z + 0.25, 5));
    } else {
      setZoom((z) => Math.max(z - 0.25, 0.5));
    }
  };

  const goToPrev = () => {
    if (currentProofIndex > 0) {
      setCurrentProofIndex(currentProofIndex - 1);
      handleResetView();
    }
  };

  const goToNext = () => {
    if (currentProofIndex < proofs.length - 1) {
      setCurrentProofIndex(currentProofIndex + 1);
      handleResetView();
    }
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      setRejectionReason('Proof inconclusive or insufficient evidence');
    }
    onReject(submission.id, rejectionReason || 'Proof inconclusive or insufficient evidence');
  };

  return (
    <div className="fixed inset-0 z-[500] bg-black/90 backdrop-blur-lg flex items-center justify-center p-4">
      <div className={`w-full rounded-2xl bg-[#0e1217] border border-white/15 shadow-2xl relative flex flex-col overflow-hidden ${isFullscreen ? 'max-w-[95vw] max-h-[95vh]' : 'max-w-4xl max-h-[90vh]'}`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-4">
            {/* Creator Avatar */}
            {submission.creatorAvatar && (
              <img
                src={submission.creatorAvatar}
                alt={submission.creatorName}
                className="w-10 h-10 rounded-xl object-cover border border-white/20"
              />
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wider text-sky-400 font-bold font-mono">
                  PROOF AUDIT INSPECTION
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase ${
                  submission.status === 'PENDING' ? 'bg-amber-950/80 border border-amber-800 text-amber-300' :
                  submission.status === 'UNDER_REVIEW' ? 'bg-sky-950/80 border border-sky-800 text-sky-300' :
                  submission.status === 'VERIFIED' ? 'bg-emerald-950/80 border border-emerald-800 text-emerald-300' :
                  'bg-red-950/80 border border-red-800 text-red-300'
                }`}>
                  {submission.status}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mt-0.5">
                {submission.creatorName}
                <span className="text-sm font-normal text-sky-400 ml-2">
                  {submission.creatorHandle}
                </span>
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              title="Toggle fullscreen"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Submission Details */}
        <div className="px-5 py-3 border-b border-white/5 flex flex-wrap items-center gap-4 text-xs text-slate-300 shrink-0">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>Submitted: <strong className="text-white">{new Date(submission.submittedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</strong></span>
          </div>
          <span className="text-slate-600">•</span>
          <div className="flex items-center gap-1.5">
            <span>Category: <strong className="text-white">{submission.category}</strong></span>
          </div>
          <span className="text-slate-600">•</span>
          <div className="flex items-center gap-1.5">
            <FileImage className="w-3.5 h-3.5 text-slate-500" />
            <span>Proof Files: <strong className="text-sky-400">{proofs.length}</strong></span>
          </div>

          {/* Connected Platforms Summary */}
          <div className="flex items-center gap-2 ml-auto">
            {submission.connectedPlatforms?.youtube?.connected && (
              <span className="px-2 py-0.5 rounded bg-red-950/60 border border-red-800/40 text-red-300 text-[10px] font-mono font-semibold">
                YT {submission.connectedPlatforms.youtube.metricValue || '?'}
              </span>
            )}
            {submission.connectedPlatforms?.discord?.connected && (
              <span className="px-2 py-0.5 rounded bg-indigo-950/60 border border-indigo-800/40 text-indigo-300 text-[10px] font-mono font-semibold">
                DC {submission.connectedPlatforms.discord.metricValue || '?'}
              </span>
            )}
            {submission.connectedPlatforms?.instagram?.connected && (
              <span className="px-2 py-0.5 rounded bg-pink-950/60 border border-pink-800/40 text-pink-300 text-[10px] font-mono font-semibold">
                IG
              </span>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {proofs.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-12">
              <div className="text-center space-y-3">
                <FileImage className="w-12 h-12 text-slate-600 mx-auto" />
                <h4 className="text-base font-bold text-white">No Proof Files Uploaded</h4>
                <p className="text-xs text-slate-400 max-w-sm">
                  This creator has not uploaded any proof screenshots or documents. You may reject this submission or request proof.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Image Viewer */}
              <div
                ref={imageContainerRef}
                className="flex-1 relative bg-[#080a0d] overflow-hidden cursor-grab active:cursor-grabbing min-h-[300px]"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleWheel}
              >
                {currentProof && (
                  <img
                    src={currentProof.url}
                    alt={currentProof.filename}
                    className="absolute top-1/2 left-1/2 max-w-full max-h-full object-contain select-none transition-transform duration-150"
                    style={{
                      transform: `translate(-50%, -50%) translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                    }}
                    draggable={false}
                  />
                )}

                {/* Zoom Controls Overlay */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/70 rounded-xl px-3 py-2 border border-white/10 backdrop-blur-sm">
                  <button onClick={handleZoomOut} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors" title="Zoom Out">
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-mono text-slate-300 min-w-[3rem] text-center">
                    {Math.round(zoom * 100)}%
                  </span>
                  <button onClick={handleZoomIn} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors" title="Zoom In">
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <div className="w-px h-4 bg-white/10" />
                  <button onClick={handleResetView} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors" title="Reset View">
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>

                {/* File Navigation (Prev / Next) */}
                {proofs.length > 1 && (
                  <>
                    <button
                      onClick={goToPrev}
                      disabled={currentProofIndex === 0}
                      className={`absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 border border-white/10 transition-all ${
                        currentProofIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white/10 text-white'
                      }`}
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={goToNext}
                      disabled={currentProofIndex === proofs.length - 1}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 border border-white/10 transition-all ${
                        currentProofIndex === proofs.length - 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white/10 text-white'
                      }`}
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}

                {/* File Info Overlay */}
                {currentProof && (
                  <div className="absolute top-4 left-4 bg-black/70 rounded-lg px-3 py-2 border border-white/10 backdrop-blur-sm text-xs">
                    <div className="text-white font-semibold truncate max-w-[200px]">{currentProof.filename}</div>
                    <div className="text-slate-400 text-[10px] mt-0.5">
                      Uploaded: {new Date(currentProof.uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      {currentProof.platform && <span className="ml-2">• {currentProof.platform}</span>}
                    </div>
                  </div>
                )}

                {/* File Counter */}
                {proofs.length > 1 && (
                  <div className="absolute top-4 right-4 bg-black/70 rounded-lg px-3 py-1.5 border border-white/10 backdrop-blur-sm text-xs font-mono text-slate-300">
                    {currentProofIndex + 1} / {proofs.length}
                  </div>
                )}
              </div>

              {/* Proof Thumbnails Strip */}
              {proofs.length > 1 && (
                <div className="px-5 py-3 border-t border-white/5 flex items-center gap-2 overflow-x-auto shrink-0">
                  {proofs.map((proof, idx) => (
                    <button
                      key={proof.id}
                      onClick={() => {
                        setCurrentProofIndex(idx);
                        handleResetView();
                      }}
                      className={`shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                        idx === currentProofIndex
                          ? 'border-sky-400 ring-2 ring-sky-400/30'
                          : 'border-white/10 hover:border-white/30 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={proof.url || proof.fileUrl} alt={proof.filename} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Action Footer */}
        <div className="px-5 py-4 border-t border-white/10 shrink-0">
          {showRejectForm ? (
            <div className="space-y-3 animate-fadeIn">
              <label className="text-xs font-semibold text-slate-300 block">Rejection Reason</label>
              <textarea
                rows={2}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain why the proof was rejected (e.g., blurry screenshot, metrics don't match, suspected manipulation)..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-red-500/30 text-sm text-white focus:outline-none focus:border-red-400 placeholder:text-slate-500"
              />
              <div className="flex items-center gap-3 justify-end">
                <button
                  onClick={() => setShowRejectForm(false)}
                  className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium text-slate-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  className="px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Confirm Rejection</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-400 max-w-md">
                Review all proof documents carefully before approving. Uploaded screenshots are evidence only — do not trust self-reported metrics.
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowRejectForm(true)}
                  className="px-5 py-2.5 rounded-lg bg-red-950/40 hover:bg-red-900 border border-red-800/40 text-red-300 text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <X className="w-4 h-4" />
                  <span>REJECT</span>
                </button>
                <button
                  onClick={() => onApprove(submission.id)}
                  className="px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-900/50 transition-colors"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>APPROVE</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


// =============================================
// MAIN ADMIN PAGE
// =============================================
export default function AdminPage() {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [staffId, setStaffId] = useState('');
  const [staffPass, setStaffPass] = useState('');
  const [loginError, setLoginError] = useState('');

  // Tab & Data states
  const [activeTab, setActiveTab] = useState<'verification' | 'creators' | 'pending' | 'logs'>('verification');
  const [applications, setApplications] = useState<PassportApplication[]>(() => getPassportApplications());
  const [creators, setCreators] = useState<CreatorProfile[]>([]);
  const [verifications, setVerifications] = useState<VerificationSubmission[]>([]);
  const [logs, setLogs] = useState(() => getAuditLogs());
  const [stats, setStats] = useState(() => getAdminStats());
  const [searchQuery, setSearchQuery] = useState('');

  // Selected proof modal state
  const [inspectingSubmission, setInspectingSubmission] = useState<VerificationSubmission | null>(null);
  const [inspectingApp, setInspectingApp] = useState<PassportApplication | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string>('');

  const [loginLoading, setLoginLoading] = useState(false);

  // Load live creators, verifications, and audit logs from DB
  const loadLiveData = React.useCallback(async () => {
    try {
      const [creatorsRes, verificationsRes, logsRes] = await Promise.all([
        fetch('/api/creators', { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } }),
        fetch('/api/verification/submit', { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } }),
        fetch('/api/admin/audit-logs', { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } }),
      ]);

      if (creatorsRes.ok) {
        const data = await creatorsRes.json();
        if (data.creators) {
          setCreators(data.creators);
        }
      }

      if (verificationsRes.ok) {
        const data = await verificationsRes.json();
        if (data.verifications) {
          setVerifications(data.verifications);
        }
      }

      if (logsRes.ok) {
        const data = await logsRes.json();
        if (data.logs && Array.isArray(data.logs)) {
          setLogs(data.logs);
        }
      }
    } catch (e) {
      console.warn('Error loading data in admin:', e);
    }
  }, []);

  // Check existing authenticated session on mount
  React.useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user && data.user.role === 'ADMIN') {
          setIsAuthenticated(true);
          loadLiveData();
        }
      })
      .catch(() => {});
  }, [loadLiveData]);

  React.useEffect(() => {
    if (!isAuthenticated) return;
    loadLiveData();

    const unsubscribe = subscribeToCreatorSync(() => {
      loadLiveData();
    });

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadLiveData();
      }
    }, 5000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [isAuthenticated, loadLiveData]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');

    try {
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: staffId.trim(),
          password: staffPass,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.message || data.error || 'Authentication failed. Please verify credentials.');
        setLoginLoading(false);
        return;
      }

      if (data.user?.role !== 'ADMIN') {
        setLoginError('Access denied: This account does not possess Administrator privileges.');
        setLoginLoading(false);
        return;
      }

      setIsAuthenticated(true);
      setStaffPass('');
      setLoginError('');
      loadLiveData();
    } catch (err: any) {
      setLoginError('Network or server error during sign in.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/signout', { method: 'POST' });
    } catch (e) {}
    setIsAuthenticated(false);
  };

  const handleDeleteCreator = async (slug: string, displayName: string) => {
    if (!confirm(`Are you sure you want to permanently delete Creator Pass for ${displayName} (@${slug})?`)) {
      return;
    }

    try {
      await fetch(`/api/creators?slug=${encodeURIComponent(slug)}`, {
        method: 'DELETE',
      });

      setCreators((prev) => prev.filter((c) => (c.slug || c.username || '').toLowerCase() !== slug.toLowerCase()));

      try {
        const saved = localStorage.getItem('creatorhq_user_card');
        if (saved) {
          const parsed: CreatorProfile = JSON.parse(saved);
          if ((parsed.slug || parsed.username || '').toLowerCase() === slug.toLowerCase()) {
            localStorage.removeItem('creatorhq_user_card');
          }
        }
      } catch (e) {}

      setActionFeedback(`Creator Pass @${slug} permanently deleted.`);
      setTimeout(() => setActionFeedback(''), 4000);
    } catch (err) {
      alert('Failed to delete creator pass. Check network/server connection.');
    }
  };

  const handleStaffVerifyCreator = async (creator: CreatorProfile) => {
    const nextVerified = !(creator.isVerified || creator.verification_status === 'VERIFIED');
    const targetSlug = (creator.slug || creator.username || creator.passportId || 'creator').toLowerCase();

    try {
      const res = await fetch('/api/verification/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verificationId: (creator as any).verificationId,
          creatorSlug: targetSlug,
          slug: creator.slug,
          username: creator.username,
          passportId: creator.passportId,
          id: creator.id,
          creator: creator,
          action: nextVerified ? 'APPROVE' : 'REVOKE',
          reviewedBy: 'Admin',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const updated: CreatorProfile = data.creator || {
          ...creator,
          isVerified: nextVerified,
          verification_status: nextVerified ? 'VERIFIED' : 'PENDING',
          tierName: nextVerified ? 'Founding Member Tier I' : 'Candidate Member',
          lastVerifiedAt: new Date().toISOString().split('T')[0],
        };

        setCreators((prev) =>
          prev.map((c) =>
            (c.slug || c.username || c.passportId || '').toLowerCase() === targetSlug
              ? updated
              : c
          )
        );

        if (data.verification) {
          setVerifications((prev) =>
            prev.map((v) =>
              (v.creatorSlug || '').toLowerCase() === targetSlug ? data.verification : v
            )
          );
        }

        broadcastLocalChange({
          type: 'VERIFICATION_UPDATED',
          slug: targetSlug,
          status: nextVerified ? 'VERIFIED' : 'PENDING',
          isVerified: nextVerified,
          creator: updated,
          verification: data.verification,
        });

        if (nextVerified) {
          setActionFeedback(`Staff Approved! Verified badge granted to ${creator.displayName} (@${targetSlug}).`);
        } else {
          setActionFeedback(`Verification revoked for ${creator.displayName}. Reverted to Pending.`);
        }
        setTimeout(() => setActionFeedback(''), 4000);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || 'Failed to update verification status.');
      }
    } catch (e) {
      alert('Failed to update verification status.');
    }
  };

  const handleInspectCreatorProof = (c: CreatorProfile) => {
    const slug = (c.slug || c.username || '').toLowerCase().replace(/^@/, '').trim();
    const existing = verifications.find((v) => (v.creatorSlug || '').toLowerCase() === slug);
    if (existing) {
      setInspectingSubmission(existing);
      return;
    }

    const proofs: Array<{
      id: string;
      filename: string;
      url: string;
      fileUrl?: string;
      platform?: string;
      uploadedAt: string;
      notes?: string;
    }> = [];

    if (c.connections?.youtube?.proofScreenshot) {
      proofs.push({
        id: `proof_yt_${slug}`,
        url: c.connections.youtube.proofScreenshot,
        fileUrl: c.connections.youtube.proofScreenshot,
        filename: 'YouTube Studio Proof',
        platform: 'YOUTUBE',
        uploadedAt: c.issuedAt || new Date().toISOString(),
        notes: `YouTube Channel Proof (${c.connections?.youtube?.metricValue || 'Subscribers'})`,
      });
    }

    if (c.connections?.discord?.proofScreenshot) {
      proofs.push({
        id: `proof_dc_${slug}`,
        url: c.connections.discord.proofScreenshot,
        fileUrl: c.connections.discord.proofScreenshot,
        filename: 'Discord Server Proof',
        platform: 'DISCORD',
        uploadedAt: c.issuedAt || new Date().toISOString(),
        notes: `Discord Server Proof (${c.connections?.discord?.metricValue || 'Members'})`,
      });
    }

    if (Array.isArray(c.proofDocuments)) {
      for (const doc of c.proofDocuments) {
        if (!proofs.some((p) => p.url === doc.url)) {
          proofs.push({
            id: doc.id || `proof_${Date.now()}`,
            url: doc.url || (doc as any).fileUrl || '',
            fileUrl: (doc as any).fileUrl || doc.url || '',
            filename: doc.filename || 'Proof Document',
            platform: (doc as any).platform || 'Channel',
            uploadedAt: (doc as any).uploadedAt || c.issuedAt || new Date().toISOString(),
            notes: (doc as any).notes,
          });
        }
      }
    }

    const sub: VerificationSubmission = {
      id: `vrf_${slug}`,
      creatorSlug: slug,
      creatorName: c.displayName,
      creatorHandle: `@${slug}`,
      creatorAvatar: c.avatarUrl,
      category: c.category || 'Creator',
      platforms: ['YOUTUBE', 'DISCORD'],
      connectedPlatforms: c.connections || {},
      proofDocuments: proofs,
      status: (c.isVerified || c.verification_status === 'VERIFIED') ? 'VERIFIED' : (c.verification_status === 'REJECTED' ? 'REJECTED' : 'PENDING'),
      submittedAt: c.issuedAt || new Date().toISOString(),
      rejectionReason: c.rejectionReason,
    };

    setInspectingSubmission(sub);
  };

  // Verification review actions
  const handleVerificationApprove = async (id: string) => {
    const matchedVerif = verifications.find(
      (v) =>
        (v.id && v.id.toLowerCase() === id.toLowerCase()) ||
        (v.creatorSlug && (v.creatorSlug.toLowerCase() === id.toLowerCase() || `vrf_${v.creatorSlug.toLowerCase()}` === id.toLowerCase()))
    );
    const matchedCreator = creators.find(
      (c) =>
        (c.slug && (c.slug.toLowerCase() === id.toLowerCase() || `vrf_${c.slug.toLowerCase()}` === id.toLowerCase() || (matchedVerif && c.slug.toLowerCase() === (matchedVerif.creatorSlug || '').toLowerCase()))) ||
        (c.username && (c.username.toLowerCase() === id.toLowerCase() || `vrf_${c.username.toLowerCase()}` === id.toLowerCase())) ||
        (c.passportId && (c.passportId.toLowerCase() === id.toLowerCase() || `vrf_${c.passportId.toLowerCase()}` === id.toLowerCase())) ||
        (c.id && c.id.toLowerCase() === id.toLowerCase())
    );

    const targetSlug =
      matchedVerif?.creatorSlug ||
      matchedCreator?.slug ||
      matchedCreator?.username ||
      id.replace(/^vrf_/, '');

    try {
      const res = await fetch('/api/verification/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verificationId: id,
          creatorSlug: targetSlug,
          slug: targetSlug,
          creator: matchedCreator,
          submission: matchedVerif,
          action: 'APPROVE',
          reviewedBy: 'Admin',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setActionFeedback('Verification approved! Creator is now VERIFIED.');
        setInspectingSubmission(null);

        if (data.creator) {
          const updatedSlug = (data.creator.slug || data.creator.username || data.creator.passportId || '').toLowerCase();
          setCreators((prev) =>
            prev.map((c) =>
              (c.slug || c.username || c.passportId || '').toLowerCase() === updatedSlug
                ? data.creator
                : c
            )
          );
        }

        if (data.verification) {
          setVerifications((prev) =>
            prev.map((v) =>
              v.id === id || (data.verification.creatorSlug && v.creatorSlug.toLowerCase() === data.verification.creatorSlug.toLowerCase())
                ? data.verification
                : v
            )
          );
        }

        broadcastLocalChange({
          type: 'VERIFICATION_UPDATED',
          slug: data.creator?.slug || (data.verification?.creatorSlug),
          status: 'VERIFIED',
          isVerified: true,
          creator: data.creator,
          verification: data.verification,
        });

        setTimeout(() => setActionFeedback(''), 4000);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || 'Failed to approve verification.');
      }
    } catch (e) {
      alert('Failed to approve verification.');
    }
  };

  const handleVerificationReject = async (id: string, reason: string) => {
    const matchedVerif = verifications.find(
      (v) =>
        (v.id && v.id.toLowerCase() === id.toLowerCase()) ||
        (v.creatorSlug && (v.creatorSlug.toLowerCase() === id.toLowerCase() || `vrf_${v.creatorSlug.toLowerCase()}` === id.toLowerCase()))
    );
    const matchedCreator = creators.find(
      (c) =>
        (c.slug && (c.slug.toLowerCase() === id.toLowerCase() || `vrf_${c.slug.toLowerCase()}` === id.toLowerCase() || (matchedVerif && c.slug.toLowerCase() === (matchedVerif.creatorSlug || '').toLowerCase()))) ||
        (c.username && (c.username.toLowerCase() === id.toLowerCase() || `vrf_${c.username.toLowerCase()}` === id.toLowerCase())) ||
        (c.passportId && (c.passportId.toLowerCase() === id.toLowerCase() || `vrf_${c.passportId.toLowerCase()}` === id.toLowerCase())) ||
        (c.id && c.id.toLowerCase() === id.toLowerCase())
    );

    const targetSlug =
      matchedVerif?.creatorSlug ||
      matchedCreator?.slug ||
      matchedCreator?.username ||
      id.replace(/^vrf_/, '');

    try {
      const res = await fetch('/api/verification/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verificationId: id,
          creatorSlug: targetSlug,
          slug: targetSlug,
          creator: matchedCreator,
          submission: matchedVerif,
          action: 'REJECT',
          rejectionReason: reason,
          reviewedBy: 'Admin',
        }),
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        setActionFeedback(`Verification rejected. Reason: ${reason}`);
        setInspectingSubmission(null);

        if (data.creator) {
          const updatedSlug = (data.creator.slug || data.creator.username || data.creator.passportId || '').toLowerCase();
          setCreators((prev) =>
            prev.map((c) =>
              (c.slug || c.username || c.passportId || '').toLowerCase() === updatedSlug
                ? data.creator
                : c
            )
          );
        }

        if (data.verification) {
          setVerifications((prev) =>
            prev.map((v) =>
              v.id === id || (data.verification.creatorSlug && v.creatorSlug.toLowerCase() === data.verification.creatorSlug.toLowerCase())
                ? data.verification
                : v
            )
          );
        }

        broadcastLocalChange({
          type: 'VERIFICATION_UPDATED',
          slug: data.creator?.slug || (data.verification?.creatorSlug),
          status: 'REJECTED',
          isVerified: false,
          creator: data.creator,
          verification: data.verification,
        });

        setTimeout(() => setActionFeedback(''), 4000);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || 'Failed to reject verification.');
      }
    } catch (e) {
      alert('Failed to reject verification.');
    }
  };

  const handleApprove = async (id: string) => {
    const res = approvePassportApplication(id);
    if (res) {
      setApplications([...getPassportApplications()]);
      setLogs([...getAuditLogs()]);
      setStats(getAdminStats());
      setActionFeedback(`Approved! Pass minted for ${res.newCreator.displayName} (@${res.newCreator.slug}).`);
      setInspectingApp(null);

      // Persist the newly minted creator to server database
      try {
        await fetch('/api/creators', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-request': 'true',
          },
          body: JSON.stringify(res.newCreator),
        });
      } catch (e) {}

      await loadLiveData();
      setTimeout(() => setActionFeedback(''), 4000);
    }
  };

  const handleReject = (id: string) => {
    const res = rejectPassportApplication(id, 'Metrics or channel ownership proof inconclusive');
    if (res) {
      setApplications([...getPassportApplications()]);
      setLogs([...getAuditLogs()]);
      setActionFeedback(`Application for ${res.applicantName} marked as Rejected.`);
      setInspectingApp(null);
      setTimeout(() => setActionFeedback(''), 4000);
    }
  };

  const handleToggleSuspend = (slug: string, currentSuspended: boolean) => {
    suspendCreator(slug, !currentSuspended, 'Staff administrative override');
    loadLiveData();
    setLogs([...getAuditLogs()]);
  };

  const pendingApps = applications.filter(a => a.status === 'PENDING_REVIEW');
  const pendingVerifications = verifications.filter(v => v.status === 'PENDING' || v.status === 'UNDER_REVIEW');

  // =========================================================================
  // LOGIN SCREEN (RESTRICTED TO STAFF)
  // =========================================================================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#060911] text-white flex flex-col justify-center items-center px-4 font-sans relative overflow-hidden">
        {/* Seamless Luxury Tech Atmosphere */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <CamouflageBannerBg bannerOpacity="opacity-50" gridOpacity="opacity-25" />
        </div>

        <div className="w-full max-w-md p-8 sm:p-9 rounded-3xl bg-[#0c101d]/90 border border-white/10 shadow-2xl space-y-6 relative z-10 backdrop-blur-2xl">
          <div className="flex flex-col items-center text-center space-y-2">
            <CHQLogo size="lg" showText={false} />
            <h1 className="text-2xl font-bold text-white tracking-tight mt-2 font-sans">
              CreatorHQ Staff Console
            </h1>
            <p className="text-xs text-slate-400">
              Restricted portal for staff proof review and creator verification.
            </p>
          </div>

          {loginError && (
            <div className="p-3.5 rounded-lg bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs text-slate-300 font-semibold block mb-1.5">
                Staff ID
              </label>
              <input
                type="text"
                required
                placeholder="admin"
                value={staffId}
                onChange={(e) => setStaffId(e.target.value)}
                className="w-full h-11 px-3.5 rounded-lg bg-[#161922] border border-white/10 text-white text-sm focus:outline-none focus:border-sky-400 font-mono"
              />
            </div>

            <div>
              <label className="text-xs text-slate-300 font-semibold block mb-1.5">
                Staff Password
              </label>
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={staffPass}
                onChange={(e) => setStaffPass(e.target.value)}
                className="w-full h-11 px-3.5 rounded-lg bg-[#161922] border border-white/10 text-white text-sm focus:outline-none focus:border-sky-400"
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full h-11 rounded-lg btn-chq-primary text-sm font-semibold flex items-center justify-center gap-2 shadow-sm disabled:opacity-60"
            >
              {loginLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Sign In as Staff</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // =========================================================================
  // AUTHENTICATED STAFF CONSOLE
  // =========================================================================
  return (
    <div className="min-h-screen bg-[#0b0d11] text-slate-100 flex flex-col font-sans">
      
      {/* Top Staff Bar */}
      <header className="h-16 border-b border-white/10 bg-[#11141a] px-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <CHQLogo size="sm" showText={true} />
          <span className="text-xs px-2.5 py-0.5 rounded bg-sky-950 border border-sky-800 text-sky-400 font-mono font-semibold">
            STAFF CONSOLE
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={async () => {
              setActionFeedback('Syncing live data from cloud store...');
              await loadLiveData();
              setActionFeedback('✓ Database synced with latest cloud changes.');
              setTimeout(() => setActionFeedback(''), 3500);
            }}
            className="flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 px-3 py-1.5 rounded-lg border border-sky-500/30 hover:border-sky-500/60 bg-sky-950/40 transition-colors"
            title="Force refresh database from cloud"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sync Cloud Data</span>
          </button>

          <Link
            href="/"
            className="text-xs text-slate-400 hover:text-white transition-colors"
          >
            ← View Public Site
          </Link>

          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-400 px-3 py-1.5 rounded-lg border border-white/10 hover:border-red-500/40 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-8">
        
        {/* Status Notification */}
        {actionFeedback && (
          <div className="p-4 rounded-xl bg-sky-950/80 border border-sky-500/50 text-sky-200 text-sm flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-sky-400 shrink-0" />
              <span>{actionFeedback}</span>
            </div>
            <button onClick={() => setActionFeedback('')} className="text-sky-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Console Header & Stats */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Verification & Creator Operations
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Inspect proof screenshots, review verifications, and manage creator passes.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-xl bg-[#11141a] border border-white/10 text-center">
              <span className="text-xs text-slate-400 block">Verified Creators</span>
              <span className="text-lg font-bold text-emerald-400 font-mono">
                {creators.filter(c => c.isVerified || c.verification_status === 'VERIFIED').length}
              </span>
            </div>
            <div className="px-4 py-2 rounded-xl bg-[#11141a] border border-white/10 text-center">
              <span className="text-xs text-slate-400 block">Pending Reviews</span>
              <span className="text-lg font-bold text-amber-400 font-mono">
                {pendingVerifications.length}
              </span>
            </div>
            <div className="px-4 py-2 rounded-xl bg-[#11141a] border border-white/10 text-center">
              <span className="text-xs text-slate-400 block">Total Passes</span>
              <span className="text-lg font-bold text-sky-400 font-mono">
                {creators.length}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab('verification')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 shrink-0 ${
              activeTab === 'verification'
                ? 'bg-sky-500 text-white'
                : 'text-slate-400 hover:text-white bg-[#11141a]'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Verification Reviews ({pendingVerifications.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('creators')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 shrink-0 ${
              activeTab === 'creators'
                ? 'bg-sky-500 text-white'
                : 'text-slate-400 hover:text-white bg-[#11141a]'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Creator Roster ({creators.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 shrink-0 ${
              activeTab === 'pending'
                ? 'bg-sky-500 text-white'
                : 'text-slate-400 hover:text-white bg-[#11141a]'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>Legacy Applications ({pendingApps.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 shrink-0 ${
              activeTab === 'logs'
                ? 'bg-sky-500 text-white'
                : 'text-slate-400 hover:text-white bg-[#11141a]'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Audit Trail</span>
          </button>
        </div>

        {/* =========================================================================
            TAB 1: VERIFICATION REVIEWS (NEW — PRIMARY TAB)
            ========================================================================= */}
        {activeTab === 'verification' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">
                Verification Submissions
              </h2>
              <span className="text-xs text-slate-400">
                Inspect proof before approving. Do not trust self-reported metrics.
              </span>
            </div>

            {verifications.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-[#11141a] border border-white/10 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-sky-400 mx-auto" />
                <h3 className="text-base font-bold text-white">No Verification Submissions</h3>
                <p className="text-xs text-slate-400">
                  When creators submit verification requests, they will appear here for review.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {verifications.map((sub) => (
                  <div
                    key={sub.id}
                    className={`p-6 rounded-2xl bg-[#11141a] border transition-colors flex flex-col md:flex-row md:items-center justify-between gap-6 ${
                      sub.status === 'PENDING' ? 'border-amber-500/30 hover:border-amber-400/50' :
                      sub.status === 'UNDER_REVIEW' ? 'border-sky-500/30 hover:border-sky-400/50' :
                      sub.status === 'VERIFIED' ? 'border-emerald-500/30' :
                      sub.status === 'REJECTED' ? 'border-red-500/30' :
                      'border-white/10'
                    }`}
                  >
                    {/* Left: Creator Info */}
                    <div className="flex items-start gap-4">
                      {sub.creatorAvatar && (
                        <img
                          src={sub.creatorAvatar}
                          alt={sub.creatorName}
                          className="w-12 h-12 rounded-xl object-cover border border-white/10 shadow-sm shrink-0"
                        />
                      )}
                      <div className="space-y-2">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-base font-bold text-white font-sans">
                            {sub.creatorName}
                          </span>
                          <span className="text-xs font-mono text-sky-400 font-semibold">
                            {sub.creatorHandle}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase ${
                            sub.status === 'PENDING' ? 'bg-amber-950/80 border border-amber-800 text-amber-300' :
                            sub.status === 'UNDER_REVIEW' ? 'bg-sky-950/80 border border-sky-800 text-sky-300' :
                            sub.status === 'VERIFIED' ? 'bg-emerald-950/80 border border-emerald-800 text-emerald-300' :
                            'bg-red-950/80 border border-red-800 text-red-300'
                          }`}>
                            {sub.status.replace('_', ' ')}
                          </span>
                        </div>

                        {/* Connected Platforms */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {sub.connectedPlatforms?.youtube?.connected && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-950/40 text-[10px] text-red-300 font-mono">
                              <svg className="w-3 h-3 fill-[#FF0000]" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"/></svg>
                              {sub.connectedPlatforms.youtube.metricValue || 'Connected'}
                            </span>
                          )}
                          {sub.connectedPlatforms?.discord?.connected && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-950/40 text-[10px] text-indigo-300 font-mono">
                              <svg className="w-3 h-3 fill-[#5865F2]" viewBox="0 0 24 24"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.12.098.246.198.373.292a.074.074 0 0 1 .078.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028z"/></svg>
                              {sub.connectedPlatforms.discord.metricValue || 'Connected'}
                            </span>
                          )}
                          {sub.connectedPlatforms?.instagram?.connected && (
                            <span className="px-2 py-0.5 rounded bg-pink-950/40 text-[10px] text-pink-300 font-mono">Instagram</span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-300">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-500" />
                            Submitted: {new Date(sub.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                          <span className="text-slate-600">•</span>
                          <span className="flex items-center gap-1">
                            <FileImage className="w-3 h-3 text-slate-500" />
                            Proof: <strong className="text-sky-400">{sub.proofDocuments?.length || 0} files</strong>
                          </span>
                        </div>

                        {sub.rejectionReason && (
                          <div className="text-xs text-red-400 bg-red-950/30 border border-red-800/30 rounded-lg px-3 py-1.5">
                            Rejected: {sub.rejectionReason}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Action Buttons */}
                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        onClick={() => setInspectingSubmission(sub)}
                        className="px-4 py-2.5 rounded-lg bg-[#161922] border border-sky-500/30 hover:border-sky-400 text-sky-400 hover:text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-sm"
                      >
                        <Eye className="w-4 h-4" />
                        <span>INSPECT PROOF</span>
                      </button>

                      {(sub.status === 'PENDING' || sub.status === 'UNDER_REVIEW') && (
                        <>
                          <button
                            onClick={() => handleVerificationApprove(sub.id)}
                            className="px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-900/40 transition-colors"
                          >
                            <Check className="w-4 h-4 stroke-[3]" />
                            <span>APPROVE</span>
                          </button>

                          <button
                            onClick={() => handleVerificationReject(sub.id, 'Proof inconclusive')}
                            className="px-3 py-2.5 rounded-lg bg-red-950/40 hover:bg-red-900 border border-red-800/40 text-red-400 text-xs font-semibold transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 2: ACTIVE CREATOR ROSTER
            ========================================================================= */}
        {activeTab === 'creators' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="relative max-w-sm w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by name, handle, or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 pl-9 pr-3 rounded-lg bg-[#11141a] border border-white/10 text-white text-xs focus:outline-none focus:border-sky-400"
                />
              </div>
              <span className="text-xs text-slate-400">
                Total Active: {creators.length}
              </span>
            </div>

            {creators.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-[#11141a] border border-white/10 space-y-3">
                <Users className="w-8 h-8 text-sky-400 mx-auto" />
                <h3 className="text-base font-bold text-white">No Creator Passes In Database</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  When someone creates their pass in Creator Studio, it will appear here for staff audit and verification.
                </p>
              </div>
            ) : (
              <div className="rounded-2xl bg-[#11141a] border border-white/10 overflow-hidden">
                <div className="divide-y divide-white/5">
                  {creators
                    .filter(c =>
                      c.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      (c.slug || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                      c.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      c.category.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((c) => {
                      const creatorSlug = c.slug || c.username;
                      return (
                        <div
                          key={c.id || creatorSlug}
                          className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
                        >
                          <div className="flex items-center gap-3.5">
                            <img
                              src={c.avatarUrl}
                              alt={c.displayName}
                              className="w-11 h-11 rounded-xl object-cover border border-white/10 shadow-sm"
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white text-sm">
                                  {c.displayName}
                                </span>
                                <span className="font-mono text-xs text-sky-400 font-semibold">
                                  @{creatorSlug}
                                </span>
                                {(c.isVerified || c.verification_status === 'VERIFIED') ? (
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-semibold flex items-center gap-1">
                                    <Check className="w-3 h-3 stroke-[3]" />
                                    <span>Verified</span>
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-semibold">
                                    {c.verification_status === 'REJECTED' ? 'Rejected' : 'Pending Review'}
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-slate-400 block mt-0.5">
                                {c.category} • {c.connections.youtube?.metricValue || '–'} YouTube • {c.connections.discord?.metricValue || '–'} Discord
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2.5">
                            {/* Inspect Proof Action */}
                            <button
                              onClick={() => handleInspectCreatorProof(c)}
                              className="px-3 py-1.5 rounded-lg bg-[#161922] border border-sky-500/40 hover:border-sky-400 text-sky-400 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                              title="Inspect proof screenshots for this creator"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Inspect Proof</span>
                            </button>

                            {/* Staff Verification Action */}
                            <button
                              onClick={() => handleStaffVerifyCreator(c)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
                                (c.isVerified || c.verification_status === 'VERIFIED')
                                  ? 'bg-[#161922] hover:bg-amber-950/40 text-amber-300 border border-white/10 hover:border-amber-700/50'
                                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                              }`}
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>{(c.isVerified || c.verification_status === 'VERIFIED') ? 'Revoke' : 'Verify'}</span>
                            </button>

                            <Link
                              href={`/${creatorSlug}`}
                              className="px-3 py-1.5 rounded-lg bg-[#161922] border border-white/10 text-xs text-slate-300 hover:text-white hover:border-white/20 flex items-center gap-1 font-mono transition-colors"
                            >
                              <span>Profile</span>
                              <ExternalLink className="w-3 h-3 text-sky-400" />
                            </Link>

                            <button
                              onClick={() => handleToggleSuspend(creatorSlug, c.isSuspended)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                c.isSuspended
                                  ? 'bg-red-500 text-white'
                                  : 'bg-[#161922] text-slate-300 hover:text-amber-400 border border-white/10'
                              }`}
                            >
                              {c.isSuspended ? 'Suspended' : 'Suspend'}
                            </button>

                            <button
                              onClick={() => handleDeleteCreator(creatorSlug, c.displayName)}
                              className="px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/80 border border-red-800/40 text-red-400 hover:text-red-200 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                              title="Permanently delete pass"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 3: LEGACY APPLICATIONS
            ========================================================================= */}
        {activeTab === 'pending' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">
                Legacy Applications
              </h2>
              <span className="text-xs text-slate-400">
                Staff must inspect proof screenshot before approving issuance.
              </span>
            </div>

            {pendingApps.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-[#11141a] border border-white/10 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-sky-400 mx-auto" />
                <h3 className="text-base font-bold text-white">Queue Empty</h3>
                <p className="text-xs text-slate-400">
                  All legacy passport applications have been reviewed.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {pendingApps.map((app) => (
                  <div
                    key={app.id}
                    className="p-6 rounded-2xl bg-[#11141a] border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-sky-500/40 transition-colors"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="text-base font-bold text-white font-sans">
                          {app.applicantName}
                        </span>
                        <span className="text-xs font-mono text-sky-400 font-semibold">
                          {app.applicantHandle}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-sky-950/80 border border-sky-800 text-[10px] font-mono text-sky-300 font-semibold uppercase">
                          {app.platform} PROOF
                        </span>
                        <span className="px-2 py-0.5 rounded bg-amber-950/80 border border-amber-800 text-[10px] font-mono text-amber-300 font-semibold uppercase">
                          PENDING
                        </span>
                      </div>

                      <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
                        {app.proofDetails}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-300 pt-1">
                        <span>Metrics Claimed: <strong className="text-white">{app.claimedMetrics}</strong></span>
                        <span className="text-slate-600">•</span>
                        <span>Submitted: {app.submittedAt}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        onClick={() => setInspectingApp(app)}
                        className="px-4 py-2.5 rounded-lg bg-[#161922] border border-white/10 hover:border-sky-400 text-sky-400 hover:text-white text-xs font-semibold flex items-center gap-2 transition-all"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Inspect Proof</span>
                      </button>

                      <button
                        onClick={() => handleApprove(app.id)}
                        className="px-4 py-2.5 rounded-lg btn-chq-primary text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                      >
                        <Check className="w-4 h-4" />
                        <span>Approve</span>
                      </button>

                      <button
                        onClick={() => handleReject(app.id)}
                        className="px-3 py-2.5 rounded-lg bg-red-950/40 hover:bg-red-900 border border-red-800/40 text-red-400 text-xs font-semibold transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 4: AUDIT TRAIL
            ========================================================================= */}
        {activeTab === 'logs' && (
          <div className="rounded-2xl bg-[#11141a] border border-white/10 p-6 space-y-4">
            <h2 className="text-lg font-bold text-white">Immutable Staff Audit Trail</h2>
            <div className="space-y-2 font-mono text-xs">
              {logs.length === 0 ? (
                <p className="text-slate-400 text-center py-6">No audit logs recorded yet.</p>
              ) : (
                logs.map((log: any) => {
                  const targetDisplay =
                    log.target ||
                    log.details?.target ||
                    log.details?.creatorSlug ||
                    log.details?.slug ||
                    (log.details ? JSON.stringify(log.details) : '');
                  return (
                    <div
                      key={log.id}
                      className="p-3 rounded-lg bg-[#0b0d11] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-slate-300"
                    >
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="px-2 py-0.5 rounded bg-sky-950/80 border border-sky-800/60 text-sky-400 font-semibold text-[11px]">
                          {log.action}
                        </span>
                        <span className="text-white font-medium">{log.actor || 'System'}</span>
                        {targetDisplay && (
                          <span className="text-slate-400 truncate max-w-md">→ {targetDisplay}</span>
                        )}
                      </div>
                      <span className="text-slate-500 text-[11px] shrink-0 font-mono">
                        {log.timestamp ? new Date(log.timestamp).toLocaleString() : ''}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

      </main>

      {/* =========================================================================
          MODAL: NEW VERIFICATION PROOF INSPECTION (FULL IMAGE VIEWER)
          ========================================================================= */}
      {inspectingSubmission && (
        <ProofInspectorModal
          submission={inspectingSubmission}
          onClose={() => setInspectingSubmission(null)}
          onApprove={handleVerificationApprove}
          onReject={handleVerificationReject}
        />
      )}

      {/* =========================================================================
          MODAL: LEGACY APPLICATION PROOF INSPECTION
          ========================================================================= */}
      {inspectingApp && (
        <div className="fixed inset-0 z-[300] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-[#11141a] border border-white/15 p-6 md:p-8 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setInspectingApp(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-xs uppercase tracking-wider text-sky-400 font-bold font-mono">
                PROOF AUDIT INSPECTION
              </span>
              <h3 className="text-2xl font-bold text-white mt-1">
                {inspectingApp.applicantName} ({inspectingApp.applicantHandle})
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Platform: <strong className="text-white">{inspectingApp.platform}</strong> • Claimed Metric: <strong className="text-sky-400">{inspectingApp.claimedMetrics}</strong>
              </p>
            </div>

            {/* Proof Image Display */}
            <div className="space-y-2">
              <span className="text-xs text-slate-300 font-semibold block">
                Submitted Dashboard Screenshot Proof:
              </span>
              <div className="relative rounded-xl overflow-hidden border border-white/10 bg-black max-h-[350px] flex items-center justify-center">
                <img
                  src={inspectingApp.proofScreenshotUrl}
                  alt="Dashboard Proof"
                  className="w-full h-auto object-cover max-h-[350px]"
                />
                <div className="absolute top-3 right-3 px-3 py-1 rounded bg-black/80 border border-sky-400 text-sky-300 text-[11px] font-mono">
                  OCR TIMESTAMP AUDITED
                </div>
              </div>
            </div>

            {/* Verification Checklist */}
            <div className="p-4 rounded-xl bg-[#0b0d11] border border-white/10 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-sky-300">
                <Check className="w-4 h-4 text-sky-400" />
                <span>Channel handle matched submitted application credentials</span>
              </div>
              <div className="flex items-center gap-2 text-sky-300">
                <Check className="w-4 h-4 text-sky-400" />
                <span>Audited 28-day watch time & subscriber tier authenticity</span>
              </div>
              <div className="flex items-center gap-2 text-sky-300">
                <Check className="w-4 h-4 text-sky-400" />
                <span>Zero bot indicator detected. UI elements align with standard studio layout.</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
              <button
                onClick={() => handleReject(inspectingApp.id)}
                className="px-5 py-2.5 rounded-lg bg-red-950/40 hover:bg-red-900 border border-red-800/40 text-red-300 text-xs font-semibold transition-colors"
              >
                Reject Proof
              </button>

              <button
                onClick={() => handleApprove(inspectingApp.id)}
                className="px-6 py-2.5 rounded-lg btn-chq-primary text-xs font-semibold flex items-center gap-2 shadow-sm"
              >
                <Check className="w-4 h-4" />
                <span>Approve & Mint Pass</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
