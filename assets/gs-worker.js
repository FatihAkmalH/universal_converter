// Memanggil mesin Ghostscript ke dalam dunia latar belakang (Worker)
importScripts('gs.js');

self.onmessage = async function(e) {
    // Menerima perintah dari halaman utama
    const { fileBuffer, args, inputName, outputName } = e.data;

    try {
        // Cek nama modul pabrikannya (biasanya GhostscriptModule atau Module)
        const GSFactory = typeof GhostscriptModule !== 'undefined' ? GhostscriptModule : (typeof Module !== 'undefined' ? Module : null);

        if (!GSFactory) {
            throw new Error("Modul gs.js tidak menyediakan instance GhostscriptModule atau Module.");
        }

        // Inisialisasi Modul WebAssembly
        const gsInstance = await GSFactory({
            noInitialRun: true,
            print: (text) => console.log('GS Background Log:', text),
            printErr: (text) => console.error('GS Background Error:', text)
        });

        // 1. Tulis file ke memori virtual worker
        gsInstance.FS.writeFile(inputName, new Uint8Array(fileBuffer));

        // 2. Eksekusi program
        gsInstance.callMain(args);

        // 3. Baca hasil file dari memori virtual
        const outputData = gsInstance.FS.readFile(outputName);

        // 4. Bersihkan memori agar RAM komputer lega kembali
        gsInstance.FS.unlink(inputName);
        gsInstance.FS.unlink(outputName);

        // 5. Kirim data hasil kompresi kembali ke halaman utama
        // [outputData.buffer] digunakan agar data 'ditransfer' langsung tanpa membebani RAM 2x lipat
        self.postMessage({ success: true, data: outputData.buffer }, [outputData.buffer]);

    } catch (error) {
        self.postMessage({ success: false, error: error.toString() });
    }
};