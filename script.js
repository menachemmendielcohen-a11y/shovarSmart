import {
    db,
    collection,
    onSnapshot,
    doc,
    query,
    orderBy
} from "../firebase.js";

const studentsList = document.getElementById("studentsList");
const newsTrack = document.getElementById("newsTrack");
const videoBox = document.querySelector(".video-box");

let videos = [];
let currentVideoIndex = 0;
let driveTimer = null;
let youtubePlayer = null;
let youtubeApiReady = false;

loadYoutubeApi();

onSnapshot(collection(db, "students"), snapshot => {
    const students = [];

    snapshot.forEach(docItem => {
        students.push({
            id: docItem.id,
            ...docItem.data()
        });
    });

    if (students.length === 0) {
        studentsList.innerHTML = `
            <div class="student">
                <div class="student-name">אין עדיין תלמידים</div>
                <div class="cards">
                    <div class="card">הוסף תלמידים דרך פאנל הניהול</div>
                </div>
            </div>
        `;
        return;
    }

    studentsList.innerHTML = students.map(student => `
        <div class="student">
            <div class="student-name">${student.name}</div>
            <div class="cards">
                <div class="card">🥤 ברד: ${student.barad || 0}</div>
                <div class="card">☕ אייס קפה: ${student.iceCoffee || 0}</div>
                <div class="card">🍿 פופקורן: ${student.popcorn || 0}</div>
            </div>
        </div>
    `).join("");

    updateStudentsAnimation(students.length);
});

onSnapshot(collection(db, "news"), snapshot => {
    const news = [];

    snapshot.forEach(docItem => {
        news.push(docItem.data().text);
    });

    if (news.length === 0) {
        newsTrack.innerHTML = `<span>📢 אין עדיין חדשות</span>`;
        return;
    }

    newsTrack.innerHTML = news.map(item => `<span>📢 ${item}</span>`).join("");
});

onSnapshot(query(collection(db, "videos"), orderBy("createdAt", "asc")), snapshot => {
    videos = [];

    snapshot.forEach(docItem => {
        videos.push({
            id: docItem.id,
            ...docItem.data()
        });
    });

    currentVideoIndex = 0;
    playCurrentVideo();
});

function playCurrentVideo() {
    clearTimeout(driveTimer);

    if (youtubePlayer && typeof youtubePlayer.destroy === "function") {
        youtubePlayer.destroy();
        youtubePlayer = null;
    }

    if (videos.length === 0) {
        showVideoPlaceholder("כאן יוצג סרטון המבצע");
        return;
    }

    if (currentVideoIndex >= videos.length) {
        currentVideoIndex = 0;
    }

    const video = videos[currentVideoIndex];

    if (video.type === "youtube") {
        playYoutube(video);
        return;
    }

    if (video.type === "drive") {
        playDrive(video);
        return;
    }

    nextVideo();
}

function playYoutube(video) {
    const videoId = video.videoId || extractYoutubeId(video.url || "");

    if (!videoId) {
        showVideoPlaceholder("קישור YouTube לא תקין");
        nextVideoAfter(5000);
        return;
    }

    videoBox.innerHTML = `<div id="youtubePlayer"></div>`;

    if (!youtubeApiReady || !window.YT || !window.YT.Player) {
        videoBox.innerHTML = `
            <iframe
                src="https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&playsinline=1&rel=0"
                title="YouTube video"
                allow="autoplay; encrypted-media; fullscreen"
                allowfullscreen>
            </iframe>
        `;

        nextVideoAfter((video.duration || 60) * 1000);
        return;
    }

    youtubePlayer = new window.YT.Player("youtubePlayer", {
        width: "100%",
        height: "100%",
        videoId,
        playerVars: {
            autoplay: 1,
            mute: 1,
            controls: 0,
            rel: 0,
            playsinline: 1
        },
        events: {
            onReady: event => {
                event.target.mute();
                event.target.playVideo();
            },
            onStateChange: event => {
                if (event.data === window.YT.PlayerState.ENDED) {
                    nextVideo();
                }
            }
        }
    });
}

function playDrive(video) {
    const driveId = video.driveId || extractDriveId(video.url || "");

    if (!driveId) {
        showVideoPlaceholder("קישור Google Drive לא תקין");
        nextVideoAfter(5000);
        return;
    }

    videoBox.innerHTML = `
        <iframe
            src="https://drive.google.com/file/d/${driveId}/preview"
            title="Google Drive video"
            allow="autoplay; fullscreen"
            allowfullscreen>
        </iframe>
    `;

    nextVideoAfter((video.duration || 60) * 1000);
}

function nextVideo() {
    if (videos.length === 0) return;

    currentVideoIndex++;

    if (currentVideoIndex >= videos.length) {
        currentVideoIndex = 0;
    }

    playCurrentVideo();
}

function nextVideoAfter(ms) {
    clearTimeout(driveTimer);
    driveTimer = setTimeout(nextVideo, ms);
}

function showVideoPlaceholder(text) {
    videoBox.innerHTML = `
        <div class="video-placeholder">
            ${text}
        </div>
    `;
}

function loadYoutubeApi() {
    if (window.YT && window.YT.Player) {
        youtubeApiReady = true;
        return;
    }

    window.onYouTubeIframeAPIReady = function() {
        youtubeApiReady = true;
        playCurrentVideo();
    };

    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";

    const firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

function updateStudentsAnimation(count) {
    const duration = Math.max(20, count * 5);
    studentsList.style.animationDuration = duration + "s";

    if (count <= 3) {
        studentsList.classList.remove("students-scroll");
    } else {
        studentsList.classList.add("students-scroll");
    }
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
const video = document.getElementById("mainVideo");

const playlist = [
//אין כרגע סרטונים מקומיים
];

let currentVideo = 0;

function playVideo(index) {

    video.src = playlist[index];

    video.play();

}

video.addEventListener("ended", () => {

    currentVideo++;

    if (currentVideo >= playlist.length) {
        currentVideo = 0;
    }

    playVideo(currentVideo);

});

playVideo(currentVideo);