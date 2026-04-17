const formatdoc = (cmd,value=false)=>{
    if(value){
        document.execCommand(cmd,false,value);
    }else{
        document.execCommand(cmd);
    }
};

const handleLink = () =>{
    const url = prompt("Enter the link URL:");
    formatdoc('createLink',url);
}

const copyAllContent = async () => {
    const textToCopy = content.innerText || content.textContent || '';
    
    if (!textToCopy.trim()) {
        showCopyFeedback('Nothing to copy', 'warning');
        return;
    }
    
    try {
        await navigator.clipboard.writeText(textToCopy);
        showCopyFeedback('Copied to clipboard!', 'success');
    } catch (err) {
        // Fallback for older browsers
        try {
            const textArea = document.createElement('textarea');
            textArea.value = textToCopy;
            textArea.style.position = 'fixed';
            textArea.style.opacity = '0';
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            showCopyFeedback('Copied to clipboard!', 'success');
        } catch (fallbackErr) {
            showCopyFeedback('Failed to copy', 'error');
        }
    }
};

const showCopyFeedback = (message, type) => {
    // Create feedback element
    const feedback = document.createElement('div');
    feedback.className = `copy-feedback copy-feedback-${type}`;
    feedback.textContent = message;
    
    // Style the feedback
    Object.assign(feedback.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '12px 20px',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '500',
        zIndex: '1000',
        opacity: '0',
        transform: 'translateY(-10px)',
        transition: 'all 0.3s ease'
    });
    
    // Set color based on type
    switch(type) {
        case 'success':
            feedback.style.background = '#4a90e2';
            feedback.style.color = 'white';
            break;
        case 'error':
            feedback.style.background = '#e74c3c';
            feedback.style.color = 'white';
            break;
        case 'warning':
            feedback.style.background = '#f39c12';
            feedback.style.color = 'white';
            break;
    }
    
    // Add to page and animate
    document.body.appendChild(feedback);
    
    // Trigger animation
    setTimeout(() => {
        feedback.style.opacity = '1';
        feedback.style.transform = 'translateY(0)';
    }, 10);
    
    // Remove after delay
    setTimeout(() => {
        feedback.style.opacity = '0';
        feedback.style.transform = 'translateY(-10px)';
        setTimeout(() => {
            if (document.body.contains(feedback)) {
                document.body.removeChild(feedback);
            }
        }, 300);
    }, 2000);
};

const resetAll = () => {
    const confirmReset = confirm('Are you sure you want to clear everything? This will:\n\n• Clear all content\n• Reset filename\n• Clear saved data\n• Reset all formatting\n\nThis action cannot be undone.');
    
    if (!confirmReset) return;
    
    try {
        // Clear editor content
        content.innerHTML = '';
        content.focus();
        
        // Reset filename
        fileName.value = 'File Name';
        
        // Clear all localStorage data
        localStorage.removeItem('editorContent');
        localStorage.removeItem('editorFileName');
        
        // Reset code view if active
        if (active) {
            active = false;
            showcode.dataset.active = active;
            content.setAttribute('contenteditable', 'true');
        }
        
        // Reset all formatting by removing all formatting commands
        try {
            document.execCommand('removeFormat', false, null);
            document.execCommand('unlink', false, null);
        } catch (e) {
            // Some commands might not be available, ignore errors
        }
        
        // Update word and character counts
        updateWordCharCount();
        
        // Reset auto-save status
        saveStatus.textContent = 'Saved automatically';
        saveStatus.style.opacity = '0.7';
        
        // Show success feedback
        showCopyFeedback('All content cleared successfully!', 'success');
        
        // Clear any existing selection
        const selection = window.getSelection();
        if (selection) {
            selection.removeAllRanges();
        }
        
    } catch (error) {
        showCopyFeedback('Error clearing content', 'error');
        console.error('Reset error:', error);
    }
};

const content = document.getElementById('content');

content.addEventListener('mouseenter',()=>{
    let anchors = content.querySelectorAll('a');
    anchors.forEach(anchor=>{
        anchor.addEventListener('mouseenter',()=>{
            anchor.setAttribute('target','_blank');
            content.setAttribute('contenteditable',false);
        })
        anchor.addEventListener('mouseleave',()=>{
            content.setAttribute('contenteditable',true);
        })
    })
})

let fileName=document.getElementById('filename');
let isExporting = false; // Flag to prevent double triggers

function handeFileExport(value){
      // Prevent double execution
      if (isExporting) return;
      isExporting = true;
      
      const fileSelect = document.getElementById('fileExport');
      
      if(value==='new'){
        content.innerHTML='';
        fileName.value='File Name';
      } else if(value==='pdf'){
        const pdfFileName = prompt('Enter filename for PDF:', fileName.value || 'document');
        if (pdfFileName) {
          html2pdf(content).save(pdfFileName);
        }
      } else if(value==='txt'){
        const txtFileName = prompt('Enter filename for TXT:', fileName.value || 'document');
        if (txtFileName) {
          const extractedText=content.innerText;
          const blob = new Blob([extractedText]);
          const url = URL.createObjectURL(blob);
          const a =document.createElement('a');
          a.href = url;
          a.download = txtFileName+'.txt';
          a.click();
        }
      }else if(value === 'html'){
          const htmlContent = content.innerHTML;
          const blob = new Blob([htmlContent], { type: 'text/html' });
          const url = URL.createObjectURL(blob);

          const a = document.createElement('a');
          a.href = url;
          a.download = fileName.value + '.html';
          a.click();
      }

      
      // Reset flag and select after a short delay
      setTimeout(() => {
        fileSelect.selectedIndex = 0;
        isExporting = false;
      }, 100);
}

// Word and character counting
const wordCountElement = document.getElementById('wordCount');
const charCountElement = document.getElementById('charCount');

const updateWordCharCount = () => {
    const text = content.innerText || content.textContent || '';
    const charCount = text.length;
    
    // Count words (split by whitespace, filter out empty strings)
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    const wordCount = text.trim() === '' ? 0 : words.length;
    
    wordCountElement.textContent = wordCount;
    charCountElement.textContent = charCount;
};

// Auto-save functionality
let saveTimeout;
const saveStatus = document.querySelector('.save-status');

const autoSave = () => {
    clearTimeout(saveTimeout);
    saveStatus.textContent = 'Saving...';
    saveStatus.style.opacity = '1';
    
    saveTimeout = setTimeout(() => {
        const editorContent = content.innerHTML;
        const editorFileName = fileName.value;
        
        localStorage.setItem('editorContent', editorContent);
        localStorage.setItem('editorFileName', editorFileName);
        
        saveStatus.textContent = 'Saved automatically';
        setTimeout(() => {
            saveStatus.style.opacity = '0.7';
        }, 1000);
    }, 1000);
};

const loadSavedContent = () => {
    const savedContent = localStorage.getItem('editorContent');
    const savedFileName = localStorage.getItem('editorFileName');
    
    if (savedContent) {
        content.innerHTML = savedContent;
    }
    if (savedFileName) {
        fileName.value = savedFileName;
    }
    
    // Update counts after loading content
    updateWordCharCount();
};

// Update counts on content changes
const updateCountsAndSave = () => {
    updateWordCharCount();
    autoSave();
};

// Add event listeners for both auto-save and count updates
content.addEventListener('input', updateCountsAndSave);
content.addEventListener('paste', updateCountsAndSave);
content.addEventListener('cut', updateCountsAndSave);
fileName.addEventListener('input', autoSave);

// Load saved content on page load
document.addEventListener('DOMContentLoaded', loadSavedContent);

let active = false;
let showcode = document.getElementById('showcode');
showcode.addEventListener('click',()=>{
    active = !active;
    showcode.dataset.active = active;
    if(active){
        content.innerText=content.innerHTML;
        content.setAttribute('contenteditable','false');
    }else{
        content.innerHTML=content.innerText;
        content.setAttribute('contenteditable','true');  
    }
})