// DOM Elements
const editor = document.getElementById('editor');
const themeToggle = document.getElementById('themeToggle');
const themeLabel = document.getElementById('themeLabel');
const wordCount = document.getElementById('wordCount');
const charCount = document.getElementById('charCount');
const fileInput = document.getElementById('fileInput');
const fileSelectBtn = document.getElementById('fileSelectBtn');
const docTitle = document.getElementById('docTitle');
const autoTitleBtn = document.getElementById('autoTitleBtn');
const exportPdfBtn = document.getElementById('exportPdfBtn');
const clearBtn = document.getElementById('clearBtn');

// Formatting buttons
const boldBtn = document.getElementById('boldBtn');
const italicBtn = document.getElementById('italicBtn');
const underlineBtn = document.getElementById('underlineBtn');
const headingSelect = document.getElementById('headingSelect');
const bulletListBtn = document.getElementById('bulletListBtn');
const numberedListBtn = document.getElementById('numberedListBtn');
const alignLeftBtn = document.getElementById('alignLeftBtn');
const alignCenterBtn = document.getElementById('alignCenterBtn');
const alignRightBtn = document.getElementById('alignRightBtn');
const linkBtn = document.getElementById('linkBtn');

// Initialize the application
function init() {
    loadFromLocalStorage();
    setupEventListeners();
    updateCounters();
    applyThemeFromStorage();
    
    // Ensure editor stays at top
    editor.scrollTop = 0;
}

// Set up all event listeners
function setupEventListeners() {
    // Editor events
    editor.addEventListener('input', () => {
        updateCounters();
        autoSave();
    });
    
    // Theme toggle
    themeToggle.addEventListener('change', toggleTheme);
    
    // File operations
    fileSelectBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileImport);
    
    // Drag and drop for file import
    editor.addEventListener('dragover', (e) => {
        e.preventDefault();
        editor.classList.add('drag-over');
    });
    
    editor.addEventListener('dragleave', () => {
        editor.classList.remove('drag-over');
    });
    
    editor.addEventListener('drop', (e) => {
        e.preventDefault();
        editor.classList.remove('drag-over');
        
        const files = e.dataTransfer.files;
        if (files.length > 0 && files[0].type === 'text/plain') {
            importTextFile(files[0]);
        }
    });
    
    // Document operations
    autoTitleBtn.addEventListener('click', autoDetectTitle);
    exportPdfBtn.addEventListener('click', exportToPdf);
    clearBtn.addEventListener('click', clearDocument);
    
    // Formatting buttons
    boldBtn.addEventListener('click', () => formatText('bold'));
    italicBtn.addEventListener('click', () => formatText('italic'));
    underlineBtn.addEventListener('click', () => formatText('underline'));
    headingSelect.addEventListener('change', () => formatHeading(headingSelect.value));
    bulletListBtn.addEventListener('click', () => formatList('insertUnorderedList'));
    numberedListBtn.addEventListener('click', () => formatList('insertOrderedList'));
    alignLeftBtn.addEventListener('click', () => formatText('justifyLeft'));
    alignCenterBtn.addEventListener('click', () => formatText('justifyCenter'));
    alignRightBtn.addEventListener('click', () => formatText('justifyRight'));
    linkBtn.addEventListener('click', insertLink);
}

// Theme functionality
function toggleTheme() {
    const isDarkMode = themeToggle.checked;
    document.body.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    themeLabel.textContent = isDarkMode ? 'Light Mode' : 'Dark Mode';
    localStorage.setItem('jawad-txt-pdf-theme', isDarkMode ? 'dark' : 'light');
}

function applyThemeFromStorage() {
    const savedTheme = localStorage.getItem('jawad-txt-pdf-theme') || 'light';
    const isDarkMode = savedTheme === 'dark';
    themeToggle.checked = isDarkMode;
    toggleTheme(); // Apply the theme
}

// Text formatting functions
function formatText(command) {
    document.execCommand(command, false, null);
    editor.focus();
}

function formatHeading(headingType) {
    if (headingType === 'p') {
        document.execCommand('formatBlock', false, '<p>');
    } else {
        document.execCommand('formatBlock', false, `<${headingType}>`);
    }
    editor.focus();
}

function formatList(command) {
    document.execCommand(command, false, null);
    editor.focus();
}

function insertLink() {
    const url = prompt('Enter the URL:');
    if (url) {
        document.execCommand('createLink', false, url);
        
        // Ensure links are blue in the editor immediately
        setTimeout(() => {
            const links = editor.querySelectorAll('a');
            links.forEach(link => {
                link.style.color = '#0066cc';
                link.style.textDecoration = 'underline';
            });
        }, 10);
    }
    editor.focus();
}

// Document operations
function autoDetectTitle() {
    const content = editor.innerHTML;
    
    // Try to find an H1 tag first
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    const h1 = tempDiv.querySelector('h1');
    
    if (h1 && h1.textContent.trim()) {
        docTitle.value = h1.textContent.trim();
        return;
    }
    
    // If no H1, try to get the first line of text
    const textContent = editor.textContent || editor.innerText;
    const firstLine = textContent.split('\n')[0].trim();
    
    if (firstLine && firstLine.length > 0) {
        docTitle.value = firstLine;
    }
}

function clearDocument() {
    // No confirmation, just clear immediately
    editor.innerHTML = '<p></p>';
    updateCounters();
    autoSave();
    
    // Set cursor to beginning
    const range = document.createRange();
    const sel = window.getSelection();
    range.selectNodeContents(editor);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
    
    editor.focus();
}

// File import functionality
function handleFileImport(e) {
    const file = e.target.files[0];
    if (file && file.type === 'text/plain') {
        importTextFile(file);
    }
}

function importTextFile(file) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const content = e.target.result;
        editor.innerHTML = content.replace(/\n/g, '<br>');
        updateCounters();
        autoSave();
        autoDetectTitle();
        
        // Ensure links are blue after import
        const links = editor.querySelectorAll('a');
        links.forEach(link => {
            link.style.color = '#0066cc';
            link.style.textDecoration = 'underline';
        });
        
        // Scroll to top after import
        editor.scrollTop = 0;
    };
    
    reader.readAsText(file);
}

// PDF export functionality
function exportToPdf() {
    if (!editor.textContent.trim()) {
        alert('Document is empty. Please add some content before exporting.');
        return;
    }
    
    // Store current scroll position and styling
    const scrollPosition = editor.scrollTop;
    const originalHeight = editor.style.height;
    const originalOverflow = editor.style.overflow;
    
    // Temporarily expand the editor to show all content
    editor.style.height = 'auto';
    editor.style.overflow = 'visible';
    
    // Create a clean copy of the editor content for PDF generation
    const contentCopy = document.createElement('div');
    contentCopy.style.padding = '15mm 20mm';
    contentCopy.style.fontFamily = 'Arial, sans-serif';
    contentCopy.style.fontSize = '12pt';
    contentCopy.style.lineHeight = '1.5';
    contentCopy.style.color = '#000000';
    
    // Add title if provided (only once)
    const title = docTitle.value.trim();
    if (title) {
        const titleElement = document.createElement('h1');
        titleElement.textContent = title;
        titleElement.style.textAlign = 'center';
        titleElement.style.marginBottom = '15px';
        titleElement.style.fontSize = '16pt';
        titleElement.style.color = '#000000';
        titleElement.style.fontWeight = 'bold';
        contentCopy.appendChild(titleElement);
    }
    
    // Add the main content (remove any existing H1 to avoid duplicates)
    const contentWithoutH1 = editor.innerHTML;
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = contentWithoutH1;
    
    // Remove any H1 elements from content to prevent duplicates
    const h1Elements = tempDiv.querySelectorAll('h1');
    h1Elements.forEach(h1 => h1.remove());
    
    // Create a style element for blue links in PDF
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        a {
            color: #0066cc !important;
            text-decoration: underline !important;
        }
        * {
            color: #000000;
        }
    `;
    contentCopy.appendChild(styleElement);
    
    // Create content div for the main text
    const contentDiv = document.createElement('div');
    contentDiv.innerHTML = tempDiv.innerHTML;
    contentCopy.appendChild(contentDiv);
    
    // PDF options - Optimized for smaller file size
    const options = {
        margin: 10,
        filename: `${title || 'document'}.pdf`,
        image: { 
            type: 'jpeg', 
            quality: 0.7
        },
        html2canvas: { 
            scale: 1.2,
            useCORS: true,
            logging: false,
            letterRendering: true
        },
        jsPDF: { 
            unit: 'mm', 
            format: 'a4', 
            orientation: 'portrait',
            compress: true,
            hotfixes: ["px_scaling"]
        }
    };
    
    // Show loading state
    exportPdfBtn.textContent = 'Generating PDF...';
    exportPdfBtn.disabled = true;
    
    // Generate PDF
    html2pdf().set(options).from(contentCopy).save().then(() => {
        // Restore original editor state
        editor.style.height = originalHeight;
        editor.style.overflow = originalOverflow;
        editor.scrollTop = scrollPosition;
        
        // Restore button state
        exportPdfBtn.textContent = 'Export to PDF';
        exportPdfBtn.disabled = false;
    }).catch(error => {
        console.error('PDF generation error:', error);
        alert('Error generating PDF. Please try again.');
        
        // Restore button state
        exportPdfBtn.textContent = 'Export to PDF';
        exportPdfBtn.disabled = false;
    });
}

// Counter functionality
function updateCounters() {
    const text = editor.textContent || editor.innerText;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const characters = text.length;
    
    wordCount.textContent = `Words: ${words}`;
    charCount.textContent = `Characters: ${characters}`;
}

// Local storage functionality
function autoSave() {
    const content = editor.innerHTML;
    localStorage.setItem('jawad-txt-pdf-content', content);
}

function loadFromLocalStorage() {
    const savedContent = localStorage.getItem('jawad-txt-pdf-content');
    if (savedContent) {
        editor.innerHTML = savedContent;
        
        // Ensure links are blue when loading from storage
        setTimeout(() => {
            const links = editor.querySelectorAll('a');
            links.forEach(link => {
                link.style.color = '#0066cc';
                link.style.textDecoration = 'underline';
            });
        }, 100);
    } else {
        // Initialize with empty paragraph
        editor.innerHTML = '<p></p>';
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
