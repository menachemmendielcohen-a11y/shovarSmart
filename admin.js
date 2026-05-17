import {
    db,
    auth,
    collection,
    addDoc,
    onSnapshot,
    doc,
    updateDoc,
    deleteDoc,
    serverTimestamp,
    query,
    orderBy,
    onAuthStateChanged,
    signOut,
    updatePassword
} from "../firebase.js";

onAuthStateChanged(auth, user => {
    if (!user) {
        location.href = "login.html";
    }
});

const studentsAdminList = document.getElementById("studentsAdminList");
const newsAdminList = document.getElementById("newsAdminList");
const videosAdminList = document.getElementById("videosAdminList");

let studentsCache = [];

async function addStudent() {
    const input = document.getElementById("studentName");
    const name = input.value.trim();

    if (!name) return;

    await addDoc(collection(db, "students"), {
        name,
        barad: 0,
        iceCoffee: 0,
        popcorn: 0
    });

    input.value = "";
}

function renderStudents(students) {
    if (students.length === 0) {
        studentsAdminList.innerHTML = `<div class="admin-card">אין עדיין תלמידים</div>`;
        return;
    }

    studentsAdminList.innerHTML = students.map(student => `
        <div class="admin-student">
            <div class="admin-student-name">${student.name}</div>

            <div class="admin-actions">
                <button onclick="changeCard('${student.id}', 'barad', 1)">+ ברד</button>
                <button onclick="changeCard('${student.id}', 'barad', -1)">- ברד</button>

                <button onclick="changeCard('${student.id}', 'iceCoffee', 1)">+ אייס קפה</button>
                <button onclick="changeCard('${student.id}', 'iceCoffee', -1)">- אייס קפה</button>

                <button onclick="changeCard('${student.id}', 'popcorn', 1)">+ פופקורן</button>
                <button onclick="changeCard('${student.id}', 'popcorn', -1)">- פופקורן</button>

                <button class="delete-btn" onclick="removeStudent('${student.id}')">מחק תלמיד</button>
            </div>

            <div class="student-stats">
                🥤 ${student.barad || 0} |
                ☕ ${student.iceCoffee || 0} |
                🍿 ${student.popcorn || 0}
            </div>
        </div>
    `).join("");
}

onSnapshot(collection(db, "students"), snapshot => {
    studentsCache = [];

    snapshot.forEach(docItem => {
        studentsCache.push({
            id: docItem.id,
            ...docItem.data()
        });
    });

    renderStudents(studentsCache);
});

async function changeCard(id, type, amount) {
    const student = studentsCache.find(s => s.id === id);
    if (!student) return;

    const currentValue = student[type] || 0;
    const newValue = Math.max(0, currentValue + amount);

    await updateDoc(doc(db, "students", id), {
        [type]: newValue
    });
}

async function removeStudent(id) {
    await deleteDoc(doc(db, "students", id));
}

async function addNews() {
    const input = document.getElementById("newsInput");
    const text = input.value.trim();

    if (!text) return;

    await addDoc(collection(db, "news"), {
        text,
        createdAt: serverTimestamp()
    });

    input.value = "";
}

function renderNews(news) {
    if (studentsAdminList && !newsAdminList) return;

    if (news.length === 0) {
        newsAdminList.innerHTML = `<div class="admin-card">אין עדיין חדשות</div>`;
        return;
    }

    newsAdminList.innerHTML = news.map(item => `
        <div class="news-item">
            <span>${item.text}</span>
            <button class="delete-btn" onclick="removeNews('${item.id}')">מחק</button>
        </div>
    `).join("");
}

onSnapshot(collection(db, "news"), snapshot => {
    const news = [];

    snapshot.forEach(docItem => {
        news.push({
            id: docItem.id,
            ...docItem.data()
        });
    });

    renderNews(news);
});

async function removeNews(id) {
    await deleteDoc(doc(db, "news", id));
}

function renderVideos(videos) {
    if (!videosAdminList) return;

    if (videos.length === 0) {
        videosAdminList.innerHTML = `<div class="admin-card">אין עדיין סרטונים</div>`;
        return;
    }

    videosAdminList.innerHTML = videos.map((video, index) => {
        const label = video.type === "youtube" ? "YouTube" : "Google Drive";

        return `
            <div class="video-item">
                <div>
                    <strong>${index + 1}. ${label}</strong>
                    <div class="video-link">${video.url || ""}</div>
                    <div class="video-time">זמן תצוגה: ${video.duration || 60} שניות</div>
                </div>

                <button class="delete-btn" onclick="removeVideo('${video.id}')">
                    מחק קישור
                </button>
            </div>
        `;
    }).join("");
}

onSnapshot(query(collection(db, "videos"), orderBy("createdAt", "asc")), snapshot => {
    const videos = [];

    snapshot.forEach(docItem => {
        videos.push({
            id: docItem.id,
            ...docItem.data()
        });
    });

    renderVideos(videos);
});

async function removeVideo(id) {
    await deleteDoc(doc(db, "videos", id));
}

async function saveYoutubeVideo() {
    const input = document.getElementById("videoUrl");
    const durationInput = document.getElementById("videoDuration");

    if (!input) return;

    const url = input.value.trim();
    const duration = Number(durationInput?.value) || 60;

    if (!url) {
        alert("תכניס קישור YouTube");
        return;
    }

    const videoId = extractYoutubeId(url);

    if (!videoId) {
        alert("זה לא נראה כמו קישור YouTube תקין");
        return;
    }

    await addDoc(collection(db, "videos"), {
        type: "youtube",
        url,
        videoId,
        duration,
        createdAt: serverTimestamp()
    });

    input.value = "";
    alert("סרטון YouTube נוסף לרשימה");
}

async function saveDriveVideo() {
    const input = document.getElementById("videoUrl");
    const durationInput = document.getElementById("videoDuration");

    if (!input) return;

    const url = input.value.trim();
    const duration = Number(durationInput?.value) || 60;

    if (!url) {
        alert("תכניס קישור Google Drive");
        return;
    }

    const driveId = extractDriveId(url);

    if (!driveId) {
        alert("זה לא נראה כמו קישור Google Drive תקין");
        return;
    }

    await addDoc(collection(db, "videos"), {
        type: "drive",
        url,
        driveId,
        duration,
        createdAt: serverTimestamp()
    });

    input.value = "";
    alert("סרטון Google Drive נוסף לרשימה");
}

function extractYoutubeId(url) {
    const patterns = [
        /youtube\.com\/watch\?v=([^&]+)/,
        /youtu\.be\/([^?&]+)/,
        /youtube\.com\/embed\/([^?&/]+)/,
        /youtube\.com\/shorts\/([^?&/]+)/
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }

    return null;
}

function extractDriveId(url) {
    const patterns = [
        /drive\.google\.com\/file\/d\/([^/]+)/,
        /drive\.google\.com\/open\?id=([^&]+)/,
        /drive\.google\.com\/uc\?[^#]*id=([^&]+)/
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }

    return null;
}

async function changePassword() {
    const input = document.getElementById("newPassword");
    const password = input.value.trim();

    if (!password) return;

    if (password.length < 6) {
        alert("הסיסמה חייבת להיות לפחות 6 תווים");
        return;
    }

    try {
        await updatePassword(auth.currentUser, password);
        input.value = "";
        alert("הסיסמה שונתה בהצלחה");
    } catch (error) {
        alert("כדי לשנות סיסמה צריך להתחבר מחדש ואז לנסות שוב");
    }
}

async function logout() {
    await signOut(auth);
    location.href = "login.html";
}

window.addStudent = addStudent;
window.changeCard = changeCard;
window.removeStudent = removeStudent;
window.addNews = addNews;
window.removeNews = removeNews;
window.saveYoutubeVideo = saveYoutubeVideo;
window.saveDriveVideo = saveDriveVideo;
window.removeVideo = removeVideo;
window.changePassword = changePassword;
window.logout = logout;