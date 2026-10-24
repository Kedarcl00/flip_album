let progress = 0;

const percentage = document.getElementById("percentage");
const loader = document.getElementById("loader");
const flipbook = document.getElementById("flipbook");
const notFoundScreen = document.getElementById("albumNotFound");

// Helper to determine album slug from URL
function getTargetAlbumSlug() {
    // 1. Check query parameter (?album=slug or ?id=slug)
    const urlParams = new URLSearchParams(window.location.search);
    const querySlug = urlParams.get("album") || urlParams.get("id");
    if (querySlug) {
        return querySlug.trim().toLowerCase();
    }

    // 2. Check path pattern /album/:slug
    const pathParts = window.location.pathname.split("/").filter(Boolean);
    const albumIndex = pathParts.indexOf("album");
    if (albumIndex !== -1 && pathParts[albumIndex + 1]) {
        return pathParts[albumIndex + 1].trim().toLowerCase();
    }

    // 3. Default to Tirtha's birthday album
    return "tirtha-turns-one";
}

/* =========================================================
   PAGE FLIP INITIALIZATION
========================================================= */
const pageFlip = new St.PageFlip(
    document.getElementById("book"),
    {
        width: 400,
        height: 550,
        minWidth: 300,
        maxWidth: 1000,
        minHeight: 400,
        maxHeight: 700,
        size: "stretch",
        maxShadowOpacity: 0.5,
        showCover: true,
        mobileScrollSupport: false,
        swipeDistance: 30,
        usePortrait: true,
        startZIndex: 0,
        autoSize: true,
        clickEventForward: true,
        useMouseEvents: true,
        flippingTime: 1000
    }
);

/* =========================================================
   BUTTONS
========================================================= */
document.getElementById("nextBtn").addEventListener("click", () => {
    playFlipSound();
    pageFlip.flipNext();
});

document.getElementById("prevBtn").addEventListener("click", () => {
    playFlipSound();
    pageFlip.flipPrev();
});

/* =========================================================
   SOUND EFFECT & AUDIO UNLOCK
========================================================= */
const flipSound = document.getElementById("flipSound");
let audioUnlocked = false;
let isInitialized = false;

// Unlock audio on first user touch/click/key
function unlockAudio() {
    if (audioUnlocked) return;
    flipSound.volume = 0;
    const p = flipSound.play();
    if (p !== undefined) {
        p.then(() => {
            flipSound.pause();
            flipSound.currentTime = 0;
            flipSound.volume = 0.4;
            audioUnlocked = true;
        }).catch(() => {});
    }
}

document.addEventListener("click", unlockAudio, { once: true });
document.addEventListener("touchstart", unlockAudio, { once: true });
document.addEventListener("keydown", unlockAudio, { once: true });

function playFlipSound() {
    try {
        flipSound.currentTime = 0;
        flipSound.volume = 0.4;
        const playPromise = flipSound.play();
        if (playPromise !== undefined) {
            playPromise.catch(() => {});
        }
    } catch (e) {}
}

pageFlip.on("flip", () => {
    if (!isInitialized) return;
    playFlipSound();
});

/* =========================================================
   FULLSCREEN
========================================================= */
document.getElementById("fullscreenBtn").addEventListener("click", () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
});

/* =========================================================
   KEYBOARD SUPPORT
========================================================= */
document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") {
        playFlipSound();
        pageFlip.flipNext();
    }
    if (e.key === "ArrowLeft") {
        playFlipSound();
        pageFlip.flipPrev();
    }
});

/* =========================================================
   APPLY ALBUM THEME
========================================================= */
function applyAlbumTheme(album) {
    if (!album) return;

    // Document Title
    const titleText = album.title || album.name || "QR Flip Album";
    document.title = titleText;
    const pageTitleEl = document.getElementById("pageTitle");
    if (pageTitleEl) pageTitleEl.textContent = titleText;

    // Loader text
    const loaderTitle = document.getElementById("loaderTitle");
    if (loaderTitle) loaderTitle.textContent = album.title || album.name;

    const loaderSubtitle = document.getElementById("loaderSubtitle");
    if (loaderSubtitle) loaderSubtitle.textContent = album.subtitle || "";

    const loaderText = document.getElementById("loaderText");
    if (loaderText) loaderText.textContent = album.theme?.loaderText || "Loading Memories...";

    // Background and Theme styling
    const body = document.getElementById("albumBody");
    const theme = album.theme || {};

    if (theme.primaryColor) {
        document.documentElement.style.setProperty("--primary-color", theme.primaryColor);
    }
    if (theme.fontFamily) {
        document.documentElement.style.setProperty("--font-family", theme.fontFamily);
    }

    if (theme.backgroundType === "color" && theme.backgroundColor) {
        body.style.background = theme.backgroundColor;
    } else if (theme.backgroundType === "image" && theme.backgroundImage) {
        body.style.background = `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url('${theme.backgroundImage}')`;
        body.style.backgroundSize = "cover";
        body.style.backgroundPosition = "center";
    } else if (theme.backgroundGradient) {
        body.style.background = theme.backgroundGradient;
    } else {
        // Fallback default
        body.style.background = "linear-gradient(135deg, #0f172a, #1e293b, #111827)";
    }
}

/* =========================================================
   LOAD ALBUM AND IMAGES
========================================================= */
async function loadAlbum() {
    const slug = getTargetAlbumSlug();
    const baseUrl = typeof API_BASE_URL !== "undefined" ? API_BASE_URL : "https://tirthas-bday.onrender.com";

    try {
        // 1. Fetch Album Details
        let album = null;
        try {
            const albumRes = await fetch(`${baseUrl}/api/albums/${slug}`);
            if (albumRes.ok) {
                const albumData = await albumRes.json();
                album = albumData.album || albumData;
            }
        } catch (err) {
            console.warn("Could not fetch album details, using fallback/default:", err.message);
        }

        // Apply theme if found
        if (album) {
            applyAlbumTheme(album);
        } else if (slug !== "tirtha-turns-one") {
            // Album not found
            if (notFoundScreen) notFoundScreen.style.display = "flex";
            if (loader) loader.style.display = "none";
            return;
        }

        // 2. Fetch Images for this Album
        let images = [];
        try {
            const imgRes = await fetch(`${baseUrl}/api/albums/${slug}/images`);
            if (imgRes.ok) {
                images = await imgRes.json();
            } else {
                // Fallback to legacy endpoint
                const legacyRes = await fetch(`${baseUrl}/api/images?album=${slug}`);
                if (legacyRes.ok) {
                    images = await legacyRes.json();
                }
            }
        } catch (fetchErr) {
            console.warn("Fetch images error, trying base /api/images:", fetchErr.message);
            const fallbackRes = await fetch(`${baseUrl}/api/images`);
            if (fallbackRes.ok) {
                images = await fallbackRes.json();
            }
        }

        const book = document.getElementById("book");
        book.innerHTML = "";

        if (Array.isArray(images) && images.length > 0) {
            images.forEach((img, index) => {
                const page = document.createElement("div");
                page.className = "page";

                let captionHtml = "";
                if (img.caption && img.caption.trim()) {
                    captionHtml = `<div class="page-caption" style="position:absolute; bottom:15px; left:50%; transform:translateX(-50%); background:rgba(0,0,0,0.65); color:white; padding:5px 14px; border-radius:20px; font-size:12px; max-width:85%; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${img.caption}</div>`;
                }

                page.innerHTML = `
                    <img src="${img.imageUrl}" alt="Page ${index + 1}">
                    ${captionHtml}
                `;

                book.appendChild(page);
            });

            // Load into PageFlip
            pageFlip.loadFromHTML(document.querySelectorAll(".page"));

            const totalPages = pageFlip.getPageCount();
            if (totalPages > 0) {
                document.getElementById("pageCounter").textContent = `Memory 1 of ${totalPages}`;
            }

            // Enable flip sound after rendering
            setTimeout(() => {
                isInitialized = true;
            }, 1000);
        } else {
            // Show placeholder page if album has no images yet
            const emptyPage = document.createElement("div");
            emptyPage.className = "page";
            emptyPage.innerHTML = `
                <div style="text-align:center; padding:30px; color:#64748b;">
                    <div style="font-size:48px; margin-bottom:12px;">📷</div>
                    <h3 style="color:#334155; margin-bottom:8px;">No Photos Added Yet</h3>
                    <p style="font-size:14px;">Upload photos in the admin panel to view this album.</p>
                </div>
            `;
            book.appendChild(emptyPage);
            pageFlip.loadFromHTML(document.querySelectorAll(".page"));
            document.getElementById("pageCounter").textContent = "Page 0 of 0";
        }

        // Start loader percentage animation
        const timer = setInterval(() => {
            progress += 2;
            percentage.textContent = progress + "%";
            if (progress >= 100) {
                clearInterval(timer);
                loader.style.display = "none";
                flipbook.style.display = "block";
            }
        }, 15);

    } catch (error) {
        console.error("Error Loading Album:", error);
        // Ensure loader is removed so user can see status
        if (loader) loader.style.display = "none";
    }
}

/* =========================================================
   PAGE COUNTER EVENT
========================================================= */
pageFlip.on("flip", (e) => {
    const currentPage = e.data + 1;
    const totalPages = pageFlip.getPageCount();
    document.getElementById("pageCounter").textContent = `Memory ${currentPage} of ${totalPages}`;
});

/* =========================================================
   START APPLICATION
========================================================= */
loadAlbum();
