import React, { useEffect, useState } from 'react';

// Clave de desbloqueo. Cambiala por la que quieras antes de desplegar.
// Cuando aparezca el sistema suspendido, presiona Ctrl + Shift + U
// y escribe esta clave para restaurar el acceso al sitio.
const SECRET = 'LUCKYSNAP-2026';
const STORAGE_KEY = 'ls_maintenance_unlock_v1';

interface Props {
  children: React.ReactNode;
}

const MaintenanceOverlay: React.FC<Props> = ({ children }) => {
  const [unlocked, setUnlocked] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (unlocked) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && (e.key === 'U' || e.key === 'u')) {
        e.preventDefault();
        const pwd = window.prompt('Clave de acceso:');
        if (pwd === null) return;
        if (pwd === SECRET) {
          try { localStorage.setItem(STORAGE_KEY, '1'); } catch {}
          setUnlocked(true);
        } else {
          window.alert('Clave incorrecta.');
        }
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [unlocked]);

  if (unlocked) return <>{children}</>;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#0a0a0a',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2147483647,
        padding: '24px',
        textAlign: 'center',
        fontFamily:
          'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      }}
    >
      <div
        style={{
          width: '88px',
          height: '88px',
          borderRadius: '50%',
          backgroundColor: '#1a1a1a',
          border: '2px solid #2a2a2a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '28px',
          fontSize: '40px',
        }}
      >
        🔒
      </div>
      <h1
        style={{
          fontSize: '34px',
          fontWeight: 700,
          margin: '0 0 14px',
          maxWidth: '640px',
          letterSpacing: '-0.01em',
        }}
      >
        Sistema suspendido
      </h1>
      <p
        style={{
          fontSize: '17px',
          color: '#b8b8b8',
          margin: 0,
          maxWidth: '520px',
          lineHeight: 1.55,
        }}
      >
        Comunícate con el administrador para más detalles.
      </p>
    </div>
  );
};

export default MaintenanceOverlay;
