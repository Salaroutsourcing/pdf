const fs = require('node:fs');
const path = require('node:path');
const files = {
 'pdf-lib/dist/pdf-lib.min.js':'pdf-lib.min.js',
 'pdfjs-dist/build/pdf.mjs':'pdf.mjs',
 'pdfjs-dist/build/pdf.worker.mjs':'pdf.worker.mjs',
 'html2pdf.js/dist/html2pdf.bundle.min.js':'html2pdf.bundle.min.js',
 'jszip/dist/jszip.min.js':'jszip.min.js',
 'tesseract.js/dist/tesseract.min.js':'tesseract.min.js',
 'tesseract.js/dist/worker.min.js':'tesseract-worker.min.js',
};
fs.mkdirSync('vendor', {recursive:true});
for (const [from,to] of Object.entries(files)) fs.copyFileSync(path.join('node_modules',from),path.join('vendor',to));
fs.mkdirSync('vendor/tesseract-core',{recursive:true});
for(const name of fs.readdirSync('node_modules/tesseract.js-core')) if(name.endsWith('.wasm.js')) fs.copyFileSync('node_modules/tesseract.js-core/'+name,'vendor/tesseract-core/'+name);
for (const name of ['pdf-lib','pdfjs-dist','html2pdf.js','jszip','tesseract.js','tesseract.js-core']) {
 const dir='node_modules/'+name;
 const lic=fs.readdirSync(dir).find(n=>/^licen[sc]e/i.test(n));
 if(lic) fs.copyFileSync(dir+'/'+lic,'vendor/'+name+'-LICENSE');
}
