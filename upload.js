// upload.js

// DOM Elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const fileList = document.getElementById('fileList');
const startUploadBtn = document.getElementById('startUploadBtn');
const uploadProgress = document.getElementById('uploadProgress');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');

let filesToUpload = [];

uploadArea.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadArea.classList.add('dragover');
});
uploadArea.addEventListener('dragleave', () => {
  uploadArea.classList.remove('dragover');
});
uploadArea.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadArea.classList.remove('dragover');
  if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
});
fileInput.addEventListener('change', () => {
  if (fileInput.files.length > 0) handleFiles(fileInput.files);
});

function handleFiles(files) {
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (!filesToUpload.some(f => f.name === file.name && f.size === file.size)) {
      filesToUpload.push(file);
      addFileToList(file);
    }
  }
}

function addFileToList(file) {
  const li = document.createElement('li');
  li.textContent = `${file.name} (${formatFileSize(file.size)})`;
  fileList.appendChild(li);
}

function formatFileSize(size) {
  if (size < 1024) return size + ' B';
  if (size < 1024 * 1024) return (size / 1024).toFixed(1) + ' KB';
  return (size / (1024 * 1024)).toFixed(1) + ' MB';
}

// Upload logic
if (startUploadBtn) startUploadBtn.addEventListener('click', async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    alert("You must be logged in to upload files.");
    return;
  }
  if (filesToUpload.length === 0) {
    alert("Please select files to upload.");
    return;
  }
  uploadProgress.style.display = 'block';
  let uploaded = 0;
  for (const file of filesToUpload) {
    const { error } = await supabase.storage
      .from('useruploads')
      .upload(`${user.id}/${file.name}`, file, { upsert: true });
    uploaded++;
    progressBar.style.width = `${(uploaded / filesToUpload.length) * 100}%`;
    progressText.textContent = `${uploaded} / ${filesToUpload.length}`;
    if (error) alert(`Error uploading ${file.name}: ${error.message}`);
  }
  alert('Upload complete!');
  filesToUpload = [];
  fileList.innerHTML = '';
  uploadProgress.style.display = 'none';
});
