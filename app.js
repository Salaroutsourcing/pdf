// app.js

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

let currentTool = '';
let selectedFiles = [];

// View Elements
const homeView = document.getElementById('home-view');
const workspaceView = document.getElementById('workspace-view');
const workspaceTitle = document.getElementById('workspace-title');
const backBtn = document.getElementById('back-btn');

// Workspace Elements
const toolOptions = document.getElementById('tool-options');
const fileInput = document.getElementById('file-input');
const dropZone = document.getElementById('drop-zone');
const fileList = document.getElementById('file-list');
const processBtn = document.getElementById('process-btn');
const statusText = document.getElementById('status-text');

// --- View Management ---
function showWorkspace() {
    homeView.classList.add('hidden');
    workspaceView.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showHome() {
    workspaceView.classList.add('hidden');
    homeView.classList.remove('hidden');
    resetWorkspace();
}

backBtn.addEventListener('click', showHome);

// --- Tool Selection ---
document.querySelectorAll('.tool-card').forEach(card => {
    card.addEventListener('click', () => {
        currentTool = card.dataset.tool;
        workspaceTitle.textContent = card.dataset.title;
        showWorkspace();
        resetWorkspace();
        renderToolOptions();
        
        // Configure input based on tool
        if (currentTool === 'merge' || currentTool === 'jpg-to-pdf') {
            fileInput.multiple = true;
            fileInput.accept = currentTool === 'merge' ? '.pdf' : '.jpg,.jpeg,.png';
        } else {
            fileInput.multiple = false;
            fileInput.accept = '.pdf';
        }
    });
});

// --- Dynamic Tool Options ---
function renderToolOptions() {
    toolOptions.innerHTML = '';
    
    if (currentTool === 'rotate') {
        toolOptions.innerHTML = `
            <div>
                <label class="block text-sm font-semibold text-slate-700 mb-2">Rotation Angle</label>
                <select id="rotate-angle" class="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all">
                    <option value="90">90° Clockwise</option>
                    <option value="180">180° (Upside Down)</option>
                    <option value="270">90° Counter-Clockwise</option>
                </select>
            </div>
        `;
    } else if (currentTool === 'watermark') {
        toolOptions.innerHTML = `
            <div>
                <label class="block text-sm font-semibold text-slate-700 mb-2">Watermark Text</label>
                <input type="text" id="watermark-text" value="CONFIDENTIAL" class="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all">
                <p class="text-xs text-slate-400 mt-2">This text will be placed diagonally across all pages.</p>
            </div>
        `;
    } else if (currentTool === 'page-numbers') {
        toolOptions.innerHTML = `
            <div>
                <label class="block text-sm font-semibold text-slate-700 mb-2">Position</label>
                <select id="page-number-position" class="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all">
                    <option value="bottom-center">Bottom Center</option>
                    <option value="bottom-right">Bottom Right</option>
                </select>
            </div>
        `;
    } else {
        toolOptions.innerHTML = `<p class="text-sm text-slate-500 italic">No additional options required for this tool.</p>`;
    }
}

// --- File Handling ---
dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('bg-indigo-100', 'border-indigo-500'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('bg-indigo-100', 'border-indigo-500'));
dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('bg-indigo-100', 'border-indigo-500');
    handleFiles(e.dataTransfer.files);
});

fileInput.addEventListener('change', (e) => handleFiles(e.target.files));

function handleFiles(files) {
    selectedFiles = Array.from(files);
    renderFileList();
    processBtn.disabled = selectedFiles.length === 0;
}

function renderFileList() {
    fileList.innerHTML = '';
    selectedFiles.forEach((file, index) => {
        const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');
        const iconClass = isPdf ? 'fa-file-pdf text-red-500' : 'fa-file-image text-amber-500';
        const bgClass = isPdf ? 'bg-red-50' : 'bg-amber-50';
        
        const li = document.createElement('li');
        li.className = 'flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-sm fade-in';
        li.innerHTML = `
            <div class="flex items-center gap-3 overflow-hidden">
                <div class="w-10 h-10 ${bgClass} rounded-lg flex items-center justify-center flex-shrink-0">
                    <i class="fas ${iconClass} text-lg"></i>
                </div>
                <div class="truncate">
                    <p class="text-sm font-semibold text-slate-700 truncate">${file.name}</p>
                    <p class="text-xs text-slate-400">${(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
            </div>
            <button onclick="removeFile(${index})" class="w-8 h-8 rounded-full hover:bg-red-50 text-slate-400 hover:text-red-500 flex items-center justify-center transition-colors flex-shrink-0">
                <i class="fas fa-times"></i>
            </button>
        `;
        fileList.appendChild(li);
    });
}

// Global function to remove a file
window.removeFile = function(index) {
    selectedFiles.splice(index, 1);
    renderFileList();
    if (selectedFiles.length === 0) {
        fileInput.value = '';
    }
    processBtn.disabled = selectedFiles.length === 0;
};

function resetWorkspace() {
    selectedFiles = [];
    fileInput.value = '';
    fileList.innerHTML = '';
    statusText.textContent = '';
    statusText.className = 'text-center text-sm mt-4 font-medium min-h-[20px]';
    processBtn.disabled = true;
    processBtn.innerHTML = '<i class="fas fa-cog"></i> Process Files';
    toolOptions.innerHTML = '';
}

// --- Processing Logic ---
processBtn.addEventListener('click', async () => {
    if (selectedFiles.length === 0) return;
    
    processBtn.disabled = true;
    processBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    statusText.textContent = 'Working...';
    statusText.className = 'text-center text-sm mt-4 font-medium text-indigo-600';

    try {
        switch (currentTool) {
            case 'merge': await mergePDFs(); break;
            case 'split': await splitPDF(); break;
            case 'compress': await compressPDF(); break;
            case 'pdf-to-jpg': await pdfToJpg(); break;
            case 'jpg-to-pdf': await jpgToPdf(); break;
            case 'rotate': await rotatePDF(); break;
            case 'watermark': await watermarkPDF(); break;
            case 'page-numbers': await addPageNumbers(); break;
            case 'ocr': await ocrPDF(); break;
        }
        statusText.textContent = 'Completed successfully! Check your downloads.';
        statusText.className = 'text-center text-sm mt-4 font-medium text-emerald-600';
    } catch (error) {
        console.error(error);
        statusText.textContent = 'Error: ' + error.message;
        statusText.className = 'text-center text-sm mt-4 font-medium text-red-600';
    } finally {
        processBtn.disabled = false;
        processBtn.innerHTML = '<i class="fas fa-cog"></i> Process Files';
    }
});

// --- Core PDF Functions (Phase 2 Logic Preserved) ---

async function mergePDFs() {
    const mergedPdf = await PDFLib.PDFDocument.create();
    for (const file of selectedFiles) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFLib.PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
    }
    const pdfBytes = await mergedPdf.save();
    downloadBlob(new Blob([pdfBytes], { type: 'application/pdf' }), 'merged.pdf');
}

async function splitPDF() {
    const file = selectedFiles[0];
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFLib.PDFDocument.load(arrayBuffer);
    const totalPages = pdf.getPageCount();
    
    for (let i = 0; i < totalPages; i++) {
        const newPdf = await PDFLib.PDFDocument.create();
        const [copiedPage] = await newPdf.copyPages(pdf, [i]);
        newPdf.addPage(copiedPage);
        const pdfBytes = await newPdf.save();
        downloadBlob(new Blob([pdfBytes], { type: 'application/pdf' }), `page_${i + 1}.pdf`);
    }
}

async function compressPDF() {
    const file = selectedFiles[0];
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    const compressedPdf = await PDFLib.PDFDocument.create();
    
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        await page.render({ canvasContext: context, viewport: viewport }).promise;
        const imgData = canvas.toDataURL('image/jpeg', 0.6); 
        const imgBytes = await fetch(imgData).then(res => res.arrayBuffer());
        const jpgImage = await compressedPdf.embedJpg(imgBytes);
        
        const newPage = compressedPdf.addPage([viewport.width, viewport.height]);
        newPage.drawImage(jpgImage, { x: 0, y: 0, width: viewport.width, height: viewport.height });
    }
    const pdfBytes = await compressedPdf.save();
    downloadBlob(new Blob([pdfBytes], { type: 'application/pdf' }), 'compressed.pdf');
}

async function pdfToJpg() {
    const file = selectedFiles[0];
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        await page.render({ canvasContext: context, viewport: viewport }).promise;
        canvas.toBlob((blob) => {
            downloadBlob(blob, `page_${i}.jpg`);
        }, 'image/jpeg', 0.9);
    }
}

async function jpgToPdf() {
    const pdfDoc = await PDFLib.PDFDocument.create();
    for (const file of selectedFiles) {
        const arrayBuffer = await file.arrayBuffer();
        let image;
        if (file.type === 'image/png') {
            image = await pdfDoc.embedPng(arrayBuffer);
        } else {
            image = await pdfDoc.embedJpg(arrayBuffer);
        }
        const page = pdfDoc.addPage([image.width, image.height]);
        page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
    }
    const pdfBytes = await pdfDoc.save();
    downloadBlob(new Blob([pdfBytes], { type: 'application/pdf' }), 'converted.pdf');
}

async function rotatePDF() {
    const file = selectedFiles[0];
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFLib.PDFDocument.load(arrayBuffer);
    const pages = pdf.getPages();
    const angle = parseInt(document.getElementById('rotate-angle').value);
    
    pages.forEach(page => {
        page.setRotation(PDFLib.degrees(page.getRotation().angle + angle));
    });
    
    const pdfBytes = await pdf.save();
    downloadBlob(new Blob([pdfBytes], { type: 'application/pdf' }), 'rotated.pdf');
}

async function watermarkPDF() {
    const file = selectedFiles[0];
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFLib.PDFDocument.load(arrayBuffer);
    const pages = pdf.getPages();
    const text = document.getElementById('watermark-text').value || 'CONFIDENTIAL';
    
    const font = await pdf.embedFont(PDFLib.StandardFonts.HelveticaBold);
    
    pages.forEach(page => {
        const { width, height } = page.getSize();
        const textWidth = font.widthOfTextAtSize(text, 50);
        const textHeight = font.heightAtSize(50);
        
        page.drawText(text, {
            x: width / 2 - textWidth / 2,
            y: height / 2 - textHeight / 2,
            size: 50,
            font: font,
            color: PDFLib.rgb(0.95, 0.1, 0.1),
            opacity: 0.3,
            rotate: PDFLib.degrees(45)
        });
    });
    
    const pdfBytes = await pdf.save();
    downloadBlob(new Blob([pdfBytes], { type: 'application/pdf' }), 'watermarked.pdf');
}

async function addPageNumbers() {
    const file = selectedFiles[0];
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFLib.PDFDocument.load(arrayBuffer);
    const pages = pdf.getPages();
    const font = await pdf.embedFont(PDFLib.StandardFonts.Helvetica);
    const position = document.getElementById('page-number-position').value;
    
    pages.forEach((page, index) => {
        const { width } = page.getSize();
        const text = `${index + 1}`;
        const textWidth = font.widthOfTextAtSize(text, 12);
        
        let x = width / 2 - textWidth / 2;
        if (position === 'bottom-right') {
            x = width - textWidth - 20;
        }
        
        page.drawText(text, {
            x: x,
            y: 20,
            size: 12,
            font: font,
            color: PDFLib.rgb(0, 0, 0)
        });
    });
    
    const pdfBytes = await pdf.save();
    downloadBlob(new Blob([pdfBytes], { type: 'application/pdf' }), 'numbered.pdf');
}

async function ocrPDF() {
    const file = selectedFiles[0];
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    let fullText = "";
    statusText.textContent = "Initializing OCR engine...";
    statusText.className = 'text-center text-sm mt-4 font-medium text-indigo-600';
    
    const worker = await Tesseract.createWorker('eng');
    
    for (let i = 1; i <= pdf.numPages; i++) {
        statusText.textContent = `Running OCR on page ${i}/${pdf.numPages}...`;
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        await page.render({ canvasContext: context, viewport: viewport }).promise;
        
        const { data: { text } } = await worker.recognize(canvas);
        fullText += `--- Page ${i} ---\n${text}\n\n`;
    }
    
    await worker.terminate();
    
    const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
    downloadBlob(blob, 'ocr_result.txt');
}

// Helper: Download
function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
