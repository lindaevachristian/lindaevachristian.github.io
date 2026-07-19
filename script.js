// Coordinates for Baiturrahman, Banda Aceh
const LATITUDE = 5.553584;
const LONGITUDE = 95.317276;

// Multiple API endpoints untuk fallback
const API_ENDPOINTS = [
    // Aladhan API - Method 2 (ISNA)
    `https://api.aladhan.com/v1/timings?latitude=${LATITUDE}&longitude=${LONGITUDE}&method=2`,
    
    // Aladhan API - Method 4 (Kementerian Agama RI - lebih akurat untuk Indonesia)
    `https://api.aladhan.com/v1/timings?latitude=${LATITUDE}&longitude=${LONGITUDE}&method=4`,
    
    // Aladhan API - dengan tanggal hari ini
    `https://api.aladhan.com/v1/timings/${new Date().toISOString().split('T')[0]}?latitude=${LATITUDE}&longitude=${LONGITUDE}&method=4`
];

// Prayer names mapping
const PRAYER_NAMES = {
    Fajr: 'Subuh',
    Dhuhr: 'Zuhur',
    Asr: 'Ashar',
    Maghrib: 'Maghrib',
    Isha: 'Isya',
};

const PRAYER_ORDER = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

let prayerTimes = {};
let currentDate = new Date();
let currentApiIndex = 0;

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

// Helper: Format waktu ke 12 jam
function formatTime(timeStr) {
    if (!timeStr) return '--:--';
    try {
        const [hours, minutes] = timeStr.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        return `${hour12}:${minutes} ${ampm}`;
    } catch {
        return timeStr;
    }
}

// Helper: Dapatkan waktu sekarang HH:MM
function getCurrentTime() {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

// Format tanggal
function formatDate(date) {
    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    };
    return date.toLocaleDateString('id-ID', options);
}

// Cari waktu shalat berikutnya
function findNextPrayer(times) {
    const now = getCurrentTime();
    const prayerList = PRAYER_ORDER.map((key) => ({
        name: PRAYER_NAMES[key],
        key: key,
        time: times[key],
    }));

    for (const prayer of prayerList) {
        if (prayer.time > now) {
            return prayer;
        }
    }
    return { ...prayerList[0], isTomorrow: true };
}

// Update active card
function updateActivePrayer(nextPrayerKey) {
    elements.prayerCards.forEach((card) => {
        card.classList.remove('active');
        if (card.id === nextPrayerKey?.toLowerCase()) {
            card.classList.add('active');
        }
    });
}

// Fetch dengan timeout
async function fetchWithTimeout(url, timeout = 10000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    try {
        const response = await fetch(url, { 
            signal: controller.signal,
            mode: 'cors',
            headers: {
                'Accept': 'application/json'
            }
        });
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
}

// Fetch prayer times from API dengan fallback
async function fetchPrayerTimes() {
    try {
        // Tampilkan loading
        document.querySelectorAll('.time').forEach((el) => {
            el.textContent = '⏳';
        });
        elements.currentDate.textContent = 'Memuat data...';

        let data = null;
        let lastError = null;

        // Coba semua endpoint
        for (let i = 0; i < API_ENDPOINTS.length; i++) {
            try {
                const url = API_ENDPOINTS[i];
                console.log(`🔄 Mencoba endpoint ${i+1}: ${url}`);
                
                const response = await fetchWithTimeout(url);
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }
                
                const result = await response.json();
                
                if (result && result.data && result.data.timings) {
                    data = result;
                    console.log(`✅ Berhasil dari endpoint ${i+1}`);
                    break;
                }
            } catch (error) {
                console.warn(`❌ Endpoint ${i+1} gagal:`, error.message);
                lastError = error;
            }
        }

        if (!data) {
            throw new Error('Semua endpoint gagal. ' + (lastError?.message || ''));
        }

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

        // Update waktu
        const now = new Date();
        elements.lastUpdate.textContent = `Terakhir diperbarui: ${now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
        
        return data;
    } catch (error) {
        console.error('❌ Error fetching prayer times:', error);
        elements.lastUpdate.textContent = '⚠️ Gagal memperbarui data';
        
        // Tampilkan pesan error di card
        document.querySelectorAll('.time').forEach((el) => {
            el.textContent = '❌';
        });
        elements.currentDate.textContent = 'Gagal memuat data';
        
        return null;
    }
}

// Update UI
function updateUI() {
    if (!prayerTimes || Object.keys(prayerTimes).length === 0) return;

    elements.fajr.textContent = formatTime(prayerTimes.Fajr);
    elements.dhuhr.textContent = formatTime(prayerTimes.Dhuhr);
    elements.asr.textContent = formatTime(prayerTimes.Asr);
    elements.maghrib.textContent = formatTime(prayerTimes.Maghrib);
    elements.isha.textContent = formatTime(prayerTimes.Isha);

    const nextPrayer = findNextPrayer(prayerTimes);
    if (nextPrayer) {
        elements.nextPrayerName.textContent = nextPrayer.name;
        elements.nextPrayerTime.textContent = nextPrayer.isTomorrow
            ? `${formatTime(nextPrayer.time)} (Besok)`
            : formatTime(nextPrayer.time);
        updateActivePrayer(nextPrayer.key);
    }

    elements.currentDate.textContent = formatDate(currentDate);
}

// Auto-refresh
function startAutoRefresh() {
    setInterval(async () => {
        await fetchPrayerTimes();
    }, 300000); // 5 menit
}

// Refresh button
elements.refreshBtn.addEventListener('click', async () => {
    elements.refreshBtn.style.transform = 'rotate(360deg)';
    await fetchPrayerTimes();
    setTimeout(() => {
        elements.refreshBtn.style.transform = 'rotate(0deg)';
    }, 500);
});

// Initialize
async function init() {
    elements.currentDate.textContent = formatDate(currentDate);
    await fetchPrayerTimes();
    startAutoRefresh();

    // Update tanggal setiap menit
    setInterval(() => {
        const now = new Date();
        if (now.getDate() !== currentDate.getDate()) {
            currentDate = now;
            elements.currentDate.textContent = formatDate(currentDate);
        }
    }, 60000);
}

// Start
init();

console.log('🕌 Jadwal Shalat Banda Aceh - Baiturrahman');
console.log(`📍 Koordinat: ${LATITUDE}, ${LONGITUDE}`);
console.log('🔄 Auto-refresh setiap 5 menit');
