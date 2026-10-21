let progress = 0;

const percentage =
document.getElementById("percentage");

const loader =
document.getElementById("loader");

const flipbook =
document.getElementById("flipbook");

const timer = setInterval(() => {

    progress++;

    percentage.textContent =
    progress + "%";

    if(progress >= 100){

        clearInterval(timer);

        loader.style.display = "none";

        flipbook.style.display = "block";
    }

}, 25);


/* =========================
   PAGE FLIP INITIALIZATION
========================= */

const pageFlip = new St.PageFlip(
    document.getElementById("book"),
    {

        width:400,
        height:550,

        minWidth:300,
        maxWidth:1000,

        minHeight:400,
        maxHeight:700,

        size:"stretch",

        maxShadowOpacity:0.5,

        showCover:true,

        mobileScrollSupport:false,

        swipeDistance:30,

        usePortrait:true,

        startZIndex:0,

        autoSize:true,

        clickEventForward:true,

        useMouseEvents:true,

        flippingTime:1000
    }
);

/* =========================
   BUTTONS
========================= */

document
.getElementById("nextBtn")
.addEventListener("click", () => {

    pageFlip.flipNext();

});

document
.getElementById("prevBtn")
.addEventListener("click", () => {

    pageFlip.flipPrev();

});

/* =========================
   SOUND EFFECT
========================= */

const flipSound =
document.getElementById("flipSound");

let isInitialized = false;

pageFlip.on("flip", () => {

    if (!isInitialized) return;

    flipSound.currentTime = 0;

    flipSound.volume = 0.4;

    flipSound.play().catch((err) => {
        // Ignored if browser blocks audio before user interaction
        console.debug("Audio play blocked by browser policy:", err);
    });

});

/* =========================
   FULLSCREEN
========================= */

document
.getElementById("fullscreenBtn")
.addEventListener("click", () => {

    if(!document.fullscreenElement){

        document.documentElement
        .requestFullscreen();

    }else{

        document.exitFullscreen();

    }

});

/* =========================
   KEYBOARD SUPPORT
========================= */

document.addEventListener(
"keydown",

(e) => {

    if(e.key === "ArrowRight"){

        pageFlip.flipNext();

    }

    if(e.key === "ArrowLeft"){

        pageFlip.flipPrev();

    }

}
);

/* =========================
   LOAD IMAGES FROM DATABASE
========================= */

async function loadImages(){

    try{

        const response =
        await fetch(
            "https://tirthas-bday.onrender.com/api/images"
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data =
        await response.json();

        const book =
        document.getElementById("book");

        /* CLEAR OLD PAGES */

        book.innerHTML = "";

        /* CREATE NEW PAGES */

        data.forEach((img,index)=>{

            const page =
            document.createElement("div");

            page.className =
            "page";

            page.innerHTML = `

                <img
                src="${img.imageUrl}"
                alt="Page ${index + 1}">

            `;

            book.appendChild(page);

        });

        /* LOAD INTO PAGEFLIP */

        pageFlip.loadFromHTML(
            document.querySelectorAll(".page")
        );

        const totalPages = pageFlip.getPageCount();
        if (totalPages > 0) {
            document.getElementById(
                "pageCounter"
            ).textContent = `Memory 1 of ${totalPages}`;
        }

        // Enable flip sound after initial render is complete
        setTimeout(() => {
            isInitialized = true;
        }, 300);

    }catch(error){

        console.log(
            "Error Loading Images:",
            error
        );

    }

}

pageFlip.on("flip", (e) => {

    const currentPage =
    e.data + 1;

    const totalPages =
    pageFlip.getPageCount();

    document.getElementById(
        "pageCounter"
    ).textContent =
    `Memory ${currentPage} of ${totalPages}`;

});


/* =========================
   RUN APP
========================= */

loadImages();