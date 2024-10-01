// List of students with their details (id, name, roll, department).
const students = [
    { id: "✔LUAPP~20240101", name: "Mehedi", roll: "101", department: "Science" },
    { id: "20240242", name: "Abid", roll: "102", department: "Arts" },
    { id: "20240243", name: "Sawon", roll: "103", department: "Commerce" }
];

// Load any previously saved attendance from Local Storage.
let attendance = JSON.parse(localStorage.getItem('attendance')) || [];

// Ensure DOM is fully loaded before running the code.
function domReady(fn) {
    if (document.readyState === "complete" || document.readyState === "interactive") {
        setTimeout(fn, 1000);
    } else {
        document.addEventListener("DOMContentLoaded", fn);
    }
}

// Execute code after DOM is ready.
domReady(function () {
    // Load the saved attendance records into the table.
    loadAttendance();

    // Called when a QR code is successfully scanned.
    function onScanSuccess(decodeText) {
        const student = students.find(s => s.id === decodeText);
        
        if (student) {
            // Check if the student is already marked present.
            if (!isStudentAlreadyPresent(student.id)) {
                const currentTime = new Date().toLocaleTimeString();
                attendance.push({ ...student, time: currentTime });
                localStorage.setItem('attendance', JSON.stringify(attendance));
                addAttendanceToTable(student, currentTime);
                showModal(`Verified: ${student.name} ✅`, "verified");
                textToSpeech(`Welcome, ${student.name}`);
            } else {
                // Show the same modal for already marked students
                showModal(`You are already marked present, ${student.name}.`, "info");
                textToSpeech(`Hello, ${student.name}. You are already marked present.`);
            }
        } else {
            showModal("Not Found: Invalid ID ❌", "danger");
            textToSpeech("Invalid ID scanned.");
        }
    }

    // Function to show a modal for 2 seconds and play sound based on the type.
    function showModal(message, type) {
        const modalBody = document.getElementById("modal-body-text");
        modalBody.innerHTML = message;

        // Set modal style based on the type (success, info, danger).
        const modalDialog = document.querySelector('.modal-dialog');
        modalDialog.className = `modal-dialog modal-${type}`;

        // Play the corresponding sound
        const sound = document.getElementById(`${type}-sound`);
        if (sound) {
            sound.currentTime = 0; // Reset sound to the beginning
            sound.play();
        }

        // Show modal and automatically hide it after 2 seconds.
        $('#resultModal').modal('show');
        setTimeout(() => $('#resultModal').modal('hide'), 4000);
    }

    // Function to check if a student is already marked present.
    function isStudentAlreadyPresent(id) {
        return attendance.some(entry => entry.id === id);
    }

    // Text-to-speech functionality
    function textToSpeech(message) {
        const speech = new SpeechSynthesisUtterance(message);
        speechSynthesis.speak(speech);
    }

    // Initialize the QR code scanner.
    let htmlscanner = new Html5QrcodeScanner("my-qr-reader", { fps: 10, qrbox: 250 });
    htmlscanner.render(onScanSuccess);

    // Button to download attendance records as PDF.
    document.getElementById("download-pdf").onclick = function () {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Add headers and the current date.
        doc.setFontSize(20);
        doc.text("Logic University", 105, 20, null, null, "center");
        doc.setFontSize(14);
        doc.text("Medical & Nursing Admission Private Program", 105, 30, null, null, "center");
        doc.setFontSize(12);
        doc.text("Developed by - Mehedi Al Hasan Sawon", 105, 40, null, null, "center");
        doc.setFontSize(10);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 10, 50);

        // Table headers.
        const startY = 60;
        doc.setFontSize(10);
        doc.text("Serial No.", 10, startY);
        doc.text("Name", 30, startY);
        doc.text("Roll", 80, startY);
        doc.text("Department", 100, startY);
        doc.text("Time", 140, startY);

        // Add attendance records.
        let y = startY + 10;
        attendance.forEach((entry, index) => {
            doc.text((index + 1).toString(), 10, y);
            doc.text(entry.name, 30, y);
            doc.text(entry.roll, 80, y);
            doc.text(entry.department, 100, y);
            doc.text(entry.time, 140, y);
            y += 10;
        });

        // Save the PDF.
        doc.save("attendance.pdf");
    };

    // Function to load saved attendance into the table.
    function loadAttendance() {
        const attendanceBody = document.getElementById("attendance-body");
        attendanceBody.innerHTML = ""; // Clear existing entries

        attendance.forEach((entry, index) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${entry.name}</td>
                <td>${entry.roll}</td>
                <td>${entry.department}</td>
                <td>${entry.time}</td>
            `;
            attendanceBody.appendChild(row);
        });
    }

    // Function to add a student entry to the attendance table.
    function addAttendanceToTable(student, time) {
        const attendanceBody = document.getElementById("attendance-body");
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${attendance.length + 1}</td>
            <td>${student.name}</td>
            <td>${student.roll}</td>
            <td>${student.department}</td>
            <td>${time}</td>
        `;
        attendanceBody.appendChild(row);
    }
});