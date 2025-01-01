// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyDuIalt43ShUkmEp6hySJfuDrk6EkgM4zY",
    authDomain: "student-management-d1075.firebaseapp.com",
    databaseURL: "https://student-management-d1075-default-rtdb.firebaseio.com",
    projectId: "student-management-d1075",
    storageBucket: "student-management-d1075.appspot.com",
    messagingSenderId: "8122943566",
    appId: "1:8122943566:web:7aa39ce40c8cce634bdb1f",
    measurementId: "G-XBXPR0V8QS"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Cloudinary Configuration
const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/dvhsit2uy/image/upload';
const CLOUDINARY_UPLOAD_PRESET = 'Chating app';

let userName = localStorage.getItem('chatUserName');

// Modal to Set Username
window.onload = () => {
    if (!userName) {
        const modal = new bootstrap.Modal(document.getElementById('nameModal'));
        modal.show();
    } else {
        document.getElementById('chatUserDisplay').textContent = `Welcome, ${userName}!`;
        addUserToActiveList();
    }
};

// Handle Name Submission
document.getElementById('startChat').addEventListener('click', () => {
    const enteredName = document.getElementById('userName').value.trim();
    if (enteredName) {
        userName = enteredName;
        localStorage.setItem('chatUserName', userName);
        document.getElementById('chatUserDisplay').textContent = `Welcome, ${userName}!`;
        const modal = bootstrap.Modal.getInstance(document.getElementById('nameModal'));
        modal.hide();
        addUserToActiveList();
        saveUserProfile();  // Save user profile after setting name
    } else {
        alert("Please enter your name to start chatting.");
    }
});

// Add User to Active List
const activeUsersRef = db.ref('activeUsers');
function addUserToActiveList() {
    activeUsersRef.child(userName).set(true);
    window.addEventListener('beforeunload', () => {
        activeUsersRef.child(userName).remove();
    });
}

// Display Active Users
const activeUsersDiv = document.getElementById('active-users');
activeUsersRef.on('value', (snapshot) => {
    const activeUsers = snapshot.val();
    const count = activeUsers ? Object.keys(activeUsers).length : 0;
    activeUsersDiv.textContent = `Active Users: ${count}`;
});

// Save User Profile (Name and Image)
const userProfileRef = db.ref('users');
function saveUserProfile() {
    const userName = localStorage.getItem('chatUserName');
    const userImage = localStorage.getItem('chatUserImage');

    userProfileRef.child(userName).set({
        name: userName,
        image: userImage || 'default-image.jpg',  // Use default image if none uploaded
    });
}

// Send Message
document.getElementById('chat-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const message = document.getElementById('message').value.trim();
    if (message) {
        db.ref('messages').push({
            sender: userName,
            text: message,
            type: 'text',
            timestamp: new Date().toLocaleTimeString()
        });
        document.getElementById('message').value = '';
    }
});

// Upload and Send Image
document.getElementById('uploadBtn').addEventListener('click', () => {
    document.getElementById('imageUpload').click();
});

document.getElementById('imageUpload').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    try {
        const response = await fetch(CLOUDINARY_URL, { method: 'POST', body: formData });
        const data = await response.json();

        if (data.secure_url) {
            db.ref('messages').push({
                sender: userName,
                text: data.secure_url,
                type: 'image',
                timestamp: new Date().toLocaleTimeString()
            });
        } else {
            alert('Image upload failed!');
        }
    } catch (err) {
        console.error('Image upload error:', err);
        alert('Error uploading image!');
    }
});

// Receive Messages
const chatBody = document.getElementById('chat-body');
db.ref('messages').on('child_added', (snapshot) => {
    const msg = snapshot.val();
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');

    const isSentByCurrentUser = msg.sender === userName;
    messageElement.classList.add(isSentByCurrentUser ? 'sent' : 'received');

    const userProfile = userProfileRef.child(msg.sender);
    userProfile.once('value', (snapshot) => {
        const profile = snapshot.val();
        const userImage = profile ? profile.image : 'default-image.jpg';  // Default if no image set

        if (msg.type === 'text') {
            messageElement.innerHTML = `
                <strong style="color:#7FFFD4"><img src="${userImage}" width="29px"> ${msg.sender}</strong>
                <br>${msg.text} <span>${msg.timestamp}</span>
            `;
        } else if (msg.type === 'image') {
            messageElement.innerHTML = `
                <strong style="color:#7FFFD4"><img src="${userImage}" width="29px"> ${msg.sender}</strong>
                <br><img src="${msg.text}" alt="Uploaded Image" style="max-width: 200px; border-radius: 8px;">
                <br><span>${msg.timestamp}</span>
            `;
        }

        chatBody.appendChild(messageElement);
        chatBody.scrollTop = chatBody.scrollHeight; // Auto-scroll to latest message
    });
});

// Typing Indicator
const typingRef = db.ref('typing');
document.getElementById('message').addEventListener('input', () => {
    typingRef.child(userName).set(true);
    setTimeout(() => typingRef.child(userName).remove(), 2000);
});

typingRef.on('child_added', (snapshot) => {
    if (snapshot.key !== userName) {
        document.getElementById('typing-indicator').textContent = `${snapshot.key} is typing...`;
    }
});

typingRef.on('child_removed', () => {
    document.getElementById('typing-indicator').textContent = '';
});

// Profile Image Upload
document.getElementById('uploadProfileBtn').addEventListener('click', () => {
    document.getElementById('profileImageUpload').click();
});

document.getElementById('profileImageUpload').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    try {
        const response = await fetch(CLOUDINARY_URL, { method: 'POST', body: formData });
        const data = await response.json();

        if (data.secure_url) {
            // Store the uploaded profile image URL in local storage
            localStorage.setItem('chatUserImage', data.secure_url);

            // Save profile to Firebase
            saveUserProfile();

            alert('Profile image uploaded successfully!');
        } else {
            alert('Image upload failed!');
        }
    } catch (err) {
        console.error('Image upload error:', err);
        alert('Error uploading image!');
    }
});