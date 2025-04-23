// DOM Elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const fileList = document.getElementById('fileList');
const startUploadBtn = document.getElementById('startUploadBtn');
const uploadProgress = document.getElementById('uploadProgress');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');

// File queue
let filesToUpload = [];

// Drag and drop functionality
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = 'var(--primary-neon)';
    uploadArea.style.boxShadow = '0 0 15px var(--primary-neon)';
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.style.borderColor = 'rgba(0, 255, 221, 0.5)';
    uploadArea.style.boxShadow = 'none';
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = 'rgba(0, 255, 221, 0.5)';
    uploadArea.style.boxShadow = 'none';
    
    if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
    }
});

// File input change
fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) {
        handleFiles(fileInput.files);
    }
});

// Handle selected files
function handleFiles(files) {
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Check if file is already in the queue
        if (!filesToUpload.some(f => f.name === file.name && f.size === file.size)) {
            filesToUpload.push(file);
            addFileToList(file);
        }
    }
}

// Add file to the list
function addFileToList(file) {
    const li = document.createElement('li');
    
    // Get file icon based on type
    let fileIcon = 'fa-file';
    if (file.type.startsWith('image/')) {
        fileIcon = 'fa-file-image';
    } else if (file.type.startsWith('video/')) {
        fileIcon = 'fa-file-video';
    } else if (file.type.startsWith('audio/')) {
        fileIcon = 'fa-file-audio';
    } else if (file.type.includes('pdf')) {
        fileIcon = 'fa-file-pdf';
    } else if (file.type.includes('zip') || file.type.includes('rar')) {
        fileIcon = 'fa-file-archive';
    }
    
    // Format file size
    const fileSize = formatFileSize(file.size);
    
    li.innerHTML = `
        <div class="file-info">
            <i class="fas ${fileIcon} file-icon"></i>
            <span class="file-name">${file.name}</span>
            <span class="file-size">${fileSize}</span>
        </div>
        <i class="fas fa-times remove-file" data-filename="${file.name}"></i>
    `;
    
    fileList.appendChild(li);
    
    // Remove file event
    const removeBtn = li.querySelector('.remove-file');
    removeBtn.addEventListener('click', () => {
        const fileName = removeBtn.getAttribute('data-filename');
        filesToUpload = filesToUpload.filter(f => f.name !== fileName);
        li.remove();
    });
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Start upload
startUploadBtn.addEventListener('click', () => {
    const user = auth.currentUser;
    
    if (!user) {
        alert('Please login to upload files');
        loginModal.style.display = 'block';
        return;
    }
    
    if (filesToUpload.length === 0) {
        alert('Please select files to upload');
        return;
    }
    
    uploadFiles(user.uid);
});

// Upload files to Firebase Storage
async function uploadFiles(userId) {
    // Show progress container
    uploadProgress.style.display = 'block';
    
    // Total bytes to upload
    const totalBytes = filesToUpload.reduce((total, file) => total + file.size, 0);
    let uploadedBytes = 0;
    
    for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        const fileRef = storage.ref(`users/${userId}/${file.name}`);
        
        // Create upload task
        const uploadTask = fileRef.put(file);
        
        // Listen for state changes
        uploadTask.on('state_changed', 
            (snapshot) => {
                // Get task progress
                const progress = snapshot.bytesTransferred;
                
                // Update total uploaded bytes
                uploadedBytes = filesToUpload.slice(0, i).reduce((total, file) => total + file.size, 0) + progress;
                
                // Calculate percentage
                const percentage = Math.round((uploadedBytes / totalBytes) * 100);
                
                // Update progress bar
                progressBar.style.width = percentage + '%';
                progressText.textContent = percentage + '%';
            },
            (error) => {
                // Handle error
                console.error('Upload error:', error);
                alert(`Error uploading ${file.name}: ${error.message}`);
            }
        );
        
        try {
            // Wait for upload to complete
            await uploadTask;
            
            // Get download URL
            const downloadURL = await fileRef.getDownloadURL();
            
            // Save file metadata to Firestore
            await firestore.collection('files').add({
                userId: userId,
                name: file.name,
                type: file.type,
                size: file.size,
                path: `users/${userId}/${file.name}`,
                downloadURL: downloadURL,
                uploadedAt: new Date()
            });
            
        } catch (error) {
            console.error('Error saving file metadata:', error);
        }
    }
    
    // Reset file queue
    filesToUpload = [];
    fileList.innerHTML = '';
    
    // Show success message
    alert('Files uploaded successfully!');
    
    // Redirect to files page
    window.location.href = 'files.html';
}