# 🚀 Universal Web Converter

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![Status](https://img.shields.io/badge/Status-Active-brightgreen.svg)
![Environment](https://img.shields.io/badge/Environment-100%25%20Client--Side-orange.svg)

Alat Konversi Universal yang sepenuhnya berjalan di sisi peramban (Client-Side). Aman, cepat, dan 100% gratis tanpa memerlukan server *backend*. File Anda tidak pernah diunggah ke internet, sehingga privasi Anda terjamin.

**🔗 Akses Web Secara Langsung:** 
*(Masukkan link hosting Anda di sini, misalnya: `https://username.github.io/universal-converter`)*

---

## 🌟 Fitur Utama

Aplikasi ini bertindak layaknya "Pisau Lipat Swiss" untuk kebutuhan konversi harian Anda.

### 🖼️ Konversi Gambar (Image)
*   **JPG / PNG ke WebP**: Kompresi canggih dengan slider pengatur kualitas.
*   **HEIC ke JPG / PNG**: Dekode foto dari perangkat Apple (iPhone/iPad) secara instan.
*   **SVG ke JPG / PNG**: Rasterisasi grafik vektor menjadi gambar piksel.

### 📊 Konversi Data (Spreadsheet)
*   **Excel (.xlsx, .xls) ke JSON / CSV**: Ekstrak baris data menjadi *array* untuk kebutuhan API atau integrasi web.
*   **CSV / XML ke JSON**: Parsing data format mentah menjadi objek JSON yang rapi.

### 🎬 Konversi Media (Video & Audio)
*   **MP4 ke MP3**: Ekstrak suara (rip) dari video menjadi format audio.
*   **MP4 ke GIF**: Buat animasi pendek dari klip video.
*   **WAV ke MP3 / OGG**: Kompresi file audio mentah (*lossless*) ke format *lossy*.

### ✨ Fitur Spesial
*   **100% Client-Side**: Tidak menggunakan server backend (PHP/Node.js dll). Privasi maksimal!
*   **Batch Processing**: Mendukung fungsi *Drag & Drop* untuk mengonversi puluhan file sekaligus.
*   **Download All (ZIP)**: Unduh semua hasil konversi dalam satu kemasan `.zip`.
*   **URL Fetch (CORS Proxy)**: Bisa mengonversi gambar menggunakan *direct link* internet berkat sistem Multi-Proxy Fallback.

---

## 🛠️ Tech Stack & Dependencies

Proyek ini dibangun menggunakan **HTML5, CSS3, dan Vanilla JavaScript (ES6)** murni tanpa framework seperti React atau Vue agar lebih ringan. 

Ditenagai oleh library WebAssembly & Web API berikut:

| Library / Tool | Kegunaan |
| :--- | :--- |
| **JSZip** | Menggabungkan hasil konversi ke dalam satu file `.zip`. |
| **heic2any** | Mendekode format Apple `.heic` ke standar web canvas. |
| **SheetJS (xlsx)** | Membaca dan mengekstrak data dari file Microsoft Excel. |
| **PapaParse** | Melakukan *parsing* super cepat untuk file CSV. |
| **FFmpeg.wasm** | Membawa mesin pemroses Video/Audio (FFmpeg core-st) ke dalam peramban web. |
| **SweetAlert2** | Menyediakan jendela *pop-up/alert* yang indah dan responsif. |

---

## 🚀 Cara Menjalankan Secara Lokal (Local Development)

Karena aplikasi ini 100% Client-Side, Anda bahkan tidak memerlukan server lokal (`localhost`). 

1. **Clone repositori ini:**
   ```bash
   git clone https://github.com/FatihAkmalH/universal_converter.git
   ```
2. **Buka folder proyek.**
3. **Klik ganda (`Double-click`)** pada file `index.html` untuk membukanya di browser favorit Anda (Chrome, Edge, Firefox, Safari).

*Catatan: Pastikan perangkat Anda terhubung ke internet saat pertama kali dibuka karena aplikasi perlu memuat library dari CDN.*

---

## ⚠️ Keterbatasan Sistem

Mengingat pemrosesan dilakukan di RAM dan CPU perangkat (*Client-side Processing*), harap perhatikan batasan berikut:
*   **Ukuran File Video**: Fitur MP4/Media ditujukan untuk file berukuran kecil ke menengah. Mencoba memproses film atau video HD berdurasi panjang dapat menyebabkan *browser hang* atau memakan banyak RAM (Memori).
*   **Fitur Konversi via URL**: Bergantung pada API *CORS Proxy* publik gratisan (AllOrigins, CodeTabs). Jika semua server perantara tersebut tumbang (*down*), maka konversi via link akan gagal. Sangat disarankan mengunduh file secara manual lalu menggunakan fitur *Drag & Drop*.

---

## 🤝 Kontribusi

Kontribusi selalu diterima! Jika Anda ingin menambahkan mode konversi baru atau memperbaiki performa, silakan:
1. Silahkan hubungi saya melalui email atau lainnya sebelum melakukan Fork repositori ini.
2. Buat *branch* fitur Anda (`git checkout -b fitur-baru`).
3. Lakukan commit perubahan Anda (`git commit -m 'Menambahkan fitur X'`).
4. Push ke *branch* (`git push origin fitur-baru`).
5. Buat *Pull Request*.

---

## 📝 Lisensi

Proyek ini berlisensi di bawah **MIT License**. Anda bebas menggunakan, mengubah, dan mendistribusikannya untuk keperluan pribadi maupun komersial.
