// Frontend/app.js
const videoInput = document.getElementById('video');
const convertBtn = document.getElementById('convert');
const clearBtn = document.getElementById('clear');
const statusDiv = document.getElementById('status');
const progressText = document.getElementById('progressText');
const progressPercent = document.getElementById('progressPercent');
const progressFill = document.getElementById('progressFill');
const resultsSection = document.getElementById('resultsSection');
const downloadBtn = document.getElementById('downloadBtn');
const uploadArea = document.getElementById('uploadArea');
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const steps = document.querySelectorAll('.step');

// Tab switching with smooth transitions
tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    tabBtns.forEach(b => b.classList.remove('active'));
    tabContents.forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    const tabId = btn.getAttribute('data-tab');
    document.getElementById(tabId).classList.add('active');
  });
});

// Add tooltips for better UX
function addTooltips() {
  const tooltipElements = [
    { selector: '#interval', text: 'Time between frame captures (lower = more frames)' },
    { selector: '#quality', text: 'Higher quality = larger file size but better image quality' },
    { selector: '#ocr', text: 'Extract text from images to make PDF searchable' },
    { selector: '#convert', text: 'Start converting your video to PDF' },
    { selector: '#clear', text: 'Reset all settings and uploaded files' }
  ];

  tooltipElements.forEach(item => {
    const element = document.querySelector(item.selector);
    if (element) {
      element.setAttribute('title', item.text);
    }
  });
}

// Initialize tooltips on load
document.addEventListener('DOMContentLoaded', addTooltips);

// Upload area click and drag/drop
uploadArea.addEventListener('click', () => videoInput.click());
uploadArea.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadArea.classList.add('dragover');
});
uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('dragover'));
uploadArea.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadArea.classList.remove('dragover');
  const files = e.dataTransfer.files;
  if (files.length > 0) {
    videoInput.files = files;
    updateUploadArea();
  }
});

videoInput.addEventListener('change', updateUploadArea);

function updateUploadArea() {
  if (videoInput.files.length > 0) {
    const file = videoInput.files[0];
    uploadArea.innerHTML = `
      <div class="upload-icon"><i class="fas fa-file-video"></i></div>
      <h3>${file.name}</h3>
      <p class="upload-text">${(file.size / 1024 / 1024).toFixed(2)} MB</p>
      <p class="upload-hint">Click to change file</p>
    `;
  }
}

// Clear button
clearBtn.addEventListener('click', () => {
  videoInput.value = '';
  updateUploadArea();
  resetProgress();
  resultsSection.style.display = 'none';
  statusDiv.textContent = 'Idle';
  statusDiv.className = 'status-text';
});

// Reset progress
function resetProgress() {
  progressFill.style.width = '0%';
  progressPercent.textContent = '0%';
  progressText.textContent = 'Ready to convert';
  steps.forEach(step => step.classList.remove('active'));
  document.getElementById('step1').classList.add('active');
}

// Convert button
convertBtn.addEventListener('click', async () => {
  if (!videoInput.files || videoInput.files.length === 0) {
    showStatus('Please select a video file first', 'error');
    return;
  }

  const file = videoInput.files[0];
  const interval = document.getElementById('interval').value || '2';
  const quality = document.getElementById('quality').value;
  const ocr = document.getElementById('ocr').checked;

  const form = new FormData();
  form.append('video', file);
  form.append('interval', interval);
  form.append('quality', quality);
  form.append('ocr', ocr);

  resetProgress();
  showStatus('Uploading video...', 'info');
  convertBtn.disabled = true;
  convertBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

  try {
    updateProgress(10, 'Uploading...');
    document.getElementById('step1').classList.add('active');

    const resp = await fetch('http://localhost:5000/upload', {
      method: 'POST',
      body: form
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ error: 'unknown' }));
      throw new Error(err.error || resp.statusText);
    }

    updateProgress(50, 'Processing video...');
    document.getElementById('step2').classList.add('active');

    // Simulate processing steps
    setTimeout(() => {
      updateProgress(80, 'Generating PDF...');
      document.getElementById('step3').classList.add('active');
    }, 1000);

    const blob = await resp.blob();

    updateProgress(100, 'Complete!');
    document.getElementById('step4').classList.add('active');

    showStatus('Conversion completed successfully!', 'success');
    resultsSection.style.display = 'block';

    // Store blob for download
    downloadBtn.onclick = () => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'bookscan_output.pdf';
      a.click();
      URL.revokeObjectURL(url);
    };

  } catch (e) {
    showStatus('Conversion failed: ' + e.message, 'error');
    resetProgress();
  } finally {
    convertBtn.disabled = false;
    convertBtn.innerHTML = '<i class="fas fa-play"></i> Convert to PDF';
  }
});

function updateProgress(percent, text) {
  progressFill.style.width = percent + '%';
  progressPercent.textContent = percent + '%';
  progressText.textContent = text;
}

function showStatus(message, type = '') {
  statusDiv.textContent = message;
  statusDiv.className = 'status-text';
  if (type) {
    statusDiv.classList.add(type);
  }
}
