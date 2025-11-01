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

// State variables
let scrollPosition = 0;
let isExporting = false;

// Initialize the application
function init() {
    loadFromLocalStorage();
    setupEventListeners();
    updateCounters();
    applyThemeFromStorage();
}

// Set up all event listeners
function setupEventListeners() {
    // Editor events
    editor.addEventListener('input', updateCounters);
    editor.addEventListener('input', autoSave);
    
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
    if (confirm('Are you sure you want to clear the entire document?')) {
        editor.innerHTML = '';
        updateCounters();
        autoSave();
    }
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
    };
    
    reader.readAsText(file);
}

// PDF export functionality
function exportToPdf() {
    if (!editor.textContent.trim()) {
        alert('Document is empty. Please add some content before exporting.');
        return;
    }
    
    isExporting = true;
    
    // Store current scroll position and styling
    scrollPosition = editor.scrollTop;
    const originalHeight = editor.style.height;
    const originalOverflow = editor.style.overflow;
    
    // Temporarily expand the editor to show all content
    editor.style.height = 'auto';
    editor.style.overflow = 'visible';
    
    // Create a copy of the editor content for PDF generation
    const contentCopy = document.createElement('div');
    contentCopy.innerHTML = editor.innerHTML;
    
    // Remove any existing title from content to avoid duplication
    const existingTitles = contentCopy.querySelectorAll('h1');
    existingTitles.forEach(title => {
        // Only remove if it matches our auto-detected title
        const titleText = title.textContent.trim();
        if (titleText === docTitle.value.trim()) {
            title.remove();
        }
    });
    
    // Add title if provided (only once, at the beginning)
    const title = docTitle.value.trim();
    if (title) {
        const titleElement = document.createElement('h1');
        titleElement.textContent = title;
        titleElement.style.textAlign = 'center';
        titleElement.style.marginBottom = '20px';
        titleElement.style.pageBreakAfter = 'avoid';
        titleElement.style.color = '#2c3e50'; // Dark color for title
        titleElement.style.fontSize = '24px';
        titleElement.style.fontWeight = 'bold';
        contentCopy.prepend(titleElement);
    }
    
    // Apply PDF-specific styling to ensure black text
    applyPdfStyling(contentCopy);
    
    // Add export info
    const exportInfo = document.createElement('div');
    exportInfo.style.textAlign = 'center';
    exportInfo.style.marginTop = '30px';
    exportInfo.style.fontSize = '12px';
    exportInfo.style.color = '#666';
    exportInfo.textContent = `Exported from Jawad's TXT to PDF on ${new Date().toLocaleDateString()}`;
    contentCopy.appendChild(exportInfo);
    
    // PDF options
    const options = {
        margin: 15,
        filename: `${title || 'document'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
            scale: 2,
            useCORS: true,
            logging: false
        },
        jsPDF: { 
            unit: 'mm', 
            format: 'a4', 
            orientation: 'portrait'
        },
        pagebreak: { 
            mode: ['avoid-all', 'css', 'legacy'] 
        }
    };
    
    // Generate PDF
    html2pdf().from(contentCopy).set(options).save().then(() => {
        // Restore original editor state
        editor.style.height = originalHeight;
        editor.style.overflow = originalOverflow;
        editor.scrollTop = scrollPosition;
        isExporting = false;
    });
}

// Apply PDF-specific styling to ensure black text while preserving links
function applyPdfStyling(contentElement) {
    // Create a style element with PDF-specific CSS
    const pdfStyle = document.createElement('style');
    pdfStyle.textContent = `
        /* Reset all text to black except links */
        body, div, p, span, h1, h2, h3, h4, h5, h6, li, ul, ol, td, th {
            color: #000000 !important;
            background-color: transparent !important;
        }
        
        /* Preserve link colors */
        a, a:link, a:visited {
            color: #0000EE !important;
            text-decoration: underline !important;
        }
        
        /* Keep title color as specified */
        h1[style*="color"] {
            color: #2c3e50 !important;
        }
        
        /* Ensure proper contrast */
        * {
            background: transparent !important;
        }
    `;
    
    // Add the style to the content
    contentElement.prepend(pdfStyle);
    
    // Also apply inline styles to all elements except links and title
    const allElements = contentElement.querySelectorAll('*');
    allElements.forEach(element => {
        // Skip links and elements that already have specific color styling
        if (element.tagName !== 'A' && !element.hasAttribute('style')) {
            element.style.color = '#000000';
            element.style.backgroundColor = 'transparent';
        }
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
    } else {
        // Initialize with a placeholder
        editor.innerHTML = '<p>Start typing your document here...</p>';
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
