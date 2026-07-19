// Coordinates for Baiturrahman, Banda Aceh
const LATITUDE = 5.553584;
const LONGITUDE = 95.317276;

// API Configuration
const API_URL = `https://api.aladhan.com/v1/timings?latitude=${LATITUDE}&longitude=${LONGITUDE}&method=2`;

// Prayer names mapping
const PRAYER_NAMES = {
    Fajr: 'Subuh',
    Dhuhr: 'Zuhur',
    Asr: 'Ashar',
    Maghrib: 'Maghrib',
    Isha: 'Isya',
};

// Prayer order for next prayer calculation
const PRAYER_ORDER = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

let prayerTimes = {};
let currentDate = new Date();

// DOM Elements
const elements = {
    fajr: document.getElementById('fajrTime'),
    dhuhr: document.getElementById('dhuhrTime'),
    asr: document.getElementById('asrTime'),
    maghrib: document.getElementById('maghribTime'),
    isha: document.getElementById('ishaTime'),
    nextPrayerName: document.getElementById('nextPrayerName'),
    nextPrayerTime: document.getElementById('nextPrayerTime'),
    currentDate: document.getElementById('currentDate'),
    lastUpdate: document.getElementById('lastUpdate'),
    refreshBtn: document.getElementById('refreshBtn'),
    prayerCards: document.querySelectorAll('.prayer-card'),
};

// Helper function to format time
function formatTime(timeStr) {
    if (!timeStr) return '--:--';
    // Convert from 24h to 12h format
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
}

// Helper function to get current time in HH:MM format
function getCurrentTime() {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

// Format date
function formatDate(date) {
    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    };
    return date.toLocaleDateString('id-ID', options);
}

// Find next prayer
function findNextPrayer(times) {
    const now = getCurrentTime();
    const prayerList = PRAYER_ORDER.map((key) => ({
        name: PRAYER_NAMES[key],
        key: key,
        time: times[key],
    }));

    // Find the next prayer
    for (const prayer of prayerList) {
        if (prayer.time > now) {
            return prayer;
        }
    }

    // If all prayers passed, return the first prayer of tomorrow
    return { ...prayerList[0], isTomorrow: true };
}

// Update active prayer card
function updateActivePrayer(nextPrayerKey) {
    elements.prayerCards.forEach((card) => {
        card.classList.remove('active');
        const cardId = card.id;
        if (cardId === nextPrayerKey?.toLowerCase()) {
            card.classList.add('active');
        }
    });
}

// Fetch prayer times from API
async function fetchPrayerTimes() {
    try {
        // Show loading state
        document.querySelectorAll('.time').forEach((el) => {
            el.textContent = '--:--';
        });

        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const timings = data.data.timings;

        // Store prayer times
        prayerTimes = {
            Fajr: timings.Fajr,
            Dhuhr: timings.Dhuhr,
            Asr: timings.Asr,
            Maghrib: timings.Maghrib,
            Isha: timings.Isha,
        };

        // Update UI
        updateUI();

        // Update last update time
        const now = new Date();
        elements.lastUpdate.textContent = `Terakhir diperbarui: ${now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;

        return data;
    } catch (error) {
        console.error('Error fetching prayer times:', error);
        elements.lastUpdate.textContent = 'Gagal memperbarui data. Coba lagi nanti.';
        // Show error state
        document.querySelectorAll('.time').forEach((el) => {
            el.textContent = 'Error';
        });
        return null;
    }
}

// Update UI with prayer times
function updateUI() {
    if (!prayerTimes || Object.keys(prayerTimes).length === 0) return;

    // Update each prayer time
    elements.fajr.textContent = formatTime(prayerTimes.Fajr);
    elements.dhuhr.textContent = formatTime(prayerTimes.Dhuhr);
    elements.asr.textContent = formatTime(prayerTimes.Asr);
    elements.maghrib.textContent = formatTime(prayerTimes.Maghrib);
    elements.isha.textContent = formatTime(prayerTimes.Isha);

    // Update next prayer
    const nextPrayer = findNextPrayer(prayerTimes);
    if (nextPrayer) {
        elements.nextPrayerName.textContent = nextPrayer.name;
        elements.nextPrayerTime.textContent = nextPrayer.isTomorrow
            ? `${formatTime(nextPrayer.time)} (Besok)`
            : formatTime(nextPrayer.time);

        // Update active card
        updateActivePrayer(nextPrayer.key);
    }

    // Update date
    elements.currentDate.textContent = formatDate(currentDate);
}

// Auto-refresh every 5 minutes
function startAutoRefresh() {
    // Refresh every 5 minutes (300000 ms)
    setInterval(async () => {
        await fetchPrayerTimes();
    }, 300000);
}

// Handle refresh button click
elements.refreshBtn.addEventListener('click', async () => {
    elements.refreshBtn.style.transform = 'rotate(360deg)';
    await fetchPrayerTimes();
    setTimeout(() => {
        elements.refreshBtn.style.transform = 'rotate(0deg)';
    }, 500);
});

// Initialize
async function init() {
    // Set initial date
    elements.currentDate.textContent = formatDate(currentDate);

    // Fetch initial data
    await fetchPrayerTimes();

    // Start auto-refresh
    startAutoRefresh();

    // Update date at midnight
    setInterval(() => {
        const now = new Date();
        if (now.getDate() !== currentDate.getDate()) {
            currentDate = now;
            elements.currentDate.textContent = formatDate(currentDate);
        }
    }, 60000);
}

// Start the app
init();

// Log success
console.log('🕌 Jadwal Shalat Banda Aceh - Baiturrahman');
console.log(`📍 Koordinat: ${LATITUDE}, ${LONGITUDE}`);
console.log('🔄 Data akan diperbarui otomatis setiap 5 menit');
