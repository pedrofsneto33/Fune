'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body style={{ fontFamily: 'system-ui', padding: 40 }}>
        <h1>Algo deu errado</h1>
        <p>O erro foi registrado. Tente novamente.</p>
        <button onClick={() => reset()} style={{ padding: '8px 16px', cursor: 'pointer' }}>
          Tentar novamente
        </button>
      </body>
    </html>
  );
}
