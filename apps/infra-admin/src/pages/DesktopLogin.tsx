import React, { useEffect, useState } from 'react';
import { app } from '@infrasuite/firebase';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

export default function DesktopLogin() {
  const [status, setStatus] = useState('Iniciando sesión con Google...');
  const [error, setError] = useState('');

  useEffect(() => {
    const login = async () => {
      try {
        console.log("DesktopLogin: Starting login process...");
        const authInstance = getAuth(app);
        if (!authInstance) {
          throw new Error('Firebase Auth no disponible');
        }

        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({
          prompt: 'select_account'
        });

        console.log("DesktopLogin: Opening popup...");
        const result = await signInWithPopup(authInstance, provider);
        
        console.log("DesktopLogin: Popup successful. Getting credential...");
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const idToken = credential?.idToken;

        if (!idToken) {
          throw new Error('No se pudo obtener el token de seguridad. Verifica tu conexión.');
        }

        setStatus('Sesión iniciada correctamente. Redirigiendo a InfraSuite...');
        
        // Redirigir hacia el protocolo de la App de Escritorio
        setTimeout(() => {
          window.location.href = `infrasuite://auth?token=${idToken}`;
        }, 1000);

      } catch (err: any) {
        console.error('Error al iniciar sesión:', err);
        setError(err.message || 'Error desconocido');
        setStatus('');
      }
    };

    login();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#f0f4f8', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', textAlign: 'center', maxWidth: '400px' }}>
        <h1 style={{ color: '#2563eb', marginBottom: '20px' }}>InfraSuite</h1>
        {status && (
          <div>
            <div style={{ border: '4px solid #f3f3f3', borderTop: '4px solid #3498db', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 2s linear infinite', margin: '0 auto 20px auto' }} />
            <style>{`
              @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            `}</style>
            <p style={{ color: '#4b5563', fontSize: '18px' }}>{status}</p>
            {status.includes('Redirigiendo') && (
              <p style={{ marginTop: '15px', color: '#10b981', fontWeight: 'bold' }}>
                ✓ Ya puedes cerrar esta pestaña y volver a la aplicación.
              </p>
            )}
          </div>
        )}
        {error && (
          <div>
            <p style={{ color: '#ef4444', fontSize: '18px', fontWeight: 'bold' }}>Hubo un problema</p>
            <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '10px' }}>{error}</p>
            <button onClick={() => window.location.reload()} style={{ marginTop: '20px', padding: '10px 20px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
              Reintentar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
