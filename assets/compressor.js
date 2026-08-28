const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const gsQualitySelect = document.getElementById('gsQualitySelect');
const resultsContainer = document.getElementById('resultsContainer');
const loaderOverlay = document.getElementById('loaderOverlay');
const loaderStatus = document.getElementById('loaderStatus');

let isProcessing = false;

// ================= 1. UI MANAJEMEN =================
function toggleLoader(show, text = "Memproses...") {
    loaderStatus.innerText = text;
    if (show) loaderOverlay.classList.remove('hidden');
    else loaderOverlay.classList.add('hidden');
}

// ================= 2. EVENT LISTENER DRAG & DROP =================
dropZone.addEventListener('click', () => { if (!isProcessing) fileInput.click(); });
dropZone.addEventListener('dragover', (e) => { e.preventDefault(); if(!isProcessing) dropZone.classList.add('dragover'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
dropZone.addEventListener('drop', (e) => { 
    e.preventDefault(); dropZone.classList.remove('dragover'); 
    if(!isProcessing && e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0]); 
});
fileInput.addEventListener('change', (e) => { if (e.target.files.length > 0) handleFile(e.target.files[0]); });

// ================= 3. ENGINE KOMPRESI GHOSTSCRIPT (VIA WORKER) =================
async function handleFile(file) {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
        Swal.fire('Format Salah', 'Harap masukkan file PDF.', 'warning');
        return;
    }

    isProcessing = true;
    toggleLoader(true, "Mempersiapkan Mesin (Background)...");

    try {
        const fileBuffer = await file.arrayBuffer();
        const inputName = 'input.pdf';
        const outputName = 'output.pdf';
        const qualitySetting = gsQualitySelect.value; 

        // Argumen CLI yang sudah dikoreksi (Tanpa 'gs')
        const args = [
            '-sDEVICE=pdfwrite',
            '-dCompatibilityLevel=1.4',
            `-dPDFSETTINGS=${qualitySetting}`,
            '-dNOPAUSE',
            '-dQUIET',
            '-dBATCH',
            `-sOutputFile=${outputName}`,
            inputName
        ];

        toggleLoader(true, "Sedang Mengecilkan (Vektor Terjaga). Ini butuh waktu untuk PDF multi-halaman...");

        // 1. Panggil Web Worker dari folder assets
        const worker = new Worker('assets/gs-worker.js');

        // 2. Dengarkan jawaban dari Worker
        worker.onmessage = function(e) {
            if (e.data.success) {
                // Berhasil! Render hasilnya
                const blob = new Blob([e.data.data], { type: 'application/pdf' });
                renderResult(file.name, blob);
            } else {
                // Gagal
                console.error("Worker Error:", e.data.error);
                Swal.fire('Kompresi Gagal', 'Proses gagal di latar belakang. Cek console log.', 'error');
            }

            // Bersihkan status dan hancurkan worker (Terminate) agar RAM bersih
            isProcessing = false;
            fileInput.value = '';
            toggleLoader(false);
            worker.terminate();
        };

        // Jika terjadi error sistem fatal pada worker
        worker.onerror = function(err) {
            console.error("Worker Fatal Error:", err);
            Swal.fire('Error Sistem', 'Terjadi kesalahan sistem pada Web Worker.', 'error');
            isProcessing = false;
            fileInput.value = '';
            toggleLoader(false);
            worker.terminate();
        };

        // 3. Kirim file PDF dan perintah ke Worker
        worker.postMessage({
            fileBuffer: fileBuffer,
            args: args,
            inputName: inputName,
            outputName: outputName
        }, [fileBuffer]); // Transfer hak milik memori buffer agar super cepat

    } catch (error) {
        console.error("Terjadi masalah pada thread utama:", error);
        Swal.fire('Gagal', 'Gagal memproses file.', 'error');
        isProcessing = false;
        fileInput.value = '';
        toggleLoader(false);
    }
}

// ================= 4. RENDER UI =================
function renderResult(originalName, blob) {
    const sizeKB = (blob.size / 1024).toFixed(1);
    const url = URL.createObjectURL(blob);
    const finalName = originalName.replace('.pdf', '_Compressed.pdf');
    
    const div = document.createElement('div');
    div.className = 'result-item';
    div.style.borderLeft = '4px solid var(--color-green)';
    
    div.innerHTML = `
        <div class="pdf-icon" style="background: #E8F5E9; border-color: #A5D6A7;">📑</div>
        <div class="file-info" style="width: 100%; overflow: hidden; min-width: 0; margin-right: 15px;">
            <h4 style="margin: 0 0 6px 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${finalName}</h4>
            <p style="color: var(--color-green); font-weight: bold; margin: 0; font-size: 13px;">Size Baru: ${sizeKB} KB</p>
        </div>
        <a href="${url}" download="${finalName}" class="btn" style="background: var(--color-green); flex-shrink: 0;">Unduh</a>
    `;
    resultsContainer.prepend(div);
}