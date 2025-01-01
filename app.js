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

    if (msg.type === 'text') {
        messageElement.innerHTML = `
            <strong style="color:#7FFFD4"><img src="https://i.ibb.co/0BkNRkW/user-4.png" width="16px"> ${msg.sender}</strong>
            <br>${msg.text} <span>${msg.timestamp}</span>
        `;
    } else if (msg.type === 'image') {
        messageElement.innerHTML = `
            <strong style="color:#7FFFD4"><img src="https://i.ibb.co/0BkNRkW/user-4.png" width="16px"> ${msg.sender}</strong>
            <br><img src="${msg.text}" alt="Uploaded Image" style="max-width: 200px; border-radius: 8px;">
            <br><span>${msg.timestamp}</span>
        `;
    }

    chatBody.appendChild(messageElement);
    chatBody.scrollTop = chatBody.scrollHeight; // Auto-scroll to latest message
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