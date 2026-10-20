const url = 'sample.pdf'; // Ubah dengan nama file PDF Anda

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

let pdfDoc = null;
let pageFlip = null;
let scale = 1;
let isZoomed = false;

const bookElement = document.getElementById('book');
const container = document.getElementById('zoom-container');
const contentContainer = document.getElementById('flipbook-container');
const loader = document.getElementById('loader');
const pageInfo = document.getElementById('page-info');

// 1. Render PDF ke Halaman Canvas (Resolusi Tinggi agar tidak blur)
async function loadPDF() {
    try {
        const loadingTask = pdfjsLib.getDocument(url);
        pdfDoc = await loadingTask.promise;
        const numPages = pdfDoc.numPages;

        for (let i = 1; i <= numPages; i++) {
            const page = await pdfDoc.getPage(i);
            
            // Gunakan scale 2.0 atau lebih tinggi agar gambar/teks tajam (tidak blur)
            const viewport = page.getViewport({ scale: 2.0 }); 
            
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            
            // CSS size untuk menyesuaikan tampilan
            canvas.style.width = '100%';
            canvas.style.height = '100%';

            await page.render({
                canvasContext: context,
                viewport: viewport
            }).promise;

            const pageDiv = document.createElement('div');
            pageDiv.className = 'page';
            pageDiv.appendChild(canvas);
            bookElement.appendChild(pageDiv);
        }

        initFlipBook();
    } catch (error) {
        console.error('Gagal memuat PDF:', error);
        loader.innerHTML = '<p style="color:red;">Gagal memuat file PDF. Pastikan nama file benar.</p>';
    }
}

// 2. Inisialisasi Pustaka PageFlip
function initFlipBook() {
    pageFlip = new St.PageFlip(bookElement, {
        width: 400,  // Lebar dasar per halaman
        height: 550, // Tinggi dasar per halaman
        size: 'stretch',
        minWidth: 250,
        maxWidth: 1000,
        minHeight: 350,
        maxHeight: 1200,
        maxShadowOpacity: 0.5,
        showCover: true,
        mobileScrollSupport: false // Dimatikan agar tidak konflik dengan pinch zoom
    });

    pageFlip.loadFromHTML(document.querySelectorAll('.page'));

    pageFlip.on('change', (e) => {
        pageInfo.textContent = `${e.data + 1} / ${pdfDoc.numPages}`;
    });

    loader.style.display = 'none';
    pageInfo.textContent = `1 / ${pdfDoc.numPages}`;
}

// 3. Tombol Navigasi
document.getElementById('prev-btn').addEventListener('click', () => {
    if (pageFlip && !isZoomed) pageFlip.flipPrev();
});

document.getElementById('next-btn').addEventListener('click', () => {
    if (pageFlip && !isZoomed) pageFlip.flipNext();
});

// 4. Fitur Fullscreen HP
document.getElementById('fullscreen-btn').addEventListener('click', () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            alert(`Error: ${err.message}`);
        });
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
});

// 5. Logika Zoom In / Out & Kunci Pergeseran Halaman
const hammer = new Hammer(container);
hammer.get('pinch').set({ enable: true });

let currentScale = 1;
let lastScale = 1;

hammer.on('pinchstart', () => {
    lastScale = currentScale;
});

hammer.on('pinch', (e) => {
    currentScale = Math.max(1, Math.min(lastScale * e.scale, 3));
    applyZoom();
});

hammer.on('pinchend', () => {
    if (currentScale > 1) {
        isZoomed = true; // Kunci halaman agar tidak bisa digeser saat di-zoom
    } else {
        isZoomed = false;
        currentScale = 1;
        contentContainer.style.transform = 'scale(1) translate(0px, 0px)';
    }
});

function applyZoom() {
    contentContainer.style.transform = `scale(${currentScale})`;
    if (currentScale > 1) {
        isZoomed = true;
    } else {
        isZoomed = false;
    }
}

// Tombol Zoom Manual
document.getElementById('zoom-in-btn').addEventListener('click', () => {
    currentScale = Math.min(currentScale + 0.5, 3);
    applyZoom();
});

document.getElementById('zoom-out-btn').addEventListener('click', () => {
    currentScale = Math.max(currentScale - 0.5, 1);
    applyZoom();
    if (currentScale === 1) {
        contentContainer.style.transform = 'scale(1)';
    }
});

// Jalankan pemuatan PDF
loadPDF();
