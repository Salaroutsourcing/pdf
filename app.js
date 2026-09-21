// app.js

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

let currentTool = '';
let selectedFiles = [];

// UI Elements
const toolCards = document.querySelectorAll('.tool-card');
const workspace = document.getElementById('workspace');
const workspaceTitle = document.getElementById('workspace-title');
const fileInput = document.getElementById('file-input');
const dropZone = document.getElementById('drop-zone');
const fileList = document.getElementById('file-list');
const processBtn = document.getElementById('process-btn');
const statusText = document.getElementById('status-text');
const closeWorkspace = document.getElementById('close-workspace');

// Tool Selection
toolCards.forEach(card => {
    card.addEventListener('click', () => {
        currentTool = card.dataset.tool;
        workspaceTitle.textContent = card.dataset.title;
        workspace.classList.remove('hidden');
        resetWorkspace();
        window.scrollTo({ top: workspace.offsetTop - 50, behavior: 'smooth' });
        
        // Configure input based on tool
        if (currentTool === 'merge' || currentTool === 'jpg-to-pdf') {
            fileInput.multiple = true;
            fileInput.accept = currentTool === 'merge' ? '.pdf' : '.jpg,.jpeg,.png';
        } else {
            fileInput.multiple = false;
            fileInput.accept = currentTool === 'split' || currentTool === 'compress' ? '.pdf' : '.pdf';
        }
    });
});

closeWorkspace.addEventListener('click', () => {
    workspace.classList.add('hidden');
    resetWorkspace();
});

// File Handling
dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('bg-indigo-50'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('bg-indigo-50'));
dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('bg-indigo-50');
    handleFiles(e.dataTransfer.files);
});

fileInput.addEventListener('change', (e) => handleFiles(e.target.files));

function handleFiles(files) {
    selectedFiles = Array.from(files);
    fileList.innerHTML = '';
    selectedFiles.forEach(file => {
        const li = document.createElement('li');
        li.className = 'flex justify-between items-center bg-gray-50 p-2 rounded border';
        li.innerHTML = `<span class="text-sm truncate">${file.name}</span> <span class="text-xs text-gray-500">${(file.size / 1024 / 1024).toFixed(2)} MB</span>`;
        fileList.appendChild(li);
    });
    processBtn.disabled = selectedFiles.length === 0;
}

function resetWorkspace() {
    selectedFiles = [];
    fileInput.value = '';
    fileList.innerHTML = '';
    statusText.textContent = '';
    processBtn.disabled = true;
    processBtn.innerHTML = 'Process Files';
}

// Processing Logic
processBtn.addEventListener('click', async () => {
    if (selectedFiles.length === 0) return;
    
    processBtn.disabled = true;
    processBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    statusText.textContent = 'Working...';

    try {
        switch (currentTool) {
            case 'merge': await mergePDFs(); break;
            case 'split': await splitPDF(); break;
            case 'compress': await compressPDF(); break;
            case 'pdf-to-jpg': await pdfToJpg(); break;
            case 'jpg-to-pdf': await jpgToPdf(); break;
        }
        statusText.textContent = 'Completed successfully!';
        statusText.className = 'text-green-600 font-bold mt-4';
    } catch (error) {
        console.error(error);
        statusText.textContent = 'Error: ' + error.message;
        statusText.className = 'text-red-600 font-bold mt-4';
    } finally {
        processBtn.disabled = false;
        processBtn.innerHTML = 'Process Files';
    }
});

// --- Core PDF Functions ---

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
    
    // For simplicity, we split into individual pages (or you could prompt for ranges)
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
    
    // Load with pdf.js
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    const compressedPdf = await PDFLib.PDFDocument.create();
    
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 }); // Lower scale = smaller size
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        await page.render({ canvasContext: context, viewport: viewport }).promise;
        
        // Convert to JPEG with lower quality
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
        const viewport = page.getViewport({ scale: 2.0 }); // High quality
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
