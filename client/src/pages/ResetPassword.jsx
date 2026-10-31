import React from 'react';

// ====================================================================
// MODUL A - AHMAD ZAKKY NURFAUZAN (714250028)
// DOMAIN: Pemulihan Kata Sandi Mandiri (Forgot Password 5 Menit)
// ====================================================================

const ResetPassword = () => {
  return (
    <div style={{ padding: '40px', color: 'var(--text-main)', maxWidth: '500px', margin: '40px auto' }}>
      <h1>Pemulihan Kata Sandi</h1>
      <p style={{ color: 'var(--text-muted)' }}>
        Formulir reset kata sandi menggunakan token kriptografis berbatas waktu 5 menit.
      </p>
    </div>
  );
};

export default ResetPassword;
