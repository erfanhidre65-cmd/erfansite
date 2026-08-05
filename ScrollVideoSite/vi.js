gsap.registerPlugin(ScrollTrigger);

const video = document.querySelector("#video");
const canvas = document.querySelector("#frames-canvas");
const ctx = canvas.getContext("2d");
const loader = document.querySelector(".loader");
const progressBar = document.querySelector(".progress-bar");

let duration = 0;
let targetProgress = 0;
let smoothProgress = 0;

/* ===== تنظیم اندازه canvas با توجه به pixel ratio ===== */
function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

/* ===== رسم فریم فعلی ویدیو روی canvas با object-fit: cover ===== */
function drawVideoFrame() {
    if (!video.videoWidth) return;

    const cw = window.innerWidth;
    const ch = window.innerHeight;
    const iw = video.videoWidth;
    const ih = video.videoHeight;

    const scale = Math.max(cw / iw, ch / ih);
    const dw = iw * scale;
    const dh = ih * scale;
    const dx = (cw - dw) / 2;
    const dy = (ch - dh) / 2;

    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(video, dx, dy, dw, dh);
}

/* ===== لوپ رندر مستقل از رویداد اسکرول ===== */
function renderLoop() {
    // لرپ نرم به سمت موقعیت هدف
    smoothProgress += (targetProgress - smoothProgress) * 0.12;

    if (Math.abs(targetProgress - smoothProgress) < 0.0005) {
        smoothProgress = targetProgress;
    }

    const targetTime = smoothProgress * duration;

    // فقط وقتی seek قبلی تموم شده و اختلاف محسوسه، seek جدید بزن
    if (!video.seeking && Math.abs(video.currentTime - targetTime) > 0.01) {
        video.currentTime = targetTime;
    }

    drawVideoFrame();

    if (progressBar) {
        progressBar.style.width = (smoothProgress * 100) + "%";
    }

    requestAnimationFrame(renderLoop);
}

/* ===== شروع ===== */
video.addEventListener("loadedmetadata", () => {

    duration = video.duration;
    video.pause();

    resizeCanvas();
    drawVideoFrame();

    loader.classList.add("hide");

    ScrollTrigger.create({
        trigger: ".scroll-space",
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => {
            targetProgress = self.progress;
        }
    });

    renderLoop();

    // ورود نرم متن
    gsap.from(".overlay h1", {
        y: 80,
        opacity: 0,
        duration: 1.5,
        ease: "power4.out"
    });

    gsap.from(".overlay p", {
        y: 40,
        opacity: 0,
        delay: .3,
        duration: 1.2,
        ease: "power4.out"
    });

    gsap.from("header", {
        y: -60,
        opacity: 0,
        duration: 1,
        ease: "power3.out"
    });

});

window.addEventListener("resize", resizeCanvas);
