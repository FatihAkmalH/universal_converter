# 🚀 Universal Web Converter

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![Status](https://img.shields.io/badge/Status-Active-brightgreen.svg)
![Environment](https://img.shields.io/badge/Environment-100%25%20Client--Side-orange.svg)

A Universal Conversion Tool that runs entirely in the browser (Client-Side). Safe, fast, and 100% free with no backend server required. Your files are never uploaded to the internet, ensuring your privacy is guaranteed.

**🔗 Direct Web Access:** 
*(https://converteruniversal.netlify.app)*

---

## 🌟 Key Features

This application acts like a "Swiss Army Knife" for your daily conversion needs.

### 🖼️ Image Conversion
*   **JPG / PNG to WebP**: Advanced compression with a quality adjustment slider.
*   **HEIC to JPG / PNG**: Instantly decode photos from Apple devices (iPhone/iPad).
*   **SVG to JPG / PNG**: Rasterize vector graphics into pixel images.

### 📊 Data Conversion (Spreadsheet)
*   **Excel (.xlsx, .xls) to JSON / CSV**: Extract data rows into *arrays* for API needs or web integration.
*   **CSV / XML to JSON**: Parse raw format data into neat JSON objects.

### 🎬 Media Conversion (Video & Audio)
*   **MP4 to MP3**: Extract (rip) sound from videos into audio format.
*   **MP4 to GIF**: Create short animations from video clips.
*   **WAV to MP3 / OGG**: Compress raw audio files (*lossless*) into *lossy* formats.

### ✨ Special Features
*   **100% Client-Side**: Uses no backend server (PHP/Node.js, etc.). Maximum privacy!
*   **Batch Processing**: Supports *Drag & Drop* functionality to convert dozens of files at once.
*   **Download All (ZIP)**: Download all converted results in a single `.zip` package.
*   **URL Fetch (CORS Proxy)**: Convert images using internet *direct links* thanks to a Multi-Proxy Fallback system.

---

## 🛠️ Tech Stack & Dependencies

This project is built using pure **HTML5, CSS3, and Vanilla JavaScript (ES6)** without frameworks like React or Vue to keep it lightweight. 

Powered by the following WebAssembly & Web API libraries:

| Library / Tool | Purpose |
| :--- | :--- |
| **JSZip** | Combines conversion results into a single `.zip` file. |
| **heic2any** | Decodes Apple's `.heic` format into standard web canvas. |
| **SheetJS (xlsx)** | Reads and extracts data from Microsoft Excel files. |
| **PapaParse** | Performs super-fast *parsing* for CSV files. |
| **FFmpeg.wasm** | Brings the Video/Audio processing engine (FFmpeg core-st) into the web browser. |
| **SweetAlert2** | Provides beautiful and responsive *pop-up/alert* windows. |

---

## 🚀 How to Run Locally (Local Development)

Since this application is 100% Client-Side, you don't even need a local server (`localhost`). 

1. **Clone this repository:**
   ```bash
   git clone [https://github.com/FatihAkmalH/universal_converter.git](https://github.com/FatihAkmalH/universal_converter.git)
   ```
2. **Open the project folder.**
3. **Double-click** the `index.html` file to open it in your favorite browser (Chrome, Edge, Firefox, Safari).

*Note: Ensure your device is connected to the internet the first time you open it because the application needs to load libraries from the CDN.*

---

## ⚠️ System Limitations

Considering the processing is done on the device's RAM and CPU (*Client-side Processing*), please note the following limitations:
*   **Video File Size**: The MP4/Media feature is intended for small to medium-sized files. Attempting to process movies or long-duration HD videos may cause the *browser to hang* or consume a lot of RAM (Memory).
*   **Conversion via URL Feature**: Relies on free public *CORS Proxy* APIs (AllOrigins, CodeTabs). If all these intermediary servers go down, conversion via link will fail. It is highly recommended to download the file manually and then use the *Drag & Drop* feature.

---

## 🤝 Contributing

Contributions are always welcome! If you want to add new conversion modes or improve performance, please:
1. Please contact me via email or other means before forking this repository.
2. Create your feature *branch* (`git checkout -b feature-new`).
3. Commit your changes (`git commit -m 'Add feature X'`).
4. Push to the *branch* (`git push origin feature-new`).
5. Create a *Pull Request*.

---

## 📝 License

This project is licensed under the **MIT License**. You are free to use, modify, and distribute it for both personal and commercial purposes.