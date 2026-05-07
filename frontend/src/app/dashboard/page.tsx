'use client';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login');
  }, [status, router]);

  if (status === 'loading' || !session) {
    return (
      <div style={{
        minHeight: '100vh', background: 'var(--bg-0)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.18em', color: 'var(--fg-3)',
      }}>
        LOADING…
      </div>
    );
  }

  const user = session.user;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-0)', color: 'var(--fg-0)' }}>
      {/* Nav */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 40px', borderBottom: '1px solid var(--fg-4)',
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(6,6,8,0.85)', backdropFilter: 'blur(12px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%',
            background: 'var(--accent-bright)', boxShadow: '0 0 12px var(--accent)',
          }} />
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 500, letterSpacing: '-0.01em' }}>
            SilentSpeak <span style={{ color: 'var(--fg-3)', fontWeight: 400 }}>.ai</span>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {user?.image && (
            <img src={user.image} alt="avatar" style={{
              width: 28, height: 28, borderRadius: '50%',
              border: '1px solid var(--fg-4)',
            }} />
          )}
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-2)' }}>
            {user?.name ?? user?.email}
          </span>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            style={{
              fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.1em',
              color: 'var(--fg-3)', background: 'transparent',
              border: '1px solid var(--fg-4)', borderRadius: 99,
              padding: '6px 14px', cursor: 'pointer', transition: 'all 160ms',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--fg-0)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--fg-2)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--fg-3)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--fg-4)'; }}
          >
            SIGN OUT
          </button>
        </div>
      </nav>

      {/* Main */}
      <main style={{ padding: 'clamp(40px,8vh,80px) clamp(24px,6vw,80px)' }}>
        {/* Header */}
        <div style={{ marginBottom: 48 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.2em',
            color: 'var(--fg-3)', marginBottom: 16,
          }}>
            <span style={{ width: 24, height: 1, background: 'linear-gradient(90deg,transparent,var(--fg-4))' }} />
            DASHBOARD
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,4vw,48px)',
            fontWeight: 500, letterSpacing: '-0.03em', margin: 0, lineHeight: 1.1,
          }}>
            Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}.
          </h1>
          <p style={{
            fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--fg-2)',
            marginTop: 10, maxWidth: 480,
          }}>
            Choose a mode to get started.
          </p>
        </div>

        {/* Feature cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 20, maxWidth: 900,
        }}>
          {/* Lip Reading */}
          <FeatureCard
            href="/gesture?mode=vsr"
            tag="VISUAL SPEECH"
            title="Lip Reading"
            description="Record a silent video and get a real-time transcript. Powered by ESPnet VSR + LLM correction."
            icon={<LipIcon />}
            accent="var(--accent)"
          />

          {/* Gesture Recognition */}
          <FeatureCard
            href="/gesture"
            tag="HAND GESTURES"
            title="Gesture Recognition"
            description="Point your camera at your hands. 30+ gestures detected in real time via MediaPipe."
            icon={<HandIcon />}
            accent="#a0e0b0"
          />
        </div>

        {/* Footer note */}
        <div style={{
          marginTop: 60, fontFamily: 'var(--font-mono)', fontSize: 10,
          letterSpacing: '0.14em', color: 'var(--fg-4)', display: 'flex', gap: 16,
        }}>
          <span>NO AUDIO RECORDED</span>
          <span>·</span>
          <span>ON-DEVICE INFERENCE</span>
          <span>·</span>
          <Link href="/" style={{ color: 'var(--fg-4)', textDecoration: 'none' }}>
            ← BACK TO SITE
          </Link>
        </div>
      </main>
    </div>
  );
}


function FeatureCard({
  href, tag, title, description, icon, accent,
}: {
  href: string; tag: string; title: string;
  description: string; icon: React.ReactNode; accent: string;
}) {
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div
        style={{
          background: 'var(--bg-1)', border: '1px solid var(--fg-4)',
          borderRadius: 14, padding: '28px 28px 24px', cursor: 'pointer',
          transition: 'all 200ms ease', position: 'relative', overflow: 'hidden',
        }}
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLDivElement;
          el.style.borderColor = accent + '55';
          el.style.background = 'var(--bg-2)';
          el.style.transform = 'translateY(-2px)';
          el.style.boxShadow = `0 8px 32px ${accent}18`;
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLDivElement;
          el.style.borderColor = 'var(--fg-4)';
          el.style.background = 'var(--bg-1)';
          el.style.transform = '';
          el.style.boxShadow = '';
        }}
      >
        {/* Accent corner line */}
        <div style={{
          position: 'absolute', top: 0, left: 0, width: 40, height: 2,
          background: `linear-gradient(90deg, ${accent}, transparent)`,
          borderRadius: '2px 0 0 0',
        }} />

        {/* Icon */}
        <div style={{
          width: 44, height: 44, borderRadius: 10,
          background: accent + '18', border: `1px solid ${accent}33`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 18, color: accent,
        }}>
          {icon}
        </div>

        {/* Tag */}
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.2em',
          color: accent, marginBottom: 8,
        }}>
          {tag}
        </div>

        {/* Title */}
        <h2 style={{
          fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 500,
          letterSpacing: '-0.02em', color: 'var(--fg-0)', margin: '0 0 10px',
        }}>
          {title}
        </h2>

        {/* Description */}
        <p style={{
          fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--fg-2)',
          lineHeight: 1.6, margin: '0 0 20px',
        }}>
          {description}
        </p>

        {/* CTA arrow */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', color: accent,
        }}>
          <span>OPEN</span>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 6h8m0 0L6 2m4 4l-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </Link>
  );
}

function LipIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3C7 3 3 7 3 12s4 9 9 9 9-4 9-9-4-9-9-9z" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <line x1="9" y1="10" x2="9.01" y2="10" strokeWidth="2" />
      <line x1="15" y1="10" x2="15.01" y2="10" strokeWidth="2" />
    </svg>
  );
}

function HandIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 11V7a2 2 0 00-4 0v5M10 11V5a2 2 0 00-4 0v6M6 11a2 2 0 00-4 0v4a8 8 0 008 8h4a8 8 0 008-8v-5a2 2 0 00-4 0" />
    </svg>
  );
}
