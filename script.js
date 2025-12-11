const counterEl = document.getElementById('counter').querySelector('span');
const detailedEl = document.getElementById('detailed-countdown');
let confettiInterval = null;
let confettiCleanupTimeout = null;

// Új konstansok a teljesítmény javítására
const MAX_ACTIVE_CONFETTI = 120; // Maximum ennyi konfetti elem lesz egyszerre a DOM-ban
const CONFETTI_ANIMATION_DURATION = 4000; // A CSS animáció időtartama (4s)
const CONFETTI_REGEN_RATE = 100; // Milyen gyakran próbáljunk újraaktiválni egy konfettit (ms)

let confettiPool = []; // A konfetti elemek tárolója
let activeConfettiCount = 0; // Aktív konfetti elemek számlálója

// EXTRA: itt adhatsz meg különleges, "kivételes" iskolai napokat (alapértelmezetten üres)
// Formátum: 'YYYY-MM-DD' pl. '2025-12-13'
// Ha ide beírsol egy dátumot, az adott napot iskolai napként fogjuk számolni még akkor is,
// ha hétvége (szombat/vasárnap).
const EXTRA_SCHOOL_DAYS = [
    // Ide kell írni a dátumot ha hozzá szeretnék adni
];

// Segédfüggvény: dátum normalizálása 'YYYY-MM-DD' formátumba
function toYMD(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

// Segédfüggvény: ellenőrzi, hogy egy nap szerepel-e az EXTRA_SCHOOL_DAYS-ben
function isExtraSchoolDay(date) {
    return EXTRA_SCHOOL_DAYS.includes(toYMD(date));
}

function getTargetDate() {
    const now = new Date();
    // Cél: Április 2. (A tavaszi szünet kezdete)
    let target = new Date(now.getFullYear(), 3, 2); // Month is 0-indexed (April is 3)

    // Ha ma már elmúlt Április 2., akkor a következő év Április 2.
    if (now > target) {
        target = new Date(now.getFullYear() + 1, 3, 2);
    }
    return target;
}

function getMonthDiff(startDate, endDate) {
    let months = 0;
    let tempDate = new Date(startDate);

    while (tempDate < endDate) {
        const currentMonthLength = new Date(tempDate.getFullYear(), tempDate.getMonth() + 1, 0).getDate();
        tempDate.setDate(tempDate.getDate() + currentMonthLength);
        months++;
    }

    return months - 1;
}

function getRandomColor() {
    // Tavaszi színek (pasztell, világos árnyalatok)
    const colors = ["#FFC0CB", "#90EE90", "#ADD8E6", "#FFFF00", "#FFD700", "#DA70D6"];
    return colors[Math.floor(Math.random() * colors.length)];
}

function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

// ÚJ segédfüggvény: két időpont közötti másodpercek, hétvégéket és szüneteket kihagyva
function getWeekdaySecondsBetween(startDate, endDate) {
    let totalMs = 0;
    let cur = new Date(startDate);
    const holidays = [
        new Date(2025, 0, 1),  // Újév – január 1.
        new Date(2025, 2, 15), // Nemzeti ünnep – március 15. 
        new Date(2025, 3, 18), // Nagypéntek – április 18. 
        new Date(2025, 3, 20), // Húsvétvasárnap – április 20. 
        new Date(2025, 3, 21), // Húsvéthétfő – április 21. 
        new Date(2025, 4, 1),  // A munka ünnepe – május 1. 
        new Date(2025, 4, 2),  // Pihenőnap – május 2. (áthelyezett) 
        new Date(2025, 5, 8),  // Pünkösdvasárnap – június 8. 
        new Date(2025, 5, 9),  // Pünkösdhétfő – június 9. 
        new Date(2025, 7, 20), // Államalapítás ünnepe – augusztus 20.
        new Date(2025, 9, 23), // Nemzeti ünnep – október 23. 
        new Date(2025, 9, 24), // Pihenőnap – október 24. (áthelyezett) 
        new Date(2025, 10, 1), // Mindenszentek – november 1. 
        new Date(2025, 11, 24), // Pihenőnap – december 24.
        new Date(2025, 11, 25), // Karácsony – december 25. 
        new Date(2025, 11, 26), // Karácsony másnapja – december 26. 
    ];

    const schoolBreaks = [
        { start: new Date(2026, 5, 23), end: new Date(2026, 8, 1) }, // Nyári szünet
        { start: new Date(2025, 9, 23), end: new Date(2025, 10, 2) }, // Őszi szünet
        { start: new Date(2026, 11, 12), end: new Date(2027, 0, 4) }, // Téli szünet (évváltás korrigálva)
        { start: new Date(2026, 3, 2), end: new Date(2026, 3, 12) }, // Tavaszi szünet (korrekció: április 2–12)
        // Add more school breaks as needed
    ];

    while (cur < endDate) {
        let next = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() + 1, 0, 0, 0, 0);
        if (next > endDate) next = new Date(endDate);

        const day = cur.getDay(); // 0 = Sunday, 6 = Saturday

        // Ünnepnap ellenőrzése
        const isHoliday = holidays.some(holiday => holiday.toDateString() === cur.toDateString());

        // Szünet ellenőrzése
        const isSchoolBreak = schoolBreaks.some(breakPeriod => cur >= breakPeriod.start && cur < breakPeriod.end);
        
        // Külön ellenőrzés: extra iskolai nap (kivétel), ha a cur dátum szerepel az EXTRA_SCHOOL_DAYS-ben
        const extraDay = isExtraSchoolDay(cur);

        // Csak akkor számítjuk be a napot, ha:
        // - Hétköznap (Hétfő-Péntek) ÉS nem ünnep/ne szünet, VAGY
        // - ez egy extra iskolai nap (extraDay) és nem ünnep és nem szünet
        if ((!isHoliday && !isSchoolBreak) && ((day !== 0 && day !== 6) || extraDay)) {
            totalMs += (next - cur); // Hozzáadjuk az eltelt másodperceket
        }

        cur = next;
    }

    return Math.floor(totalMs / 1000);
}

function initConfettiPool() {
    const confettiContainer = document.createElement('div');
    confettiContainer.classList.add('confetti-container');
    document.body.appendChild(confettiContainer);

    for (let i = 0; i < MAX_ACTIVE_CONFETTI; i++) {
        const confetti = document.createElement('div');
        confetti.classList.add('confetti');
        confetti.style.display = 'none';
        confettiContainer.appendChild(confetti);
        confettiPool.push(confetti);
    }
}

function activateConfetti() {
    if (activeConfettiCount >= MAX_ACTIVE_CONFETTI) {
        return;
    }

    const confetti = confettiPool.find(c => c.style.display === 'none');

    if (confetti) {
        confetti.style.display = 'block';
        confetti.style.left = `${Math.random() * 100}vw`;
        confetti.style.backgroundColor = getRandomColor();

        confetti.classList.remove('confetti');
        void confetti.offsetWidth; 
        confetti.classList.add('confetti');

        activeConfettiCount++;

        setTimeout(() => {
            confetti.style.display = 'none';
            activeConfettiCount--;
        }, CONFETTI_ANIMATION_DURATION);
    }
}

function startConfetti() {
    if (confettiInterval) {
        return;
    }

    if (confettiPool.length === 0) {
        initConfettiPool();
    }

    confettiInterval = setInterval(activateConfetti, CONFETTI_REGEN_RATE);
    console.log("Konfetti elindult!");
}

function stopConfetti() {
    clearInterval(confettiInterval);
    confettiInterval = null;
    clearTimeout(confettiCleanupTimeout);
    confettiCleanupTimeout = null;

    confettiPool.forEach(confetti => {
        confetti.style.display = 'none';
    });
    activeConfettiCount = 0;

    document.querySelector('.confetti-container')?.remove();
    confettiPool = [];
    console.log("Konfetti leállítva!");
}

function updateMainCounter(target) {
    const now = new Date();
    const diffInSeconds = Math.floor((target - now) / 1000);

    // Tavaszi szünet időtartama: Április 2. → Április 13.
    let breakStart = new Date(now.getFullYear(), 3, 2); // April 2
    let breakEnd = new Date(now.getFullYear(), 3, 13); // April 13 (exclusive)
    
    // Ha a szünet már elmúlt az aktuális évben, akkor a következő évre kell beállítani
    if (now > breakEnd && now.getMonth() >= 3) {
        breakStart.setFullYear(now.getFullYear() + 1);
        breakEnd.setFullYear(now.getFullYear() + 1);
    }

    const isBreak = (now >= breakStart && now < breakEnd);

    if (isBreak) {
        counterEl.classList.remove('fade-out');
        counterEl.textContent = "Tavaszi szünet van!"; // FELIRAT VÁLTOZÁS
        detailedEl.textContent = "Élvezd a vakációt! 🐰"; // EMOJI VÁLTOZÁS

        if (!confettiInterval) {
            startConfetti();
        }
        return;
    } else {
        if (confettiInterval) {
            stopConfetti();
        }
    }

    counterEl.classList.add('fade-out');
    setTimeout(() => {
        counterEl.textContent = `${formatNumber(diffInSeconds)} másodperc van hátra a tavaszi szünetig!`; // FELIRAT VÁLTOZÁS
        counterEl.classList.remove('fade-out');
    }, 250);

    // Normál (teljes idő szerint)
    const days = Math.floor(diffInSeconds / (3600 * 24));
    const hours = Math.floor((diffInSeconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((diffInSeconds % 3600) / 60);
    const seconds = diffInSeconds % 60;

    // Tanítási napok szerint (hétvégéket, ünnepeket, szüneteket kihagyva)
    const teachingSeconds = getWeekdaySecondsBetween(now, target);
    const tDays = Math.floor(teachingSeconds / (3600 * 24));
    const tHours = Math.floor((teachingSeconds % (3600 * 24)) / 3600);
    const tMinutes = Math.floor((teachingSeconds % 3600) / 60);
    const tSeconds = teachingSeconds % 60;

    detailedEl.innerHTML = 
        `Ez pontosan ${formatNumber(days)} nap, ${formatNumber(hours)} óra, ${formatNumber(minutes)} perc, ${formatNumber(seconds)} másodperc.` +
        `<br><br>Ebből <strong> ${formatNumber(tDays)} </strong> iskolai nap.`;
}

function updateDetailedBox(target) {
    const now = new Date();
    let timeLeft = target - now;

    if (timeLeft < 0) {
        target = new Date(target.getFullYear() + 1, 3, 2); // Április 2.
        timeLeft = target - now;
    }

    const totalSeconds = Math.floor(timeLeft / 1000);
    const totalMinutes = Math.floor(timeLeft / (1000 * 60));
    const totalHours = Math.floor(timeLeft / (1000 * 60 * 60));
    const totalDays = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const totalWeeks = Math.floor(totalDays / 7);
    const totalMonths = getMonthDiff(now, target);

    if (document.getElementById("months")) {
        document.getElementById("months").textContent = formatNumber(totalMonths);
        document.getElementById("weeks").textContent = formatNumber(totalWeeks);
        document.getElementById("days").textContent = formatNumber(totalDays);
        document.getElementById("hours").textContent = formatNumber(totalHours);
        document.getElementById("minutes").textContent = formatNumber(totalMinutes);
        document.getElementById("seconds").textContent = formatNumber(totalSeconds);
    }
}


function updateRemainingSpringBreak() {
    const now = new Date();

    // Tavaszi szünet: Április 2. → Április 13.
    let breakStart = new Date(now.getFullYear(), 3, 2); 
    let breakEnd = new Date(now.getFullYear(), 3, 13); 

    // Ha már április 13. után járunk → következő év
    if (now > breakEnd && now.getMonth() >= 3) {
        breakStart = new Date(now.getFullYear() + 1, 3, 2);
        breakEnd = new Date(now.getFullYear() + 1, 3, 13);
    }

    const box = document.getElementById("remaining-break-box");
    const text = document.getElementById("remaining-break-text");

    if (!box || !text) return; 

    // SZÜNET VAN?
    if (now >= breakStart && now < breakEnd) {
        box.style.display = "block";

        const diff = breakEnd - now;
        const totalSeconds = Math.floor(diff / 1000);

        const d = Math.floor(totalSeconds / (3600 * 24));
        const h = Math.floor((totalSeconds % (3600 * 24)) / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;

        text.innerHTML = `
            A tavaszi szünetből még hátravan:<br>
            <span class="number">${formatNumber(d)}</span> nap,
            <span class="number">${formatNumber(h)}</span> óra,
            <span class="number">${formatNumber(m)}</span> perc,
            <span class="number">${formatNumber(s)}</span> mp.
        `;

    } else {
        // Nincs szünet → ELREJTÉS
        box.style.display = "none";
    }
}


function updateAll() {
    const target = getTargetDate();
    updateMainCounter(target);
    updateDetailedBox(target);
    updateRemainingSpringBreak();  // <--- Ezt a nevet kell használni a kódodban is
}


// Első futtatás és frissítés másodpercenként
updateAll();
setInterval(updateAll, 1000);