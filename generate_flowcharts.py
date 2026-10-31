import os
import subprocess
from PIL import Image, ImageChops

DIAGRAMS_DIR = "/Users/zakky/Documents/Zakky/Proyek 2/Laporan/diagrams"
os.makedirs(DIAGRAMS_DIR, exist_ok=True)

# Styling for diagrams
MERMAID_STYLES = """
    classDef startEnd fill:#1F4E79,stroke:#0E2A47,stroke-width:2.5px,color:#FFFFFF,font-weight:bold;
    classDef proc fill:#F4F8FC,stroke:#1F4E79,stroke-width:1.5px,color:#0F2942,font-weight:500;
    classDef decision fill:#FFFBEB,stroke:#D97706,stroke-width:2px,color:#78350F,font-weight:600;
    classDef event fill:#ECFDF5,stroke:#059669,stroke-width:1.5px,color:#064E3B,font-weight:500;
    classDef alert fill:#FEF2F2,stroke:#DC2626,stroke-width:1.5px,color:#991B1B,font-weight:500;
"""

diagrams = {
    "gambar_f1_notifikasi_automasi.png": {
        "title": "Gambar F.1 Flowchart Alur Notifikasi Real-time dan Automasi Tugas Berkala (Modul Izat)",
        "code": f"""
flowchart TD
{MERMAID_STYLES}
    subgraph NC ["ALUR 1: IN-APP NOTIFICATION CENTER & DEADLINE REMINDER"]
        A([Mulai: Trigger Event]):::startEnd --> B["Event: Penugasan Kartu Baru / Komentar Baru / Reminder H-1"]:::event
        B --> C["Server Buat Record di Tabel notifications (user_id, type, title, message, link_url)"]:::proc
        C --> D["Socket.io Broadcast Event 'new-notification' ke Room Pengguna Terkait"]:::proc
        D --> E["Klien Tangkap Event & Naikkan Counter Unread Badge Lonceng di Header"]:::proc
        E --> F["Pengguna Klik Ikon Lonceng Notifikasi di Header Bar"]:::proc
        F --> G["Sistem Tampilkan Dropdown Interaktif Memuat Daftar Notifikasi"]:::proc
        G --> H["Pengguna Klik Item Notifikasi Tertentu"]:::proc
        H --> I["API PATCH /api/notifications/:id/read -> Set is_read = TRUE"]:::proc
        I --> J["Counter Badge Lonceng Berkurang & Arahkan Tampilan ke Modal Kartu"]:::proc
        J --> K([Selesai: Notifikasi Terbaca]):::startEnd
    end

    subgraph TA ["ALUR 2: TASK AUTOMATION (RECURRING TASKS)"]
        T1([Mulai: Polling Background Scheduler]):::startEnd --> T2["Pemeriksaan Konfigurasi Aktif di Tabel recurring_tasks"]:::proc
        T2 --> T3{{"Apakah Jadwal Interval Tercapai?<br/>(Harian / Mingguan / Bulanan)"}}:::decision
        T3 -- Tidak --> T4["Tunda Eksekusi & Tunggu Siklus Polling Cron Berikutnya"]:::proc
        T4 --> T1
        T3 -- Ya --> T5["Generate Kartu Tugas Baru Otomatis di Kolom Awal Kanban Board"]:::proc
        T5 --> T6["Perbarui Timestamp last_generated_at di Tabel recurring_tasks"]:::proc
        T6 --> T7["Terbitkan Notifikasi Sistem & Broadcast Socket.io ke Papan Tim"]:::proc
        T7 --> T8([Selesai: Kartu Rutin Terbuat]):::startEnd
    end
        """,
        "window_w": 2600,
        "window_h": 1600
    },

    "gambar_f2_iam_otp_reset.png": {
        "title": "Gambar F.2 Flowchart Alur Registrasi Email OTP dan Pemulihan Kata Sandi IAM (Modul Zakky)",
        "code": f"""
flowchart TD
{MERMAID_STYLES}
    subgraph REG ["ALUR 1: REGISTRASI & VERIFIKASI EMAIL OTP"]
        R1([Mulai: Registrasi Pengguna Baru]):::startEnd --> R2["Pengguna Input: Username, Email, Password, dan Nama Lengkap"]:::proc
        R2 --> R3["Server Validasi Format & Hash Password Menggunakan Bcrypt"]:::proc
        R3 --> R4["Simpan ke Tabel users dengan Status is_email_verified = FALSE"]:::proc
        R4 --> R5["Generate Kode OTP 6 Digit di auth_tokens (Masa Berlaku 5 Menit)"]:::proc
        R5 --> R6["Kirim Surel Kode OTP ke Email Pengguna via SMTP Nodemailer"]:::proc
        R6 --> R7["Pengguna Menerima Surel & Input Kode OTP pada Modal Verifikasi"]:::proc
        R7 --> R8{{"Apakah Kode OTP Sesuai &<br/>Belum Kedaluwarsa?"}}:::decision
        R8 -- Tidak --> R9["Tampilkan Peringatan OTP Salah / Expired & Opsi Resend OTP"]:::alert
        R9 --> R7
        R8 -- Ya --> R10["Update Tabel users: is_email_verified = TRUE"]:::proc
        R10 --> R11["Tandai auth_tokens: is_used = TRUE"]:::proc
        R11 --> R12([Selesai: Akun Aktif & Masuk Dashboard]):::startEnd
    end

    subgraph FP ["ALUR 2: PEMULIHAN KATA SANDI (FORGOT PASSWORD)"]
        F1([Mulai: Pengguna Klik 'Lupa Password']):::startEnd --> F2["Pengguna Memasukkan Alamat Email Terdaftar"]:::proc
        F2 --> F3{{"Apakah Alamat Email<br/>Terdaftar di Database?"}}:::decision
        F3 -- Tidak --> F4["Tampilkan Pesan Konfirmasi Standar (Anti-User Enumeration)"]:::proc
        F3 -- Ya --> F5["Generate Token Kriptografis Unik (Single-Use, Masa Aktif 5 Menit)"]:::proc
        F5 --> F6["Simpan Hash Token ke auth_tokens & Buat Tautan Reset Password"]:::proc
        F6 --> F7["Kirim Surel Tautan Reset Password via SMTP Nodemailer"]:::proc
        F7 --> F8["Pengguna Klik Tautan di Email & Memasukkan Password Baru"]:::proc
        F8 --> F9{{"Apakah Token Valid, Belum Expired,<br/>dan is_used == FALSE?"}}:::decision
        F9 -- Tidak --> F10["Tolak Akses & Tampilkan Peringatan Tautan Kedaluwarsa"]:::alert
        F9 -- Ya --> F11["Enkripsi Password Baru dengan Bcrypt & Update users.password_hash"]:::proc
        F11 --> F12["Tandai auth_tokens: is_used = TRUE"]:::proc
        F12 --> F13([Selesai: Password Diperbarui & Redirect ke Login]):::startEnd
    end
        """,
        "window_w": 2600,
        "window_h": 1600
    },

    "gambar_f3_tautan_eksternal.png": {
        "title": "Gambar F.3 Flowchart Alur Pengelolaan Tautan Sumber Daya Eksternal pada Kartu Kanban (Modul Zakky)",
        "code": f"""
flowchart TD
{MERMAID_STYLES}
    A([Mulai: Pengguna Membuka Modal Detail Kartu Kanban]):::startEnd --> B["Pengguna Mengklik Tombol 'Tambah Tautan Eksternal'"]:::proc
    B --> C["Form Input: Judul Tautan & URL Sumber Daya Eksternal (GDrive, Figma, GitHub, Dropbox)"]:::proc
    C --> D{{"Apakah Format URL Valid?<br/>(Regex Validasi RFC 3986)"}}:::decision
    D -- Tidak --> E["Tampilkan Peringatan: 'Format URL Tidak Valid' & Batalkan Penyimpanan"]:::alert
    E --> C
    D -- Ya --> F["Deteksi Otomatis Provider Tautan (Google Drive, Figma, GitHub, atau Web Link)"]:::proc
    F --> G["Kirim HTTP POST Request ke Endpoint /api/cards/:id/attachments"]:::proc
    G --> H["Server Validasi Sesi Pengguna & Simpan Record ke Tabel card_attachments"]:::proc
    H --> I["Socket.io Memancarkan Event 'card-updated' ke Room Papan Kanban"]:::proc
    I --> J["Frontend Render Badge Ikon 🔗 & Counter Jumlah Tautan pada Kartu Kanban"]:::proc
    J --> K([Selesai: Tautan Terlampir Siap Diakses Bersama Anggota Tim]):::startEnd
        """,
        "window_w": 2000,
        "window_h": 1400
    }
}

for filename, data in diagrams.items():
    print(f"Generating {filename}...")
    html_content = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
  <style>
    body {{
      background: #FFFFFF;
      margin: 0;
      padding: 40px;
      font-family: Arial, sans-serif;
    }}
    #diagram-container svg {{
      max-width: none !important;
    }}
    .cluster-label {{
      font-weight: bold !important;
      fill: #1F4E79 !important;
      font-size: 15px !important;
    }}
    .edgePath path {{
      stroke: #1F4E79 !important;
      stroke-width: 2px !important;
    }}
    .edgeLabel {{
      background-color: #FFFFFF !important;
      color: #0F2942 !important;
      font-weight: bold !important;
      font-size: 12px !important;
      padding: 2px 4px !important;
    }}
  </style>
</head>
<body>
  <div id="diagram-container"></div>
  <script>
    mermaid.initialize({{
      startOnLoad: false,
      theme: 'neutral',
      fontFamily: 'Arial, sans-serif',
      fontSize: 13,
      flowchart: {{
        curve: 'basis',
        nodeSpacing: 35,
        rankSpacing: 42
      }}
    }});

    const code = `{data["code"].strip()}`;
    mermaid.render('renderedSvg', code).then(r => {{
      document.getElementById('diagram-container').innerHTML = r.svg;
      const svg = document.querySelector('svg');
      const vb = svg.viewBox.baseVal;
      svg.style.width = vb.width + 'px';
      svg.style.height = vb.height + 'px';
      document.body.style.width = (vb.width + 100) + 'px';
      document.body.style.height = (vb.height + 100) + 'px';
    }}).catch(err => {{
      document.body.innerHTML = '<div style="color:red; font-size:18px;">ERROR: ' + (err.str || err.message) + '</div>';
    }});
  </script>
</body>
</html>"""

    html_path = os.path.join(DIAGRAMS_DIR, f"{filename}.html")
    raw_png_path = os.path.join(DIAGRAMS_DIR, f"{filename}_raw.png")
    final_png_path = os.path.join(DIAGRAMS_DIR, filename)

    with open(html_path, "w", encoding="utf-8") as f:
        f.write(html_content)

    cmd = [
        "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
        "--headless=new",
        f"--screenshot={raw_png_path}",
        f"--window-size={data['window_w']},{data['window_h']}",
        "--force-device-scale-factor=1.5",
        "--virtual-time-budget=6000",
        html_path
    ]
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    im = Image.open(raw_png_path)
    bg = Image.new(im.mode, im.size, (255, 255, 255))
    diff = ImageChops.difference(im, bg)
    bbox = diff.getbbox()
    if bbox:
        pad = 25
        cropped = im.crop((
            max(0, bbox[0] - pad),
            max(0, bbox[1] - pad),
            min(im.size[0], bbox[2] + pad),
            min(im.size[1], bbox[3] + pad)
        ))
        cropped.save(final_png_path, "PNG", optimize=True)
        print(f"Successfully generated {filename} (Dimensions: {cropped.size})")
    else:
        print(f"Warning: No bounding box for {filename}")

    if os.path.exists(html_path): os.remove(html_path)
    if os.path.exists(raw_png_path): os.remove(raw_png_path)

print("All 3 high-resolution flowcharts generated successfully!")
