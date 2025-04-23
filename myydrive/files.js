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

// Current user files
let userFiles = [];
let currentFile = null;

// Check if user is logged in
auth.onAuthStateChanged(user => {
    if (user) {
        // User is signed in, load their files
        loadUserFiles(user.uid);
    } else {
        // User is signed out, show message
        showNoFilesMessage('Please login to view your files');
    }
});

// Load user files from Firestore
function loadUserFiles(userId) {
    firestore.collection('files')
        .where('userId', '==', userId)
        .orderBy('uploadedAt', 'desc')
        .get()
        .then((querySnapshot) => {
            if (querySnapshot.empty) {
                showNoFilesMessage('No files found. Upload some files to get started!');
                return;
            }
            
            // Hide no files message
            noFilesMessage.style.display = 'none';
            
            // Clear files grid
            filesGrid.innerHTML = '';
            
            // Store files data
            userFiles = [];
            
            querySnapshot.forEach((doc) => {
                const fileData = {
                    id: doc.id,
                    ...doc.data()
                };
                
                userFiles.push(fileData);
                createFileCard(fileData);
            });
        })
        .catch((error) => {
            console.error('Error loading files:', error);
            showNoFilesMessage('Error loading files. Please try again later.');
        });
}

// Show no files message
function showNoFilesMessage(message) {
    noFilesMessage.querySelector('p').textContent = message;
    noFilesMessage.style.display = 'block';
    filesGrid.innerHTML = '';
}

// Create file card
function createFileCard(fileData) {
    const fileCard = document.createElement('div');
    fileCard.className = 'file-card';
    fileCard.setAttribute('data-id', fileData.id);
    
    // Get file icon based on type
    let fileIcon = 'fa-file';
    if (fileData.type.startsWith('image/')) {
        fileIcon = 'fa-file-image';
    } else if (fileData.type.startsWith('video/')) {
        fileIcon = 'fa-file-video';
    } else if (fileData.type.startsWith('audio/')) {
        fileIcon = 'fa-file-audio';
    } else if (fileData.type.includes('pdf')) {
        fileIcon = 'fa-file-pdf';
    } else if (fileData.type.includes('zip') || fileData.type.includes('rar')) {
        fileIcon = 'fa-file-archive';
    }
    
    // Format file size
    const fileSize = formatFileSize(fileData.size);
    
    // Format date
    const uploadDate = new Date(fileData.uploadedAt.toDate()).toLocaleDateString();
    
    fileCard.innerHTML = `
        <i class="fas ${fileIcon}"></i>
        <div class="file-name">${fileData.name}</div>
        <div class="file-info">${fileSize} • ${uploadDate}</div>
    `;
    
    // Open file preview on click
    fileCard.addEventListener('click', () => {
        openFilePreview(fileData);
    });
    
    filesGrid.appendChild(fileCard);
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Open file preview
function openFilePreview(fileData) {
    currentFile = fileData;
    previewFileName.textContent = fileData.name;
    
    // Clear previous preview
    filePreviewContainer.innerHTML = '';
    
    // Create preview based on file type
    if (fileData.type.startsWith('image/')) {
        const img = document.createElement('img');
        img.src = fileData.downloadURL;
        img.alt = fileData.name;
        filePreviewContainer.appendChild(img);
    } else if (fileData.type.startsWith('video/')) {
        const video = document.createElement('video');
        video.src = fileData.downloadURL;
        video.controls = true;
        filePreviewContainer.appendChild(video);
    } else if (fileData.type.startsWith('audio/')) {
        const audio = document.createElement('audio');
        audio.src = fileData.downloadURL;
        audio.controls = true;
        filePreviewContainer.appendChild(audio);
    } else {
        // Generic file preview
        const fileIcon = document.createElement('i');
        fileIcon.className = 'fas fa-file';
        fileIcon.style.fontSize = '100px';
        fileIcon.style.color = 'var(--primary-neon)';
        
        const fileInfo = document.createElement('p');
        fileInfo.textContent = `${fileData.name} (${formatFileSize(fileData.size)})`;
        fileInfo.style.marginTop = '20px';
        
        filePreviewContainer.appendChild(fileIcon);
        filePreviewContainer.appendChild(fileInfo);
    }
    
    // Show modal
    filePreviewModal.style.display = 'block';
}

// Close file preview
document.querySelector('#filePreviewModal .close').addEventListener('click', () => {
    filePreviewModal.style.display = 'none';
});

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === filePreviewModal) {
        filePreviewModal.style.display = 'none';
    }
});

// Download file
downloadFileBtn.addEventListener('click', () => {
    if (currentFile) {
        // Create a temporary link and trigger download
        const a = document.createElement('a');
        a.href = currentFile.downloadURL;
        a.download = currentFile.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
});

// Share file
shareFileBtn.addEventListener('click', () => {
    if (currentFile) {
        // Copy download URL to clipboard
        navigator.clipboard.writeText(currentFile.downloadURL)
            .then(() => {
                alert('Download link copied to clipboard!');
            })
            .catch((error) => {
                console.error('Error copying to clipboard:', error);
            });
    }
});

// Delete file
deleteFileBtn.addEventListener('click', () => {
    if (currentFile && confirm('Are you sure you want to delete this file?')) {
        // Delete from Storage
        storage.ref(currentFile.path).delete()
            .then(() => {
                // Delete from Firestore
                return firestore.collection('files').doc(currentFile.id).delete();
            })
            .then(() => {
                // Close modal
                filePreviewModal.style.display = 'none';
                
                // Remove from UI
                const fileCard = document.querySelector(`.file-card[data-id="${currentFile.id}"]`);
                if (fileCard) {
                    fileCard.remove();
                }
                
                // Remove from array
                userFiles = userFiles.filter(file => file.id !== currentFile.id);
                
                // Show message if no files left
                if (userFiles.length === 0) {
                    showNoFilesMessage('No files found. Upload some files to get started!');
                }
                
                alert('File deleted successfully!');
            })
            .catch((error) => {
                console.error('Error deleting file:', error);
                alert('Error deleting file. Please try again.');
            });
    }
});

// Search files
searchFiles.addEventListener('input', () => {
    const searchTerm = searchFiles.value.toLowerCase();
    
    if (searchTerm === '') {
        // Show all files
        displayFilteredFiles(userFiles);
        return;
    }
    
    // Filter files by name
    const filteredFiles = userFiles.filter(file => 
        file.name.toLowerCase().includes(searchTerm)
    );
    
    displayFilteredFiles(filteredFiles);
});

// Sort files
sortFiles.addEventListener('change', () => {
    const sortBy = sortFiles.value;
    let sortedFiles = [...userFiles];
    
    switch (sortBy) {
        case 'newest':
            sortedFiles.sort((a, b) => b.uploadedAt.toDate() - a.uploadedAt.toDate());
            break;
        case 'oldest':
            sortedFiles.sort((a, b) => a.uploadedAt.toDate() - b.uploadedAt.toDate());
            break;
        case 'name':
            sortedFiles.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'size':
            sortedFiles.sort((a, b) => b.size - a.size);
            break;
    }
    
    displayFilteredFiles(sortedFiles);
});

// File type filters
fileTypeFilters.forEach(filter => {
    filter.addEventListener('click', () => {
        // Remove active class from all filters
        fileTypeFilters.forEach(f => f.classList.remove('active'));
        
        // Add active class to clicked filter
        filter.classList.add('active');
        
        const filterText = filter.textContent.trim();
        
        if (filterText === 'All Files') {
            // Show all files
            displayFilteredFiles(userFiles);
            return;
        }
        
        // Filter files by type
        let filteredFiles;
        
        switch (filterText) {
            case 'Images':
                filteredFiles = userFiles.filter(file => file.type.startsWith('image/'));
                break;
            case 'Documents':
                filteredFiles = userFiles.filter(file => 
                    file.type.includes('pdf') || 
                    file.type.includes('doc') || 
                    file.type.includes('txt') || 
                    file.type.includes('xls')
                );
                break;
            case 'Videos':
                filteredFiles = userFiles.filter(file => file.type.startsWith('video/'));
                break;
            case 'Audio':
                filteredFiles = userFiles.filter(file => file.type.startsWith('audio/'));
                break;
            case 'Archives':
                filteredFiles = userFiles.filter(file => 
                    file.type.includes('zip') || 
                    file.type.includes('rar') || 
                    file.type.includes('tar')
                );
                break;
            default:
                filteredFiles = userFiles;
        }
        
        displayFilteredFiles(filteredFiles);
    });
});

// Display filtered files
function displayFilteredFiles(files) {
    // Clear files grid
    filesGrid.innerHTML = '';
    
    if (files.length === 0) {
        showNoFilesMessage('No matching files found.');
        return;
    }
    
    // Hide no files message
    noFilesMessage.style.display = 'none';
    
    // Create file cards
    files.forEach(file => {
        createFileCard(file);
    });
}