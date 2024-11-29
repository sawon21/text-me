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
const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/dvhsit2uy/image/upload'; // Replace with your Cloudinary URL
const CLOUDINARY_UPLOAD_PRESET = 'Chating app'; // Replace with your Upload Preset name

let userName = localStorage.getItem('chatUserName');

// Ensure Modal loads if name is not set
window.onload = () => {
    if (!userName) {
        const modal = new bootstrap.Modal(document.getElementById('nameModal'));
        modal.show();
    } else {
        document.getElementById('chatUserDisplay').textContent = `Welcome, ${userName}!`;
    }
};

// Handle Name Submission
document.getElementById('startChat').addEventListener('click', () => {
    const enteredName = document.getElementById('userName').value.trim();
    if (enteredName) {
        userName = enteredName;
        localStorage.setItem('chatUserName', userName); // Save name to local storage
        document.getElementById('chatUserDisplay').textContent = `Welcome, ${userName}!`;
        const modal = bootstrap.Modal.getInstance(document.getElementById('nameModal'));
        modal.hide(); // Hide the modal after name is entered
    } else {
        alert("Please enter your name to start chatting.");
    }
});

// Send Message
document.getElementById('chat-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const message = document.getElementById('message').value;
    if (message.trim()) {
        db.ref('messages').push({
            sender: userName,
            text: message,
            type: 'text',
            timestamp: new Date().toLocaleTimeString()
        });
        document.getElementById('message').value = "";
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
        const response = await fetch(CLOUDINARY_URL, {
            method: 'POST',
            body: formData,
        });
        const data = await response.json();

        if (data.secure_url) {
            // Push Image URL to Firebase
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

    // Check Message Type
    if (msg.type === 'text') {
        // Text Message
        messageElement.innerHTML = `
            <strong style="color:#7FFFD4"><img src="https://i.ibb.co/0BkNRkW/user-4.png" width="16px"> ${msg.sender}</strong>
            <br>${msg.text} <span>${msg.timestamp}</span>
        `;
    } else if (msg.type === 'image') {
        // Image Message
        messageElement.innerHTML = `
            <strong style="color:#7FFFD4"><img src="https://i.ibb.co/0BkNRkW/user-4.png" width="16px"> ${msg.sender}</strong>
            <br><img src="${msg.text}" alt="Uploaded Image" style="max-width: 200px; border-radius: 8px;">
            <br><span>${msg.timestamp}</span>
        `;
    }

    chatBody.appendChild(messageElement);
    chatBody.scrollTop = chatBody.scrollHeight; // Auto-scroll to the latest message
});