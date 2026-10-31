import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
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
    set_cell_shading(cell, "1F4E79")
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

# Create Document
doc = docx.Document()

# Set Margins (Normal: 1 inch = 72 pt)
sections = doc.sections
for s in sections:
    s.top_margin = Inches(0.8)
    s.bottom_margin = Inches(0.8)
    s.left_margin = Inches(0.85)
    s.right_margin = Inches(0.85)

# --- HEADER TOP TITLE ---
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

# --- METADATA TABLE ---
meta_table = doc.add_table(rows=4, cols=4)
meta_table.alignment = WD_TABLE_ALIGNMENT.CENTER
meta_table.autofit = False
set_table_borders(meta_table, color="A0B2C6", sz="4")

col_widths = [Inches(1.3), Inches(2.1), Inches(1.4), Inches(2.0)]
meta_data = [
    [("Kelompok", True), ("Mandiri", False), ("Tanggal Usulan", True), ("19 Oktober 2026", False)],
    [("Ketua", True), ("Ahmad Zakky Nurfauzan\n(714250028)", False), ("Anggota", True), ("- (Pengembangan Mandiri)", False)],
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

r_a = p_a.add_run("Pengembangan Fitur Manajemen Profil Pengguna dan Penguatan Keamanan Sistem Autentikasi pada Aplikasi Decko Berbasis Code Coverage")
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
    "Aplikasi manajemen tugas kolaboratif Decko yang telah dibangun pada Proyek 1 berhasil mengimplementasikan metode visual Kanban, "
    "pembagian peran bertingkat Role-Based Access Control (RBAC), serta sinkronisasi perubahan kartu secara real-time via WebSockets Socket.io. "
    "Meskipun fondasi alur kerja manajemen tugas telah beroperasi dengan baik, evaluasi sistem pasca-implementasi menunjukkan adanya kelemahan fundamental "
    "pada aspek ketahanan autentikasi dan personalisasi pengguna. Pertama, pendaftaran akun belum dilengkapi dengan mekanisme verifikasi kepemilikan alamat surel, "
    "sehingga basis data rentan terhadap pembuatan akun anonim, pendaftaran massal oleh bot, dan spam. Kedua, ketiadaan fungsionalitas pemulihan kata sandi (forgot password) "
    "menyebabkan pengguna yang kehilangan kredensial tidak dapat mengakses kembali akunnya secara mandiri, berpotensi memutus akses terhadap ruang kerja dan kartu tugas penting. "
    "Ketiga, entitas pengguna belum memiliki kendali personalisasi profil yang fleksibel, seperti pengunggahan foto profil (avatar) kustom, pembaruan biodata, maupun penggantian username unik."
)

ringkasan_p2 = (
    "Tujuan utama dari Proyek 2 ini adalah mentransformasi dan meningkatkan reliabilitas aplikasi Decko melalui dua pilar esensial, "
    "yaitu penguatan arsitektur keamanan autentikasi dan penyediaan modul manajemen profil pengguna secara menyeluruh berbasis pengujian code coverage yang ketat. "
    "Pada pilar keamanan, sistem akan dikembangkan dengan mengintegrasikan protokol Simple Mail Transfer Protocol (SMTP) menggunakan pustaka Nodemailer untuk pengiriman "
    "One-Time Password (OTP) dan tautan aktivasi berbatas waktu (time-limited tokens). Mekanisme ini menjamin bahwa setiap pendaftar tervalidasi secara sah sebelum akun diaktifkan. "
    "Selain itu, alur pemulihan kata sandi mandiri dibangun menggunakan token kriptografis sekali pakai (single-use cryptographic tokens) yang dilengkapi pengamanan brute force "
    "berbasis rate limiting pada setiap endpoint sensitif. Pada pilar manajemen profil, pengguna diberikan antarmuka modern untuk melakukan operasi Create, Read, Update, dan Delete (CRUD) "
    "pada identitas diri, mencakup pengunggahan berkas avatar lokal/server dengan validasi tipe MIME dan batasan ukuran, pengubahan identitas username real-time, penyuntingan nomor telepon, serta opsi deaktivasi akun mandiri."
)

ringkasan_p3 = (
    "Sebagai perwujudan tema utama Proyek 2 yaitu CRUD & Code Coverage, seluruh modul baru yang dikembangkan akan diuji secara komprehensif menggunakan kombinasi unit testing "
    "dan integration testing dengan framework Jest dan Supertest pada sisi backend Express.js, serta Vitest pada sisi frontend React. Pengujian mencakup skenario positif (happy paths) "
    "dan skenario batas negatif (edge cases), seperti token kedaluwarsa, manipulasi payload request, duplikasi username, dan kegagalan transmisi surel. Proyek ini menargetkan "
    "capaian code coverage minimal sebesar 80% pada seluruh file controller, middleware keamanan, dan model basis data terkait. Luaran utama yang dihasilkan dari Proyek 2 ini "
    "meliputi repositori aplikasi Decko versi mutakhir yang tangguh, dokumentasi lengkap operasi CRUD, laporan analisis source code, matriks laporan code coverage terverifikasi, "
    "serta dokumen laporan akhir Proyek 2 yang memenuhi standar akademik Program Studi D4 Teknik Informatika."
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
r_c = p_c.add_run("CRUD; Decko; Keamanan Autentikasi; Profil Pengguna; Code Coverage; Jest")
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

d_col_widths = [Inches(0.8), Inches(2.2), Inches(1.8), Inches(2.0)]
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
    "Dr. Syafrial Fachri Pane, S.T., M.TI., EBDP., CDSP., SFPC",
    "Rekayasa Perangkat Lunak, Basis Data, dan Pengujian Sistem",
    "Memiliki kesesuaian kepakaran di bidang pengujian perangkat lunak dan telah membimbing arsitektur sistem Decko pada Proyek 1 sehingga keberlanjutan proyek terjamin."
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
    "Aplikasi Decko dirancang sebagai sistem manajemen tugas berbasis web yang memanfaatkan metodologi Kanban guna meningkatkan "
    "efisiensi kolaborasi tim. Pada tahapan Proyek 1, pengembangan telah berhasil mengimplementasikan modul inti berupa autentikasi dasar berbasis JWT, "
    "manajemen workspace dan board, hierarki Role-Based Access Control (RBAC) 4-tingkat (Owner, Admin, Member, Observer), sinkronisasi interaksi real-time "
    "menggunakan WebSockets Socket.io, hingga mekanisme soft delete dan trash bin kartu tugas. Namun demikian, observasi dan pengujian mendalam terhadap "
    "aplikasi mengungkapkan beberapa keterbatasan kritis yang dapat menghambat adopsi aplikasi dalam skenario penggunaan riil. "
    "Kondisi saat ini menunjukkan bahwa arsitektur autentikasi Decko masih mengizinkan pengguna melakukan registrasi secara instan hanya dengan memasukkan "
    "alamat surel tanpa adanya proses pembuktian kepemilikan (email verification). Hal ini membuka celah keamanan yang signifikan di mana pengguna dapat mendaftarkan "
    "alamat email sembarang milik orang lain atau melakukan pendaftaran berulang melalui bot otomatis (spam accounts), yang berdampak langsung pada penurunan integritas "
    "serta pemborosan sumber daya basis data PostgreSQL."
)

e1_p2 = (
    "Permasalahan lain yang sangat krusial adalah ketiadaan mekanisme pemulihan akun saat pengguna melupakan kata sandi (forgot password). "
    "Dalam sistem saat ini, apabila pengguna lupa kredensial login, tidak ada jalur pemulihan otomatis yang disediakan selain meminta administrator basis data melakukan reset hash kata sandi manual. "
    "Dampak dari masalah ini sangat merugikan pengguna, karena terputusnya akses ke akun berarti hilangnya akses langsung terhadap seluruh workspace proyek, daftar tugas, dan riwayat "
    "diskusi penting yang telah dikerjakan. Selain itu, dari perspektif pengalaman pengguna (user experience), personalisasi akun masih sangat terbatas di mana pengguna tidak dapat mengganti "
    "foto profil secara kustom menggunakan berkas lokal, tidak dapat memperbarui informasi biodata, dan tidak dapat mengubah username secara dinamis. "
    "Terlebih lagi, modul-modul ini belum didukung oleh rangkaian pengujian kode otomatis (automated code coverage) yang terstruktur, sehingga setiap pembaruan kode di masa depan "
    "berisiko memicu regresi (software regression) dan merusak fungsi-fungsi yang telah berjalan sebelumnya."
)

e1_p3 = (
    "Berdasarkan analisis permasalahan di atas, rumusan masalah yang akan dijawab dan diselesaikan melalui pelaksanaan Proyek 2 ini adalah: "
    "(1) Bagaimana merancang dan mengimplementasikan mekanisme verifikasi email pendaftaran dan alur pemulihan kata sandi mandiri yang aman dan berbatas waktu pada aplikasi Decko? "
    "(2) Bagaimana membangun modul manajemen profil pengguna yang mendukung operasi Create, Read, Update, dan Delete (CRUD) terhadap identitas akun, avatar kustom, dan pengaturan keamanan mandiri? "
    "(3) Bagaimana merancang arsitektur pengujian otomatis unit dan integration test menggunakan framework Jest dan Supertest guna mencapai target code coverage minimal 80% pada seluruh modul baru yang dikembangkan?"
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
    "Pelaksanaan Proyek 2 ini dirancang secara terukur untuk menjawab rumusan masalah yang telah ditetapkan, dengan orientasi utama pada penyempurnaan fitur fungsional, "
    "penerapan operasi CRUD yang terdokumentasi rapi, serta pencapaian kualitas perangkat lunak melalui pengujian code coverage yang ketat. "
    "Secara spesifik, tujuan pertama dari proyek ini adalah melakukan analisis mendalam terhadap celah keamanan alur autentikasi dan identitas pengguna pada aplikasi Decko, "
    "kemudian merancang solusi penguatan keamanan berbasis protokol SMTP untuk verifikasi email saat registrasi serta mekanisme pengiriman token pemulihan kata sandi berbatas waktu. "
    "Tujuan ini diukur dengan keberhasilan sistem dalam mengirimkan kode One-Time Password (OTP) dan tautan verifikasi yang kedaluwarsa secara otomatis dalam kurun waktu 15 menit, "
    "serta kemampuan sistem dalam mencegah login bagi akun yang belum tervalidasi."
)

e2_p2 = (
    "Tujuan kedua adalah mengimplementasikan modul manajemen profil pengguna yang menyediakan seluruh operasi CRUD (Create, Read, Update, Delete) secara terintegrasi pada antarmuka "
    "frontend React.js dan backend Express.js. Keberhasilan implementasi ini diukur dari terwujudnya fungsionalitas unggah dan hapus foto profil kustom (avatar) dengan validasi tipe berkas dan ukuran maksimal 2MB, "
    "kemampuan membaca serta memperbarui data pribadi (nama lengkap, username, nomor telepon, biodata) secara aman tanpa menyebabkan inkonsistensi relasi basis data, "
    "serta fitur pembaruan kata sandi dari dalam profil pengguna yang diverifikasi dengan kata sandi lama."
)

e2_p3 = (
    "Tujuan ketiga yang merupakan inti dari tema Proyek 2 adalah mendokumentasikan source code secara modular, memetakan setiap siklus operasi CRUD ke dalam tabel spesifikasi formal, "
    "serta menyusun suite pengujian otomatis (automated test suites) menggunakan Jest dan Supertest pada sisi backend serta Vitest pada sisi frontend. "
    "Tujuan pengujian ini diukur secara kuantitatif melalui laporan code coverage dengan target pencapaian minimal 80% pada statement coverage, branch coverage, function coverage, dan line coverage. "
    "Dengan target terukur tersebut, setiap kemungkinan kesalahan (seperti request token kedaluwarsa, kegagalan koneksi database, kesalahan input formulir, hingga penyerangan brute force) "
    "dapat dipastikan tertangani dengan respons galat yang tepat dan tidak mengakibatkan kegagalan sistem mendadak (system crash). "
    "Hasil akhir dari proyek ini adalah aplikasi yang siap produksi, berkinerja tinggi, dan memiliki standar dokumentasi pengujian yang dapat dipertanggungjawabkan secara akademik."
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
    "Dalam merancang pengembangan fitur keamanan dan profil pengguna pada Proyek 2 ini, dilakukan analisis komparatif terhadap tiga aplikasi industri populer sejenis, yaitu:\n"
    "1. Trello (Atlassian): Diamati pada aspek alur registrasi akun dan manajemen profil kolaboratif. Trello menerapkan sistem pengaturan avatar pengguna dengan fallback inisial nama otomatis yang harmonis, "
    "serta konfirmasi kata sandi lama sebelum pengguna diizinkan memperbarui kata sandi baru. Fitur yang diadopsi adalah penyediaan avatar kustom yang tetap konsisten saat ditampilkan pada kartu tugas (card) maupun header ruang kerja.\n"
    "2. Notion (Notion Labs): Diamati pada alur verifikasi surel berbasis kode PIN/OTP sementara (login/verification code) dan pengaturan preferensi akun (My Settings). Notion menyajikan antarmuka "
    "profil pengguna yang sangat bersih dan terpusat, mencakup pengaturan nama tampilan, pengunggahan foto profil kustom, pengelolaan kata sandi, serta opsi penonaktifan akun secara mandiri. "
    "Fitur yang diadopsi pada Decko adalah alur verifikasi kode OTP interaktif di kotak masuk surel serta struktur modal pengaturan profil akun yang ringkas dan intuitif.\n"
    "3. Linear (Linear Orbit): Platform manajemen tugas modern yang menerapkan keamanan autentikasi mutakhir, proteksi pembatasan frekuensi request (rate limiting) yang ketat pada endpoint otentikasi, "
    "serta penyuntingan identitas pengguna (username unik dan bio) dengan sinkronisasi real-time. Fitur yang diadopsi adalah mitigasi serangan brute force menggunakan rate limiter serta validasi keunikan username secara langsung."
)

e3_text2 = (
    "Perbedaan dan pengembangan yang direncanakan pada Decko:\n"
    "Berbeda dari Notion dan Trello yang mengarahkan proses pemulihan akun serta verifikasi surel ke ekosistem cloud pihak ketiga berskala enterprise (seperti Atlassian Cloud SSO atau server tertutup Notion), "
    "Decko membangun arsitektur verifikasi surel dan pemulihan kata sandi mandiri menggunakan protokol SMTP (Nodemailer) dengan token hash berbatas waktu yang disimpan langsung di database PostgreSQL. "
    "Hal ini menjadikan Decko memiliki kedaulatan data penuh tanpa ketergantungan pada vendor pihak ketiga berbayar (anti-vendor lock-in). Selain itu, Decko mengintegrasikan fitur pembersihan berkas avatar lama "
    "secara otomatis saat pengguna mengganti atau menghapus foto profil, guna mencegah penumpukan sampah berkas di server lokal."
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
    "Ruang lingkup pada Proyek 2 ini difokuskan secara spesifik pada penguatan modul keamanan autentikasi dan modul manajemen profil pengguna, "
    "serta pelaksanaan pengujian otomatis berbasis code coverage. Batasan modul yang dianalisis dan dikembangkan mencakup: "
    "(1) Modul Verifikasi Surel: Pembuatan token aktivasi saat registrasi, pengiriman surel aktivasi via SMTP Nodemailer, serta endpoint konfirmasi token aktivasi; "
    "(2) Modul Pemulihan Kata Sandi: Endpoint permohonan reset kata sandi, validasi token reset berbatas waktu (15 menit), dan eksekusi hashing kata sandi baru; "
    "(3) Modul Manajemen Profil Pengguna: Antarmuka modal profil, penanganan unggah berkas gambar avatar menggunakan middleware Multer dengan pembatasan ukuran maksimal 2MB dan filter ekstensi (.jpg, .jpeg, .png), "
    "penyuntingan username unik, nama lengkap, nomor telepon, dan bio, serta fitur ganti kata sandi berotentikasi dan deaktivasi akun mandiri; "
    "(4) Modul Keamanan Sesi: Implementasi middleware express-rate-limit pada rute otentikasi guna mencegah serangan brute force dan denial-of-service berskala kecil."
)

e4_p2 = (
    "Operasi CRUD yang masuk dalam ruang lingkup proyek ini didefinisikan secara tegas: "
    "Create mencakup pembuatan entri token verifikasi email pada tabel auth_tokens, pembuatan tiket token reset password, dan penyimpanan berkas avatar baru; "
    "Read mencakup pengambilan data profil pengguna (GET /api/users/profile), verifikasi status keabsahan token reset password, dan pemuatan berkas avatar; "
    "Update mencakup pengubahan username, biodata, dan nomor telepon pada tabel users, pembaruan password_hash saat reset/ganti kata sandi, serta pengubahan status token menjadi is_used; "
    "Delete mencakup penghapusan berkas fisik avatar lama dari media penyimpanan server, pembersihan token autentikasi kedaluwarsa, dan pembekuan/deaktivasi akun pengguna secara mandiri."
)

e4_p3 = (
    "Teknologi yang digunakan dalam ruang lingkup ini meliputi React.js (React 19+) dan Vite di sisi frontend, Express.js (Node.js) di sisi backend, PostgreSQL sebagai Relational Database Management System (RDBMS), "
    "Nodemailer untuk transmisi surel SMTP, Multer untuk penanganan berkas multipart, serta Jest dan Supertest sebagai runner pengujian dan pengukur code coverage. "
    "Adapun bagian yang secara tegas DITETAPKAN TIDAK DIKERJAKAN (out of scope) pada Proyek 2 ini meliputi: "
    "(1) Integrasi autentikasi pihak ketiga OAuth2 / Social Login (seperti Google Login atau GitHub Sign-In); "
    "(2) Penyimpanan media di layanan cloud eksternal berbayar seperti AWS S3 atau Google Cloud Storage (penyimpanan berkas avatar difokuskan secara lokal di server backend); "
    "(3) Pembangunan aplikasi seluler native (Android/iOS); dan "
    "(4) Fitur komunikasi obrolan langsung (live chat messaging) antarpengguna."
)

add_styled_paragraph(doc, e4_p1)
add_styled_paragraph(doc, e4_p2)
add_styled_paragraph(doc, e4_p3)

total_e4_words = len((e4_p1 + " " + e4_p2 + " " + e4_p3).split())

# --- F. ANALISIS DAN RENCANA PELAKSANAAN ---
add_header_banner(doc, "F. ANALISIS DAN RENCANA PELAKSANAAN")
p_f_hint = doc.add_paragraph()
r_f_hint = p_f_hint.add_run("Gunakan bagian ini untuk menunjukkan bahwa pemohon memahami aplikasi sebelum masuk ke dokumentasi kode dan pengujian.\n")
r_f_hint.font.name = 'Arial'
r_f_hint.font.size = Pt(8.5)
r_f_hint.font.italic = True
r_f_hint.font.color.rgb = RGBColor(120, 120, 120)

# F.1
add_subheading(doc, "F.1 Analisis Kebutuhan Fungsional")
f1_items = [
    ("F-01 (Verifikasi Surel Registrasi): ", "Sistem harus dapat mengirimkan kode One-Time Password (OTP) ke alamat surel pengguna sesaat setelah pengisian formulir pendaftaran akun dan mengaktifkan akun hanya setelah kode divalidasi."),
    ("F-02 (Permohonan Lupa Kata Sandi): ", "Sistem harus menyediakan formulir permohonan pemulihan kata sandi bagi pengguna yang memasukkan email terdaftar dan memancarkan token reset berbatas waktu 15 menit ke kotak masuk surel."),
    ("F-03 (Reset Kata Sandi Mandiri): ", "Sistem harus menyediakan halaman pembaharuan kata sandi yang memvalidasi integritas token reset dan mengenkripsi kata sandi baru menggunakan Bcrypt sebelum disimpan ke basis data."),
    ("F-04 (Unggah Foto Profil Kustom): ", "Sistem harus mengizinkan pengguna mengunggah berkas foto profil berformat JPG/PNG dengan kapasitas berkas maksimal 2MB serta memperbarui visual avatar di seluruh antarmuka."),
    ("F-05 (Hapus Foto Profil): ", "Sistem harus menyediakan opsi penghapusan avatar kustom yang memicu penghapusan berkas fisik di server dan mengembalikan tampilan avatar ke inisial nama default."),
    ("F-06 (Manajemen Identitas Akun): ", "Sistem harus memfasilitasi pengubahan username dengan validasi keunikan secara real-time, penyuntingan nama lengkap, nomor telepon, dan bio profil."),
    ("F-07 (Ganti Kata Sandi dari Akun): ", "Sistem harus memvalidasi kebenaran kata sandi lama sebelum mengizinkan penyimpanan kata sandi baru pada menu pengaturan akun."),
    ("F-08 (Proteksi Brute Force): ", "Sistem harus membatasi frekuensi request pada endpoint sensitif (maksimal 5 percobaan gagal per 15 menit) guna memitigasi serangan otomatis."),
    ("F-09 (Deaktivasi Akun Mandiri): ", "Sistem harus memfasilitasi pengguna untuk menonaktifkan status akunnya sendiri secara aman dengan mewajibkan verifikasi kata sandi aktif.")
]
for pfx, desc in f1_items:
    add_styled_paragraph(doc, desc, bold_prefix=pfx, space_after=3)

# F.2
add_subheading(doc, "F.2 Analisis Kebutuhan Nonfungsional")
f2_items = [
    ("N-01 (Keamanan / Security): ", "Seluruh kata sandi wajib di-hash menggunakan algoritma Bcrypt dengan salt rounds minimal 10. Seluruh token verifikasi di basis data disimpan dalam bentuk hash SHA-256."),
    ("N-02 (Kinerja / Performance): ", "Waktu respon endpoint verifikasi surel dan pembaruan profil harus berada di bawah ambang batas 500ms pada kondisi jaringan normal."),
    ("N-03 (Kemudahan Penggunaan / Usability): ", "Antarmuka formulir profil dan pemulihan akun dirancang konsisten mengusung tema gelap (dark theme) dengan umpan balik pesan sukses/galat yang jelas (sweetalert style)."),
    ("N-04 (Kompatibilitas / Compatibility): ", "Antarmuka profil responsif dan berfungsi optimal pada resolusi layar peramban desktop maupun peramban seluler modern."),
    ("N-05 (Keandalan Pengujian / Testability): ", "Seluruh logika bisnis pada service layer dan controller dirancang modular (loose coupling) agar dapat diuji secara terisolasi dengan Jest mencapai coverage minimal 80%.")
]
for pfx, desc in f2_items:
    add_styled_paragraph(doc, desc, bold_prefix=pfx, space_after=3)

# F.3
add_subheading(doc, "F.3 Workflow / Flowchart / Flowmap")
add_styled_paragraph(
    doc,
    "Alur kerja utama pada pengembangan Proyek 2 berpusat pada dua proses bisnis baru: (1) Alur Verifikasi Surel & Pemulihan Kata Sandi, dan (2) Alur Manajemen Profil Pengguna.\n"
    "Bagan alur (flowchart) di bawah ini menggambarkan alur keputusan sistem secara terperinci:"
)

flowchart_desc = (
    "ALUR 1: VERIFIKASI EMAIL & LUPA PASSWORD\n"
    "[Mulai] -> User Registrasi -> Server terbitkan token verifikasi & kirim email via SMTP -> "
    "User menerima email -> User input OTP di modal aktivasi -> Server validasi token:\n"
    "   - Jika tidak cocok / expired -> Tampilkan error, tolak aktivasi -> [Selesai]\n"
    "   - Jika cocok -> Set users.is_email_verified = TRUE -> Akun aktif -> [Selesai]\n\n"
    "[Mulai Lupa Password] -> User input email -> Cek email di database:\n"
    "   - Jika tidak ada -> Tampilkan respons aman 'Email instruksi telah terkirim jika terdaftar' -> [Selesai]\n"
    "   - Jika ada -> Generate reset token berbatas waktu 15 menit -> Kirim tautan reset ke email -> "
    "User klik tautan & input password baru -> Server validasi token & expiry -> Hash password baru via Bcrypt -> "
    "Update users.password_hash -> Set token is_used = TRUE -> Berhasil login kembali -> [Selesai]\n\n"
    "ALUR 2: PENGELOLAAN PROFIL & UPLOAD AVATAR\n"
    "[Mulai] -> User buka modal profil -> Menampilkan data profil aktif -> Pilihan aksi:\n"
    "   - Aksi 1: Unggah Avatar -> Validasi format (PNG/JPG) & ukuran (<2MB) -> Upload via Multer -> Update users.avatar_url -> [Selesai]\n"
    "   - Aksi 2: Ganti Username/Bio -> Validasi keunikan username di DB -> Update users -> [Selesai]\n"
    "   - Aksi 3: Ganti Password -> Input password lama & baru -> Verifikasi bcrypt password lama -> Hash & Update -> [Selesai]"
)
add_styled_paragraph(doc, flowchart_desc, bold_prefix="Diagram Logika Alur Bisnis:\n", space_after=6)

# F.4
add_subheading(doc, "F.4 Struktur Menu dan Antarmuka")
add_styled_paragraph(
    doc,
    "Perubahan antarmuka pada Proyek 2 mengintegrasikan 3 komponen antarmuka baru yang dirancang selaras dengan konsep Dark Theme aplikasi Decko:\n"
    "1. Modal Verifikasi Email (Activation Dialog): Popup terpusat yang muncul sesaat setelah pendaftaran akun, menyediakan 6 kotak input PIN OTP dengan tombol 'Kirim Ulang Kode' (resend) yang memiliki countdown timer 60 detik.\n"
    "2. Halaman Lupa & Reset Password (Password Recovery Screen): Halaman khusus yang dapat diakses dari tombol 'Lupa Password?' pada modal Login. Terdiri dari form input email dan form konfirmasi penetapan kata sandi baru lengkap dengan indikator kekuatan kata sandi.\n"
    "3. Modal Pengaturan Profil Pengguna (User Profile Settings Modal): Diakses melalui klik avatar pengguna di pojok kanan atas Dashboard. Menyediakan tab navigasi terstruktur:\n"
    "   - Tab Profil Utama: Pratinjau foto avatar besar, tombol 'Unggah Foto Baru', tombol 'Hapus Avatar', form edit Username, Nama Lengkap, Nomor Telepon, dan Biodata.\n"
    "   - Tab Keamanan: Form ganti kata sandi (Password Lama, Password Baru, Konfirmasi Password Baru), serta opsi 'Deaktivasi Akun' pada area danger zone."
)

# F.5
add_subheading(doc, "F.5 Rancangan Database / ERD (Perencanaan)")
add_styled_paragraph(
    doc,
    "Pengembangan Proyek 2 memerlukan penyesuaian skema basis data relasional PostgreSQL dengan menambahkan tabel transaksi baru "
    "dan memperluas atribut pada tabel users yang sudah ada. Spesifikasi perencanaan basis data adalah sebagai berikut:"
)

erd_details = (
    "1. Pembaruan Tabel `users` (Penambahan Atribut Profil & Keamanan):\n"
    "   - avatar_url (TEXT, nullable): Menyimpan path berkas foto profil yang diunggah ke server.\n"
    "   - bio (TEXT, nullable): Deskripsi singkat profil pengguna.\n"
    "   - phone (VARCHAR 20, nullable): Nomor telepon kontak pengguna.\n"
    "   - is_email_verified (BOOLEAN, default FALSE): Penanda keabsahan alamat surel pengguna.\n"
    "   - email_verified_at (TIMESTAMP WITH TIME ZONE, nullable): Waktu pencatatan verifikasi surel berhasil.\n\n"
    "2. Pembuatan Tabel Baru `auth_tokens` (Tabel Transaksi Token Keamanan):\n"
    "   - id (SERIAL, PRIMARY KEY): Identifikasi unik token transaksi.\n"
    "   - user_id (INT, FOREIGN KEY merujuk ke users.id ON DELETE CASCADE): Pengguna pemilik token.\n"
    "   - token_hash (VARCHAR 255, NOT NULL): Nilai token yang di-hash dengan SHA-256 untuk keamanan.\n"
    "   - otp_code (VARCHAR 10, nullable): Kode OTP angka untuk verifikasi pendaftaran cepat.\n"
    "   - token_type (VARCHAR 30, NOT NULL): Jenis transaksi ('email_verification', 'password_reset').\n"
    "   - expires_at (TIMESTAMP WITH TIME ZONE, NOT NULL): Batas waktu kedaluwarsa token.\n"
    "   - is_used (BOOLEAN, default FALSE): Menandai apakah token telah dieksekusi agar tidak dapat digunakan ulang.\n"
    "   - created_at (TIMESTAMP WITH TIME ZONE, default CURRENT_TIMESTAMP): Waktu penerbitan token.\n\n"
    "Relasi Antarentitas: Entitas `users` memiliki relasi One-to-Many (1:M) terhadap entitas `auth_tokens`, di mana satu pengguna "
    "dapat memiliki beberapa riwayat permohonan token verifikasi atau reset kata sandi, namun setiap baris token terikat mutlak pada satu pengguna."
)
add_styled_paragraph(doc, erd_details)

# F.6
add_subheading(doc, "F.6 Pemetaan Modul CRUD (Perencanaan)")
add_styled_paragraph(
    doc,
    "Tabel di bawah ini memetakan seluruh operasi Create, Read, Update, dan Delete (CRUD) yang direncanakan pada modul keamanan dan profil pengguna:"
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
    ["1", "Verifikasi Surel", "C & U", "Email, OTP Code", "Buat token verifikasi di DB, kirim via SMTP. Saat OTP diinput, cocokkan kode & expiry, ubah status verifikasi menjadi TRUE.", "Status Akun Aktif, JWT Token Sesi", "auth_tokens, users"],
    ["2", "Lupa Kata Sandi", "C & R", "Alamat Email", "Cari akun berdasarkan surel, buat token reset acak 32-byte, set expiry 15 menit, simpan hash ke DB & kirim tautan ke surel.", "Surel Tautan Reset Terkirim", "auth_tokens, users"],
    ["3", "Reset Kata Sandi", "U & D", "Token Reset, Password Baru", "Validasi token reset dari URL (cek expiry & is_used). Hash password baru dengan Bcrypt. Update password_hash & invalidate token.", "Password Berhasil Diperbarui", "users, auth_tokens"],
    ["4", "Unggah Foto Avatar", "C & U", "Berkas Gambar (JPG/PNG)", "Validasi ukuran file (<2MB) & ekstensi MIME via Multer. Simpan berkas ke storage server, perbarui URL di users.avatar_url.", "Avatar Kustom Terpasang", "users"],
    ["5", "Hapus Avatar Kustom", "D & U", "User ID, Konfirmasi", "Hapus berkas fisik avatar lama dari direktori server. Set users.avatar_url = NULL (kembali ke avatar inisial otomatis).", "Avatar Kembali ke Inisial", "users"],
    ["6", "Edit Identitas & Profil", "R & U", "Username, Nama, Bio, Telepon", "Ambil data profil saat ini (Read). Saat disubmit, cek ketersediaan username. Update baris data pengguna pada tabel users.", "Profil Diperbarui Realtime", "users"]
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
    "tampilan, logika, database, validasi, testing, dan dokumentasi. (Pada usulan ini, proyek dikerjakan secara mandiri oleh pengembang tunggal).\n"
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
        "Modul Keamanan &\nAutentikasi Lanjutan\n(Email Verify & Reset Pass)",
        "Bertanggung jawab penuh atas: perancangan UI modal aktivasi & reset password, pembuatan REST API auth controller, integrasi SMTP Nodemailer, pembuatan tabel auth_tokens, pembuatan unit test Jest/Supertest (coverage >= 80%), dan dokumentasi teknis modul.",
        "Modul Autentikasi Tangguh, Test Suite Jest, Dokumentasi CRUD Keamanan"
    ],
    [
        "2",
        "Ahmad Zakky Nurfauzan\n(714250028)",
        "Modul Manajemen Profil\n& Akun Pengguna\n(Avatar & Profil CRUD)",
        "Bertanggung jawab penuh atas: perancangan UI modal profil & crop/upload, integrasi middleware Multer di Express, pembaharuan atribut users di PostgreSQL, fitur ganti password profil & deaktivasi akun, pengujian otomatis Vitest/Jest (coverage >= 80%), dan dokumentasi modul.",
        "Modul Manajemen Profil Lengkap, Test Suite Vitest/Jest, Laporan Code Coverage"
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
    ["1", "Aplikasi / modul yang dikembangkan", "Fitur verifikasi surel OTP, pemulihan kata sandi berbatas waktu, upload avatar kustom, dan edit identitas profil berjalan sempurna dan dapat didemonstrasikan.", "Selesai 100%"],
    ["2", "Dokumentasi CRUD", "Seluruh siklus Create, Read, Update, Delete pada modul keamanan dan profil pengguna terdokumentasi lengkap mencakup skema input, proses, dan output basis data.", "Terdokumentasi Lengkap"],
    ["3", "Dokumentasi source code", "Setiap controller, middleware (Multer, Auth, Rate Limit), dan fungsi helper dijelaskan secara modular dengan komentar standar dokumentasi kode.", "Tersedia di Repositori"],
    ["4", "Hasil testing", "Matriks pengujian otomatis terperinci mencakup skenario pengujian, data masukan, nilai ekspektasi, hasil aktual, dan status (Pass/Fail).", "100% Passed"],
    ["5", "Code coverage report", "Bukti laporan HTML/LCOV hasil kalkulasi code coverage per modul/file yang menunjukkan capaian persentase baris, fungsi, dan percabangan logika.", "Coverage >= 80%"],
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

# --- J. JADWAL PELAKSANAAN ---
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

j_col_widths = [Inches(0.4), Inches(2.6), Inches(1.8), Inches(2.0)]
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
    ["1", "Pengajuan & Penyempurnaan Proposal Proyek 2", "Minggu 1 - 2", "ACC Proposal Proyek 2"],
    ["2", "Analisis Kebutuhan & Desain Basis Data (ERD Baru)", "Minggu 3 - 4", "Dokumen SRS & Skema Tabel DB"],
    ["3", "Implementasi Backend: Verifikasi Surel & Reset Password", "Minggu 5 - 6", "REST API Keamanan & SMTP Service"],
    ["4", "Implementasi Backend & Frontend: Profil & Upload Avatar", "Minggu 7 - 8", "Modul Profil CRUD & UI Terintegrasi"],
    ["5", "Penyusunan Suite Pengujian Otomatis (Unit & Integration)", "Minggu 9 - 10", "Test Script Jest & Supertest"],
    ["6", "Analisis & Optimasi Code Coverage (Refactoring)", "Minggu 11 - 12", "Laporan Code Coverage >= 80%"],
    ["7", "Penyusunan Dokumentasi Akhir & Persiapan Sidang", "Minggu 13 - 14", "Laporan Akhir & Demo Sistem"]
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
    "[4] M. Fowler, Refactoring: Improving the Design of Existing Code, 2nd ed. Boston: Addison-Wesley Professional, 2018.",
    "[5] V. Khorikov, Unit Testing Principles, Practices, and Patterns. Shelter Island, NY: Manning Publications, 2020.",
    "[6] P. Aniche, Effective Software Testing: A Developer's Guide. Shelter Island, NY: Manning Publications, 2022.",
    "[7] E. Gamma, R. Helm, R. Johnson, and J. Vlissides, Design Patterns: Elements of Reusable Object-Oriented Software. Reading, MA: Addison-Wesley, 1994.",
    "[8] PostgreSQL Global Development Group, \"PostgreSQL 16 Documentation,\" PostgreSQL.org, 2023. [Online]. Available: https://www.postgresql.org/docs/."
]

for item in pustaka_items:
    add_styled_paragraph(doc, item, space_after=3)

doc.add_paragraph().paragraph_format.space_after = Pt(8)

# --- CHECKLIST SEBELUM SUBMIT ---
add_header_banner(doc, "CHECKLIST SEBELUM SUBMIT")
checklist_items = [
    ("☑ ", "Judul dan ruang lingkup sesuai Proyek 2 (CRUD & Code Coverage)."),
    ("☑ ", "Fitur CRUD yang dianalisis sudah jelas (Modul Profil Pengguna & Keamanan Autentikasi)."),
    ("☑ ", "ERD/workflow sudah dilampirkan atau direncanakan secara terperinci."),
    ("☑ ", "Pembagian tugas dilakukan berdasarkan fitur/modul (Dikerjakan secara mandiri end-to-end)."),
    ("☑ ", "Pilihan dosen pembimbing sudah diisi sesuai bidang kepakaran."),
    ("☑ ", "Jadwal pelaksanaan sudah disusun terstruktur sepanjang 14 minggu kegiatan."),
    ("☑ ", "Persyaratan panjang kata pada Ringkasan, Latar Belakang, Tujuan, dan Ruang Lingkup terpenuhi (masing-masing > 300 kata).")
]
for pfx, item in checklist_items:
    add_styled_paragraph(doc, item, bold_prefix=pfx, space_after=2)

# Save Document
output_path = "/Users/zakky/Documents/Zakky/Proyek 1/CODE/Proposal_Proyek_2_Decko_Ahmad_Zakky_Nurfauzan.docx"
doc.save(output_path)

print(f"Proposal successfully generated at: {output_path}")
print(f"Word counts verified:")
print(f"  - Section B (Ringkasan): {total_ringkasan_words} kata (Syarat: Minimal 300 kata) -> {'MEMENUHI' if total_ringkasan_words >= 300 else 'KURANG'}")
print(f"  - Section E.1 (Latar Belakang): {total_e1_words} kata (Syarat: Minimal 300 kata) -> {'MEMENUHI' if total_e1_words >= 300 else 'KURANG'}")
print(f"  - Section E.2 (Tujuan Proyek): {total_e2_words} kata (Syarat: Minimal 300 kata) -> {'MEMENUHI' if total_e2_words >= 300 else 'KURANG'}")
print(f"  - Section E.4 (Ruang Lingkup): {total_e4_words} kata (Syarat: Minimal 300 kata) -> {'MEMENUHI' if total_e4_words >= 300 else 'KURANG'}")
