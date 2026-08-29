import { removeBackground } from "https://esm.sh/@imgly/background-removal@1.7.0";


// ============================================================
// ELEMENT
// ============================================================

const dropZone = document.getElementById("dropZone");
const fileInput = document.getElementById("fileInput");
const resultsContainer = document.getElementById("resultsContainer");

const loaderOverlay = document.getElementById("loaderOverlay");
const loaderStatus = document.getElementById("loaderStatus");
const loaderProgress = document.getElementById("loaderProgress");


// Tombol Bersihkan Memori
const clearMemoryButton =
    document.getElementById("clearMemory");


// ============================================================
// STATE
// ============================================================

let isProcessing = false;


// Menyimpan semua hasil sementara
// agar Object URL dan Blob bisa dibersihkan
const processedResults = [];


// ============================================================
// CONFIG
// ============================================================

// Maksimal dimensi gambar yang diberikan ke AI.
//
// 1800 cukup tinggi untuk hasil web/social media,
// tetapi jauh lebih ringan daripada foto kamera
// 4000 - 6000 px.
const MAX_AI_SIZE = 1800;


// Jika ingin lebih cepat:
// 1500
//
// Jika ingin lebih detail:
// 2000 - 2200
//
// Jangan terlalu besar karena inference CPU
// bisa menjadi sangat berat.


// ============================================================
// UI LOADER
// ============================================================

function toggleLoader(
    show,
    text = "Memproses...",
    progress = ""
) {

    if (loaderStatus) {
        loaderStatus.innerText = text;
    }

    if (loaderProgress) {
        loaderProgress.innerText = progress;
    }


    if (!loaderOverlay) {
        return;
    }


    if (show) {

        loaderOverlay.classList.remove("hidden");

    } else {

        loaderOverlay.classList.add("hidden");

    }

}


// ============================================================
// UPDATE LOADER
// ============================================================

function updateLoader(
    text,
    progress = ""
) {

    if (loaderStatus) {
        loaderStatus.innerText = text;
    }

    if (loaderProgress) {
        loaderProgress.innerText = progress;
    }

}


// ============================================================
// FORMAT FILE SIZE
// ============================================================

function formatFileSize(bytes) {

    if (bytes < 1024) {
        return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;

}


// ============================================================
// CHECK WEBGPU
// ============================================================

function supportsWebGPU() {

    return (
        typeof navigator !== "undefined" &&
        "gpu" in navigator &&
        !!navigator.gpu
    );

}


// ============================================================
// DRAG & DROP
// ============================================================

dropZone.addEventListener(
    "click",
    () => {

        if (!isProcessing) {
            fileInput.click();
        }

    }
);


dropZone.addEventListener(
    "dragover",
    (event) => {

        event.preventDefault();

        if (!isProcessing) {
            dropZone.classList.add("dragover");
        }

    }
);


dropZone.addEventListener(
    "dragleave",
    () => {

        dropZone.classList.remove("dragover");

    }
);


dropZone.addEventListener(
    "drop",
    (event) => {

        event.preventDefault();

        dropZone.classList.remove("dragover");


        if (
            !isProcessing &&
            event.dataTransfer &&
            event.dataTransfer.files &&
            event.dataTransfer.files.length > 0
        ) {

            handleFile(
                event.dataTransfer.files[0]
            );

        }

    }
);


fileInput.addEventListener(
    "change",
    (event) => {

        if (
            event.target.files &&
            event.target.files.length > 0
        ) {

            handleFile(
                event.target.files[0]
            );

        }

    }
);


// ============================================================
// PREPARE IMAGE FOR AI
// ============================================================

async function prepareImageForAI(file) {

    const bitmap =
        await createImageBitmap(file);


    const originalWidth =
        bitmap.width;

    const originalHeight =
        bitmap.height;


    // console.log(
    //     "Original image:",
    //     `${originalWidth} × ${originalHeight}`
    // );


    // --------------------------------------------------------
    // Tidak perlu resize
    // --------------------------------------------------------

    if (
        originalWidth <= MAX_AI_SIZE &&
        originalHeight <= MAX_AI_SIZE
    ) {

        bitmap.close();


        return {

            blob: file,

            width: originalWidth,

            height: originalHeight,

            resized: false

        };

    }


    // --------------------------------------------------------
    // Hitung ukuran baru
    // --------------------------------------------------------

    const scale =
        Math.min(
            MAX_AI_SIZE / originalWidth,
            MAX_AI_SIZE / originalHeight
        );


    const width =
        Math.round(
            originalWidth * scale
        );


    const height =
        Math.round(
            originalHeight * scale
        );


    // console.log(
    //     "AI resized image:",
    //     `${width} × ${height}`
    // );


    // --------------------------------------------------------
    // Canvas
    // --------------------------------------------------------

    const canvas =
        document.createElement("canvas");


    canvas.width = width;
    canvas.height = height;


    const context =
        canvas.getContext(
            "2d",
            {
                alpha: true,
                willReadFrequently: false
            }
        );


    if (!context) {

        bitmap.close();

        throw new Error(
            "Browser tidak mendukung Canvas 2D."
        );

    }


    // --------------------------------------------------------
    // Draw
    // --------------------------------------------------------

    context.drawImage(
        bitmap,
        0,
        0,
        width,
        height
    );


    // ImageBitmap tidak diperlukan lagi
    bitmap.close();


    // --------------------------------------------------------
    // Convert canvas → PNG Blob
    // --------------------------------------------------------

    const blob =
        await new Promise(
            (resolve, reject) => {

                canvas.toBlob(
                    (result) => {

                        if (result) {

                            resolve(result);

                        } else {

                            reject(
                                new Error(
                                    "Gagal membuat gambar sementara."
                                )
                            );

                        }

                    },
                    "image/png",
                    1
                );

            }
        );


    // Buang canvas reference
    canvas.width = 1;
    canvas.height = 1;


    return {

        blob,

        width,

        height,

        resized: true

    };

}


// ============================================================
// CLEAN ALPHA
// ============================================================
//
// Membersihkan pixel yang benar-benar hampir transparan.
//
// Jangan menggunakan threshold terlalu tinggi karena
// dapat memotong rambut, kain tipis, atau detail objek.
//
// ============================================================

async function cleanAlpha(blob) {

    const bitmap =
        await createImageBitmap(blob);


    const canvas =
        document.createElement("canvas");


    canvas.width =
        bitmap.width;

    canvas.height =
        bitmap.height;


    const context =
        canvas.getContext(
            "2d",
            {
                alpha: true,
                willReadFrequently: true
            }
        );


    if (!context) {

        bitmap.close();

        throw new Error(
            "Browser tidak mendukung Canvas 2D."
        );

    }


    context.drawImage(
        bitmap,
        0,
        0
    );


    bitmap.close();


    const imageData =
        context.getImageData(
            0,
            0,
            canvas.width,
            canvas.height
        );


    const data =
        imageData.data;


    // Threshold rendah agar rambut/detail
    // tidak ikut terpotong.
    const ALPHA_THRESHOLD = 12;


    for (
        let index = 3;
        index < data.length;
        index += 4
    ) {

        if (
            data[index] <= ALPHA_THRESHOLD
        ) {

            data[index] = 0;

        }

    }


    context.putImageData(
        imageData,
        0,
        0
    );


    const cleanedBlob =
        await new Promise(
            (resolve, reject) => {

                canvas.toBlob(
                    (result) => {

                        if (result) {

                            resolve(result);

                        } else {

                            reject(
                                new Error(
                                    "Gagal membuat PNG final."
                                )
                            );

                        }

                    },
                    "image/png"
                );

            }
        );


    // Release canvas memory
    canvas.width = 1;
    canvas.height = 1;


    return cleanedBlob;

}


// ============================================================
// CREATE RESULT UI
// ============================================================

function createResultItem(
    url,
    finalName,
    sizeKB
) {

    const div =
        document.createElement("div");


    div.className =
        "result-item";


    div.style.borderLeft =
        "4px solid var(--color-red)";


    div.innerHTML = `
        <img
            src="${url}"
            alt="Hasil Background Removal"
            style="
                width:70px;
                height:70px;
                object-fit:contain;
                border-radius:8px;
                margin-right:20px;
                border:1px solid #FFCDD2;

                background-color:#eeeeee;

                background-image:
                    linear-gradient(
                        45deg,
                        #dddddd 25%,
                        transparent 25%
                    ),
                    linear-gradient(
                        -45deg,
                        #dddddd 25%,
                        transparent 25%
                    ),
                    linear-gradient(
                        45deg,
                        transparent 75%,
                        #dddddd 75%
                    ),
                    linear-gradient(
                        -45deg,
                        transparent 75%,
                        #dddddd 75%
                    );

                background-size:16px 16px;

                background-position:
                    0 0,
                    0 8px,
                    8px -8px,
                    -8px 0;
            "
        >

        <div
            class="file-info"
            style="
                width:100%;
                overflow:hidden;
                min-width:0;
                margin-right:15px;
            "
        >

            <h4
                style="
                    margin:0 0 6px 0;
                    white-space:nowrap;
                    overflow:hidden;
                    text-overflow:ellipsis;
                "
                title="${finalName}"
            >
                ${finalName}
            </h4>

            <p
                style="
                    color:var(--color-red);
                    font-weight:bold;
                    margin:0;
                    font-size:13px;
                "
            >
                PNG Transparan • ${sizeKB}
            </p>

        </div>

        <a
            href="${url}"
            download="${finalName}"
            class="btn"
            style="
                background:var(--color-red);
                flex-shrink:0;
            "
        >
            Unduh
        </a>
    `;


    return div;

}


// ============================================================
// HANDLE FILE
// ============================================================

async function handleFile(file) {

    // --------------------------------------------------------
    // VALIDASI TYPE
    // --------------------------------------------------------

    if (!file.type.startsWith("image/")) {

        Swal.fire({

            icon: "warning",

            title: "Format Salah",

            text:
                "Harap masukkan file JPG, PNG, WebP, atau format gambar yang didukung."

        });

        return;

    }


    // --------------------------------------------------------
    // VALIDASI SIZE
    // --------------------------------------------------------

    const MAX_FILE_SIZE =
        25 * 1024 * 1024;


    if (file.size > MAX_FILE_SIZE) {

        Swal.fire({

            icon: "warning",

            title: "File Terlalu Besar",

            text:
                "Ukuran file maksimal adalah 25 MB."

        });

        return;

    }


    // --------------------------------------------------------
    // CEGAH DOUBLE PROCESSING
    // --------------------------------------------------------

    if (isProcessing) {

        return;

    }


    isProcessing = true;


    // Disable drop zone
    dropZone.classList.add(
        "processing"
    );


    toggleLoader(
        true,
        "Menyiapkan Gambar...",
        "Mengoptimalkan ukuran gambar..."
    );


    try {

        // ====================================================
        // PREPARE
        // ====================================================

        const prepared =
            await prepareImageForAI(file);


        updateLoader(
            "Menyiapkan AI...",
            prepared.resized
                ? `Resolusi AI: ${prepared.width} × ${prepared.height}`
                : `Resolusi: ${prepared.width} × ${prepared.height}`
        );


        // ====================================================
        // WEBGPU DETECTION
        // ====================================================

        const hasGPU =
            supportsWebGPU();


        /*
         * Jika GPU tersedia:
         *
         * model = isnet
         * device = gpu
         * proxyToWorker = true
         *
         * Jika GPU tidak tersedia:
         *
         * model = isnet_fp16
         * device = cpu
         * proxyToWorker = false
         *
         * Karena implementation IMG.LY saat ini hanya
         * mem-proxy inference ke Worker ketika WebGPU
         * digunakan.
         */

        const device =
            hasGPU
                ? "gpu"
                : "cpu";


        const model =
            hasGPU
                ? "isnet"
                : "isnet_fp16";


        const proxyToWorker =
            hasGPU;


        // console.log(
        //     "IMG.LY configuration:",
        //     {
        //         device,
        //         model,
        //         proxyToWorker,
        //         hasGPU
        //     }
        // );


        // ====================================================
        // AI CONFIG
        // ====================================================

        const config = {

            debug: false,

            device,

            model,

            proxyToWorker,

            publicPath:
                "https://staticimgly.com/@imgly/background-removal-data/1.7.0/dist/",

            output: {

                format: "image/png",

                quality: 1

            },

            progress: (
                key,
                current,
                total
            ) => {

                // console.log(
                //     "[IMG.LY]",
                //     key,
                //     current,
                //     total
                // );


                const percent =
                    total > 0
                        ? Math.round(
                            (current / total) *
                            100
                        )
                        : 0;


                // ------------------------------------------------
                // DOWNLOAD
                // ------------------------------------------------

                if (
                    key.includes("fetch")
                ) {

                    updateLoader(
                        "Mengunduh AI Model...",
                        `${percent}%`
                    );

                    return;

                }


                // ------------------------------------------------
                // DECODE
                // ------------------------------------------------

                if (
                    key.includes("decode")
                ) {

                    updateLoader(
                        "Menganalisis Gambar...",
                        "Mempersiapkan gambar..."
                    );

                    return;

                }


                // ------------------------------------------------
                // INFERENCE
                // ------------------------------------------------

                if (
                    key.includes("inference")
                ) {

                    updateLoader(
                        "Menghapus Background...",
                        "AI sedang memisahkan objek..."
                    );

                    return;

                }


                // ------------------------------------------------
                // MASK
                // ------------------------------------------------

                if (
                    key.includes("mask")
                ) {

                    updateLoader(
                        "Merapikan Hasil...",
                        "Menyempurnakan tepian objek..."
                    );

                    return;

                }


                // ------------------------------------------------
                // ENCODE
                // ------------------------------------------------

                if (
                    key.includes("encode")
                ) {

                    updateLoader(
                        "Menyimpan Hasil...",
                        "Membuat PNG transparan..."
                    );

                    return;

                }


                // ------------------------------------------------
                // DEFAULT
                // ------------------------------------------------

                if (total > 0) {

                    updateLoader(
                        "Memproses...",
                        `${percent}%`
                    );

                }

            }

        };


        // ====================================================
        // RUN IMG.LY
        // ====================================================

        updateLoader(
            "Menghapus Background...",
            hasGPU
                ? "Menggunakan GPU..."
                : "Menggunakan CPU..."
        );


        const imageBlob =
            await removeBackground(
                prepared.blob,
                config
            );


        if (!imageBlob) {

            throw new Error(
                "IMG.LY tidak menghasilkan Blob."
            );

        }


        // console.log(
        //     "IMG.LY result:",
        //     imageBlob.type,
        //     formatFileSize(imageBlob.size)
        // );


        // ====================================================
        // CLEAN ALPHA
        // ====================================================

        updateLoader(
            "Merapikan Hasil...",
            "Membersihkan pixel transparan..."
        );


        const cleanedBlob =
            await cleanAlpha(
                imageBlob
            );


        // ====================================================
        // CREATE OBJECT URL
        // ====================================================

        const url =
            URL.createObjectURL(
                cleanedBlob
            );


        // ====================================================
        // REGISTER RESULT
        // ====================================================

        const baseName =
            file.name.replace(
                /\.[^/.]+$/,
                ""
            );


        const finalName =
            `${baseName}_nobg.png`;


        const size =
            formatFileSize(
                cleanedBlob.size
            );


        /*
         * Simpan reference Blob + Object URL.
         *
         * Ini yang nanti akan dibersihkan oleh
         * tombol "Bersihkan Memori".
         */

        processedResults.push({

            url,

            blob: cleanedBlob,

            fileName: finalName,

            originalName: file.name,

            createdAt: Date.now()

        });


        // console.log(
        //     "Active results:",
        //     processedResults.length
        // );


        // ====================================================
        // CREATE UI
        // ====================================================

        const resultElement =
            createResultItem(
                url,
                finalName,
                size
            );


        resultsContainer.prepend(
            resultElement
        );


        // ====================================================
        // SUCCESS
        // ====================================================

        Swal.fire({

            icon: "success",

            title: "Berhasil!",

            text:
                "Background berhasil dihapus.",

            timer: 1500,

            showConfirmButton: false

        });


    } catch (error) {

        console.error(
            "IMG.LY Background Removal Error:",
            error
        );


        const message =
            error?.message ||
            String(error);


        Swal.fire({

            icon: "error",

            title: "Proses Gagal",

            html: `
                <p>
                    Gagal menghapus background gambar.
                </p>

                <small
                    style="
                        display:block;
                        margin-top:10px;
                        word-break:break-word;
                        opacity:.7;
                    "
                >
                    ${message}
                </small>
            `

        });


    } finally {

        // ----------------------------------------------------
        // RESET STATE
        // ----------------------------------------------------

        isProcessing = false;


        fileInput.value = "";


        dropZone.classList.remove(
            "processing"
        );


        toggleLoader(false);

    }

}


// ============================================================
// CLEAR MEMORY
// ============================================================

function clearMemory() {

    if (
        isProcessing
    ) {

        Swal.fire({

            icon: "info",

            title: "Sedang Memproses",

            text:
                "Tunggu sampai proses gambar selesai sebelum membersihkan memori."

        });

        return;

    }


    // ========================================================
    // Jika tidak ada hasil
    // ========================================================

    if (
        processedResults.length === 0
    ) {

        resultsContainer.innerHTML = "";

        Swal.fire({

            icon: "info",

            title: "Memori Sudah Bersih",

            text:
                "Tidak ada hasil sementara yang perlu dibersihkan.",

            timer: 1400,

            showConfirmButton: false

        });

        return;

    }


    // ========================================================
    // Hitung jumlah
    // ========================================================

    const total =
        processedResults.length;


    // ========================================================
    // Release Object URL
    // ========================================================

    processedResults.forEach(
        (item) => {

            if (
                item.url
            ) {

                try {

                    URL.revokeObjectURL(
                        item.url
                    );

                } catch (error) {

                    console.warn(
                        "Gagal revoke Object URL:",
                        error
                    );

                }

            }

        }
    );


    // ========================================================
    // Hapus semua reference
    // ========================================================

    processedResults.length = 0;


    // ========================================================
    // Hapus UI
    // ========================================================

    resultsContainer.innerHTML = "";


    // ========================================================
    // Reset input
    // ========================================================

    fileInput.value = "";


    // ========================================================
    // Success
    // ========================================================

    Swal.fire({

        icon: "success",

        title: "Memori Dibersihkan",

        text:
            `${total} hasil gambar sementara telah dibersihkan dari halaman.`,

        timer: 1700,

        showConfirmButton: false

    });


    // console.log(
    //     "Memory cleanup complete."
    // );

}


// ============================================================
// BUTTON: BERSIHKAN MEMORI
// ============================================================

if (clearMemoryButton) {

    clearMemoryButton.addEventListener(
        "click",
        clearMemory
    );

} else {

    console.warn(
        'Element #clearMemory tidak ditemukan.'
    );

}


// ============================================================
// CLEANUP SAAT PAGE DITUTUP / RELOAD
// ============================================================
//
// Browser biasanya sudah membersihkan state halaman ketika
// reload, tetapi revoke secara eksplisit tetap merupakan
// praktik yang baik.
//
// ============================================================

window.addEventListener(
    "pagehide",
    () => {

        processedResults.forEach(
            (item) => {

                if (item.url) {

                    try {

                        URL.revokeObjectURL(
                            item.url
                        );

                    } catch (error) {

                        // Tidak perlu melakukan apa-apa
                        // saat halaman sedang ditutup.

                    }

                }

            }
        );


        processedResults.length = 0;

    }
);