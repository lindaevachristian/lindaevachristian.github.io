// ============================================================
// DATA STORE
// ============================================================
let drawData = JSON.parse(localStorage.getItem('totoMacauProData')) || [];
let currentId = drawData.length > 0 ? Math.max(...drawData.map(d => d.id)) + 1 : 1;
let isLoadingHistory = false;

// ============================================================
// DOM REFS
// ============================================================
const $ = id => document.getElementById(id);
const tableBody = $('tableBody');
const hotNumbersList = $('hotNumbersList');
const coldNumbersList = $('coldNumbersList');
const frequencyChart = $('frequencyChart');
const movementChart = $('movementChart');
const predictionsContainer = $('predictionsContainer');
const dataStatus = $('dataStatus');
const dataCount = $('dataCount');
const latestPeriod = $('latestPeriod');

// ============================================================
// INIT
// ============================================================
function init() {
    const now = new Date();
    document.getElementById('drawDateTime').value = now.toISOString().slice(0, 16);
    
    renderTable();
    updateStats();
    analyzeAll();
    generateAllPredictions();
    
    if (drawData.length === 0) {
        setTimeout(loadHistoryData, 500);
    }
}

// ============================================================
// DATA LOADING
// ============================================================
function loadHistoryData() {
    if (isLoadingHistory) return;
    isLoadingHistory = true;
    dataStatus.textContent = '⏳ Memuat data...';
    dataStatus.className = 'data-status loading';
    
    fetch('histori.txt')
        .then(res => {
            if (!res.ok) throw new Error('File histori.txt tidak ditemukan');
            return res.text();
        })
        .then(text => {
            const lines = text.split('\n').filter(line => line.trim() !== '');
            const parsed = [];
            
            lines.forEach((line, idx) => {
                const parts = line.split('\t');
                if (parts.length === 3) {
                    const dateTime = parts[0].trim();
                    const period = parseInt(parts[1].trim());
                    const result = parts[2].trim().padStart(4, '0');
                    const numbers = result.split('').map(Number);
                    
                    if (numbers.length === 4 && numbers.every(n => !isNaN(n) && n >= 0 && n <= 9)) {
                        parsed.push({ id: idx + 1, dateTime, period, numbers, result });
                    }
                }
            });
            
            if (parsed.length === 0) throw new Error('Tidak ada data valid');
            
            if (drawData.length > 0 && !confirm(`Ganti ${drawData.length} data dengan ${parsed.length} data baru?`)) {
                isLoadingHistory = false;
                return;
            }
            
            drawData = parsed;
            currentId = drawData.length + 1;
            saveData();
            renderAll();
            dataStatus.textContent = `✅ ${parsed.length} data dimuat dari histori.txt`;
            dataStatus.className = 'data-status success';
        })
        .catch(err => {
            dataStatus.textContent = `❌ ${err.message}`;
            dataStatus.className = 'data-status error';
            if (drawData.length === 0) {
                setTimeout(() => {
                    if (confirm('Muat data sample sebagai alternatif?')) loadSampleData();
                }, 500);
            }
        })
        .finally(() => { isLoadingHistory = false; });
}

function loadSampleData() {
    if (drawData.length > 0 && !confirm('Ganti data saat ini?')) return;
    
    const sample = [
        { dateTime: '2026-07-04T13:09', period: 13645, result: '6164' },
        { dateTime: '2026-07-04T00:09', period: 13644, result: '2167' },
        { dateTime: '2026-07-03T23:08', period: 13643, result: '6761' },
        { dateTime: '2026-07-03T22:08', period: 13642, result: '9119' },
        { dateTime: '2026-07-03T19:07', period: 13641, result: '7216' },
        { dateTime: '2026-07-03T16:08', period: 13640, result: '0085' },
        { dateTime: '2026-07-03T13:08', period: 13639, result: '6689' },
        { dateTime: '2026-07-03T00:07', period: 13638, result: '5717' },
        { dateTime: '2026-07-02T23:07', period: 13637, result: '2231' },
        { dateTime: '2026-07-02T22:08', period: 13636, result: '3807' },
        { dateTime: '2026-07-02T19:07', period: 13635, result: '8227' },
        { dateTime: '2026-07-02T16:07', period: 13634, result: '3790' },
        { dateTime: '2026-07-02T13:08', period: 13633, result: '1194' },
        { dateTime: '2026-07-02T00:08', period: 13632, result: '1822' },
        { dateTime: '2026-07-01T23:08', period: 13631, result: '9305' },
        { dateTime: '2026-07-01T22:07', period: 13630, result: '0007' },
        { dateTime: '2026-07-01T19:19', period: 13629, result: '0370' },
        { dateTime: '2026-07-01T16:07', period: 13628, result: '8502' },
        { dateTime: '2026-07-01T13:09', period: 13627, result: '1970' },
        { dateTime: '2026-07-01T00:08', period: 13626, result: '5055' }
    ];
    
    drawData = sample.map((d, i) => ({
        id: i + 1,
        dateTime: d.dateTime,
        period: d.period,
        numbers: d.result.split('').map(Number),
        result: d.result
    }));
    currentId = drawData.length + 1;
    saveData();
    renderAll();
    dataStatus.textContent = `✅ ${drawData.length} data sample dimuat`;
    dataStatus.className = 'data-status success';
}

function clearAllData() {
    if (!confirm('Hapus semua data?')) return;
    drawData = [];
    currentId = 1;
    saveData();
    renderAll();
    dataStatus.textContent = '🗑️ Data dihapus';
    dataStatus.className = 'data-status';
}

function saveData() {
    localStorage.setItem('totoMacauProData', JSON.stringify(drawData));
}

// ============================================================
// CRUD OPERATIONS
// ============================================================
function addDraw() {
    const dateTime = document.getElementById('drawDateTime').value;
    const period = parseInt(document.getElementById('drawPeriod').value);
    const nums = [
        parseInt(document.getElementById('num1').value),
        parseInt(document.getElementById('num2').value),
        parseInt(document.getElementById('num3').value),
        parseInt(document.getElementById('num4').value)
    ];
    
    if (!dateTime || isNaN(period) || nums.some(n => isNaN(n))) {
        alert('Lengkapi semua data!');
        return;
    }
    if (nums.some(n => n < 0 || n > 9)) {
        alert('Angka harus 0-9!');
        return;
    }
    if (drawData.some(d => d.period === period)) {
        alert(`Periode ${period} sudah ada!`);
        return;
    }
    
    drawData.push({
        id: currentId++,
        dateTime,
        period,
        numbers: nums,
        result: nums.join('')
    });
    
    saveData();
    renderAll();
    ['num1','num2','num3','num4','drawPeriod'].forEach(id => document.getElementById(id).value = '');
    dataStatus.textContent = '✅ Data ditambahkan';
    dataStatus.className = 'data-status success';
}

function deleteDraw(id) {
    drawData = drawData.filter(d => d.id !== id);
    saveData();
    renderAll();
}

// ============================================================
// RENDER FUNCTIONS
// ============================================================
function renderAll() {
    renderTable();
    updateStats();
    analyzeAll();
    generateAllPredictions();
}

function renderTable() {
    if (drawData.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:2rem;color:var(--text-secondary);">Belum ada data</td></tr>`;
        dataCount.textContent = '(0 data)';
        return;
    }
    
    const sorted = [...drawData].sort((a, b) => b.period - a.period);
    tableBody.innerHTML = sorted.map(d => `
        <tr>
            <td>${d.dateTime.replace('T', ' ')}</td>
            <td>${d.period}</td>
            <td>
                <span style="display:flex;gap:8px;">
                    ${d.numbers.map(n => `<span class="number-badge" style="width:35px;height:35px;font-size:0.9rem;">${n}</span>`).join('')}
                </span>
            </td>
            <td><button onclick="deleteDraw(${d.id})" class="action-btn"><i class="fas fa-trash"></i></button></td>
        </tr>
    `).join('');
    dataCount.textContent = `(${drawData.length} data)`;
}

function updateStats() {
    document.getElementById('totalDraws').textContent = drawData.length;
    if (drawData.length === 0) {
        ['hotNumbers','coldNumbers','latestPeriod'].forEach(id => document.getElementById(id).textContent = '-');
        return;
    }
    
    const freq = getFrequency();
    const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
    document.getElementById('hotNumbers').textContent = sorted.slice(0, 3).map(d => d[0]).join(', ');
    document.getElementById('coldNumbers').textContent = sorted.slice(-3).map(d => d[0]).join(', ');
    
    const latest = drawData.reduce((max, d) => d.period > max.period ? d : max, drawData[0]);
    document.getElementById('latestPeriod').textContent = latest.period;
}

// ============================================================
// FREQUENCY ANALYSIS
// ============================================================
function getFrequency(data = drawData) {
    const freq = {};
    data.forEach(d => d.numbers.forEach(n => { freq[n] = (freq[n] || 0) + 1; }));
    return freq;
}

function analyzeAll() {
    analyzeFrequency();
    analyzeMovement();
    analyzePatterns();
}

function analyzeFrequency() {
    if (drawData.length === 0) {
        ['hotNumbersList','coldNumbersList','frequencyChart'].forEach(id => {
            document.getElementById(id).innerHTML = '<p class="empty-message">Belum ada data</p>';
        });
        return;
    }
    
    const freq = getFrequency();
    const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
    const hot = sorted.slice(0, 5);
    const cold = sorted.slice(-5).reverse();
    
    hotNumbersList.innerHTML = hot.map(([n, c]) => 
        `<span class="number-badge hot">${n}<span class="count">×${c}</span></span>`
    ).join('');
    
    coldNumbersList.innerHTML = cold.map(([n, c]) => 
        `<span class="number-badge cold">${n}<span class="count">×${c}</span></span>`
    ).join('');
    
    const allNums = Array.from({length:10}, (_,i) => i);
    const max = Math.max(...Object.values(freq), 1);
    frequencyChart.innerHTML = allNums.map(n => {
        const c = freq[n] || 0;
        const h = (c / max) * 180;
        const color = c > 0 ? (c >= max/2 ? '#FF6B6B' : '#4ECDC4') : '#2a2a5a';
        return `
            <div class="chart-bar-wrapper">
                <div class="chart-bar" style="height:${h}px;background:${color};"></div>
                <span class="chart-label">${n}</span>
                <span class="chart-label" style="font-size:0.6rem;opacity:0.6;">${c}</span>
            </div>
        `;
    }).join('');
}

// ============================================================
// MOVEMENT ANALYSIS
// ============================================================
function analyzeMovement() {
    if (drawData.length < 2) {
        ['trendUp','trendDown','movementChart'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = '<p class="empty-message">Minimal 2 data untuk analisis pergerakan</p>';
        });
        return;
    }
    
    const sorted = [...drawData].sort((a, b) => a.period - b.period);
    const movements = {};
    
    for (let i = 1; i < sorted.length; i++) {
        const prev = sorted[i-1].numbers;
        const curr = sorted[i].numbers;
        for (let j = 0; j < 4; j++) {
            const diff = curr[j] - prev[j];
            const key = `${curr[j]}`;
            if (!movements[key]) movements[key] = { up: 0, down: 0, total: 0 };
            movements[key].total++;
            if (diff > 0) movements[key].up++;
            else if (diff < 0) movements[key].down++;
        }
    }
    
    const allNums = Array.from({length:10}, (_,i) => i);
    const trendUp = allNums.filter(n => movements[n] && movements[n].up > movements[n].down);
    const trendDown = allNums.filter(n => movements[n] && movements[n].down > movements[n].up);
    
    document.getElementById('trendUp').innerHTML = trendUp.length ? 
        trendUp.map(n => `<span class="number-badge" style="border-color:var(--success);color:var(--success);">${n}</span>`).join('') :
        '<p style="color:var(--text-secondary);">Tidak ada tren naik</p>';
    
    document.getElementById('trendDown').innerHTML = trendDown.length ?
        trendDown.map(n => `<span class="number-badge" style="border-color:var(--secondary);color:var(--secondary);">${n}</span>`).join('') :
        '<p style="color:var(--text-secondary);">Tidak ada tren turun</p>';
    
    // Movement chart - show last 20 draws
    const recent = sorted.slice(-20);
    const labels = recent.map(d => d.period);
    const data = recent.map(d => d.numbers[0]); // Use first digit as example
    
    movementChart.innerHTML = recent.map((d, idx) => {
        const h = 50 + (d.numbers[0] / 9) * 150;
        const color = idx > 0 && d.numbers[0] > recent[idx-1].numbers[0] ? '#4ECDC4' : 
                     idx > 0 && d.numbers[0] < recent[idx-1].numbers[0] ? '#FF6B6B' : '#6C3CE1';
        return `
            <div class="chart-bar-wrapper">
                <div class="chart-bar" style="height:${h}px;background:${color};width:100%;max-width:20px;"></div>
                <span class="chart-label" style="font-size:0.6rem;">${d.period}</span>
            </div>
        `;
    }).join('');
}

// ============================================================
// PATTERN ANALYSIS (Index, Mistis, Tenson, Shio)
// ============================================================
function analyzePatterns() {
    if (drawData.length === 0) {
        ['indexPattern','mysticalPattern','tensonPattern','shioPattern'].forEach(id => {
            document.getElementById(id).innerHTML = '<p style="color:var(--text-secondary);">Belum ada data</p>';
        });
        return;
    }
    
    const sorted = [...drawData].sort((a, b) => a.period - b.period);
    const last = sorted[sorted.length - 1];
    const prev = sorted.length > 1 ? sorted[sorted.length - 2] : null;
    
    // INDEX PATTERN
    const indexMap = { 0: '0', 1: '1', 2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8', 9: '9' };
    const indexPattern = last.numbers.map(n => indexMap[n] || n).join(' - ');
    document.getElementById('indexPattern').innerHTML = `
        <div style="display:flex;gap:12px;flex-wrap:wrap;">
            <span style="background:var(--bg-card);padding:8px 16px;border-radius:8px;border:1px solid var(--border-color);">
                <strong>Index:</strong> ${indexPattern}
            </span>
            <span style="background:var(--bg-card);padding:8px 16px;border-radius:8px;border:1px solid var(--border-color);">
                <strong>Total:</strong> ${last.numbers.reduce((a,b) => a+b, 0)}
            </span>
        </div>
        <div style="margin-top:8px;color:var(--text-secondary);font-size:0.85rem;">
            Periode: ${last.period} | Result: ${last.result}
        </div>
    `;
    
    // MISTICAL PATTERN
    const mistisMap = { 0: 5, 1: 6, 2: 7, 3: 8, 4: 9, 5: 0, 6: 1, 7: 2, 8: 3, 9: 4 };
    const mistisPattern = last.numbers.map(n => mistisMap[n] || n).join(' - ');
    document.getElementById('mysticalPattern').innerHTML = `
        <div style="display:flex;gap:12px;flex-wrap:wrap;">
            <span style="background:var(--bg-card);padding:8px 16px;border-radius:8px;border:1px solid var(--border-color);">
                <strong>Mistis:</strong> ${mistisPattern}
            </span>
            <span style="background:var(--bg-card);padding:8px 16px;border-radius:8px;border:1px solid var(--border-color);">
                <strong>Selisih:</strong> ${last.numbers.map(n => Math.abs(n - mistisMap[n])).join(' - ')}
            </span>
        </div>
    `;
    
    // TENSON PATTERN
    const tensonMap = { 0: 7, 1: 8, 2: 9, 3: 0, 4: 1, 5: 2, 6: 3, 7: 4, 8: 5, 9: 6 };
    const tensonPattern = last.numbers.map(n => tensonMap[n] || n).join(' - ');
    document.getElementById('tensonPattern').innerHTML = `
        <div style="display:flex;gap:12px;flex-wrap:wrap;">
            <span style="background:var(--bg-card);padding:8px 16px;border-radius:8px;border:1px solid var(--border-color);">
                <strong>Tenson:</strong> ${tensonPattern}
            </span>
            <span style="background:var(--bg-card);padding:8px 16px;border-radius:8px;border:1px solid var(--border-color);">
                <strong>Pola:</strong> ${last.numbers.map(n => n % 2 === 0 ? 'Genap' : 'Ganjil').join(' - ')}
            </span>
        </div>
    `;
    
    // SHIO PATTERN
    const shioMap = {
        0: 'Tikus', 1: 'Kerbau', 2: 'Harimau', 3: 'Kelinci', 
        4: 'Naga', 5: 'Ular', 6: 'Kuda', 7: 'Kambing',
        8: 'Monyet', 9: 'Ayam'
    };
    const shioPattern = last.numbers.map(n => shioMap[n] || n).join(' - ');
    const shioElements = ['Kayu', 'Api', 'Tanah', 'Logam', 'Air'];
    const elementPattern = last.numbers.map(n => shioElements[n % 5]).join(' - ');
    
    document.getElementById('shioPattern').innerHTML = `
        <div style="display:flex;gap:12px;flex-wrap:wrap;">
            <span style="background:var(--bg-card);padding:8px 16px;border-radius:8px;border:1px solid var(--border-color);">
                <strong>Shio:</strong> ${shioPattern}
            </span>
            <span style="background:var(--bg-card);padding:8px 16px;border-radius:8px;border:1px solid var(--border-color);">
                <strong>Elemen:</strong> ${elementPattern}
            </span>
        </div>
        <div style="margin-top:8px;color:var(--text-secondary);font-size:0.85rem;">
            Berdasarkan angka ${last.numbers.join(', ')} → Shio ${last.numbers.map(n => shioMap[n]).join(' - ')}
        </div>
    `;
}

// ============================================================
// TAB SWITCHING
// ============================================================
function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    
    document.querySelector(`.tab-btn[onclick*="${tab}"]`).classList.add('active');
    document.getElementById(`tab-${tab}`).classList.add('active');
}

// ============================================================
// 30 SET PREDICTIONS - 12 METHODS
// ============================================================
function generateAllPredictions() {
    if (drawData.length === 0) {
        predictionsContainer.innerHTML = `
            <div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--text-secondary);">
                <i class="fas fa-database" style="font-size:3rem;display:block;margin-bottom:1rem;"></i>
                Tambahkan data terlebih dahulu untuk menghasilkan prediksi
            </div>
        `;
        return;
    }
    
    const method = document.getElementById('mainMethod').value;
    const sets = generate30Sets(method);
    
    predictionsContainer.innerHTML = sets.map((set, idx) => `
        <div class="prediction-set">
            <div class="set-header">
                <span class="set-number">#${idx + 1}</span>
                <span class="set-method">${set.method}</span>
            </div>
            <div class="set-numbers">
                ${set.numbers.map(n => `<span class="pnum">${n}</span>`).join('')}
            </div>
            <div class="set-detail">
                ${set.detail || 'Analisis statistik'}
                ${set.confidence ? ` | Confidence: ${set.confidence}%` : ''}
            </div>
        </div>
    `).join('');
}

function generate30Sets(method) {
    const sets = [];
    const freq = getFrequency();
    const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
    const hotNumbers = sorted.slice(0, 5).map(d => parseInt(d[0]));
    const coldNumbers = sorted.slice(-5).map(d => parseInt(d[0]));
    const allNumbers = Array.from({length:10}, (_,i) => i);
    
    // Get last result for pattern analysis
    const sortedData = [...drawData].sort((a, b) => a.period - b.period);
    const lastResult = sortedData[sortedData.length - 1];
    const prevResult = sortedData.length > 1 ? sortedData[sortedData.length - 2] : null;
    
    // Define 12 methods
    const methods = [
        { name: 'Frekuensi Panas', fn: () => shuffleArray([...hotNumbers.slice(0, 4)]) },
        { name: 'Frekuensi Dingin', fn: () => shuffleArray([...coldNumbers.slice(0, 4)]) },
        { name: 'Kombinasi Panas-Dingin', fn: () => shuffleArray([...hotNumbers.slice(0, 2), ...coldNumbers.slice(0, 2)]) },
        { name: 'Pola Posisi', fn: () => getPositionPattern() },
        { name: 'Index Pattern', fn: () => getIndexPattern() },
        { name: 'Mistis Pattern', fn: () => getMysticalPattern() },
        { name: 'Tenson Pattern', fn: () => getTensonPattern() },
        { name: 'Shio Pattern', fn: () => getShioPattern() },
        { name: 'Trend Naik', fn: () => getTrendUp() },
        { name: 'Trend Turun', fn: () => getTrendDown() },
        { name: 'Rotasi Angka', fn: () => getRotationPattern() },
        { name: 'Keseimbangan Genap-Ganjil', fn: () => getBalancedPattern() }
    ];
    
    // Generate 30 sets using all methods
    for (let i = 0; i < 30; i++) {
        let numbers;
        let methodName;
        let detail;
        let confidence;
        
        // Use specific method or cycle through all
        let methodIndex;
        if (method === 'combined') {
            methodIndex = i % methods.length;
        } else {
            // Find method by name
            const found = methods.findIndex(m => m.name.toLowerCase().includes(method));
            methodIndex = found >= 0 ? found : i % methods.length;
        }
        
        const m = methods[methodIndex];
        numbers = m.fn();
        methodName = m.name;
        
        // Add some variation
        if (i > 0 && i % 3 === 0) {
            // Swap one number for variation
            const idx = Math.floor(Math.random() * numbers.length);
            const available = allNumbers.filter(n => !numbers.includes(n));
            if (available.length > 0) {
                numbers[idx] = available[Math.floor(Math.random() * available.length)];
            }
        }
        
        // Ensure 4 unique numbers
        numbers = ensureUnique(numbers);
        while (numbers.length < 4) {
            const n = Math.floor(Math.random() * 10);
            if (!numbers.includes(n)) numbers.push(n);
        }
        numbers = numbers.slice(0, 4);
        
        // Calculate confidence based on frequency
        const freqSum = numbers.reduce((sum, n) => sum + (freq[n] || 0), 0);
        confidence = Math.min(95, Math.round(40 + (freqSum / (drawData.length * 4)) * 100));
        
        detail = `Metode ${methodName} | Periode: ${lastResult ? lastResult.period : '-'}`;
        
        sets.push({
            numbers: numbers,
            method: methodName,
            detail: detail,
            confidence: confidence
        });
    }
    
    return sets;
}

// ============================================================
// HELPER FUNCTIONS FOR PREDICTION METHODS
// ============================================================
function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function ensureUnique(arr) {
    return [...new Set(arr)];
}

function getPositionPattern() {
    const sorted = [...drawData].sort((a, b) => a.period - b.period);
    const posFreq = Array.from({length: 4}, () => ({}));
    sorted.forEach(d => {
        d.numbers.forEach((n, idx) => {
            posFreq[idx][n] = (posFreq[idx][n] || 0) + 1;
        });
    });
    return posFreq.map(pos => {
        const sortedPos = Object.entries(pos).sort((a, b) => b[1] - a[1]);
        return parseInt(sortedPos[0]?.[0] || Math.floor(Math.random() * 10));
    });
}

function getIndexPattern() {
    const sorted = [...drawData].sort((a, b) => a.period - b.period);
    const last = sorted[sorted.length - 1];
    const indexMap = { 0: 5, 1: 6, 2: 7, 3: 8, 4: 9, 5: 0, 6: 1, 7: 2, 8: 3, 9: 4 };
    return last.numbers.map(n => indexMap[n] || n);
}

function getMysticalPattern() {
    const sorted = [...drawData].sort((a, b) => a.period - b.period);
    const last = sorted[sorted.length - 1];
    const mistisMap = { 0: 5, 1: 6, 2: 7, 3: 8, 4: 9, 5: 0, 6: 1, 7: 2, 8: 3, 9: 4 };
    const result = last.numbers.map(n => mistisMap[n] || n);
    // Add variation
    if (Math.random() > 0.5) {
        const idx = Math.floor(Math.random() * result.length);
        result[idx] = (result[idx] + 1) % 10;
    }
    return result;
}

function getTensonPattern() {
    const sorted = [...drawData].sort((a, b) => a.period - b.period);
    const last = sorted[sorted.length - 1];
    const tensonMap = { 0: 7, 1: 8, 2: 9, 3: 0, 4: 1, 5: 2, 6: 3, 7: 4, 8: 5, 9: 6 };
    const result = last.numbers.map(n => tensonMap[n] || n);
    // Add variation
    if (Math.random() > 0.5) {
        const idx = Math.floor(Math.random() * result.length);
        result[idx] = (result[idx] + 2) % 10;
    }
    return result;
}

function getShioPattern() {
    const sorted = [...drawData].sort((a, b) => a.period - b.period);
    const last = sorted[sorted.length - 1];
    // Shio mapping: 0=Tikus,1=Kerbau,2=Harimau,3=Kelinci,4=Naga,5=Ular,6=Kuda,7=Kambing,8=Monyet,9=Ayam
    const result = last.numbers.map(n => {
        // Use shio rotation
        const shioNum = (n + 2) % 10;
        return shioNum;
    });
    // Ensure unique
    return ensureUnique(result);
}

function getTrendUp() {
    const sorted = [...drawData].sort((a, b) => a.period - b.period);
    const movements = {};
    for (let i = 1; i < sorted.length; i++) {
        const prev = sorted[i-1].numbers;
        const curr = sorted[i].numbers;
        for (let j = 0; j < 4; j++) {
            const diff = curr[j] - prev[j];
            if (diff > 0) {
                movements[curr[j]] = (movements[curr[j]] || 0) + 1;
            }
        }
    }
    const sortedMov = Object.entries(movements).sort((a, b) => b[1] - a[1]);
    const top = sortedMov.slice(0, 4).map(d => parseInt(d[0]));
    while (top.length < 4) {
        const n = Math.floor(Math.random() * 10);
        if (!top.includes(n)) top.push(n);
    }
    return top.slice(0, 4);
}

function getTrendDown() {
    const sorted = [...drawData].sort((a, b) => a.period - b.period);
    const movements = {};
    for (let i = 1; i < sorted.length; i++) {
        const prev = sorted[i-1].numbers;
        const curr = sorted[i].numbers;
        for (let j = 0; j < 4; j++) {
            const diff = curr[j] - prev[j];
            if (diff < 0) {
                movements[prev[j]] = (movements[prev[j]] || 0) + 1;
            }
        }
    }
    const sortedMov = Object.entries(movements).sort((a, b) => b[1] - a[1]);
    const top = sortedMov.slice(0, 4).map(d => parseInt(d[0]));
    while (top.length < 4) {
        const n = Math.floor(Math.random() * 10);
        if (!top.includes(n)) top.push(n);
    }
    return top.slice(0, 4);
}

function getRotationPattern() {
    const sorted = [...drawData].sort((a, b) => a.period - b.period);
    const last = sorted[sorted.length - 1];
    const result = last.numbers.map(n => (n + 3) % 10);
    // Rotate again
    if (Math.random() > 0.5) {
        return result.map(n => (n + 2) % 10);
    }
    return result;
}

function getBalancedPattern() {
    const evens = [0, 2, 4, 6, 8];
    const odds = [1, 3, 5, 7, 9];
    const result = [];
    // 2 even, 2 odd
    const shuffledEvens = shuffleArray([...evens]);
    const shuffledOdds = shuffleArray([...odds]);
    result.push(shuffledEvens[0], shuffledEvens[1], shuffledOdds[0], shuffledOdds[1]);
    return result;
}

// ============================================================
// EXPORT PREDICTIONS
// ============================================================
function exportPredictions() {
    const sets = document.querySelectorAll('.prediction-set');
    if (sets.length === 0) {
        alert('Tidak ada prediksi untuk diexport');
        return;
    }
    
    let text = '=== TOTOMACAU PRO - 30 SET PREDIKSI ===\n';
    text += `Tanggal: ${new Date().toLocaleDateString('id-ID')}\n`;
    text += `Total Data: ${drawData.length} undian\n`;
    text += '='.repeat(50) + '\n\n';
    
    sets.forEach((set, idx) => {
        const nums = set.querySelectorAll('.pnum');
        const method = set.querySelector('.set-method')?.textContent || 'Unknown';
        const numbers = Array.from(nums).map(el => el.textContent).join(' ');
        text += `${String(idx + 1).padStart(2, '0')}. ${numbers}  |  ${method}\n`;
    });
    
    text += '\n' + '='.repeat(50) + '\n';
    text += '⚠️ Prediksi hanya berdasarkan analisis statistik, tidak menjamin kemenangan.\n';
    text += 'Gunakan dengan bijak dan bertanggung jawab.\n';
    
    // Download as text file
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `prediksi_totomacau_${new Date().toISOString().slice(0,10)}.txt`;
    link.click();
    URL.revokeObjectURL(link.href);
}

// ============================================================
// EVENT LISTENERS
// ============================================================
document.querySelectorAll('.number-inputs input').forEach((input, idx, inputs) => {
    input.addEventListener('input', function() {
        if (this.value.length === 1 && idx < inputs.length - 1) {
            inputs[idx + 1].focus();
        }
        if (this.value.length > 1) this.value = this.value.slice(-1);
    });
});

document.querySelectorAll('input[name="method"]').forEach(radio => {
    radio.addEventListener('change', generateAllPredictions);
});

// ============================================================
// START
// ============================================================
document.addEventListener('DOMContentLoaded', init);
