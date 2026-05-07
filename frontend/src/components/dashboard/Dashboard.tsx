'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import HistoryPanel from './HistoryPanel';
import WebcamCapture from './WebcamCapture';
import UploadArea from './UploadArea';
import LoadingScreen from './LoadingScreen';
import ResultPopup from './ResultPopup';
import type { HistoryEntry, ResultData } from './types';

type Mode = 'idle' | 'webcam' | 'upload' | 'loading';

interface Props {
  user: { name: string | null; email: string | null; image: string | null };
}

const WS_URL   = process.env.NEXT_PUBLIC_BACKEND_WS   ?? 'ws://localhost:8000/ws';
const HTTP_URL = process.env.NEXT_PUBLIC_BACKEND_HTTP ?? 'http://localhost:8000';

// ── small icon components ──────────────────────────────────────────────────────

function CameraIcon() {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="12" width="26" height="20" rx="3" />
      <path d="M31 18l8-4v16l-8-4" />
      <circle cx="18" cy="22" r="5" />
    </svg>
  );
}
function UploadIcon() {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 28V14M15 21l7-7 7 7" />
      <path d="M9 32v3a2 2 0 002 2h22a2 2 0 002-2v-3" />
    </svg>
  );
}

function CornerMark({ v, h }: { v: 'top' | 'bottom'; h: 'left' | 'right' }) {
  return (
    <span style={{
      position: 'absolute', width: 10, height: 10,
      borderTop: v === 'top' ? '1.5px solid var(--accent)' : 'none',
      borderBottom: v === 'bottom' ? '1.5px solid var(--accent)' : 'none',
      borderLeft: h === 'left' ? '1.5px solid var(--accent)' : 'none',
      borderRight: h === 'right' ? '1.5px solid var(--accent)' : 'none',
      top: v === 'top' ? 8 : 'auto', bottom: v === 'bottom' ? 8 : 'auto',
      left: h === 'left' ? 8 : 'auto', right: h === 'right' ? 8 : 'auto',
      opacity: 0.5,
    }} />
  );
}

function ActionCard({ icon, label, desc, badge, accent, onClick }: {
  icon: React.ReactNode; label: string; desc: string; badge: string; accent?: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        position: 'relative', width: 220, padding: '32px 24px',
        background: accent
          ? 'linear-gradient(180deg, rgba(184,216,248,0.07), rgba(184,216,248,0.02))'
          : 'linear-gradient(180deg, var(--bg-2), var(--bg-1))',
        border: `1px solid ${accent ? 'rgba(184,216,248,0.2)' : 'var(--fg-4)'}`,
        borderRadius: 10, cursor: 'pointer',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
        textAlign: 'center', transition: 'all 200ms ease',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-3px)';
        (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(184,216,248,0.45)';
        (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 12px 40px rgba(184,216,248,0.08)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.transform = '';
        (e.currentTarget as HTMLButtonElement).style.borderColor = accent ? 'rgba(184,216,248,0.2)' : 'var(--fg-4)';
        (e.currentTarget as HTMLButtonElement).style.boxShadow = '';
      }}
    >
      <CornerMark v="top" h="left" /><CornerMark v="top" h="right" />
      <CornerMark v="bottom" h="left" /><CornerMark v="bottom" h="right" />
      <div style={{ color: 'var(--accent)' }}>{icon}</div>
      <div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 500, letterSpacing: '-0.02em', color: 'var(--fg-0)', marginBottom: 6 }}>{label}</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-2)', letterSpacing: '0.06em' }}>{desc}</div>
      </div>
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.15em',
        color: accent ? 'var(--accent)' : 'var(--fg-3)',
        padding: '4px 10px', border: `1px solid ${accent ? 'rgba(184,216,248,0.3)' : 'var(--fg-4)'}`, borderRadius: 99,
      }}>
        {badge}
      </div>
    </button>
  );
}

function IdleScreen({ onWebcam, onUpload }: { onWebcam: () => void; onUpload: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 48, padding: '40px 32px' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.2em', color: 'var(--accent)', marginBottom: 20 }}>
          <span style={{ width: 32, height: 1, background: 'linear-gradient(90deg, transparent, var(--accent))' }} />
          VISUAL SPEECH RECOGNITION
          <span style={{ width: 32, height: 1, background: 'linear-gradient(90deg, var(--accent), transparent)' }} />
        </div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(26px, 3.5vw, 44px)', fontWeight: 500, letterSpacing: '-0.03em', marginBottom: 12, color: 'var(--fg-0)' }}>
          Choose your input
        </h2>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-3)', letterSpacing: '0.06em' }}>
          Stream live video or upload a recorded clip
        </p>
      </div>
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
        <ActionCard icon={<CameraIcon />} label="Live Webcam" desc="Real-time lip reading via camera" badge="● LIVE" accent onClick={onWebcam} />
        <ActionCard icon={<UploadIcon />} label="Upload Video" desc="Analyse a pre-recorded clip" badge="MP4 / WEBM" onClick={onUpload} />
      </div>
    </div>
  );
}

// ── main Dashboard component ───────────────────────────────────────────────────

export default function Dashboard({ user }: Props) {
  const [mode, setMode]                   = useState<Mode>('idle');
  const [result, setResult]               = useState<ResultData | null>(null);
  const [showPopup, setShowPopup]         = useState(false);
  const [history, setHistory]             = useState<HistoryEntry[]>([]);
  const [selectedId, setSelectedId]       = useState<string | null>(null);
  const [wsReady, setWsReady]             = useState(false);
  const [error, setError]                 = useState<string | null>(null);

  const wsRef          = useRef<WebSocket | null>(null);
  const inputKindRef   = useRef<'webcam' | 'upload'>('webcam');
  // Stable ref to state setters so the WS onmessage closure never goes stale
  const setModeRef     = useRef(setMode);
  const setResultRef   = useRef(setResult);
  const setShowPopupRef = useRef(setShowPopup);
  const setErrorRef    = useRef(setError);
  const setWsReadyRef  = useRef(setWsReady);

  // Keep refs synced (they are stable functions from useState so these never actually change)
  useEffect(() => {
    setModeRef.current      = setMode;
    setResultRef.current    = setResult;
    setShowPopupRef.current = setShowPopup;
    setErrorRef.current     = setError;
    setWsReadyRef.current   = setWsReady;
  });

  // localStorage history
  useEffect(() => {
    try { const s = localStorage.getItem('ss-history'); if (s) setHistory(JSON.parse(s)); } catch {}
  }, []);
  useEffect(() => {
    localStorage.setItem('ss-history', JSON.stringify(history));
  }, [history]);

  const pushHistory = useCallback((entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => {
    const id = crypto.randomUUID();
    setHistory(prev => [{ ...entry, id, timestamp: Date.now() }, ...prev].slice(0, 50));
    setSelectedId(id);
    return id;
  }, []);

  // ── WebSocket ──────────────────────────────────────────────────────────────

  const disconnectWS = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.onmessage = null;
      wsRef.current.onerror   = null;
      wsRef.current.onclose   = null;
      wsRef.current.close();
      wsRef.current = null;
    }
    setWsReadyRef.current(false);
  }, []);

  const connectWS = useCallback(() => {
    disconnectWS();

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onmessage = (e) => {
      let msg: Record<string, unknown>;
      try { msg = JSON.parse(e.data as string); }
      catch { console.warn('[WS] non-JSON message', e.data); return; }

      console.log('[WS ←]', msg.type, msg);

      const t = msg.type as string;

      if (t === 'ready') {
        setWsReadyRef.current(true);

      } else if (t === 'recording_started') {
        // nothing extra needed

      } else if (t === 'recording_stopped') {
        // switch to loading immediately so user sees feedback
        setModeRef.current('loading');

      } else if (t === 'processing') {
        setModeRef.current('loading');

      } else if (t === 'result') {
        const raw        = (msg.raw        as string)  ?? '';
        const corrected  = (msg.corrected  as string)  ?? '';
        const candidates = (msg.candidates as Array<{ text: string; score: number }>) ?? [];
        const input      = inputKindRef.current;

        const data: ResultData = { raw, corrected, candidates, input };
        setResultRef.current(data);
        setShowPopupRef.current(true);
        setModeRef.current('idle');

        // persist to history (done outside to avoid stale closure)
        setHistory(prev => {
          const id = crypto.randomUUID();
          const entry: HistoryEntry = { id, timestamp: Date.now(), input, raw, corrected, candidates };
          setSelectedId(id);
          return [entry, ...prev].slice(0, 50);
        });

      } else if (t === 'error') {
        const msg2 = (msg.message as string) ?? 'Backend error';
        console.error('[WS error]', msg2);
        setErrorRef.current(msg2);
        // If we were loading, go back to idle; if webcam, stay
        setModeRef.current(prev => prev === 'loading' ? 'idle' : prev);

      } else if (t === 'pong' || t === 'history_reset') {
        // no-op
      }
    };

    ws.onerror = (ev) => {
      console.error('[WS onerror]', ev);
      setErrorRef.current('Cannot reach backend — is the server running on port 8000?');
      setModeRef.current('idle');
      setWsReadyRef.current(false);
    };

    ws.onclose = () => {
      console.log('[WS closed]');
      setWsReadyRef.current(false);
    };
  }, [disconnectWS]);

  // ── Webcam helpers ─────────────────────────────────────────────────────────

  const startWebcam = useCallback(() => {
    inputKindRef.current = 'webcam';
    setError(null);
    setMode('webcam');
    connectWS();
  }, [connectWS]);

  const leaveWebcam = useCallback(() => {
    disconnectWS();
    setMode('idle');
    setError(null);
  }, [disconnectWS]);

  const sendWsJson = useCallback((msg: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('[WS →]', msg);
      wsRef.current.send(JSON.stringify(msg));
    } else {
      console.warn('[WS →] not open, dropping', msg);
    }
  }, []);

  const handleStartRecording = useCallback(() => sendWsJson({ type: 'start_recording' }), [sendWsJson]);
  const handleStopRecording  = useCallback(() => sendWsJson({ type: 'stop_recording' }),  [sendWsJson]);
  const handleFrame          = useCallback((buf: ArrayBuffer) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) wsRef.current.send(buf);
  }, []);

  // ── Upload helper ──────────────────────────────────────────────────────────

  const handleUploadFile = useCallback(async (file: File) => {
    inputKindRef.current = 'upload';
    setError(null);
    setMode('loading');

    const form = new FormData();
    form.append('file', file);
    try {
      const res = await fetch(`${HTTP_URL}/infer`, { method: 'POST', body: form });
      if (!res.ok) throw new Error(`Server responded ${res.status}`);
      const data = await res.json();

      const raw        = (data.raw        as string)  ?? '';
      const corrected  = (data.corrected  as string)  ?? '';
      const candidates = (data.candidates as Array<{ text: string; score: number }>) ?? [];
      const input: 'webcam' | 'upload' = 'upload';

      setResult({ raw, corrected, candidates, input });
      setShowPopup(true);
      setMode('idle');
      pushHistory({ input, raw, corrected, candidates });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      setError(msg);
      setMode('upload');
    }
  }, [pushHistory]);

  // ── Popup actions ──────────────────────────────────────────────────────────

  const handlePopupClose    = useCallback(() => setShowPopup(false), []);
  const handleNewSession    = useCallback(() => { setShowPopup(false); setMode('idle'); }, []);

  // ── Global reset ──────────────────────────────────────────────────────────

  const reset = useCallback(() => {
    disconnectWS();
    setShowPopup(false);
    setError(null);
    setMode('idle');
  }, [disconnectWS]);

  // cleanup WS on unmount
  useEffect(() => () => { wsRef.current?.close(); }, []);

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-0)', overflow: 'hidden' }}>

      {/* ── Sidebar ── */}
      <HistoryPanel
        user={user}
        history={history}
        selectedId={selectedId}
        onSelect={entry => {
          setSelectedId(entry.id);
          setResult({ raw: entry.raw, corrected: entry.corrected, candidates: entry.candidates, input: entry.input });
          setShowPopup(true);
        }}
        onClear={() => { setHistory([]); setSelectedId(null); }}
      />

      {/* ── Main column ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>

        {/* Top bar */}
        <div style={{
          flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 28px', borderBottom: '1px solid var(--fg-4)',
          background: 'rgba(6,6,8,0.6)', backdropFilter: 'blur(12px)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-bright)',
              boxShadow: '0 0 14px var(--accent)', animation: 'pulse-dot 2.4s ease-in-out infinite',
            }} />
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 500, letterSpacing: '-0.01em' }}>
              SilentSpeak <span style={{ color: 'var(--fg-3)', fontWeight: 400 }}>AI</span>
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontFamily: 'var(--font-mono)', fontSize: 10 }}>
            {mode === 'webcam' && wsReady && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent)' }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 6px var(--accent)', animation: 'pulse-dot 1.6s ease-in-out infinite' }} />
                BACKEND READY
              </span>
            )}
            {mode === 'loading' && (
              <button onClick={reset} style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.1em', color: 'var(--fg-3)', background: 'none', border: 'none', cursor: 'pointer', transition: 'color 140ms ease' }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--fg-0)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--fg-3)'; }}>
                ← CANCEL
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, minHeight: 0, overflow: 'auto', position: 'relative' }}>
          {error && (
            <div style={{
              position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(192,57,43,0.12)', border: '1px solid rgba(192,57,43,0.35)',
              borderRadius: 6, padding: '8px 20px', zIndex: 20, whiteSpace: 'nowrap',
              fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.05em', color: '#ff8b8b',
              animation: 'fade-up 0.3s ease both', cursor: 'pointer',
            }} onClick={() => setError(null)}>
              ⚠ {error} &nbsp;×
            </div>
          )}

          <div style={{ height: '100%' }}>
            {mode === 'idle' && (
              <IdleScreen
                onWebcam={startWebcam}
                onUpload={() => { setError(null); setMode('upload'); }}
              />
            )}
            {mode === 'webcam' && (
              <WebcamCapture
                wsReady={wsReady}
                onFrame={handleFrame}
                onStartRecording={handleStartRecording}
                onStopRecording={handleStopRecording}
                onBack={leaveWebcam}
              />
            )}
            {mode === 'upload' && (
              <UploadArea
                onFile={handleUploadFile}
                onBack={() => { setError(null); setMode('idle'); }}
              />
            )}
            {mode === 'loading' && <LoadingScreen />}
          </div>
        </div>
      </div>

      {/* ── Result popup (overlay) ── */}
      <ResultPopup
        result={result}
        show={showPopup}
        onClose={handlePopupClose}
        onTryAgain={handleNewSession}
      />
    </div>
  );
}
