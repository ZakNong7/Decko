import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { X, User, Lock, Mail, Eye, EyeOff } from "lucide-react";

const Landing = () => {
  const [activeModal, setActiveModal] = useState(null); // 'login' or 'register'
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ username: '', password: '', email: '', confirmPassword: '' });
  const navigate = useNavigate();

  const handleAuth = async (e, type) => {
    e.preventDefault();
    try {
      const endpoint = type === 'login' ? 'login' : 'register';
      const { data } = await api.post(`/auth/${endpoint}`, formData);
      
      if (type === 'login') {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate('/dashboard');
      } else {
        alert('Registrasi berhasil! Silakan masuk.');
        setActiveModal('login');
      }
    } catch (err) {
      alert('Error: ' + (err.response?.data?.message || 'Gagal terhubung ke server'));
    }
  };

  const closeModal = () => {
    setActiveModal(null);
    setFormData({ username: '', password: '', email: '', confirmPassword: '' });
  };

  return (
    <div style={styles.container}>
      {/* BACKGROUND IMAGE PLACEHOLDER */}
      {/* Untuk mengganti background: Ganti URL di bawah atau letakkan file di client/src/assets/bg.png */}

      <div style={styles.content}>
        <div style={styles.logoWrapper}>
          {/* LOGO ICON PLACEHOLDER */}
          {/* Untuk mengganti logo: Ganti div logoIcon di bawah dengan <img src={logoUrl} /> */}
          <div style={styles.logoIcon}>
            <div style={styles.hamburger}>
              <div style={styles.bar}></div>
              <div style={styles.bar}></div>
              <div style={styles.bar}></div>
            </div>
          </div>
          <h1 style={styles.logoText}>DECKO</h1>
        </div>
        
        <h2 style={styles.tagline}>
          Manajemen Tugas Visual<br />
          Sederhana, Aman, dan Kolaboratif
        </h2>

        <div style={styles.buttonGroup}>
          <button onClick={() => setActiveModal('register')} style={styles.outlineBtn}>DAFTAR</button>
          <button onClick={() => setActiveModal('login')} style={styles.solidBtn}>MASUK</button>
        </div>
      </div>

      {/* AUTH MODAL */}
      {activeModal && (
        <div style={styles.modalOverlay} onClick={closeModal}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <button style={styles.closeModalBtn} onClick={closeModal}><X size={24} /></button>
            <div style={styles.modalHeader}>
              <div style={styles.userIconCircle}><User size={40} /></div>
              <h2 style={styles.modalTitle}>{activeModal === 'login' ? 'MASUK' : 'DAFTAR'}</h2>
            </div>

            <form onSubmit={e => handleAuth(e, activeModal)} style={styles.form}>
              <div style={styles.inputWrapper}>
                <input 
                  type="text" 
                  placeholder="Username" 
                  style={styles.input}
                  value={formData.username}
                  onChange={e => setFormData({...formData, username: e.target.value})}
                  required
                />
                <User size={18} style={styles.inputIcon} />
              </div>

              {activeModal === 'register' && (
                <div style={styles.inputWrapper}>
                  <input 
                    type="email" 
                    placeholder="Email" 
                    style={styles.input}
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    required
                  />
                  <Mail size={18} style={styles.inputIcon} />
                </div>
              )}

              <div style={styles.inputWrapper}>
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Password" 
                  style={styles.input}
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  required
                />
                <Lock size={18} style={styles.inputIcon} />
                <button 
                  type="button" 
                  style={styles.passwordToggle} 
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {activeModal === 'register' && (
                <div style={styles.inputWrapper}>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="Konfirmasi Password" 
                    style={styles.input}
                    value={formData.confirmPassword}
                    onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                    required
                  />
                  <Lock size={18} style={styles.inputIcon} />
                </div>
              )}

              {activeModal === 'register' && (
                  <p style={styles.hint}>Password harus terdiri minimal 8 karakter, huruf kapital, angka, dan simbol unik</p>
              )}

              <button type="submit" style={styles.modalSubmitBtn}>
                {activeModal === 'login' ? 'MASUK' : 'DAFTAR'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const DocumentIcon = () => (
    <svg width="100" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity="0.1">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
        <polyline points="10 9 9 9 8 9"></polyline>
    </svg>
);

const CheckIcon = () => (
    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity="0.1">
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="16 12 12 8 8 12"></polyline>
        <line x1="12" y1="16" x2="12" y2="8"></line>
    </svg>
);

const PersonIcon = () => (
    <svg width="90" height="90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity="0.1">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
    </svg>
);

const styles = {
  container: {
    height: '100vh',
    backgroundColor: '#343a40',
    backgroundImage: "url('/bg.png')",
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    color: 'white',
  },
  iconBackground: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none',
  },
  bgIcon: { position: 'absolute' },
  content: {
    zIndex: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center',
  },
  logoWrapper: {
    marginBottom: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
  },
  logoIcon: {
    width: '64px', height: '64px', backgroundColor: '#0095ff', borderRadius: '12px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  hamburger: { display: 'flex', flexDirection: 'column', gap: '6px' },
  bar: { width: '32px', height: '5px', backgroundColor: 'white', borderRadius: '3px' },
  logoText: { fontSize: '64px', fontWeight: '800', letterSpacing: '8px', margin: 0 },
  tagline: { fontSize: '20px', fontWeight: '400', color: 'white', lineHeight: '1.5', marginBottom: '24px' },
  buttonGroup: { display: 'flex', gap: '20px' },
  outlineBtn: { padding: '12px 40px', backgroundColor: 'transparent', border: '1px solid rgba(255,255,255,0.3)', color: '#0095ff', fontSize: '14px', fontWeight: '700', borderRadius: '8px' },
  solidBtn: { padding: '12px 40px', backgroundColor: '#0095ff', color: 'white', fontSize: '14px', fontWeight: '700', borderRadius: '8px' },
  
  modalOverlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
  },
  modal: {
    backgroundColor: '#2c3338', width: '90%', maxWidth: '400px', borderRadius: '24px', padding: '40px',
    position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center',
  },
  closeModalBtn: { position: 'absolute', top: '24px', left: '24px', background: 'transparent', color: '#a0a0a0' },
  modalHeader: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginBottom: '32px' },
  userIconCircle: { width: '80px', height: '80px', borderRadius: '40px', border: '3px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modalTitle: { fontSize: '24px', fontWeight: '700', letterSpacing: '2px' },
  form: { width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' },
  inputWrapper: { position: 'relative', width: '100%' },
  input: {
    width: '100%', padding: '12px 16px 12px 48px', backgroundColor: 'rgba(255,255,255,0.05)',
    border: '2px solid #0095ff', borderRadius: '8px', color: 'white', fontSize: '14px', outline: 'none',
  },
  inputIcon: { position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#a0a0a0' },
  passwordToggle: { position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', color: '#a0a0a0' },
  hint: { fontSize: '10px', color: '#a0a0a0', lineHeight: '1.4' },
  modalSubmitBtn: {
    width: '100%', padding: '14px', backgroundColor: '#0095ff', color: 'white',
    fontSize: '14px', fontWeight: '700', borderRadius: '8px', marginTop: '10px',
  }
};

export default Landing;