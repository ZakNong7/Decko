# Decko — Aplikasi Manajemen Tugas Kanban

Decko adalah aplikasi manajemen tugas visual berbasis Kanban yang dirancang untuk kolaborasi tim secara terorganisir, transparan, dan real-time. Terinspirasi dari platform modern seperti Trello dan Notion, Decko mengusung konsep **Minimalist Premium Design** (Tema Gelap) dengan sistem keamanan **Role-Based Access Control (RBAC)** 4 tingkatan.

---

## 🚀 Fitur Utama

1.  **Visualisasi Alur Kerja Kanban**: Struktur data terisolasi bertingkat mulai dari *Workspace* -> *Board* -> *List* -> *Card*.
2.  **Otorisasi Role-Based Access Control (RBAC)**: Pengaturan hak akses kaku yang divalidasi ketat di sisi backend:
    *   **Owner**: Pemilik mutlak workspace, dapat menghapus workspace, mengelola keanggotaan, mengatur kode undangan, dan menghapus papan proyek.
    *   **Admin**: Dapat mengelola papan, list, kartu, dan mengedit keanggotaan (kecuali Owner/Admin lain).
    *   **Member**: Dapat membuat, mengedit, dan memindahkan kartu tugas serta menulis komentar.
    *   **Observer**: Hak akses *Read-Only* (hanya melihat papan, detail kartu, dan komentar tanpa hak mutasi).
3.  **Sinkronisasi Real-Time**: Pergeseran kartu (drag-and-drop) dan modifikasi data (tambah/hapus list/kartu/komentar) langsung tersinkronisasi ke semua anggota papan secara instan via **Socket.io**.
4.  **Database Transactions**: Pembaruan posisi kartu secara massal (*batch-update*) dikelola dengan transaksi database aman (`BEGIN`, `COMMIT`, `ROLLBACK`) untuk mencegah anomali urutan data.
5.  **Docker Ready**: Dukungan penuh containerisasi menggunakan `docker-compose` untuk deployment sekali perintah.

---

## 🛠️ Tech Stack

*   **Frontend**: React.js, Vite, Axios, Lucide React, `@hello-pangea/dnd` (Drag and Drop).
*   **Backend**: Node.js, Express.js, Socket.io, JSON Web Token (JWT), Bcrypt.
*   **Database**: PostgreSQL (dengan indeks foreign keys untuk performa query optimal).
*   **Web Server / Proxy**: Nginx (dalam container frontend).

---

## ⚙️ Panduan Setup Lokal (Untuk Anggota Tim / Izat)

### Prasyarat
* Node.js (v18+)
* PostgreSQL aktif di port 5432

### 1. Salin Environment File
Di dalam folder `server`:
```bash
cp server/.env.example server/.env
```
*(Secara default sudah terisi `DATABASE_URL=postgresql://localhost:5432/decko_db` dan `JWT_SECRET`).*

### 2. Buat Database PostgreSQL
Buka terminal dan buat database lokal:
```bash
createdb decko_db
```
> **Catatan Otomatisasi**: Server Decko sudah dilengkapi fitur *auto-migration*. Saat backend dijalankan pertama kali, seluruh tabel dasar (`schema.sql`) dan tabel Proyek 2 (`proyek2_migration.sql`) akan **dibuat secara otomatis** tanpa perlu psql manual!

### 3. Install Dependensi
```bash
cd server && npm install
cd ../client && npm install
```

### 4. (Opsional) Isi Data Demo / Dummy Admin
```bash
cd server && npm run seed
```
* **Akun Demo**: `admin` / `password123`

### 5. Jalankan Aplikasi
**Cara 1 (Otomatis 1-Click Script)**:
```bash
./start-decko.sh
```

**Cara 2 (Manual 2 Terminal)**:
* Terminal 1 (Backend): `cd server && npm run dev`
* Terminal 2 (Frontend): `cd client && npm run dev`

Buka browser di: `http://localhost:5173`
```bash
cd server
npm install
npm run dev
```

**Terminal 2 — Frontend Client (Port 5173)**:
```bash
cd client
npm install
npm run dev
```
Buka peramban di alamat `http://localhost:5173`.

---

## 🐳 Panduan Deployment (Docker Compose)

Decko siap dideploy ke lingkungan produksi lokal dengan Docker. Jalankan perintah berikut di direktori root project:

```bash
docker compose up --build
```
Perintah ini akan secara otomatis mengunduh image, membangun container frontend (dilengkapi Nginx), backend API, dan database PostgreSQL, lalu menjalankannya dalam satu jaringan terisolasi.

*   Frontend Production: `http://localhost:5173`
*   Backend API & Health Check: `http://localhost:5001/api/health`

---

## 🔑 Matriks Hak Akses (RBAC)

| Aksi / Fitur | Owner | Admin | Member | Observer |
| :--- | :---: | :---: | :---: | :---: |
| Lihat Board & Detail Kartu | ✅ | ✅ | ✅ | ✅ |
| Tambah / Edit / Geser Kartu | ✅ | ✅ | ✅ | ❌ |
| Tulis / Hapus Komentar Sendiri | ✅ | ✅ | ✅ | ❌ |
| Buat / Hapus / Edit Kolom List | ✅ | ✅ | ❌ | ❌ |
| Kelola Anggota & Dropdown Peran | ✅ | ✅ | ❌ | ❌ |
| Edit Nama & Kode Undangan Workspace | ✅ | ✅ | ❌ | ❌ |
| Hapus Seluruh Papan (Board) | ✅ | ✅ | ❌ | ❌ |
| Hapus Workspace Utama | ✅ | ❌ | ❌ | ❌ |

---

## 🎯 Fokus Pengembangan Selanjutnya (Next Roadmap)

Untuk meningkatkan kesiapan Decko menuju sistem skala produksi siap pakai (*production-grade*), berikut adalah fokus fitur berikutnya:


1. **Profile Settings**: Mendukung untuk mengubah profil icon, username, dan ganti password
2.  **Checklist & Subtask**: Mendukung penambahan sub-tugas kecil di dalam detail kartu untuk memecah tugas kompleks.
3.  **Pencarian Global Workspace**: Fitur search bar di dashboard utama untuk menemukan kartu tugas di seluruh board dalam workspace yang bersangkutan.
4.  **Log Aktivitas (Activity Log)**: Pencatatan riwayat audit (*audit trail*) tentang siapa, kapan, dan apa saja yang diubah (seperti pemindahan kartu, penugasan baru) di dalam board.
5.  **Due Date Reminder & Notification**: Mengintegrasikan scheduler otomatis (seperti cron job in-app) untuk memicu notifikasi jika ada tenggat waktu tugas yang mendekati batas (overdue).
6.  **Soft Delete (Archive)**: Fitur pengarsipan list dan card agar data tidak langsung terhapus permanen dari basis data saat dibersihkan dari layar.
