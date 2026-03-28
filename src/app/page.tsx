import { Metadata } from 'next';
import LayoutContainer from '@/layouts/layout-container';

export const metadata: Metadata = {
  title: 'Gnolove is becoming Memba',
  description:
    'The Gnolove contributor scoreboard has moved to Memba. Visit memba.samourai.app/gnolove for the latest data.',
  alternates: {
    canonical: 'https://memba.samourai.app/gnolove',
  },
};

const MEMBA_GNOLOVE_URL = 'https://memba.samourai.app/gnolove';

export default function HomePage() {
  return (
    <LayoutContainer>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          gap: '24px',
          textAlign: 'center',
          padding: '40px 20px',
        }}
      >
        <div style={{ fontSize: '64px' }}>💚</div>

        <h1 style={{ fontSize: '32px', fontWeight: 700, margin: 0 }}>
          Gnolove is becoming Memba
        </h1>

        <p
          style={{
            fontSize: '16px',
            maxWidth: '560px',
            lineHeight: 1.7,
            opacity: 0.7,
          }}
        >
          The contributor scoreboard, weekly reports, and analytics you know
          from Gnolove are now part of{' '}
          <strong>Memba</strong> — our Gno multisig &amp; DAO wallet.
          Same data, better experience, one unified platform.
        </p>

        <a
          href={MEMBA_GNOLOVE_URL}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '14px 32px',
            fontSize: '16px',
            fontWeight: 600,
            color: '#fff',
            background: 'linear-gradient(135deg, #00d4aa, #00b894)',
            borderRadius: '12px',
            textDecoration: 'none',
            boxShadow: '0 4px 20px rgba(0, 212, 170, 0.3)',
          }}
        >
          Open Gnolove on Memba →
        </a>

      </div>
    </LayoutContainer>
  );
}
