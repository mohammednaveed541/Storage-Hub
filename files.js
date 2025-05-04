// files.js

// DOM Elements
const filesGrid = document.getElementById('filesGrid');
const noFilesMessage = document.getElementById('noFilesMessage');
const searchFiles = document.getElementById('searchFiles');
const sortFiles = document.getElementById('sortFiles');
const filePreviewModal = document.getElementById('filePreviewModal');
const previewFileName = document.getElementById('previewFileName');
const filePreviewContainer = document.getElementById('filePreviewContainer');
const downloadFileBtn = document.getElementById('downloadFileBtn');
const shareFileBtn = document.getElementById('shareFileBtn');
const deleteFileBtn = document.getElementById('deleteFileBtn');
const fileTypeFilters = document.querySelectorAll('.files-sidebar li');

// State
let userFiles = [];
let currentFile = null;
let currentUserId = null;

// --- Supabase Auth: Get current user and load files ---
supabase.auth.getUser().then(({ data }) => {
  if (data && data.user) {
    currentUserId = data.user.id;
    loadUserFiles(currentUserId);
  } else {
    showNoFilesMessage('Please login to view your files');
  }
});

// --- Load files from Supabase Storage ---
async function loadUserFiles(userId) {
  // List files from user's folder in 'useruploads' bucket
  const { data, error } = await supabase.storage.from('useruploads').list(`${userId}/`);
  if (error || !data || data.length === 0) {
    showNoFilesMessage('No files found. Upload some files to get started!');
    return;
  }
  noFilesMessage.style.display = 'none';
  filesGrid.innerHTML = '';
  userFiles = data.map(fileObj => ({
    name: fileObj.name,
    size: fileObj.metadata ? fileObj.metadata.size : 0,
    type: getFileMimeType(fileObj.name),
    uploadedAt: fileObj.created_at || new Date().toISOString(),
  }));
  userFiles.forEach(createFileCard);
}

// --- Show no files message ---
function showNoFilesMessage(message) {
  if (noFilesMessage) {
    noFilesMessage.querySelector('p').textContent = message;
    noFilesMessage.style.display = 'flex';
    filesGrid.innerHTML = '';
  }
}

// --- Helper: Get MIME type by extension ---
function getFileMimeType(fileName) {
  const ext = fileName.split('.').pop().toLowerCase();
  if (['jpg','jpeg','png','gif','bmp','webp'].includes(ext)) return 'image/' + ext;
  if (['mp4','mov','avi','webm','mkv'].includes(ext)) return 'video/' + ext;
  if (['mp3','wav','ogg','aac'].includes(ext)) return 'audio/' + ext;
  if (['pdf'].includes(ext)) return 'application/pdf';
  if (['doc','docx'].includes(ext)) return 'application/msword';
  if (['ppt','pptx'].includes(ext)) return 'application/vnd.ms-powerpoint';
  if (['xls','xlsx'].includes(ext)) return 'application/vnd.ms-excel';
  if (['zip','rar','7z','tar','gz'].includes(ext)) return 'application/zip';
  return 'application/octet-stream';
}

// --- Helper: Get file category for filtering ---
function getFileCategory(fileName) {
  const ext = fileName.split('.').pop().toLowerCase();
  if (['jpg','jpeg','png','gif','bmp','webp'].includes(ext)) return 'image';
  if (['mp4','mov','avi','webm','mkv'].includes(ext)) return 'video';
  if (['mp3','wav','ogg','aac'].includes(ext)) return 'audio';
  if (['pdf','doc','docx','txt','ppt','pptx','xls','xlsx'].includes(ext)) return 'document';
  if (['zip','rar','7z','tar','gz'].includes(ext)) return 'archive';
  return 'other';
}

// --- Format file size ---
function formatFileSize(size) {
  if (!size) return '';
  if (size < 1024) return size + ' B';
  if (size < 1024 * 1024) return (size / 1024).toFixed(1) + ' KB';
  return (size / (1024 * 1024)).toFixed(1) + ' MB';
}

// --- Create file card with icons and actions ---
function createFileCard(fileData) {
  const fileCard = document.createElement('div');
  fileCard.className = 'file-card';
  fileCard.setAttribute('data-category', getFileCategory(fileData.name));

  // Choose icon
  let fileIcon = 'fa-file';
  if (fileData.type.startsWith('image/')) fileIcon = 'fa-file-image';
  else if (fileData.type.startsWith('video/')) fileIcon = 'fa-file-video';
  else if (fileData.type.startsWith('audio/')) fileIcon = 'fa-file-audio';
  else if (fileData.type.includes('pdf')) fileIcon = 'fa-file-pdf';
  else if (fileData.type.includes('zip') || fileData.type.includes('rar')) fileIcon = 'fa-file-archive';

  fileCard.innerHTML = `
    <div class="file-icon"><i class="fas ${fileIcon}"></i></div>
    <div class="file-info">
      <div class="file-name">${fileData.name}</div>
      <div class="file-size">${formatFileSize(fileData.size)}</div>
    </div>
    <div class="file-actions">
      <button class="preview-btn" title="Preview"><i class="fas fa-eye"></i></button>
      <button class="download-btn" title="Download"><i class="fas fa-download"></i></button>
      <button class="share-btn" title="Share"><i class="fas fa-share-alt"></i></button>
      <button class="delete-btn" title="Delete"><i class="fas fa-trash"></i></button>
    </div>
  `;

  // Action handlers
  fileCard.querySelector('.preview-btn').onclick = () => previewFile(fileData);
  fileCard.querySelector('.download-btn').onclick = () => downloadFile(fileData);
  fileCard.querySelector('.share-btn').onclick = () => shareFile(fileData);
  fileCard.querySelector('.delete-btn').onclick = () => deleteFile(fileData, fileCard);

  filesGrid.appendChild(fileCard);
}

// --- Preview file (show modal) ---
function previewFile(fileData) {
  previewFileName.textContent = fileData.name;
  // Get public URL for preview
  const { data } = supabase.storage.from('useruploads').getPublicUrl(`${currentUserId}/${fileData.name}`);
  filePreviewContainer.innerHTML = `<a href="${data.publicUrl}" target="_blank">Open Preview</a>`;
  filePreviewModal.style.display = 'block';
  currentFile = fileData;
}

// --- Download file ---
async function downloadFile(fileData) {
  const { data } = await supabase.storage.from('useruploads').createSignedUrl(`${currentUserId}/${fileData.name}`, 60);
  window.open(data.signedUrl, '_blank');
}

// --- Share file ---
async function shareFile(fileData) {
  const { data } = supabase.storage.from('useruploads').getPublicUrl(`${currentUserId}/${fileData.name}`);
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(data.publicUrl);
    alert('Shareable link copied to clipboard!');
  } else {
    prompt('Copy this link to share:', data.publicUrl);
  }
}

// --- Delete file ---
async function deleteFile(fileData, fileCard) {
  if (!confirm('Delete this file?')) return;
  const { error } = await supabase.storage.from('useruploads').remove([`${currentUserId}/${fileData.name}`]);
  if (!error) fileCard.remove();
  else alert('Could not delete file.');
}

// --- Modal close handler ---
if (filePreviewModal) filePreviewModal.querySelector('.close').onclick = () => {
  filePreviewModal.style.display = 'none';
};

// --- Sidebar filtering ---
document.querySelectorAll('.files-sidebar li').forEach((li) => {
  li.addEventListener('click', () => {
    document.querySelectorAll('.files-sidebar li').forEach(el => el.classList.remove('active'));
    li.classList.add('active');
    let filter = li.textContent.trim().toLowerCase();
    let cards = document.querySelectorAll('.file-card');
    cards.forEach(card => card.style.display = 'flex');
    if (filter === 'all files') return;
    let cat = '';
    if (filter === 'images') cat = 'image';
    else if (filter === 'documents') cat = 'document';
    else if (filter === 'videos') cat = 'video';
    else if (filter === 'audio') cat = 'audio';
    else if (filter === 'archives') cat = 'archive';
    cards.forEach(card => {
      if (card.getAttribute('data-category') !== cat) card.style.display = 'none';
    });
  });
});
