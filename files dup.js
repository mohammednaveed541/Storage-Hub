// files.js

const filesGrid = document.getElementById('filesGrid');
const noFilesMessage = document.getElementById('noFilesMessage');
const filePreviewModal = document.getElementById('filePreviewModal');
const previewFileName = document.getElementById('previewFileName');
const filePreviewContainer = document.getElementById('filePreviewContainer');
const downloadFileBtn = document.getElementById('downloadFileBtn');
const shareFileBtn = document.getElementById('shareFileBtn');
const deleteFileBtn = document.getElementById('deleteFileBtn');

let userFiles = [];
let currentFile = null;

// On load, fetch files
window.supabase.auth.getUser().then(async ({ data }) => {
  if (data && data.user) {
    loadUserFiles(data.user.id);
  } else {
    showNoFilesMessage('Please login to view your files');
  }
});

async function loadUserFiles(userId) {
  const { data, error } = await supabase.storage.from('useruploads').list(`${userId}/`);
  if (error || !data || data.length === 0) {
    showNoFilesMessage('No files found. Upload some files to get started!');
    return;
  }
  noFilesMessage.style.display = 'none';
  filesGrid.innerHTML = '';
  userFiles = data;
  data.forEach(fileData => createFileCard(fileData, userId));
}

function showNoFilesMessage(message) {
  if (noFilesMessage) {
    noFilesMessage.querySelector('p').textContent = message;
    noFilesMessage.style.display = 'block';
    filesGrid.innerHTML = '';
  }
}

function createFileCard(fileData, userId) {
  const fileCard = document.createElement('div');
  fileCard.className = 'file-card';
  // File icon logic
  let fileIcon = 'fa-file';
  if (fileData.name.match(/\.(jpg|jpeg|png|gif)$/i)) fileIcon = 'fa-file-image';
  else if (fileData.name.match(/\.(mp4|mov|avi)$/i)) fileIcon = 'fa-file-video';
  else if (fileData.name.match(/\.(mp3|wav)$/i)) fileIcon = 'fa-file-audio';
  else if (fileData.name.match(/\.pdf$/i)) fileIcon = 'fa-file-pdf';
  else if (fileData.name.match(/\.(zip|rar)$/i)) fileIcon = 'fa-file-archive';

  fileCard.innerHTML = `
    <div class="file-icon"><i class="fas ${fileIcon}"></i></div>
    <div class="file-info">
      <div class="file-name">${fileData.name}</div>
      <div class="file-size">${formatFileSize(fileData.metadata?.size || 0)}</div>
    </div>
    <div class="file-actions">
      <button class="preview-btn" title="Preview"><i class="fas fa-eye"></i></button>
      <button class="download-btn" title="Download"><i class="fas fa-download"></i></button>
      <button class="share-btn" title="Share"><i class="fas fa-share-alt"></i></button>
      <button class="delete-btn" title="Delete"><i class="fas fa-trash"></i></button>
    </div>
  `;
  filesGrid.appendChild(fileCard);

  // Actions
  fileCard.querySelector('.preview-btn').onclick = () => previewFile(userId, fileData.name);
  fileCard.querySelector('.download-btn').onclick = () => downloadFile(userId, fileData.name);
  fileCard.querySelector('.share-btn').onclick = () => shareFile(userId, fileData.name);
  fileCard.querySelector('.delete-btn').onclick = () => deleteFile(userId, fileData.name, fileCard);
}

function formatFileSize(size) {
  if (size < 1024) return size + ' B';
  if (size < 1024 * 1024) return (size / 1024).toFixed(1) + ' KB';
  return (size / (1024 * 1024)).toFixed(1) + ' MB';
}

async function previewFile(userId, fileName) {
  const { data } = supabase.storage.from('useruploads').getPublicUrl(`${userId}/${fileName}`);
  previewFileName.textContent = fileName;
  filePreviewContainer.innerHTML = `<a href="${data.publicUrl}" target="_blank">Open Preview</a>`;
  filePreviewModal.style.display = 'block';
  currentFile = { userId, fileName };
}
async function downloadFile(userId, fileName) {
  const { data } = supabase.storage.from('useruploads').createSignedUrl(`${userId}/${fileName}`, 60);
  window.open(data.signedUrl, '_blank');
}
async function shareFile(userId, fileName) {
  const { data } = supabase.storage.from('useruploads').getPublicUrl(`${userId}/${fileName}`);
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(data.publicUrl);
    alert('Shareable link copied to clipboard!');
  } else {
    prompt('Copy this link to share:', data.publicUrl);
  }
}
async function deleteFile(userId, fileName, fileCard) {
  if (!confirm('Delete this file?')) return;
  const { error } = await supabase.storage.from('useruploads').remove([`${userId}/${fileName}`]);
  if (!error) fileCard.remove();
  else alert('Could not delete file.');
}

// Modal close
if (filePreviewModal) filePreviewModal.querySelector('.close').onclick = () => {
  filePreviewModal.style.display = 'none';
};
