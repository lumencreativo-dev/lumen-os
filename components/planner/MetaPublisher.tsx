'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Instagram,
  Facebook,
  Clock,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Eye,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Link2,
  Check,
} from 'lucide-react';
import { PlannerItem, PlannerClient } from './types';
import {
  findSuggestedMetaAccount,
  MetaAccount,
  ClientMetaMapping,
  MatchResult,
} from '@/lib/metaMapping';

interface MetaPublisherProps {
  item: PlannerItem;
  date: string;
  client?: PlannerClient | null;
  clients?: PlannerClient[];
  onUpdate: (patch: Partial<PlannerItem>) => void;
  mode: 'admin' | 'client';
}

export function MetaPublisher({ item, date, client, clients, onUpdate, mode }: MetaPublisherProps) {
  const [targetChannels, setTargetChannels] = useState<string[]>(['instagram']);
  const [accounts, setAccounts] = useState<MetaAccount[]>([]);
  const [mappings, setMappings] = useState<Record<string, ClientMetaMapping>>({});
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [savingMapping, setSavingMapping] = useState(false);
  const [justLinked, setJustLinked] = useState(false);

  const [publishing, setPublishing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [feedback, setFeedback] = useState<{
    success: boolean;
    message: string;
    postId?: string;
  } | null>(null);

  // Determine effective client (direct prop or lookup by item's client_id)
  const effectiveClient = useMemo(() => {
    if (client) return client;
    if (item.client_id && clients && clients.length > 0) {
      return clients.find((c) => c.id === item.client_id) || null;
    }
    return null;
  }, [client, item.client_id, clients]);

  // Load connected Meta accounts & saved mappings
  useEffect(() => {
    async function loadMetaContext() {
      setLoadingAccounts(true);
      try {
        const [accRes, mapRes] = await Promise.all([
          fetch('/api/meta/accounts'),
          fetch('/api/meta/mappings'),
        ]);

        const accData = await accRes.json();
        const mapData = await mapRes.json();

        let loadedAccounts: MetaAccount[] = [];
        let loadedMappings: Record<string, ClientMetaMapping> = {};

        if (accData.success && accData.accounts) {
          loadedAccounts = accData.accounts;
          setAccounts(loadedAccounts);
        }

        if (mapData.success && mapData.mappings) {
          loadedMappings = mapData.mappings;
          setMappings(loadedMappings);
        }

        // Smart auto-suggestion based on client acronym or stored mapping
        if (loadedAccounts.length > 0) {
          const suggestion = findSuggestedMetaAccount(
            effectiveClient?.name,
            effectiveClient?.id,
            loadedAccounts,
            loadedMappings
          );

          if (suggestion.account) {
            setSelectedAccountId(suggestion.account.facebookPageId);
          } else {
            setSelectedAccountId(loadedAccounts[0].facebookPageId);
          }
        }
      } catch (err) {
        console.error('Error cargando cuentas o mapeos de Meta:', err);
      } finally {
        setLoadingAccounts(false);
      }
    }

    loadMetaContext();
  }, [effectiveClient?.id, effectiveClient?.name]);

  // Compute suggestion for current client
  const suggestion: MatchResult = useMemo(() => {
    return findSuggestedMetaAccount(
      effectiveClient?.name,
      effectiveClient?.id,
      accounts,
      mappings
    );
  }, [effectiveClient?.id, effectiveClient?.name, accounts, mappings]);

  const activeAccount = accounts.find((a) => a.facebookPageId === selectedAccountId);
  const igUsername = activeAccount?.instagramUsername || 'lumencreativo';

  // Check if currently selected account differs from suggested client account
  const isMismatch = useMemo(() => {
    if (!effectiveClient || !suggestion.account || !activeAccount) return false;
    return activeAccount.facebookPageId !== suggestion.account.facebookPageId;
  }, [effectiveClient, suggestion.account, activeAccount]);

  const mediaUrl = item.material_link || '';
  const fullCaption = [item.copy, item.hashtags].filter(Boolean).join('\n\n');

  // Link selected account permanently to this client
  const handleLinkPermanently = async () => {
    if (!effectiveClient || !activeAccount) return;
    setSavingMapping(true);
    try {
      const res = await fetch('/api/meta/mappings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: effectiveClient.id,
          clientName: effectiveClient.name,
          igUsername: activeAccount.instagramUsername,
          facebookPageId: activeAccount.facebookPageId,
          facebookPageName: activeAccount.facebookPageName,
        }),
      });
      const data = await res.json();
      if (data.success && data.mappings) {
        setMappings(data.mappings);
        setJustLinked(true);
        setTimeout(() => setJustLinked(false), 3000);
      }
    } catch (e) {
      console.error('Error al guardar mapeo permanente:', e);
    } finally {
      setSavingMapping(false);
    }
  };

  const handlePublish = async (publishNow: boolean) => {
    setPublishing(true);
    setFeedback(null);

    const scheduledTime = publishNow ? null : `${date}T${item.hour || '12:00'}:00`;

    try {
      const res = await fetch('/api/meta/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: item.id,
          caption: fullCaption || item.title,
          mediaUrl: mediaUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800',
          mediaType: item.fmt === 'Reel' ? 'REEL' : 'IMAGE',
          targetChannels,
          scheduledTime,
          customIgId: activeAccount?.instagramBusinessAccountId,
          customFbId: activeAccount?.facebookPageId,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error al conectar con la API de Meta');
      }

      const isDry = data.dryRun;
      setFeedback({
        success: true,
        message: publishNow
          ? `¡Publicado exitosamente ${isDry ? '(Modo Seguro Activo)' : ''}!`
          : `¡Programado con éxito en Meta para el ${date} a las ${item.hour || '12:00'} ${isDry ? '(Modo Seguro Activo)' : ''}!`,
        postId: data.metaPostId,
      });

      // Update state locally
      onUpdate({
        status: publishNow ? 'Publicado' : 'Programado',
      });
    } catch (err: any) {
      setFeedback({
        success: false,
        message: err.message || 'Error desconocido al procesar con Meta Business Suite',
      });
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="bg-[#181818] border border-white/10 rounded-2xl p-4 sm:p-5 space-y-4 my-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#F7931E] to-[#FFB74D] flex items-center justify-center text-black font-black text-xs shadow-md">
            M
          </div>
          <div>
            <h4 className="text-white font-black text-sm flex items-center gap-1.5">
              <span>Programador Meta Business Suite</span>
              <span className="text-[10px] font-semibold bg-[#F7931E]/20 text-[#F7931E] border border-[#F7931E]/40 px-2 py-0.2 rounded-full">
                API Oficial
              </span>
            </h4>
            <p className="text-white/40 text-[11px]">
              {effectiveClient ? (
                <span>
                  Publicando para <strong className="text-white/80">{effectiveClient.name}</strong>
                </span>
              ) : (
                'Programa o publica directo a Instagram y Facebook desde esta ficha'
              )}
            </p>
          </div>
        </div>

        {/* Safe Dry Run Badge */}
        <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2.5 py-1 rounded-xl text-xs font-semibold self-start sm:self-auto">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Modo Seguro Activo</span>
        </div>
      </div>

      {/* Smart Suggestion Badge */}
      {effectiveClient && suggestion.account && (
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-gradient-to-r from-[#F7931E]/15 via-white/5 to-white/5 border border-[#F7931E]/25 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-[#F7931E]/20 text-[#F7931E] flex items-center justify-center shrink-0">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
            <div>
              <div className="flex items-center gap-1.5 font-bold text-white text-[11px]">
                <span>Cuenta sugerida para {effectiveClient.name}:</span>
                <span className="text-[#F7931E] font-black">
                  {suggestion.account.instagramUsername
                    ? `@${suggestion.account.instagramUsername}`
                    : suggestion.account.facebookPageName}
                </span>
                {suggestion.confidence === 'explicit' && (
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded-md">
                    ✓ Vinculada
                  </span>
                )}
              </div>
              <p className="text-white/40 text-[10px]">{suggestion.reason}</p>
            </div>
          </div>

          {/* Quick link button if heuristic */}
          {suggestion.confidence === 'heuristic' && (
            <button
              type="button"
              onClick={handleLinkPermanently}
              disabled={savingMapping || justLinked}
              className="text-[10px] flex items-center gap-1 bg-white/10 hover:bg-white/20 text-white font-semibold px-2.5 py-1 rounded-lg transition-all disabled:opacity-60"
            >
              {justLinked ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">¡Vinculada!</span>
                </>
              ) : (
                <>
                  <Link2 className="w-3 h-3 text-[#F7931E]" />
                  <span>Recordar como fija</span>
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Safety Warning if Account Mismatches Client */}
      {isMismatch && (
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs animate-fade-in">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-amber-300">
              ⚠️ Alerta de Seguridad (Posible confusión de cuenta):
            </span>
            <p className="text-[11px] text-amber-200/90 leading-relaxed">
              Estás editando un contenido de <strong>{effectiveClient?.name}</strong>, pero seleccionaste la cuenta de{' '}
              <strong className="text-white underline">
                {activeAccount?.facebookPageName} (@{activeAccount?.instagramUsername})
              </strong>
              .
            </p>
            {suggestion.account && (
              <button
                type="button"
                onClick={() => setSelectedAccountId(suggestion.account!.facebookPageId)}
                className="mt-1 text-[11px] text-[#F7931E] hover:underline font-bold flex items-center gap-1"
              >
                ➔ Cambiar a la cuenta sugerida de {effectiveClient?.name} (@
                {suggestion.account.instagramUsername})
              </button>
            )}
          </div>
        </div>
      )}

      {/* Account Selector & Channel Toggles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Account selection */}
        <div className="space-y-1">
          <label className="text-white/50 text-[11px] font-semibold uppercase tracking-wider flex items-center justify-between">
            <span>Cuenta de Meta / Cliente</span>
            {suggestion.account?.facebookPageId === selectedAccountId && (
              <span className="text-[#F7931E] text-[10px] font-bold">✓ Coincide con {effectiveClient?.name}</span>
            )}
          </label>
          <select
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            disabled={loadingAccounts}
            className={`w-full bg-[#202020] border rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-[#F7931E]/70 [color-scheme:dark] ${
              isMismatch ? 'border-amber-500/60 ring-1 ring-amber-500/30' : 'border-white/20'
            }`}
          >
            {accounts.map((acc) => {
              const isSuggested = suggestion.account?.facebookPageId === acc.facebookPageId;
              return (
                <option key={acc.facebookPageId} value={acc.facebookPageId}>
                  {isSuggested ? '★ [Sugerida] ' : ''}
                  {acc.facebookPageName} {acc.instagramUsername ? `(@${acc.instagramUsername})` : ''}
                </option>
              );
            })}
          </select>
        </div>

        {/* Channels checkboxes */}
        <div className="space-y-1">
          <label className="text-white/50 text-[11px] font-semibold uppercase tracking-wider">
            Canales de Publicación
          </label>
          <div className="flex gap-2 pt-0.5">
            <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/20 bg-white/5 text-xs text-white cursor-pointer hover:bg-white/10 font-semibold">
              <input
                type="checkbox"
                checked={targetChannels.includes('instagram')}
                onChange={(e) =>
                  setTargetChannels((prev) =>
                    e.target.checked ? [...prev, 'instagram'] : prev.filter((c) => c !== 'instagram')
                  )
                }
                className="rounded text-[#E11D48] focus:ring-0"
              />
              <Instagram className="w-3.5 h-3.5 text-pink-400" />
              <span>Instagram</span>
            </label>

            <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/20 bg-white/5 text-xs text-white cursor-pointer hover:bg-white/10 font-semibold">
              <input
                type="checkbox"
                checked={targetChannels.includes('facebook')}
                onChange={(e) =>
                  setTargetChannels((prev) =>
                    e.target.checked ? [...prev, 'facebook'] : prev.filter((c) => c !== 'facebook')
                  )
                }
                className="rounded text-blue-500 focus:ring-0"
              />
              <Facebook className="w-3.5 h-3.5 text-blue-400" />
              <span>Facebook</span>
            </label>
          </div>
        </div>
      </div>

      {/* Feedback banner if available */}
      {feedback && (
        <div
          className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs ${
            feedback.success
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-red-500/10 border-red-500/30 text-red-300'
          }`}
        >
          {feedback.success ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <p className="font-semibold">{feedback.message}</p>
            {feedback.postId && (
              <p className="text-[10px] text-white/40 mt-0.5">ID: {feedback.postId}</p>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons: Preview Toggle, Publish Now & Schedule */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/5">
        <button
          type="button"
          onClick={() => setShowPreview((p) => !p)}
          className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 font-medium transition-all"
        >
          <Eye className="w-3.5 h-3.5 text-[#F7931E]" />
          <span>{showPreview ? 'Ocultar vista previa' : 'Ver maqueta Instagram'}</span>
          {showPreview ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>

        <div className="flex items-center gap-2">
          {/* Schedule button */}
          <button
            type="button"
            disabled={publishing || targetChannels.length === 0}
            onClick={() => handlePublish(false)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 text-white text-xs font-bold transition-all disabled:opacity-40"
          >
            {publishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Clock className="w-3.5 h-3.5 text-[#F7931E]" />}
            <span>Programar ({date} {item.hour || '12:00'})</span>
          </button>

          {/* Instant publish button */}
          <button
            type="button"
            disabled={publishing || targetChannels.length === 0}
            onClick={() => handlePublish(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#F7931E] hover:bg-[#F7931E]/90 active:scale-95 text-white text-xs font-bold shadow-lg shadow-[#F7931E]/20 transition-all disabled:opacity-40"
          >
            {publishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            <span>Publicar ahora</span>
          </button>
        </div>
      </div>

      {/* Collapsible Instagram Mockup Preview */}
      {showPreview && (
        <div className="mt-3 p-4 rounded-2xl bg-black/50 border border-white/10 max-w-sm mx-auto shadow-2xl space-y-3 animate-fade-in">
          {/* Mockup Header */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 p-0.5">
              <div className="w-full h-full rounded-full bg-black flex items-center justify-center text-[10px] font-bold text-white">
                {igUsername[0]?.toUpperCase() || 'L'}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-white truncate">@{igUsername}</span>
                <span className="text-[10px] text-white/40">· Siguiendo</span>
              </div>
              <span className="text-[10px] text-white/30">{activeAccount?.facebookPageName}</span>
            </div>
          </div>

          {/* Media thumbnail */}
          <div className="aspect-square w-full rounded-xl bg-[#141414] border border-white/10 overflow-hidden flex items-center justify-center relative">
            {mediaUrl ? (
              <img src={mediaUrl} alt={item.title} className="w-full h-full object-cover" />
            ) : (
              <div className="text-center p-4">
                <Instagram className="w-8 h-8 text-white/20 mx-auto mb-2" />
                <span className="text-white/40 text-[11px]">Sin imagen asignada (se usará placeholder)</span>
              </div>
            )}
            <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded-full text-[9px] text-white/80 font-mono">
              {item.fmt}
            </div>
          </div>

          {/* Mockup Caption */}
          <div className="space-y-1 text-xs">
            <p className="text-white/90 line-clamp-3">
              <strong className="text-white mr-1.5">@{igUsername}</strong>
              {fullCaption || item.title || 'Tu copy aparecerá aquí...'}
            </p>
            <span className="text-[10px] text-white/30 uppercase tracking-wider block">
              Programado para {date}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
