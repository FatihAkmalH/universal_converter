// DOM Elements Utama
const homeView = document.getElementById('homeView');
const converterView = document.getElementById('converterView');
const converterTitle = document.getElementById('converterTitle');

// DOM Elements Pengaturan
const dropZone = document.getElementById('dropZone');
const dropZoneSubtitle = document.getElementById('dropZoneSubtitle');
const fileInput = document.getElementById('fileInput');
const urlInput = document.getElementById('urlInput');
const fetchUrlBtn = document.getElementById('fetchUrlBtn');
const infoUrlBtn = document.getElementById('infoUrlBtn');

const qualityControl = document.getElementById('qualityControl');
const qualitySlider = document.getElementById('qualitySlider');
const qualityValue = document.getElementById('qualityValue');
const formatControl = document.getElementById('formatControl');
const targetFormatSelect = document.getElementById('targetFormatSelect');

// DOM Elements Hasil & Loader
const resultsContainer = document.getElementById('resultsContainer');
const actionButtons = document.getElementById('actionButtons');
const downloadAllBtn = document.getElementById('downloadAllBtn');
const resetBtn = document.getElementById('resetBtn');
const loaderOverlay = document.getElementById('loaderOverlay');
const loaderStatus = document.getElementById('loaderStatus');

let currentMode = ''; 
let convertedFiles = []; 
let isProcessing = false;

// ================= 1. ROUTING & UI MANAGEMENT =================
function openConverter(mode) {
    currentMode = mode;
    homeView.classList.add('hidden');
    converterView.classList.remove('hidden');
    resetUI();
    
    qualityControl.classList.remove('hidden');
    formatControl.classList.add('hidden');
    mediaDisclaimer.classList.add('hidden'); // Sembunyikan disclaimer secara default

    if (mode === 'webp') {
        converterTitle.innerText = "JPG/PNG ke WebP";
        dropZoneSubtitle.innerText = "Mendukung JPG, PNG";
        fileInput.accept = "image/png, image/jpeg";
    } 
    else if (mode === 'heic') {
        converterTitle.innerText = "HEIC ke JPG/PNG";
        dropZoneSubtitle.innerText = "Mendukung file Apple HEIC/HEIF";
        fileInput.accept = ".heic, .heif";
        formatControl.classList.remove('hidden');
        targetFormatSelect.innerHTML = `<option value="image/jpeg">JPG (.jpg)</option><option value="image/png">PNG (.png)</option>`;
    } 
    else if (mode === 'svg') {
        converterTitle.innerText = "SVG ke JPG/PNG";
        dropZoneSubtitle.innerText = "Mendukung format vektor .SVG";
        fileInput.accept = ".svg";
        formatControl.classList.remove('hidden');
        targetFormatSelect.innerHTML = `<option value="image/jpeg">JPG (.jpg)</option><option value="image/png">PNG (.png)</option>`;
    }
    else if (mode === 'excel') {
        converterTitle.innerText = "Excel ke JSON / CSV";
        dropZoneSubtitle.innerText = "Mendukung .xlsx, .xls";
        fileInput.accept = ".xlsx, .xls";
        qualityControl.classList.add('hidden');
        formatControl.classList.remove('hidden');
        targetFormatSelect.innerHTML = `<option value="json">JSON (.json)</option><option value="csv">CSV (.csv)</option>`;
    }
    else if (mode === 'csv_xml') {
        converterTitle.innerText = "CSV / XML ke JSON";
        dropZoneSubtitle.innerText = "Mendukung .csv, .xml";
        fileInput.accept = ".csv, .xml";
        qualityControl.classList.add('hidden');
        formatControl.classList.remove('hidden');
        targetFormatSelect.innerHTML = `<option value="json">JSON (.json)</option>`;
    }
    else if (mode === 'media') {
        converterTitle.innerText = "Konverter Audio & Video";
        dropZoneSubtitle.innerText = "Mendukung .mp4, .wav";
        fileInput.accept = "video/mp4, audio/wav";
        qualityControl.classList.add('hidden');
        formatControl.classList.remove('hidden');
        mediaDisclaimer.classList.remove('hidden'); // Tampilkan Catatan FFmpeg
        targetFormatSelect.innerHTML = `
            <option value="mp3">Audio MP3 (.mp3)</option>
            <option value="ogg">Audio OGG (.ogg)</option>
            <option value="gif">Animasi GIF (.gif)</option>
        `;
    }
}

function goHome() {
    converterView.classList.add('hidden');
    homeView.classList.remove('hidden');
    resetUI();
}

function resetUI() {
    convertedFiles = [];
    resultsContainer.innerHTML = '';
    actionButtons.style.display = 'none';
    fileInput.value = ''; urlInput.value = '';
}

resetBtn.addEventListener('click', resetUI);
qualitySlider.addEventListener('input', (e) => qualityValue.innerText = e.target.value + '%');

function toggleLoader(show, text = "Memproses...") {
    loaderStatus.innerText = text;
    if (show) loaderOverlay.classList.remove('hidden');
    else loaderOverlay.classList.add('hidden');
}

// ================= FITUR DISCLAIMER INFO URL =================
infoUrlBtn.addEventListener('click', () => {
    Swal.fire({
        icon: 'info', title: 'Informasi URL',
        html: `
            <div style="text-align: left; font-size: 14px; line-height: 1.5; color: #444;">
                <p style="margin-top:0;">Fitur ini menggunakan <b>Proxy Publik Gratis</b> untuk melewati keamanan browser (CORS).</p>
                <p><b>Mengapa proses URL sering gagal?</b></p>
                <ul style="padding-left: 20px; margin-bottom: 15px;">
                    <li>Server proxy sedang down / limit.</li>
                    <li>Situs dilindungi Cloudflare / Anti-bot.</li>
                    <li>Link bukan <b>Direct Link</b> file asli.</li>
                </ul>
                <div style="background: rgba(46, 196, 182, 0.1); padding: 10px; border-radius: 8px; border-left: 4px solid var(--color-tosca-dark);">
                    <b>Saran:</b> Unduh file secara manual lalu gunakan fitur <i>Drag & Drop</i>.
                </div>
            </div>
        `,
        confirmButtonColor: '#2EC4B6', width: '500px'
    });
});

// ================= 2. FETCH FILE DARI URL =================
fetchUrlBtn.addEventListener('click', async () => {
    const fileUrl = urlInput.value.trim();
    if (!fileUrl) return;

    toggleLoader(true, "Mengunduh file dari URL...");
    fetchUrlBtn.disabled = true;

    const proxies = ['https://api.allorigins.win/raw?url=', 'https://api.codetabs.com/v1/proxy?quest=', 'https://corsproxy.io/?'];
    let blob = null;
    let success = false;

    for (let proxy of proxies) {
        try {
            const response = await fetch(proxy + encodeURIComponent(fileUrl));
            if (!response.ok) throw new Error("HTTP Error");
            blob = await response.blob();
            
            // Validasi longgar (Kecuali mode Excel/CSV, pastikan gambar)
            const isDataMode = ['excel', 'csv_xml'].includes(currentMode);
            if (!isDataMode && !blob.type.startsWith('image/') && currentMode !== 'heic') {
                throw new Error("URL tidak mengarah ke file gambar valid.");
            }
            success = true; break; 
        } catch (error) { continue; }
    }

    try {
        if (!success || !blob) throw new Error("Semua proxy gagal. Akses diblokir oleh situs asal.");
        let fileName = fileUrl.substring(fileUrl.lastIndexOf('/') + 1).split('?')[0] || 'downloaded_file';
        const file = new File([blob], fileName, { type: blob.type });

        setTimeout(() => handleFiles([file]), 100);
        urlInput.value = ''; 
    } catch (error) {
        toggleLoader(false);
        Swal.fire({ icon: 'error', title: 'Gagal Memuat URL', text: error.message, confirmButtonColor: '#FF9F1C' });
    } finally {
        fetchUrlBtn.disabled = false;
    }
});

// ================= 3. DRAG & DROP & CORE LOGIC =================
dropZone.addEventListener('click', () => { if (!isProcessing) fileInput.click(); });
dropZone.addEventListener('dragover', (e) => { e.preventDefault(); if(!isProcessing) dropZone.classList.add('dragover'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
dropZone.addEventListener('drop', (e) => { e.preventDefault(); dropZone.classList.remove('dragover'); if(!isProcessing) handleFiles(e.dataTransfer.files); });
fileInput.addEventListener('change', (e) => handleFiles(e.target.files));

async function handleFiles(files) {
    if (files.length === 0) return;
    isProcessing = true;
    toggleLoader(true, "Mempersiapkan...");

    const targetFormat = (currentMode === 'webp') ? 'image/webp' : targetFormatSelect.value;
    const isDataMode = ['excel', 'csv_xml'].includes(currentMode);
    const isMediaMode = currentMode === 'media';

    // KHUSUS MEDIA: Inisialisasi FFmpeg jika belum ada
    if (isMediaMode && !ffmpegInstance) {
        toggleLoader(true, "Memuat Mesin FFmpeg (±25MB), harap tunggu...");
        try {
            const { createFFmpeg } = FFmpeg;
            // Menggunakan core-st (Single-Thread) agar tidak diblokir browser (CORS SAB Issue)
            ffmpegInstance = createFFmpeg({
                log: true,
                corePath: 'https://unpkg.com/@ffmpeg/core-st@0.11.1/dist/ffmpeg-core.js'
            });
            await ffmpegInstance.load();
        } catch (err) {
            Swal.fire({ icon:'error', title:'Gagal Memuat FFmpeg', text:'Browser Anda mungkin tidak mendukung fitur ini.' });
            toggleLoader(false); isProcessing = false; return;
        }
    }

    setTimeout(async () => {
        let hasError = false;
        toggleLoader(true, "Memproses file...");

        for (let i = 0; i < files.length; i++) {
            try {
                if (isMediaMode) {
                    await processMediaFile(files[i], targetFormat);
                } else if (isDataMode) {
                    await processDataFile(files[i], targetFormat);
                } else {
                    const quality = parseInt(qualitySlider.value) / 100;
                    const targetExt = targetFormat === 'image/webp' ? '.webp' : (targetFormat === 'image/jpeg' ? '.jpg' : '.png');
                    await processImageFile(files[i], quality, targetFormat, targetExt);
                }
            } catch (error) {
                console.error("Gagal:", files[i].name, error);
                hasError = true;
            }
        }

        isProcessing = false; fileInput.value = ''; toggleLoader(false);
        if (convertedFiles.length > 0) actionButtons.style.display = 'flex';
        
        if (hasError) Swal.fire({ icon: 'warning', title: 'Sebagian gagal diproses', text: 'Pastikan file sesuai dan tidak korup.', confirmButtonColor: '#2EC4B6' });
    }, 150);
}

// ================= 4. ENGINE GAMBAR =================
function processImageFile(file, quality, targetFormat, targetExt) {
    return new Promise(async (resolve, reject) => {
        const baseName = file.name.replace(/\.[^/.]+$/, "");
        const newFileName = baseName + targetExt;

        if (currentMode === 'heic') {
            try {
                let resultBlob = await heic2any({ blob: file, toType: targetFormat, quality: quality });
                if (Array.isArray(resultBlob)) resultBlob = resultBlob[0];
                saveAndRender(resultBlob, newFileName, 'image'); resolve();
            } catch (err) { reject(err); } return;
        }

        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            const cvs = document.createElement('canvas');
            cvs.width = img.width || 800; cvs.height = img.height || 800;
            const ctx = cvs.getContext('2d');
            if (targetFormat === 'image/jpeg') { ctx.fillStyle = '#FFF'; ctx.fillRect(0,0,cvs.width,cvs.height); }
            ctx.drawImage(img, 0, 0, cvs.width, cvs.height);
            cvs.toBlob(b => { 
                if(b) saveAndRender(b, newFileName, 'image'); else reject(); 
                URL.revokeObjectURL(url); resolve(); 
            }, targetFormat, quality);
        };
        img.onerror = () => { URL.revokeObjectURL(url); reject(); };
        img.src = url;
    });
}

// ================= 5. ENGINE DATA (BARU) =================
function processDataFile(file, targetFormat) {
    return new Promise((resolve, reject) => {
        const baseName = file.name.replace(/\.[^/.]+$/, "");
        const ext = file.name.split('.').pop().toLowerCase();
        const reader = new FileReader();

        // MENGUBAH EXCEL (.XLSX)
        if (currentMode === 'excel') {
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    
                    // Tambahkan cellDates: true agar SheetJS mengenali sel tersebut sebagai tanggal/waktu
                    const workbook = XLSX.read(data, { type: 'array', cellDates: true });
                    const worksheet = workbook.Sheets[workbook.SheetNames[0]]; // Ambil sheet pertama
                    
                    let resultStr = "", newExt = "";
                    if (targetFormat === 'json') {
                        // TAMBAHKAN { raw: false } DI SINI
                        // Agar output json mengikuti format teks asli yang terlihat di Excel
                        const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false });
                        resultStr = JSON.stringify(jsonData, null, 2);
                        newExt = ".json";
                    } else if (targetFormat === 'csv') {
                        resultStr = XLSX.utils.sheet_to_csv(worksheet);
                        newExt = ".csv";
                    }
                    
                    const blob = new Blob([resultStr], { type: "text/plain;charset=utf-8" });
                    saveAndRender(blob, baseName + newExt, 'data'); resolve();
                } catch (err) { reject("File Excel rusak."); }
            };
            reader.readAsArrayBuffer(file);
        }
        
        // MENGUBAH CSV / XML
        else if (currentMode === 'csv_xml') {
            reader.onload = (e) => {
                try {
                    const content = e.target.result;
                    if (ext === 'csv') {
                        // Pakai PapaParse untuk CSV
                        Papa.parse(content, {
                            header: true, skipEmptyLines: true,
                            complete: (res) => {
                                const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: "application/json" });
                                saveAndRender(blob, baseName + ".json", 'data'); resolve();
                            }
                        });
                    } else if (ext === 'xml') {
                        // XML parsing standar
                        const xmlDoc = new DOMParser().parseFromString(content, "text/xml");
                        if(xmlDoc.getElementsByTagName("parsererror").length > 0) throw new Error();
                        const blob = new Blob([JSON.stringify(xmlToJson(xmlDoc), null, 2)], { type: "application/json" });
                        saveAndRender(blob, baseName + ".json", 'data'); resolve();
                    } else { reject(); }
                } catch (err) { reject("Gagal mem-parsing file."); }
            };
            reader.readAsText(file);
        }
    });
}

// Fungsi Bantuan Konversi XML -> JSON (Struktur Dasar)
function xmlToJson(xml) {
    let obj = {};
    if (xml.nodeType === 1 && xml.attributes.length > 0) {
        obj["@attributes"] = {};
        for (let j = 0; j < xml.attributes.length; j++) obj["@attributes"][xml.attributes.item(j).nodeName] = xml.attributes.item(j).nodeValue;
    } else if (xml.nodeType === 3) { obj = xml.nodeValue.trim(); }
    
    if (xml.hasChildNodes()) {
        for (let i = 0; i < xml.childNodes.length; i++) {
            let item = xml.childNodes.item(i), nodeName = item.nodeName;
            if (nodeName === '#text') { if (item.nodeValue.trim() === '') continue; else obj = item.nodeValue.trim(); }
            else if (typeof(obj[nodeName]) === "undefined") obj[nodeName] = xmlToJson(item);
            else {
                if (typeof(obj[nodeName].push) === "undefined") obj[nodeName] = [obj[nodeName]];
                obj[nodeName].push(xmlToJson(item));
            }
        }
    }
    return obj;
}

// ================= 6. ENGINE MEDIA (FFMPEG.WASM) =================
function processMediaFile(file, targetFormat) {
    return new Promise(async (resolve, reject) => {
        const baseName = file.name.replace(/\.[^/.]+$/, "");
        const inputName = file.name;
        const outputName = baseName + '.' + targetFormat;
        
        try {
            // 1. Tulis file mentah ke memori virtual FFmpeg
            const fileData = new Uint8Array(await file.arrayBuffer());
            ffmpegInstance.FS('writeFile', inputName, fileData);

            // 2. Jalankan perintah konversi berdasarkan pilihan
            if (targetFormat === 'mp3') {
                // Konversi apapun ke MP3 (Bitrate 192k)
                await ffmpegInstance.run('-i', inputName, '-vn', '-b:a', '192k', outputName);
            } 
            else if (targetFormat === 'ogg') {
                // Konversi apapun ke OGG Vorbis
                await ffmpegInstance.run('-i', inputName, '-vn', '-c:a', 'libvorbis', outputName);
            } 
            else if (targetFormat === 'gif') {
                // Konversi Video ke GIF (Dibatasi 480lebar, 10 fps, max 10 detik agar browser tidak hang)
                await ffmpegInstance.run('-i', inputName, '-t', '10', '-vf', 'fps=10,scale=480:-1:flags=lanczos', outputName);
            }

            // 3. Baca hasilnya dari memori virtual
            const outData = ffmpegInstance.FS('readFile', outputName);
            
            // 4. Ubah ke bentuk Blob untuk diunduh
            const mimeType = targetFormat === 'gif' ? 'image/gif' : (targetFormat === 'mp3' ? 'audio/mpeg' : 'audio/ogg');
            const blob = new Blob([outData.buffer], { type: mimeType });

            saveAndRender(blob, outputName, 'media');

            // 5. Bebaskan memori FFmpeg agar RAM tidak penuh
            ffmpegInstance.FS('unlink', inputName);
            ffmpegInstance.FS('unlink', outputName);
            resolve();

        } catch (err) {
            reject("Gagal memproses media: " + err);
        }
    });
}

// ================= UI RENDER =================
function saveAndRender(blob, fileName, type) {
    const sizeKB = (blob.size / 1024).toFixed(1);
    const url = URL.createObjectURL(blob);
    convertedFiles.push({ name: fileName, blob: blob });

    let previewHtml = "";
    if (type === 'image') previewHtml = `<img src="${url}" alt="preview">`;
    else if (type === 'data') previewHtml = `<div class="doc-icon">📄</div>`;
    else if (type === 'media') previewHtml = `<div class="media-icon">🎧</div>`; // Ikon Audio/Video

    const div = document.createElement('div');
    div.className = 'result-item';
    div.innerHTML = `
        ${previewHtml}
        <div class="file-info">
            <h4>${fileName}</h4>
            <p>${sizeKB} KB</p>
        </div>
        <a href="${url}" download="${fileName}" class="btn btn-download">Unduh</a>
    `;
    resultsContainer.prepend(div);
}

// ================= UI RENDER & ZIP =================
function saveAndRender(blob, fileName, type) {
    const sizeKB = (blob.size / 1024).toFixed(1);
    const url = URL.createObjectURL(blob);
    convertedFiles.push({ name: fileName, blob: blob });

    // Tampilkan gambar jika type = image, atau ikon dokumen jika type = data
    const previewHtml = type === 'image' 
        ? `<img src="${url}" alt="preview">` 
        : `<div class="doc-icon">📄</div>`;

    const div = document.createElement('div');
    div.className = 'result-item';
    div.innerHTML = `
        ${previewHtml}
        <div class="file-info">
            <h4>${fileName}</h4>
            <p>${sizeKB} KB</p>
        </div>
        <a href="${url}" download="${fileName}" class="btn btn-download">Unduh</a>
    `;
    resultsContainer.prepend(div);
}

downloadAllBtn.addEventListener('click', async () => {
    if (convertedFiles.length === 0) return;
    toggleLoader(true, "Membungkus file ZIP...");
    setTimeout(async () => {
        const zip = new JSZip();
        convertedFiles.forEach(f => zip.file(f.name, f.blob));
        try {
            const zipContent = await zip.generateAsync({ type: "blob" });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(zipContent);
            link.download = `Hasil_Konversi_${currentMode.toUpperCase()}.zip`;
            link.click();
        } catch (error) { Swal.fire({ icon:'error', title:'Gagal ZIP', text:'Gagal membuat file ZIP.' }); }
        finally { toggleLoader(false); }
    }, 100);
});