// ====== DOM ELEMENTS ======
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

const BACKEND_URL = "https://bookscan-ai-backend-6.onrender.com/upload";


// ====== TAB SWITCHING ======
tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    tabBtns.forEach(b => b.classList.remove('active'));
    tabContents.forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    const tabId = btn.getAttribute('data-tab');
    document.getElementById(tabId).classList.add('active');
  });
});


// ====== TOOLTIP SETUP ======
function addTooltips() {
  const tooltipElements = [
    { selector: '#interval', text: 'Time between frame captures (lower = more frames)' },
    { selector: '#quality', text: 'Higher quality = larger file size' },
    { selector: '#convert', text: 'Start converting your video to PDF' },
    { selector: '#clear', text: 'Reset everything' }
  ];

  tooltipElements.forEach(item => {
    const element = document.querySelector(item.selector);
    if (element) element.setAttribute('title', item.text);
  });
}
document.addEventListener('DOMContentLoaded', addTooltips);


// ====== DRAG & DROP UPLOAD ======
uploadArea.addEventListener('click', () => videoInput.click());
uploadArea.addEventListener('dragover', e => {
  e.preventDefault();
  uploadArea.classList.add('dragover');
});
uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('dragover'));
uploadArea.addEventListener('drop', e => {
  e.preventDefault();
  uploadArea.classList.remove('dragover');
  if (e.dataTransfer.files.length > 0) {
    videoInput.files = e.dataTransfer.files;
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
      <p class="upload-hint">Click to change</p>
    `;
  }
}


// ====== RESET BUTTON ======
clearBtn.addEventListener('click', () => {
  videoInput.value = '';
  updateUploadArea();
  resetProgress();
  resultsSection.style.display = 'none';
  showStatus("Idle");
});


// ====== PROGRESS RESET ======
function resetProgress() {
  progressFill.style.width = "0%";
  progressPercent.textContent = "0%";
  progressText.textContent = "Ready";
  steps.forEach(step => step.classList.remove('active'));
  document.getElementById('step1').classList.add('active');
}


// ====== CONVERT BUTTON ======
convertBtn.addEventListener('click', async () => {
  if (!videoInput.files || videoInput.files.length === 0) {
    showStatus("Please select a video file first", "error");
    return;
  }

  const file = videoInput.files[0];
  const interval = document.getElementById('interval').value || "2";

  const form = new FormData();
  form.append("video", file);
  form.append("interval", interval);

  // UI lock
  convertBtn.disabled = true;
  convertBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
  resetProgress();
  showStatus("Uploading video...", "info");

  try {
    updateProgress(10, "Uploading...");
    document.getElementById('step1').classList.add('active');

    // ====== SENDING TO BACKEND ======
    const resp = await fetch(BACKEND_URL, {
      method: "POST",
      body: form
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(err.error || resp.statusText);
    }

    updateProgress(50, "Processing video...");
    document.getElementById('step2').classList.add('active');

    // Fake delay for animation
    setTimeout(() => {
      updateProgress(80, "Generating PDF...");
      document.getElementById('step3').classList.add('active');
    }, 800);

    const pdfBlob = await resp.blob();

    updateProgress(100, "Done!");
    document.getElementById('step4').classList.add('active');
    showStatus("Conversion completed successfully!", "success");

    resultsSection.style.display = 'block';

    // ====== DOWNLOAD BUTTON ======
    downloadBtn.onclick = () => {
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "bookscan_output.pdf";
      a.click();
      URL.revokeObjectURL(url);
    };

  } catch (err) {
    showStatus("Conversion failed: " + err.message, "error");
    resetProgress();
  } finally {
    convertBtn.disabled = false;
    convertBtn.innerHTML = '<i class="fas fa-play"></i> Convert to PDF';
  }
});


// ====== PROGRESS BAR ======
function updateProgress(percent, text) {
  progressFill.style.width = percent + "%";
  progressPercent.textContent = percent + "%";
  progressText.textContent = text;
}


// ====== STATUS DISPLAY ======
function showStatus(msg, type = "") {
  statusDiv.textContent = msg;
  statusDiv.className = "status-text";
  if (type) statusDiv.classList.add(type);
}
