import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def set_cell_shading(cell, color_hex):
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{color_hex}"/>')
    cell._tc.get_or_add_tcPr().append(shd)

def set_table_borders(table, color="B0C4DE", sz="4", val="single"):
    tblPr = table._tbl.tblPr
    borders = parse_xml(
        f'<w:tblBorders {nsdecls("w")}>'
        f'  <w:top w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'  <w:bottom w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'  <w:insideH w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'  <w:insideV w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'  <w:left w:val="none"/>'
        f'  <w:right w:val="none"/>'
        f'</w:tblBorders>'
    )
    tblPr.append(borders)

def add_header_banner(doc, text):
    table = doc.add_table(rows=1, cols=1)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    
    cell = table.cell(0, 0)
    cell.width = Inches(6.8)
    set_cell_shading(cell, "1F4E79") # Deep Professional Blue
    set_cell_margins(cell, top=100, bottom=100, left=150, right=150)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(0)
    run = p.add_run(text)
    run.font.name = 'Arial'
    run.font.size = Pt(11)
    run.font.bold = True
    run.font.color.rgb = RGBColor(255, 255, 255)
    
    sp = doc.add_paragraph()
    sp.paragraph_format.space_before = Pt(0)
    sp.paragraph_format.space_after = Pt(3)

def add_styled_paragraph(doc, text, bold_prefix="", space_after=6, align=WD_ALIGN_PARAGRAPH.JUSTIFY):
    p = doc.add_paragraph()
    p.alignment = align
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.line_spacing = 1.15
    if bold_prefix:
        r_pre = p.add_run(bold_prefix)
        r_pre.font.name = 'Arial'
        r_pre.font.size = Pt(10)
        r_pre.font.bold = True
        r_pre.font.color.rgb = RGBColor(30, 30, 30)
    r_body = p.add_run(text)
    r_body.font.name = 'Arial'
    r_body.font.size = Pt(10)
    r_body.font.color.rgb = RGBColor(40, 40, 40)
    return p

def add_subheading(doc, text):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(8)
    p.paragraph_format.space_after = Pt(3)
    run = p.add_run(text)
    run.font.name = 'Arial'
    run.font.size = Pt(10.5)
    run.font.bold = True
    run.font.color.rgb = RGBColor(31, 78, 121)
    return p

def add_figure_image(doc, image_path, caption_text, width=Inches(6.4)):
    if os.path.exists(image_path):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(8)
        p.paragraph_format.space_after = Pt(3)
        run = p.add_run()
        run.add_picture(image_path, width=width)
        
        p_cap = doc.add_paragraph()
        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap.paragraph_format.space_before = Pt(2)
        p_cap.paragraph_format.space_after = Pt(8)
        r_cap = p_cap.add_run(caption_text)
        r_cap.font.name = 'Arial'
        r_cap.font.size = Pt(9)
        r_cap.font.bold = True
        r_cap.font.italic = True
        r_cap.font.color.rgb = RGBColor(60, 60, 60)
        return p_cap
    else:
        print(f"Warning: Gambar tidak ditemukan di {image_path}")
        return None

# Create Document
doc = docx.Document()

# Set Margins
for s in doc.sections:
    s.top_margin = Inches(0.8)
    s.bottom_margin = Inches(0.8)
    s.left_margin = Inches(0.85)
    s.right_margin = Inches(0.85)

# Top Bar
p_top = doc.add_paragraph()
p_top.alignment = WD_ALIGN_PARAGRAPH.RIGHT
p_top.paragraph_format.space_after = Pt(12)
r_top = p_top.add_run("PROGRAM STUDI D4 TEKNIK INFORMATIKA | PROPOSAL PROYEK 2")
r_top.font.name = 'Arial'
r_top.font.size = Pt(8.5)
r_top.font.bold = True
r_top.font.color.rgb = RGBColor(100, 100, 100)

p_main_title = doc.add_paragraph()
p_main_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
p_main_title.paragraph_format.space_before = Pt(0)
p_main_title.paragraph_format.space_after = Pt(2)
r_mt = p_main_title.add_run("SUBSTANSI PROPOSAL")
r_mt.font.name = 'Arial'
r_mt.font.size = Pt(16)
r_mt.font.bold = True
r_mt.font.color.rgb = RGBColor(31, 78, 121)

p_sub_title = doc.add_paragraph()
p_sub_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
p_sub_title.paragraph_format.space_before = Pt(0)
p_sub_title.paragraph_format.space_after = Pt(14)
r_st = p_sub_title.add_run("PROYEK 2 – CRUD & CODE COVERAGE")
r_st.font.name = 'Arial'
r_st.font.size = Pt(12)
r_st.font.bold = True
r_st.font.color.rgb = RGBColor(80, 80, 80)

# Metadata Table
meta_table = doc.add_table(rows=4, cols=4)
meta_table.alignment = WD_TABLE_ALIGNMENT.CENTER
meta_table.autofit = False
set_table_borders(meta_table, color="A0B2C6", sz="4")

col_widths = [Inches(1.3), Inches(2.1), Inches(1.4), Inches(2.0)]
meta_data = [
    [("Kelompok", True), ("Kelompok 12", False), ("Tanggal Usulan", True), ("20 Oktober 2026", False)],
    [("Ketua", True), ("Ahmad Zakky Nurfauzan\n(714250028)", False), ("Anggota", True), ("Izat Ibrahimovic Irawan\n(714250024)", False)],
    [("Kelas", True), ("D4 Teknik Informatika", False), ("Teknologi Utama", True), ("React.js, Express.js,\nPostgreSQL, Jest, Supertest", False)],
    [("Nama Aplikasi", True), ("Decko", False), ("Jenis Aplikasi", True), ("Web Application", False)]
]

for row_idx, row_content in enumerate(meta_data):
    for col_idx, (text, is_label) in enumerate(row_content):
        cell = meta_table.cell(row_idx, col_idx)
        cell.width = col_widths[col_idx]
        set_cell_margins(cell, top=70, bottom=70, left=100, right=100)
        if is_label:
            set_cell_shading(cell, "EBF1F5")
        p = cell.paragraphs[0]
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(0)
        p.paragraph_format.line_spacing = 1.05
        run = p.add_run(text)
        run.font.name = 'Arial'
        run.font.size = Pt(9)
        if is_label:
            run.font.bold = True
            run.font.color.rgb = RGBColor(31, 78, 121)
        else:
            run.font.color.rgb = RGBColor(40, 40, 40)

doc.add_paragraph().paragraph_format.space_after = Pt(6)

# --- A. JUDUL ---
add_header_banner(doc, "A. JUDUL")
p_a = doc.add_paragraph()
p_a.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
p_a.paragraph_format.space_after = Pt(10)
r_a_italic = p_a.add_run("Tuliskan judul Proyek 2 secara singkat, spesifik, dan mencerminkan aplikasi serta fokus dokumentasi/pengujian.\n")
r_a_italic.font.name = 'Arial'
r_a_italic.font.size = Pt(8.5)
r_a_italic.font.italic = True
r_a_italic.font.color.rgb = RGBColor(120, 120, 120)

judul_teks = "Pengembangan Modul Notification Center, Task Automation, dan Identity Access Management (IAM) pada Aplikasi Decko Melalui Pengujian Otomatis Berbasis Code Coverage"
r_a = p_a.add_run(judul_teks)
r_a.font.name = 'Arial'
r_a.font.size = Pt(11)
r_a.font.bold = True
r_a.font.color.rgb = RGBColor(20, 40, 80)

# --- B. RINGKASAN (MIN 300 KATA) ---
add_header_banner(doc, "B. RINGKASAN")
p_b_hint = doc.add_paragraph()
r_b_hint = p_b_hint.add_run("Ringkasan Minimal 300 kata. Memuat masalah, tujuan proyek, aplikasi yang dianalisis/dikembangkan, fokus CRUD, rencana testing/code coverage, dan luaran utama.\n")
r_b_hint.font.name = 'Arial'
r_b_hint.font.size = Pt(8.5)
r_b_hint.font.italic = True
r_b_hint.font.color.rgb = RGBColor(120, 120, 120)

ringkasan_p1 = (
    "Aplikasi manajemen tugas kolaboratif Decko yang dibangun pada Proyek 1 telah berhasil mewujudkan alur kerja visual berbasis metode Kanban, "
    "pembagian peran bertingkat Role-Based Access Control (RBAC), serta pembaruan data real-time menggunakan WebSockets Socket.io. "
    "Namun demikian, evaluasi komprehensif pasca-rilis menunjukkan adanya keterbatasan fungsional yang signifikan dalam mendukung ekosistem kerja tim yang dinamis. "
    "Pertama, dari aspek komunikasi alur kerja, sistem belum memiliki pusat notifikasi internal (in-app notification center) sehingga anggota tim sering kali terlambat "
    "mengetahui adanya penugasan kartu baru, komentar rekan tim, atau tenggat waktu (deadline) yang mendekat. Kedua, belum tersedianya automasi tugas berkala (recurring tasks) "
    "mengakibatkan tugas rutin tim (seperti evaluasi mingguan atau backup sistem) harus dibuat ulang secara manual dan repetitif. "
    "Ketiga, kartu tugas belum mendukung lampiran tautan rujukan eksternal (external resource links seperti Google Drive, Figma, atau repositori GitHub) "
    "yang sangat dibutuhkan sebagai bukti rujukan kerja tanpa membebani penyimpanan server fisik. Keempat, dari aspek keamanan, pendaftaran akun belum memiliki verifikasi surel "
    "dan pemulihan kata sandi mandiri berbatas waktu, sehingga akun rentan terhadap pendaftaran bot dan risiko kehilangan akses permanen."
)

ringkasan_p2 = (
    "Tujuan utama dari pelaksanaan Proyek 2 ini adalah melakukan eskalasi kemampuan sistem Decko melalui perancangan dan implementasi tiga pilar modul utama: "
    "Pusat Notifikasi dan Pengingat Tenggat Waktu (Notification Center & Deadline Alert), Automasi Tugas Berkala dan Lampiran Tautan Eksternal (Task Automation & Resource Links), "
    "serta Penguatan Keamanan Identitas (Identity Access Management / IAM) berbasis protokol SMTP dan rate limiting. "
    "Pada modul Notification Center, sistem akan memancarkan pemberitahuan in-app secara otomatis dengan penanda unread badge saat pengguna ditugaskan ke kartu baru atau saat deadline tersisa 24 jam. "
    "Pada modul automasi tugas, pengguna dapat menetapkan aturan recurring tasks harian atau mingguan yang dibangkitkan otomatis oleh server, serta menyematkan tautan rujukan eksternal "
    "lengkap dengan indikator ikon tautan (🔗) pada antarmuka papan Kanban. Di sisi keamanan, autentikasi diperkuat melalui pengiriman kode One-Time Password (OTP) via surel dan token reset password berbatas waktu 5 menit."
)

ringkasan_p3 = (
    "Sesuai tema substansi Proyek 2 yaitu CRUD & Code Coverage, seluruh modul baru yang dikembangkan akan dibedah logika operasinya (Create, Read, Update, Delete) "
    "dan diuji secara empiris menggunakan automated unit dan integration testing berbasis framework Jest dan Supertest. "
    "Pengujian dirancang mencakup minimal 12 skenario pengujian (issues) yang terbagi secara proporsional antara kedua anggota kelompok, meliputi pengujian jalur sukses (happy paths) "
    "dan penanganan galat batas negatif (edge cases) seperti pencegahan brute force, token OTP kedaluwarsa, validasi URL tautan, dan penjadwalan berulang. "
    "Target pengujian adalah mencapai code coverage minimal 80% pada seluruh controller, middleware, dan service layer terkait. "
    "Luaran utama proyek ini mencakup repositori aplikasi Decko yang telah diperkaya, dokumentasi spesifikasi CRUD, laporan anatomi source code, laporan hasil pengujian dan code coverage terverifikasi, "
    "serta draf laporan akhir Proyek 2 yang memenuhi standar akademik Program Studi D4 Teknik Informatika."
)

add_styled_paragraph(doc, ringkasan_p1)
add_styled_paragraph(doc, ringkasan_p2)
add_styled_paragraph(doc, ringkasan_p3)

total_ringkasan_words = len((ringkasan_p1 + " " + ringkasan_p2 + " " + ringkasan_p3).split())

# --- C. KATA KUNCI ---
add_header_banner(doc, "C. KATA KUNCI")
p_c_hint = doc.add_paragraph()
r_c_hint = p_c_hint.add_run("Tuliskan 4–5 kata kunci dan pisahkan dengan tanda titik koma (;).\n")
r_c_hint.font.name = 'Arial'
r_c_hint.font.size = Pt(8.5)
r_c_hint.font.italic = True
r_c_hint.font.color.rgb = RGBColor(120, 120, 120)

p_c = doc.add_paragraph()
r_c = p_c.add_run("Notification Center; Task Automation; IAM; Code Coverage; Decko; Jest")
r_c.font.name = 'Arial'
r_c.font.size = Pt(10)
r_c.font.bold = True
r_c.font.color.rgb = RGBColor(31, 78, 121)

# --- D. PILIHAN DOSEN PEMBIMBING ---
add_header_banner(doc, "D. PILIHAN DOSEN PEMBIMBING")
p_d_hint = doc.add_paragraph()
r_d_hint = p_d_hint.add_run("Setiap kelompok dapat mengusulkan maksimal 1 calon dosen pembimbing. Urutan menunjukkan prioritas.\n")
r_d_hint.font.name = 'Arial'
r_d_hint.font.size = Pt(8.5)
r_d_hint.font.italic = True
r_d_hint.font.color.rgb = RGBColor(120, 120, 120)

dosen_table = doc.add_table(rows=2, cols=4)
dosen_table.alignment = WD_TABLE_ALIGNMENT.CENTER
dosen_table.autofit = False
set_table_borders(dosen_table, color="A0B2C6", sz="4")

d_col_widths = [Inches(0.8), Inches(2.0), Inches(1.9), Inches(2.1)]
d_headers = ["Prioritas", "Nama Dosen Pembimbing", "Bidang/Keahlian yang Relevan", "Alasan Pemilihan"]

for i, h in enumerate(d_headers):
    cell = dosen_table.cell(0, i)
    cell.width = d_col_widths[i]
    set_cell_margins(cell, top=70, bottom=70, left=100, right=100)
    set_cell_shading(cell, "EBF1F5")
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(0)
    run = p.add_run(h)
    run.font.name = 'Arial'
    run.font.size = Pt(9)
    run.font.bold = True
    run.font.color.rgb = RGBColor(31, 78, 121)

d_data = [
    "1",
    "Roni Habibi, S.Kom., M.T., SFPC",
    "Keamanan Jaringan dan Sistem Informasi",
    "Memiliki kesesuaian kepakaran dan keahlian di bidang keamanan jaringan serta sistem informasi yang sangat relevan dengan penguatan arsitektur Identity Access Management (IAM), mitigasi serangan brute-force, dan integritas data pada aplikasi Decko."
]

for i, val in enumerate(d_data):
    cell = dosen_table.cell(1, i)
    cell.width = d_col_widths[i]
    set_cell_margins(cell, top=70, bottom=70, left=100, right=100)
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(0)
    run = p.add_run(val)
    run.font.name = 'Arial'
    run.font.size = Pt(9)
    if i == 0:
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run.font.bold = True

doc.add_paragraph().paragraph_format.space_after = Pt(6)

# --- E. PENDAHULUAN ---
add_header_banner(doc, "E. PENDAHULUAN")
p_e_hint = doc.add_paragraph()
r_e_hint = p_e_hint.add_run("Bagian ini menjelaskan konteks aplikasi, masalah yang diselesaikan, tujuan, aplikasi referensi, serta batas ruang lingkup Proyek 2.\n")
r_e_hint.font.name = 'Arial'
r_e_hint.font.size = Pt(8.5)
r_e_hint.font.italic = True
r_e_hint.font.color.rgb = RGBColor(120, 120, 120)

# E.1
add_subheading(doc, "E.1 Latar Belakang dan Rumusan Masalah")
p_e1_hint = doc.add_paragraph()
r_e1_hint = p_e1_hint.add_run("Jelaskan kondisi saat ini Minimal 300 kata, masalah utama, dampak masalah, dan rumusan masalah yang akan dijawab melalui proyek.\n")
r_e1_hint.font.name = 'Arial'
r_e1_hint.font.size = Pt(8.5)
r_e1_hint.font.italic = True
r_e1_hint.font.color.rgb = RGBColor(120, 120, 120)

e1_p1 = (
    "Aplikasi kolaborasi proyek berbasis Kanban, Decko, telah diimplementasikan pada Proyek 1 dengan menyediakan antarmuka visual dinamis "
    "untuk mengelola papan tugas, ruang kerja kelompok (workspaces), hak akses bertingkat (Owner, Admin, Member, Observer), serta sinkronisasi perpindahan kartu secara real-time via Socket.io. "
    "Meskipun fondasi alur kerja manajemen tugas telah beroperasi dengan stabil, observasi lapangan dan umpan balik pengguna mengungkapkan beberapa permasalahan esensial "
    "yang membatasi efisiensi koordinasi tim. Permasalahan utama pertama terletak pada ketiadaan pusat notifikasi (notification center) internal di dalam aplikasi. "
    "Ketika seorang ketua tim memberikan penugasan kartu baru kepada anggota, atau ketika seorang anggota menuliskan komentar penting mengenai hambatan kerja, "
    "pengguna yang dituju tidak memperoleh pemberitahuan langsung di dalam aplikasi. Ketiadaan notifikasi pengingat tenggat waktu (deadline reminder) juga sering mengakibatkan "
    "tugas terlambat diselesaikan karena anggota tim tidak menyadari batas waktu yang telah mendekat."
)

e1_p2 = (
    "Permasalahan utama kedua adalah belum adanya mekanisme otomatisasi untuk tugas-tugas rutin (recurring tasks). Dalam manajemen proyek perangkat lunak dan organisasi, "
    "banyak tugas yang bersifat berulang secara periodik (seperti evaluasi mingguan, sinkronisasi sprint, atau pemeliharaan server berkala). Saat ini, pengguna terpaksa membuat kartu "
    "tersebut secara manual satu per satu setiap minggunya, yang memicu inefisiensi dan risiko terlupa. Selain itu, kartu tugas saat ini belum mampu mengintegrasikan tautan rujukan eksternal "
    "(seperti berkas Google Drive, prototipe Figma, atau commit GitHub), sehingga informasi pendukung tugas terpisah dan sulit diakses. "
    "Permasalahan utama ketiga berkaitan dengan aspek keamanan autentikasi dan kedaulatan akun; registrasi belum diverifikasi via surel sehingga rentan akun spam, "
    "serta ketiadaan fitur pemulihan kata sandi mandiri berbatas waktu yang menyebabkan akun terkunci permanen apabila pengguna melupakan kredensialnya. "
    "Terakhir, seluruh modul tersebut belum didukung oleh rangkaian pengujian kode otomatis (automated code coverage) yang terverifikasi secara empiris."
)

e1_p3 = (
    "Berdasarkan latar belakang tersebut, rumusan masalah yang akan diselesaikan pada Proyek 2 ini dirumuskan sebagai berikut: "
    "(1) Bagaimana merancang dan membangun modul pusat notifikasi internal (Notification Center) serta pengingat tenggat waktu real-time untuk meningkatkan responsivitas komunikasi tim pada aplikasi Decko? "
    "(2) Bagaimana mengimplementasikan automasi tugas berulang (Recurring Tasks) dan manajemen tautan rujukan eksternal (External Resource Links) pada kartu tugas Kanban? "
    "(3) Bagaimana memperkuat arsitektur keamanan autentikasi melalui modul Identity Access Management (IAM) berbasis verifikasi surel OTP dan pemulihan kata sandi berbatas waktu? "
    "(4) Bagaimana menyusun skenario pengujian otomatis unit dan integrasi menggunakan Jest dan Supertest guna membuktikan kualitas kode dengan capaian code coverage minimal 80%?"
)

add_styled_paragraph(doc, e1_p1)
add_styled_paragraph(doc, e1_p2)
add_styled_paragraph(doc, e1_p3)

total_e1_words = len((e1_p1 + " " + e1_p2 + " " + e1_p3).split())

# E.2
add_subheading(doc, "E.2 Tujuan Proyek")
p_e2_hint = doc.add_paragraph()
r_e2_hint = p_e2_hint.add_run("Tuliskan tujuan yang spesifik dan terukur terkait analisis aplikasi Minimal 300 kata, dokumentasi CRUD, source code, testing, dan code coverage.\n")
r_e2_hint.font.name = 'Arial'
r_e2_hint.font.size = Pt(8.5)
r_e2_hint.font.italic = True
r_e2_hint.font.color.rgb = RGBColor(120, 120, 120)

e2_p1 = (
    "Tujuan dari pelaksanaan Proyek 2 ini dirumuskan secara spesifik, terukur, dan berorientasi pada peningkatan fungsionalitas aplikasi Decko "
    "serta pemenuhan standar mutu pengujian perangkat lunak berbasis code coverage. Tujuan pertama adalah menganalisis dan membangun modul Notification Center "
    "yang terintegrasi secara real-time pada antarmuka aplikasi. Keberhasilan tujuan ini diukur dari kemampuan sistem dalam menerbitkan notifikasi in-app "
    "secara instan dengan penanda unread badge saat pengguna menerima penugasan kartu baru, menerima komentar pada kartu yang diikuti, serta memicu notifikasi peringatan tenggat waktu "
    "secara otomatis 24 jam sebelum kartu tugas jatuh tempo, sehingga koordinasi antaranggota tim dapat ditingkatkan secara signifikan."
)

e2_p2 = (
    "Tujuan kedua adalah mengimplementasikan modul automasi tugas (Task Automation) dan manajemen tautan rujukan eksternal (External Resource Links). "
    "Tujuan ini diukur dari keberhasilan sistem dalam membangkitkan kartu tugas baru secara otomatis sesuai aturan jadwal berulang (harian, mingguan, bulanan) yang telah dikonfigurasi, "
    "serta kemampuan pengguna dalam menyematkan tautan rujukan eksternal (Google Drive, Figma, GitHub) yang tervalidasi formatnya dan menampilkan indikator ikon tautan (🔗) secara elegan pada kartu di papan Kanban. "
    "Selain itu, tujuan ini mencakup pembangunan dashboard metrik produktivitas personal per-akun pada halaman profil pengguna (personal task velocity dan rasio penyelesaian tugas) serta modul profil pengguna yang mendukung opsi preferensi tema adaptif (Dark, Light, dan sinkronisasi otomatis hardware) guna memberikan keterbukaan data kinerja individu."
)

e2_p3 = (
    "Tujuan ketiga adalah memperkokoh lapisan keamanan autentikasi melalui modul Identity Access Management (IAM) yang mencakup verifikasi pendaftaran akun via kode OTP surel 5 menit (SMTP Nodemailer), "
    "alur pemulihan kata sandi mandiri berbatas waktu 5 menit menggunakan token kriptografi sekali pakai, penanganan konflik registrasi ulang bagi pengguna yang lupa akun dengan pengiriman username terdaftar, "
    "serta pembatasan frekuensi request (rate limiting) untuk mitigasi serangan brute-force. "
    "Tujuan keempat yang merupakan indikator inti Proyek 2 adalah mendokumentasikan anatomi source code per fungsi/modul, memetakan seluruh operasi CRUD ke dalam tabel spesifikasi formal, "
    "serta menyusun test suite pengujian otomatis menggunakan framework Jest dan Supertest minimal sebanyak 12 skenario pengujian (issues). "
    "Kualitas pengujian diukur secara kuantitatif melalui laporan code coverage empiris dengan target pencapaian minimal 80% pada aspek baris kode (lines), percabangan logika (branches), dan fungsi (functions) "
    "sehingga perangkat lunak terbukti tangguh terhadap kesalahan input dan memiliki kesiapan rilis tingkat tinggi."
)

add_styled_paragraph(doc, e2_p1)
add_styled_paragraph(doc, e2_p2)
add_styled_paragraph(doc, e2_p3)

total_e2_words = len((e2_p1 + " " + e2_p2 + " " + e2_p3).split())

# E.3
add_subheading(doc, "E.3 Aplikasi Referensi dan Analisis Pengembangan")
p_e3_hint = doc.add_paragraph()
r_e3_hint = p_e3_hint.add_run("Jelaskan 1–3 aplikasi referensi, fitur yang diamati/diadopsi, serta perbedaan atau pengembangan yang direncanakan.\n")
r_e3_hint.font.name = 'Arial'
r_e3_hint.font.size = Pt(8.5)
r_e3_hint.font.italic = True
r_e3_hint.font.color.rgb = RGBColor(120, 120, 120)

e3_text1 = (
    "Dalam merancang pengembangan fitur notifikasi, automasi tugas, tautan eksternal, dan keamanan autentikasi pada Proyek 2, dilakukan studi komparasi terhadap tiga aplikasi kolaborasi industri terkemuka:\n"
    "1. Trello (Atlassian): Diamati pada fitur Power-Up Card Repeater yang mengotomasi pembuatan kartu berulang, serta fitur penyematan tautan eksternal (Attach Links) yang menyajikan ikon tautan visual "
    "pada antarmuka depan kartu. Fitur yang diadopsi pada Decko adalah konsep penyematan tautan dokumen eksternal (Google Drive/Figma) yang ringan tanpa membebani media penyimpanan server fisik.\n"
    "2. Notion (Notion Labs): Diamati pada pusat notifikasi (Updates/Inbox) yang memusatkan seluruh aktivitas penugasan anggota, komentar kartu, dan pengingat tanggal jatuh tempo dalam satu wadah dropdown yang bersih. "
    "Fitur yang diadopsi adalah struktur antarmuka Notification Center dengan penanda unread badge dan filter notifikasi belum dibaca.\n"
    "3. Linear (Linear Orbit): Platform manajemen proyek modern berkecepatan tinggi yang menerapkan proteksi keamanan autentikasi ketat melalui rate-limiting, "
    "alur verifikasi surel sementara, serta pelacakan sesi login aktif. Fitur yang diadopsi adalah perlindungan serangan brute-force dan mekanisme token kriptografis berbatas waktu (time-limited tokens)."
)

e3_text2 = (
    "Perbedaan dan pengembangan yang direncanakan pada Decko:\n"
    "Berbeda dari Trello dan Linear yang mengikat fitur notifikasi serta automasi pada paket langganan berbayar (paid tiers) dan infrastruktur cloud tertutup, "
    "Decko mengimplementasikan Notification Center dan task scheduler secara mandiri menggunakan kombinasi WebSockets Socket.io dan database PostgreSQL lokal/cloud. "
    "Selain itu, Decko mengintegrasikan validasi URL tautan secara ketat di sisi server untuk memastikan keamanan tautan eksternal dari upaya phishing serta mengombinasikannya "
    "dengan alur pemulihan kata sandi mandiri berbasis SMTP lokal tanpa ketergantungan pada vendor pihak ketiga berbayar (anti-vendor lock-in)."
)

add_styled_paragraph(doc, e3_text1)
add_styled_paragraph(doc, e3_text2)

# E.4
add_subheading(doc, "E.4 Ruang Lingkup Proyek")
p_e4_hint = doc.add_paragraph()
r_e4_hint = p_e4_hint.add_run("Tetapkan batas fitur/modul yang dianalisis Minimal 300 kata, CRUD yang masuk ruang lingkup, teknologi, dan bagian yang tidak dikerjakan.\n")
r_e4_hint.font.name = 'Arial'
r_e4_hint.font.size = Pt(8.5)
r_e4_hint.font.italic = True
r_e4_hint.font.color.rgb = RGBColor(120, 120, 120)

e4_p1 = (
    "Ruang lingkup pada Proyek 2 ini ditetapkan secara terfokus pada pengembangan dan pengujian otomatis terhadap dua modul besar sistem, yaitu: "
    "(1) Modul Notification Center, Task Automation, Personal Metrics, dan Profile Adaptive Theme; serta "
    "(2) Modul Identity Access Management (IAM), Session Security, dan External Resource Link Attachments. "
    "Batasan fitur yang dikembangkan secara spesifik meliputi: pembuatan entri dan pembacaan notifikasi in-app otomatis saat terjadi penugasan kartu, "
    "penambahan komentar, dan peringatan tenggat waktu H-1; konfigurasi aturan kartu tugas berulang (recurring tasks) berbasis interval jadwal; "
    "penyematan dan validasi URL tautan rujukan eksternal pada kartu tugas dengan penanda ikon visual rantai (🔗); visualisasi metrik performa personal "
    "(personal task velocity dan rasio tugas selesai) pada halaman profil; manajemen profil pengguna mandiri beserta pengaturan tema adaptif (Dark, Light, dan sinkronisasi otomatis hardware OS); "
    "verifikasi pendaftaran via kode OTP surel 5 menit (SMTP Nodemailer); penanganan konflik registrasi ulang email terdaftar melalui penyertaan username resmi; "
    "serta pemulihan kata sandi mandiri berbatas waktu 5 menit yang dilindungi middleware pembatas laju request (express-rate-limit)."
)

e4_p2 = (
    "Operasi CRUD (Create, Read, Update, Delete) yang masuk ke dalam ruang lingkup proyek dipetakan secara jelas pada masing-masing entitas: "
    "Create mencakup pembuatan record notifikasi sistem pada tabel notifications, pembuatan konfigurasi tugas berulang pada tabel recurring_tasks, "
    "penambahan tautan eksternal pada tabel card_attachments, penerbitan token OTP pada tabel auth_tokens, dan pembuatan sesi login baru; "
    "Read mencakup pembacaan daftar notifikasi belum dibaca, pemuatan daftar tautan eksternal pada modal kartu, kueri agregasi metrik performa personal pada profil, dan verifikasi status token keamanan; "
    "Update mencakup perubahan status notifikasi menjadi dibaca (mark as read), pembaruan judul atau URL tautan eksternal, pengubahan jadwal recurring task, pembaruan password_hash, penyuntingan profil pengguna, dan penyimpanan preferensi tema antarmuka; "
    "Delete mencakup penghapusan notifikasi, penghapusan tautan eksternal dari kartu tugas, pencabutan aturan recurring task, pemusnahan token reset kedaluwarsa, dan deaktivasi akun mandiri."
)

e4_p3 = (
    "Teknologi utama yang digunakan dalam pengembangan sistem adalah React.js (React 19+) dan Vite pada sisi frontend, Node.js dan Express.js pada sisi backend, "
    "PostgreSQL sebagai sistem manajemen basis data relasional, Nodemailer untuk integrasi pengiriman surel SMTP, serta framework Jest dan Supertest sebagai runner pengujian otomatis dan code coverage. "
    "Adapun batasan yang secara tegas DITETAPKAN TIDAK DIKERJAKAN (out of scope) pada Proyek 2 ini meliputi: "
    "(1) Penyimpanan fisik berkas biner berukuran besar (upload file multipart ke server/AWS S3 ditangguhkan dan digantikan secara efisien menggunakan modul tautan sumber daya eksternal); "
    "(2) Fitur obrolan langsung (live chat instant messaging) antarpengguna; "
    "(3) Integrasi autentikasi pihak ketiga OAuth2 / Single Sign-On (Google Login / GitHub Login); dan "
    "(4) Pembangunan aplikasi seluler native (Android/iOS)."
)

add_styled_paragraph(doc, e4_p1)
add_styled_paragraph(doc, e4_p2)
add_styled_paragraph(doc, e4_p3)

total_e4_words = len((e4_p1 + " " + e4_p2 + " " + e4_p3).split())

# --- F. ANALISIS DAN RENCANA PELAKSANAAN ---
add_header_banner(doc, "F. ANALISIS DAN RENCANA PELAKSANAAN")
p_f_hint = doc.add_paragraph()
r_f_hint = p_f_hint.add_run("Gunakan bagian ini untuk menunjukkan bahwa kelompok memahami aplikasi sebelum masuk ke dokumentasi kode dan pengujian.\n")
r_f_hint.font.name = 'Arial'
r_f_hint.font.size = Pt(8.5)
r_f_hint.font.italic = True
r_f_hint.font.color.rgb = RGBColor(120, 120, 120)

# F.1
add_subheading(doc, "F.1 Analisis Kebutuhan Fungsional")
f1_items = [
    ("F-01 (In-App Notification Center): ", "Sistem harus dapat memancarkan dan menampilkan notifikasi in-app pada ikon lonceng di header saat pengguna didelegasikan ke kartu tugas baru, menerima komentar pada kartu yang diikuti, atau saat tenggat waktu mendekati batas 24 jam."),
    ("F-02 (Manajemen Status Notifikasi): ", "Sistem harus menyediakan fitur untuk menandai satu atau seluruh notifikasi sebagai telah dibaca (mark as read), menampilkan badge jumlah notifikasi unread, serta opsi menghapus riwayat notifikasi."),
    ("F-03 (Automasi Tugas Berulang / Recurring Tasks): ", "Sistem harus menyediakan konfigurasi jadwal berulang (Harian, Mingguan, Bulanan) pada kartu tugas dan secara otomatis meregenerasi kartu baru pada kolom awal Kanban saat waktu pemicu tercapai."),
    ("F-04 (Penyematan Tautan Eksternal / External Resource Links): ", "Sistem harus memfasilitasi penambahan tautan rujukan eksternal (Google Drive, Figma, GitHub, dll.) pada modal detail kartu tugas dan menampilkan indikator ikon tautan (🔗) pada kartu di papan Kanban."),
    ("F-05 (Manajemen Tautan Eksternal): ", "Sistem harus memvalidasi format sintaksis URL rujukan eksternal serta menyediakan opsi penyuntingan judul tautan dan penghapusan tautan dari kartu."),
    ("F-06 (Dashboard Metrik Performa Personal di Profil): ", "Sistem harus menghitung dan menampilkan visualisasi analitik produktivitas per-akun pada halaman User Profile, meliputi kecepatan penyelesaian tugas mingguan (Personal Velocity), rasio tugas selesai versus ditugaskan, serta indikator kartu tugas overdue milik pengguna."),
    ("F-07 (Verifikasi Surel Registrasi OTP 5 Menit): ", "Sistem harus mengirimkan kode OTP berbatas waktu 5 menit via surel saat registrasi pengguna baru dan menahan akses login hingga kode OTP berhasil divalidasi."),
    ("F-08 (Pemulihan Kata Sandi Mandiri & Resolusi Akun): ", "Sistem harus menyediakan alur reset kata sandi mandiri menggunakan token kriptografi yang kedaluwarsa dalam 5 menit. Jika pengguna lupa akun dan mendaftar ulang dengan surel yang sama, sistem menolak duplikasi dan mengirimkan username resmi beserta tautan reset via surel."),
    ("F-09 (Session Management & Anti-Brute Force): ", "Sistem harus melacak sesi login aktif per perangkat, menyediakan fitur pencabutan sesi jarak jauh (remote logout), serta membatasi percobaan login gagal maksimal 5 kali dalam 5 menit menggunakan rate limiting."),
    ("F-10 (Manajemen Profil Pengguna): ", "Sistem harus menyediakan antarmuka bagi pengguna untuk memperbarui nama lengkap, nomor telepon, biodata profil, username unik, serta opsi deaktivasi akun mandiri."),
    ("F-11 (Pengaturan Tema Adaptif di Profil): ", "Sistem harus menyediakan opsi preferensi tema di halaman profil (Dark Theme, Light Theme, dan Auto/Sistem) yang dapat mendeteksi dan mengikuti tema hardware laptop/handphone secara otomatis melalui listener prefers-color-scheme.")
]
for pfx, desc in f1_items:
    add_styled_paragraph(doc, desc, bold_prefix=pfx, space_after=3)

# F.2
add_subheading(doc, "F.2 Analisis Kebutuhan Nonfungsional")
f2_items = [
    ("N-01 (Keamanan Data & Hashing): ", "Seluruh kredensial kata sandi dienkripsi menggunakan algoritma Bcrypt (10 salt rounds). Seluruh token verifikasi dan token reset disimpan dalam basis data dalam format hash kriptografis SHA-256."),
    ("N-02 (Keandalan Sinyal Real-Time): ", "Penyebaran event notifikasi in-app ke klien aktif harus memiliki latensi rendah (< 300ms) memanfaatkan koneksi WebSocket Socket.io."),
    ("N-03 (Integritas Validasi Input): ", "Seluruh input URL tautan eksternal divalidasi menggunakan ekspresi reguler (regex) ketat untuk mencegah serangan Cross-Site Scripting (XSS) dan injeksi tautan berbahaya."),
    ("N-04 (Kemudahan Penggunaan & Tema Adaptif): ", "Antarmuka aplikasi mendukung peralihan tema Dark dan Light, serta mode sinkronisasi otomatis dengan preferensi tema sistem operasi hardware (laptop/smartphone) untuk kenyamanan visual pengguna."),
    ("N-05 (Uji Kelayakan Kode / Testability): ", "Seluruh fungsi bisnis pada layer controller dan service dirancang secara modular dan loosely-coupled agar dapat diuji secara empiris menggunakan Jest dan Supertest dengan capaian code coverage minimal 80%.")
]
for pfx, desc in f2_items:
    add_styled_paragraph(doc, desc, bold_prefix=pfx, space_after=3)

# F.3
add_subheading(doc, "F.3 Workflow / Flowchart / Flowmap")
add_styled_paragraph(
    doc,
    "Alur kerja operasional (workflow) pada pengembangan Proyek 2 dirancang menggunakan pendekatan visual terstruktur "
    "guna memetakan interaksi pengguna, pemrosesan logika server, automasi layanan latar belakang (background scheduler), "
    "komunikasi asinkron WebSockets, dan integritas transaksi pada basis data PostgreSQL. Keseluruhan logika operasional "
    "sistem diklasifikasikan ke dalam 3 bagan alir (flowchart) utama berbasis pembagian modul fitur utuh:",
    space_after=4
)

# 1. Modul Izat
add_styled_paragraph(
    doc,
    "1. Alur Notification Center & Task Automation (Modul Izat): "
    "Mekanisme pusat notifikasi menangani penerbitan alert secara real-time saat terjadi event pemicu (penugasan kartu baru, "
    "komentar baru, serta peringatan deadline H-1). Notifikasi dicatat ke tabel notifications dan dipancarkan via Socket.io "
    "sehingga badge counter lonceng klien bertambah secara reaktif. Ketika pengguna membuka lonceng dan memilih notifikasi, "
    "status keterbacaan diperbarui menjadi is_read = TRUE dan pengguna diarahkan ke kartu terkait. Secara paralel, "
    "background scheduler secara periodik mengevaluasi aturan pada tabel recurring_tasks untuk membangkitkan kartu tugas "
    "rutin baru secara otomatis di kolom awal Kanban saat waktu interval (harian, mingguan, atau bulanan) tercapai.",
    bold_prefix="a. ",
    space_after=4
)
diagram_f1_path = "/Users/zakky/Documents/Zakky/Proyek 2/Laporan/diagrams/gambar_f1_notifikasi_automasi.png"
add_figure_image(doc, diagram_f1_path, "Gambar F.1 Flowchart Alur Notifikasi Real-time dan Automasi Tugas Berkala (Modul Izat)", width=Inches(6.5))

# 2. Modul Zakky - IAM
add_styled_paragraph(
    doc,
    "2. Alur Identity Access Management (Email OTP & Forgot Password) (Modul Zakky): "
    "Mekanisme keamanan identitas dan otentikasi menerapkan prinsip zero-trust pada pendaftaran akun dan pemulihan akses. "
    "Pada saat registrasi akun baru, akun ditahan dalam status is_email_verified = FALSE dan sistem menerbitkan kode OTP numerik "
    "6 digit dengan masa berlaku 5 menit melalui SMTP Nodemailer. Pengguna wajib memvalidasi OTP sebelum diizinkan masuk ke sistem. "
    "Jika pengguna yang lupa akun atau lupa password mencoba mendaftar kembali menggunakan alamat surel yang sudah terdaftar, sistem secara preventif "
    "menolak duplikasi pendaftaran (HTTP 409 Conflict) guna mencegah penimpaan akun (account takeover), menampilkan notifikasi pemulihan ramah, "
    "dan secara otomatis mengirimkan username resmi yang terdaftar beserta tautan reset password baru ke surel pengguna. Pada alur pemulihan kata sandi (Forgot Password), "
    "sistem menerbitkan token kriptografis unik sekali pakai (single-use token) berdurasi 5 menit. Setelah token dan masa kedaluwarsa divalidasi "
    "oleh server, kata sandi baru dienkripsi menggunakan Bcrypt sebelum disimpan ke database, dan token langsung ditandai is_used = TRUE guna mencegah replay attack.",
    bold_prefix="b. ",
    space_after=4
)
diagram_f2_path = "/Users/zakky/Documents/Zakky/Proyek 2/Laporan/diagrams/gambar_f2_iam_otp_reset.png"
add_figure_image(doc, diagram_f2_path, "Gambar F.2 Flowchart Alur Registrasi Email OTP dan Pemulihan Kata Sandi IAM (Modul Zakky)", width=Inches(6.5))

# 3. Modul Zakky - External Links
add_styled_paragraph(
    doc,
    "3. Alur Pengelolaan Tautan Sumber Daya Eksternal pada Kartu Kanban (Modul Zakky): "
    "Fitur lampiran tautan rujukan eksternal memungkinkan anggota tim melampirkan artefak dokumen (Google Drive, Figma, GitHub PR, Dropbox) "
    "langsung pada kartu tugas Kanban sebagai alternatif penyimpanan berkas fisik lokal. Setiap tautan yang diinput melalui modal kartu "
    "divalidasi format URL-nya secara ketat (Regex RFC 3986), dideteksi jenis penyedianya secara otomatis, dan disimpan ke tabel card_attachments. "
    "Server memancarkan event Socket.io card-updated sehingga klien secara instan menampilkan lencana indikator rantai (🔗) beserta counter "
    "jumlah tautan terlampir (contoh: 🔗 2) pada kartu di kolom Kanban.",
    bold_prefix="c. ",
    space_after=4
)
diagram_f3_path = "/Users/zakky/Documents/Zakky/Proyek 2/Laporan/diagrams/gambar_f3_tautan_eksternal.png"
add_figure_image(doc, diagram_f3_path, "Gambar F.3 Flowchart Alur Pengelolaan Tautan Sumber Daya Eksternal pada Kartu Kanban (Modul Zakky)", width=Inches(4.8))

add_styled_paragraph(
    doc,
    "Ketiga alur sistem di atas terintegrasi secara harmonis dan konsisten dengan sistem hak akses 4-tier Role-Based Access Control (RBAC) "
    "serta struktur soft-delete yang telah diimplementasikan pada Proyek 1.",
    space_after=6
)

# F.4
add_subheading(doc, "F.4 Struktur Menu dan Antarmuka")
add_styled_paragraph(
    doc,
    "Antarmuka aplikasi Decko pada Proyek 2 diperkaya dengan penambahan 4 komponen visual utama yang terintegrasi secara harmonis:\n"
    "1. Lonceng Notification Center (Header Bar): Terletak di pojok kanan atas di samping avatar profil. Dilengkapi badge angka merah penanda jumlah notifikasi belum dibaca, "
    "serta dropdown interaktif yang memuat daftar notifikasi dengan tombol 'Tandai Semua Dibaca' dan 'Hapus Semua'.\n"
    "2. Sub-Modal External Resource Links (Di dalam Modal Detail Kartu): Komponen baru di dalam modal kartu tugas yang menampilkan daftar tautan rujukan eksternal aktif "
    "dengan ikon representasi penyedia (logo Drive/Figma/GitHub/Link), tombol klik untuk membuka tautan pada tab baru, serta form penambahan tautan baru.\n"
    "3. Ikon Indikator Tautan (🔗 Badge pada Papan Kanban): Komponen visual kecil di baris bawah kartu tugas pada kolom Kanban yang menampilkan ikon rantai beserta angka "
    "penghitung jumlah tautan (contoh: 🔗 2), memberikan informasi cepat kepada tim bahwa kartu tersebut memiliki lampiran rujukan dokumen.\n"
    "4. Halaman Profil Pengguna Terintegrasi (Personal Metrics Dashboard & Adaptive Theme): Halaman profil akun komprehensif yang memuat formulir pembaruan identitas "
    "(nama, telepon, biodata, username unik), dashboard metrik analitik personal (grafik Personal Task Completion Velocity mingguan, rasio tugas selesai vs ditugaskan, "
    "dan daftar kartu overdue milik pengguna), serta kontrol preferensi tema antarmuka (Dark Theme, Light Theme, dan Auto Sync yang mendeteksi tema hardware laptop/handphone secara dinamis)."
)

# F.5
add_subheading(doc, "F.5 Rancangan Database / ERD (Perencanaan)")
add_styled_paragraph(
    doc,
    "Arsitektur penyimpanan data PostgreSQL Decko diperluas dengan menambahkan 4 tabel operasional baru dan pembaruan pada tabel users yang sudah ada. "
    "Spesifikasi rancangan basis data perencanaan Proyek 2 adalah sebagai berikut:"
)

erd_spec = (
    "1. Perluasan Tabel `users`:\n"
    "   - bio (TEXT, nullable): Menyimpan ringkasan biodata profil pengguna.\n"
    "   - phone (VARCHAR 20, nullable): Nomor telepon kontak pengguna.\n"
    "   - is_email_verified (BOOLEAN, default FALSE): Penanda verifikasi alamat surel aktif.\n\n"
    "2. Pembuatan Tabel Baru `notifications` (Pusat Notifikasi):\n"
    "   - id (SERIAL, PRIMARY KEY): Identifikasi unik notifikasi.\n"
    "   - user_id (INT, FOREIGN KEY -> users.id ON DELETE CASCADE): Penerima notifikasi.\n"
    "   - type (VARCHAR 50, NOT NULL): Jenis notifikasi ('assignment', 'comment', 'deadline_alert').\n"
    "   - title (VARCHAR 150, NOT NULL): Judul ringkas notifikasi.\n"
    "   - message (TEXT, NOT NULL): Deskripsi detail pesan notifikasi.\n"
    "   - link_url (TEXT, nullable): Rute URL kartu atau board terkait.\n"
    "   - is_read (BOOLEAN, default FALSE): Status keterbacaan notifikasi.\n"
    "   - created_at (TIMESTAMP WITH TIME ZONE, default CURRENT_TIMESTAMP): Waktu penerbitan.\n\n"
    "3. Pembuatan Tabel Baru `card_attachments` (Tautan Rujukan Eksternal):\n"
    "   - id (SERIAL, PRIMARY KEY): Identifikasi unik tautan.\n"
    "   - card_id (INT, FOREIGN KEY -> cards.id ON DELETE CASCADE): Kartu pemilik tautan.\n"
    "   - title (VARCHAR 150, NOT NULL): Nama label tautan (contoh: 'Dokumen SRS Google Drive').\n"
    "   - url (TEXT, NOT NULL): Alamat tautan web eksternal.\n"
    "   - provider (VARCHAR 50, nullable): Jenis penyedia ('Google Drive', 'Figma', 'GitHub', 'Generic').\n"
    "   - created_by (INT, FOREIGN KEY -> users.id ON DELETE SET NULL): Pembuat tautan.\n"
    "   - created_at (TIMESTAMP WITH TIME ZONE, default CURRENT_TIMESTAMP): Waktu penambahan.\n\n"
    "4. Pembuatan Tabel Baru `recurring_tasks` (Automasi Tugas Berkala):\n"
    "   - id (SERIAL, PRIMARY KEY): Identifikasi unik aturan automasi.\n"
    "   - board_id (INT, FOREIGN KEY -> boards.id ON DELETE CASCADE): Papan tujuan kartu.\n"
    "   - list_id (INT, FOREIGN KEY -> lists.id ON DELETE CASCADE): Kolom awal penempatan kartu.\n"
    "   - title (VARCHAR 200, NOT NULL): Judul kartu tugas yang akan dibangkitkan.\n"
    "   - description (TEXT, nullable): Deskripsi tugas berkala.\n"
    "   - frequency (VARCHAR 20, NOT NULL): Interval pengulangan ('Daily', 'Weekly', 'Monthly').\n"
    "   - is_active (BOOLEAN, default TRUE): Status aktifitas penjadwalan.\n"
    "   - last_generated_at (TIMESTAMP WITH TIME ZONE, nullable): Waktu terakhir dieksekusi.\n\n"
    "5. Pembuatan Tabel Baru `auth_tokens` (Token Kriptografis Keamanan):\n"
    "   - id (SERIAL, PRIMARY KEY): Identifikasi unik token transaksi.\n"
    "   - user_id (INT, FOREIGN KEY -> users.id ON DELETE CASCADE): Pemilik token.\n"
    "   - token_hash (VARCHAR 255, NOT NULL): Hash token keamanan (SHA-256).\n"
    "   - otp_code (VARCHAR 10, nullable): Kode OTP verifikasi pendaftaran.\n"
    "   - token_type (VARCHAR 30, NOT NULL): Jenis token ('email_verification', 'password_reset').\n"
    "   - expires_at (TIMESTAMP WITH TIME ZONE, NOT NULL): Batas waktu kedaluwarsa token.\n"
    "   - is_used (BOOLEAN, default FALSE): Penanda penggunaan sekali pakai (one-time use).\n"
    "   - created_at (TIMESTAMP WITH TIME ZONE, default CURRENT_TIMESTAMP): Waktu penerbitan token."
)
add_styled_paragraph(doc, erd_spec)

# F.6
add_subheading(doc, "F.6 Pemetaan Modul CRUD (Perencanaan)")
add_styled_paragraph(
    doc,
    "Tabel di bawah ini memetakan seluruh operasi Create, Read, Update, dan Delete (CRUD) perencanaan Proyek 2 "
    "beserta spesifikasi input, proses logika, output, dan tabel basis data relasional yang terlibat:"
)

crud_table = doc.add_table(rows=7, cols=7)
crud_table.alignment = WD_TABLE_ALIGNMENT.CENTER
crud_table.autofit = False
set_table_borders(crud_table, color="A0B2C6", sz="4")
crud_widths = [Inches(0.35), Inches(1.1), Inches(0.55), Inches(1.1), Inches(1.6), Inches(1.1), Inches(1.0)]
crud_headers = ["No", "Fitur/Modul", "CRUD", "Input", "Proses / Logika", "Output", "Tabel DB"]

for i, h in enumerate(crud_headers):
    cell = crud_table.cell(0, i)
    cell.width = crud_widths[i]
    set_cell_margins(cell, top=60, bottom=60, left=60, right=60)
    set_cell_shading(cell, "EBF1F5")
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(0)
    run = p.add_run(h)
    run.font.name = 'Arial'
    run.font.size = Pt(8.5)
    run.font.bold = True
    run.font.color.rgb = RGBColor(31, 78, 121)

crud_rows_data = [
    ["1", "Notification Center", "C, R, U, D", "Event Trigger, User ID", "Sistem memvalidasi event (assignee/deadline), membuat notifikasi di DB, memancarkan event Socket.io, menandai status is_read = TRUE, dan menghapus notifikasi.", "Pemberitahuan Real-time & Unread Badge", "notifications, users"],
    ["2", "Recurring Task Scheduler", "C, R, U, D", "Board ID, Title, Frequency", "Menyimpan aturan automasi, mengecek timestamp interval jadwal via scheduler, menginstansiasi kartu tugas baru di kolom Kanban, serta memperbarui last_generated_at.", "Kartu Tugas Otomatis Terbit", "recurring_tasks, cards, lists"],
    ["3", "Tautan Berkas Eksternal", "C, R, U, D", "Card ID, Title, URL", "Validasi format sintaksis URL (regex), simpan relasi ke tabel card_attachments, tampilkan daftar tautan di modal kartu & badge ikon 🔗 pada papan Kanban.", "Tautan Tersimpan & Ikon 🔗 di Kartu", "card_attachments, cards"],
    ["4", "Dashboard Metrik Personal (Profil)", "R", "User ID, Time Range", "Kueri agregasi SQL untuk menghitung jumlah tugas selesai mingguan milik pengguna (personal velocity), rasio penyelesaian tugas individu, dan kartu overdue.", "Grafik Kecepatan Personal & Beban Tugas", "cards, card_members, lists"],
    ["5", "Verifikasi Surel Registrasi (OTP 5 Min)", "C, R, U", "Email, OTP Code", "Penerbitan kode OTP acak 5 menit saat registrasi, simpan hash ke DB, kirim surel via SMTP Nodemailer. Cocokkan kode & expiry, ubah users.is_email_verified = TRUE.", "Status Akun Aktif & Token Sesi JWT", "auth_tokens, users"],
    ["6", "Pemulihan Kata Sandi & Akun (IAM)", "C, R, U, D", "Email, Token/OTP, Password Baru", "Cek keberadaan email, buat token unik 32-byte berbatas waktu 5 menit, validasi integritas token reset, hash password baru dengan Bcrypt, update password_hash & invalidate token. Sertakan username jika registrasi ulang akun terduplikasi.", "Password Diperbarui & Notifikasi Sukses", "auth_tokens, users"]
]

for row_idx, r_data in enumerate(crud_rows_data, start=1):
    for col_idx, val in enumerate(r_data):
        cell = crud_table.cell(row_idx, col_idx)
        cell.width = crud_widths[col_idx]
        set_cell_margins(cell, top=50, bottom=50, left=60, right=60)
        p = cell.paragraphs[0]
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(0)
        p.paragraph_format.line_spacing = 1.05
        run = p.add_run(val)
        run.font.name = 'Arial'
        run.font.size = Pt(8)
        if col_idx == 0:
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            run.font.bold = True
        elif col_idx == 2:
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            run.font.bold = True

doc.add_paragraph().paragraph_format.space_after = Pt(6)

# --- G. PEMBAGIAN TUGAS BERBASIS FITUR ---
add_header_banner(doc, "G. PEMBAGIAN TUGAS BERBASIS FITUR")
p_g_hint = doc.add_paragraph()
r_g_hint = p_g_hint.add_run(
    "Pembagian tugas dilakukan berdasarkan fitur/modul, bukan frontend vs backend. Setiap anggota bertanggung jawab pada fitur secara utuh: "
    "tampilan, logika, database, validasi, testing, dan dokumentasi.\n"
)
r_g_hint.font.name = 'Arial'
r_g_hint.font.size = Pt(8.5)
r_g_hint.font.italic = True
r_g_hint.font.color.rgb = RGBColor(120, 120, 120)

tugas_table = doc.add_table(rows=3, cols=5)
tugas_table.alignment = WD_TABLE_ALIGNMENT.CENTER
tugas_table.autofit = False
set_table_borders(tugas_table, color="A0B2C6", sz="4")

t_col_widths = [Inches(0.4), Inches(1.5), Inches(1.5), Inches(2.1), Inches(1.3)]
t_headers = ["No", "Nama Anggota", "Fitur/Modul", "Ruang Lingkup Tanggung Jawab", "Output"]

for i, h in enumerate(t_headers):
    cell = tugas_table.cell(0, i)
    cell.width = t_col_widths[i]
    set_cell_margins(cell, top=60, bottom=60, left=70, right=70)
    set_cell_shading(cell, "EBF1F5")
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(0)
    run = p.add_run(h)
    run.font.name = 'Arial'
    run.font.size = Pt(8.5)
    run.font.bold = True
    run.font.color.rgb = RGBColor(31, 78, 121)

t_rows_data = [
    [
        "1",
        "Ahmad Zakky Nurfauzan\n(714250028)",
        "Modul IAM (Keamanan Sesi, Verifikasi Surel OTP 5 Min) & Tautan Berkas Eksternal",
        "Bertanggung jawab secara utuh (end-to-end) atas: perancangan UI modal tautan eksternal & badge 🔗 pada kartu; validasi regex URL; pembuatan REST API auth token & service SMTP Nodemailer (OTP 5 menit); penanganan resolusi akun terduplikasi; perancangan tabel card_attachments & auth_tokens; implementasi rate-limiting; penulisan test suite Jest/Supertest (6 skenario uji); dan penyusunan dokumentasi anatomi kode CRUD IAM.",
        "Modul IAM Tangguh, Modul External Links Lengkap, Test Suite Jest, Bukti Code Coverage >= 80%"
    ],
    [
        "2",
        "Izat Ibrahimovic Irawan\n(714250024)",
        "Modul Notification Center, Task Automation, & Profil (Personal Metrics & Adaptive Theme)",
        "Bertanggung jawab secara utuh (end-to-end) atas: perancangan UI lonceng notifikasi & dropdown inbox; perancangan antarmuka personal metrics dashboard di halaman profil (personal velocity & task completion); opsi pengaturan tema adaptif (Dark/Light/Auto OS sync); pembuatan REST API notifications & recurring scheduler; perancangan tabel notifications & recurring_tasks; penulisan test suite Jest/Supertest (6 skenario uji); dan penyusunan dokumentasi anatomi kode CRUD Notifikasi & Automasi.",
        "Modul Notification Center, Modul Recurring Tasks, Profil & Dashboard Metrik Personal, Bukti Code Coverage >= 80%"
    ]
]

for row_idx, r_data in enumerate(t_rows_data, start=1):
    for col_idx, val in enumerate(r_data):
        cell = tugas_table.cell(row_idx, col_idx)
        cell.width = t_col_widths[col_idx]
        set_cell_margins(cell, top=60, bottom=60, left=70, right=70)
        p = cell.paragraphs[0]
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(0)
        p.paragraph_format.line_spacing = 1.05
        run = p.add_run(val)
        run.font.name = 'Arial'
        run.font.size = Pt(8)
        if col_idx == 0:
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            run.font.bold = True

doc.add_paragraph().paragraph_format.space_after = Pt(6)

# --- I. LUARAN YANG DITARGETKAN ---
add_header_banner(doc, "I. LUARAN YANG DITARGETKAN")
p_i_hint = doc.add_paragraph()
r_i_hint = p_i_hint.add_run("Tuliskan luaran yang akan dihasilkan dan indikator kelengkapannya.\n")
r_i_hint.font.name = 'Arial'
r_i_hint.font.size = Pt(8.5)
r_i_hint.font.italic = True
r_i_hint.font.color.rgb = RGBColor(120, 120, 120)

luaran_table = doc.add_table(rows=7, cols=4)
luaran_table.alignment = WD_TABLE_ALIGNMENT.CENTER
luaran_table.autofit = False
set_table_borders(luaran_table, color="A0B2C6", sz="4")

l_col_widths = [Inches(0.4), Inches(2.0), Inches(3.0), Inches(1.4)]
l_headers = ["No", "Luaran", "Indikator Kelengkapan", "Target"]

for i, h in enumerate(l_headers):
    cell = luaran_table.cell(0, i)
    cell.width = l_col_widths[i]
    set_cell_margins(cell, top=60, bottom=60, left=70, right=70)
    set_cell_shading(cell, "EBF1F5")
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(0)
    run = p.add_run(h)
    run.font.name = 'Arial'
    run.font.size = Pt(8.5)
    run.font.bold = True
    run.font.color.rgb = RGBColor(31, 78, 121)

l_rows_data = [
    ["1", "Aplikasi / modul yang dikembangkan", "Modul Notification Center, Task Automation, External Resource Links, Profil & Dashboard Metrik Personal (Adaptive Theme), dan Keamanan IAM berjalan sempurna dan dapat didemonstrasikan.", "Selesai 100%"],
    ["2", "Dokumentasi CRUD", "Seluruh siklus Create, Read, Update, Delete pada seluruh modul terdokumentasi lengkap mencakup spesifikasi input, proses logika, query, dan output basis data.", "Terdokumentasi Lengkap"],
    ["3", "Dokumentasi source code", "Setiap controller, middleware otorisasi, scheduler automasi, dan helper dijelaskan secara modular dengan komentar standar dokumentasi kode.", "Tersedia di Repositori"],
    ["4", "Hasil testing", "Matriks pengujian otomatis terperinci mencakup 12 skenario pengujian (issues), data masukan, nilai ekspektasi, hasil aktual, dan status (Pass/Fail).", "100% Passed"],
    ["5", "Code coverage report", "Bukti laporan HTML/LCOV hasil eksekusi pengujian otomatis Jest/Supertest yang membuktikan capaian persentase baris, fungsi, dan percabangan logika.", "Coverage >= 80%"],
    ["6", "Laporan akhir Proyek 2", "Dokumen laporan akhir lengkap yang mematuhi format panduan Proyek 2 Program Studi D4 Teknik Informatika.", "Draft Final Siap Sidang"]
]

for row_idx, r_data in enumerate(l_rows_data, start=1):
    for col_idx, val in enumerate(r_data):
        cell = luaran_table.cell(row_idx, col_idx)
        cell.width = l_col_widths[col_idx]
        set_cell_margins(cell, top=50, bottom=50, left=70, right=70)
        p = cell.paragraphs[0]
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(0)
        p.paragraph_format.line_spacing = 1.05
        run = p.add_run(val)
        run.font.name = 'Arial'
        run.font.size = Pt(8)
        if col_idx == 0:
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            run.font.bold = True

doc.add_paragraph().paragraph_format.space_after = Pt(6)

# --- J. JADWAL PELAKSANAAN (SESUAI SLIDE 13) ---
add_header_banner(doc, "J. JADWAL PELAKSANAAN")
p_j_hint = doc.add_paragraph()
r_j_hint = p_j_hint.add_run("Susun jadwal pelaksanaan sesuai timeline Proyek 2 dan periode bimbingan yang ditetapkan koordinator.\n")
r_j_hint.font.name = 'Arial'
r_j_hint.font.size = Pt(8.5)
r_j_hint.font.italic = True
r_j_hint.font.color.rgb = RGBColor(120, 120, 120)

jadwal_table = doc.add_table(rows=8, cols=4)
jadwal_table.alignment = WD_TABLE_ALIGNMENT.CENTER
jadwal_table.autofit = False
set_table_borders(jadwal_table, color="A0B2C6", sz="4")

j_col_widths = [Inches(0.4), Inches(2.5), Inches(2.0), Inches(1.9)]
j_headers = ["No", "Tahap / Kegiatan", "Periode / Tanggal", "Target Output"]

for i, h in enumerate(j_headers):
    cell = jadwal_table.cell(0, i)
    cell.width = j_col_widths[i]
    set_cell_margins(cell, top=60, bottom=60, left=70, right=70)
    set_cell_shading(cell, "EBF1F5")
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(0)
    run = p.add_run(h)
    run.font.name = 'Arial'
    run.font.size = Pt(8.5)
    run.font.bold = True
    run.font.color.rgb = RGBColor(31, 78, 121)

j_rows_data = [
    ["1", "Pengajuan Judul & Penyusunan Proposal Proyek 2", "18 – 21 Oktober 2026", "Proposal Proyek 2 Terkumpul"],
    ["2", "Review & Revisi Proposal Bersama Pembimbing", "21 – 24 Oktober 2026", "ACC Proposal Final"],
    ["3", "Bimbingan 1 - 2: Analisis Kebutuhan & Desain ERD Baru", "27 Oktober – 9 November 2026", "Logbook & Skema Database"],
    ["4", "Bimbingan 3 - 4: Implementasi Backend & UI Tautan/IAM", "10 – 23 November 2026", "Logbook & API IAM/Links Berjalan"],
    ["5", "Bimbingan 5 - 6: Implementasi Notifikasi & Task Automation", "24 November – 7 Desember 2026", "Logbook & Modul Notifikasi Berjalan"],
    ["6", "Bimbingan 7 - 8: Pengujian Otomatis & Code Coverage", "8 – 22 Desember 2026", "Laporan Code Coverage >= 80%"],
    ["7", "Pengumpulan Draf Laporan Akhir & Pelaksanaan Sidang", "23 Desember 2026 – 5 Jan 2027", "Laporan Akhir, Poster, & Sidang"]
]

for row_idx, r_data in enumerate(j_rows_data, start=1):
    for col_idx, val in enumerate(r_data):
        cell = jadwal_table.cell(row_idx, col_idx)
        cell.width = j_col_widths[col_idx]
        set_cell_margins(cell, top=50, bottom=50, left=70, right=70)
        p = cell.paragraphs[0]
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(0)
        p.paragraph_format.line_spacing = 1.05
        run = p.add_run(val)
        run.font.name = 'Arial'
        run.font.size = Pt(8)
        if col_idx == 0:
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            run.font.bold = True

doc.add_paragraph().paragraph_format.space_after = Pt(6)

# --- K. DAFTAR PUSTAKA ---
add_header_banner(doc, "K. DAFTAR PUSTAKA")
p_k_hint = doc.add_paragraph()
r_k_hint = p_k_hint.add_run("Cantumkan hanya sumber yang benar-benar digunakan dalam proposal. Gunakan sumber yang kredibel dan satu gaya sitasi secara konsisten.\n")
r_k_hint.font.name = 'Arial'
r_k_hint.font.size = Pt(8.5)
r_k_hint.font.italic = True
r_k_hint.font.color.rgb = RGBColor(120, 120, 120)

pustaka_items = [
    "[1] R. S. Pressman and B. R. Maxim, Software Engineering: A Practitioner's Approach, 9th ed. New York: McGraw-Hill Education, 2020.",
    "[2] I. Sommerville, Software Engineering, 10th ed. Boston: Pearson Education, 2016.",
    "[3] OWASP Foundation, \"OWASP Top 10 Web Application Security Risks,\" OWASP.org, 2021. [Online]. Available: https://owasp.org/www-project-top-ten/.",
    "[4] V. Khorikov, Unit Testing Principles, Practices, and Patterns. Shelter Island, NY: Manning Publications, 2020.",
    "[5] P. Aniche, Effective Software Testing: A Developer's Guide. Shelter Island, NY: Manning Publications, 2022.",
    "[6] M. Fowler, Refactoring: Improving the Design of Existing Code, 2nd ed. Boston: Addison-Wesley Professional, 2018.",
    "[7] PostgreSQL Global Development Group, \"PostgreSQL 16 Documentation,\" PostgreSQL.org, 2023. [Online]. Available: https://www.postgresql.org/docs/.",
    "[8] R. Habibi and F. B. Sandikapura, \"Penerapan Kriptografi dan Manajemen Akses pada Sistem Informasi Terdistribusi,\" Jurnal Teknologi dan Sistem Komputer, vol. 9, no. 2, pp. 102–111, 2021."
]

for item in pustaka_items:
    add_styled_paragraph(doc, item, space_after=3)

doc.add_paragraph().paragraph_format.space_after = Pt(8)

# --- CHECKLIST SEBELUM SUBMIT ---
add_header_banner(doc, "CHECKLIST SEBELUM SUBMIT")
checklist_items = [
    ("☑ ", "Judul dan ruang lingkup sesuai Proyek 2 (CRUD & Code Coverage)."),
    ("☑ ", "Fitur CRUD yang dianalisis sudah jelas (Notification Center, Task Automation, External Links, & IAM)."),
    ("☑ ", "ERD/workflow sudah dilampirkan atau direncanakan secara terperinci (4 tabel operasional baru)."),
    ("☑ ", "Pembagian tugas dilakukan berdasarkan fitur/modul secara berimbang antara 2 anggota kelompok."),
    ("☑ ", "Pilihan dosen pembimbing sudah diisi sesuai bidang kepakaran (Roni Habibi, S.Kom., M.T., SFPC)."),
    ("☑ ", "Jadwal pelaksanaan sudah disusun terstruktur sepanjang timeline perkuliahan hingga periode sidang."),
    ("☑ ", "Persyaratan panjang kata pada Ringkasan, Latar Belakang, Tujuan, dan Ruang Lingkup terpenuhi (masing-masing > 300 kata).")
]
for pfx, item in checklist_items:
    add_styled_paragraph(doc, item, bold_prefix=pfx, space_after=2)

# Save Document
output_proyek2_laporan = "/Users/zakky/Documents/Zakky/Proyek 2/Laporan/Proposal_Proyek_2_Decko_Ahmad_Zakky_Izat_Ibrahimovic.docx"
output_workspace = "/Users/zakky/Documents/Zakky/Proyek 1/CODE/Proposal_Proyek_2_Decko_Ahmad_Zakky_Izat_Ibrahimovic.docx"
output_desktop = "/Users/zakky/Desktop/Proposal_Proyek_2_Decko_Ahmad_Zakky_Izat_Ibrahimovic.docx"

doc.save(output_proyek2_laporan)
doc.save(output_workspace)
doc.save(output_desktop)

print(f"Proposal DOCX successfully generated at:")
print(f"  - {output_proyek2_laporan}")
print(f"  - {output_workspace}")
print(f"  - {output_desktop}")

# Export to PDF via Microsoft Word AppleScript
import subprocess

pdf_targets = [
    (output_proyek2_laporan, "/Users/zakky/Documents/Zakky/Proyek 2/Laporan/Proposal_Proyek_2_Decko_Ahmad_Zakky_Izat_Ibrahimovic.pdf"),
    (output_workspace, "/Users/zakky/Documents/Zakky/Proyek 1/CODE/Proposal_Proyek_2_Decko_Ahmad_Zakky_Izat_Ibrahimovic.pdf")
]

for docx_path, pdf_path in pdf_targets:
    try:
        ascript = f'''
        set docxPath to (POSIX file "{docx_path}") as text
        set pdfPath to (POSIX file "{pdf_path}") as text
        tell application "Microsoft Word"
            open file docxPath
            save as active document file name pdfPath file format format PDF
            close active document saving no
        end tell
        '''
        subprocess.run(['osascript', '-e', ascript], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=10)
        print(f"Proposal PDF successfully exported at: {pdf_path}")
    except Exception as e:
        print(f"Notice during PDF export for {pdf_path}: {e}")

print(f"\nWord counts verified:")
print(f"  - Section B (Ringkasan): {total_ringkasan_words} kata (Syarat: Minimal 300 kata) -> {'MEMENUHI' if total_ringkasan_words >= 300 else 'KURANG'}")
print(f"  - Section E.1 (Latar Belakang): {total_e1_words} kata (Syarat: Minimal 300 kata) -> {'MEMENUHI' if total_e1_words >= 300 else 'KURANG'}")
print(f"  - Section E.2 (Tujuan Proyek): {total_e2_words} kata (Syarat: Minimal 300 kata) -> {'MEMENUHI' if total_e2_words >= 300 else 'KURANG'}")
print(f"  - Section E.4 (Ruang Lingkup): {total_e4_words} kata (Syarat: Minimal 300 kata) -> {'MEMENUHI' if total_e4_words >= 300 else 'KURANG'}")
