// Data Store
let drawData = JSON.parse(localStorage.getItem('totoMacauData')) || [];
let currentId = drawData.length > 0 ? Math.max(...drawData.map(d => d.id)) + 1 : 1;

// Sample Data
const sampleData = [
    { date: '2024-01-01', period: 'MACAU-001', numbers: [6, 1, 6, 4] },
    { date: '2024-01-02', period: 'MACAU-002', numbers: [2, 1, 6, 7] },
    { date: '2024-01-03', period: 'MACAU-003', numbers: [6, 7, 6, 1] },
    { date: '2024-01-04', period: 'MACAU-004', numbers: [9, 1, 1, 9] },
    { date: '2024-01-05', period: 'MACAU-005', numbers: [7, 2, 1, 6] },
    { date: '2024-01-06', period: 'MACAU-006', numbers: [0, 0, 8, 5] },
    { date: '2024-01-07', period: 'MACAU-007', numbers: [6, 6, 8, 9] },
    { date: '2024-01-08', period: 'MACAU-008', numbers: [5, 7, 1, 7] },
    { date: '2024-01-09', period: 'MACAU-009', numbers: [2, 2, 3, 1] },
    { date: '2024-01-10', period: 'MACAU-010', numbers: [3, 8, 0, 7] },
    { date: '2024-01-11', period: 'MACAU-011', numbers: [8, 2, 2, 7] },
    { date: '2024-01-12', period: 'MACAU-012', numbers: [3, 7, 9, 0] },
    { date: '2024-01-13', period: 'MACAU-013', numbers: [1, 1, 9, 4] },
    { date: '2024-01-14', period: 'MACAU-014', numbers: [1, 8, 2, 2] },
    { date: '2024-01-15', period: 'MACAU-015', numbers: [9, 3, 0, 5] }
];

// DOM Elements
const tableBody = document.getElementById('tableBody');
const hotNumbersList = document.getElementById('hotNumbersList');
const coldNumbersList = document.getElementById('coldNumbersList');
const frequencyChart = document.getElementById('frequencyChart');
const predictionResult = document.getElementById('predictionResult');
const predictionExplanation = document.getElementById('predictionExplanation');

// Initialize
function init() {
    renderTable();
    updateStats();
    analyzeData();
    generatePrediction();
}

// Add Draw
function addDraw() {
    const date = document.getElementById('drawDate').value;
    const period = document.getElementById('drawPeriod').value;
    const num1 = parseInt(document.getElementById('num1').value);
    const num2 = parseInt(document.getElementById('num2').value);
    const num3 = parseInt(document.getElementById('num3').value);
    const num4 = parseInt(document.getElementById('num4').value);

    if (!date || !period || isNaN(num1) || isNaN(num2) || isNaN(num3) || isNaN(num4)) {
        alert('Mohon lengkapi semua data!');
        return;
    }

    if (num1 < 0 || num1 > 9 || num2 < 0 || num2 > 9 || num3 < 0 || num3 > 9 || num4 < 0 || num4 > 9) {
        alert('Angka harus antara 0-9!');
        return;
    }

    drawData.push({
        id: currentId++,
        date: date,
        period: period,
        numbers: [num1, num2, num3, num4]
    });

    saveData();
    renderTable();
    updateStats();
    analyzeData();
    generatePrediction();

    // Clear inputs
    document.getElementById('num1').value = '';
    document.getElementById('num2').value = '';
    document.getElementById('num3').value = '';
    document.getElementById('num4').value = '';
}

// Delete Draw
function deleteDraw(id) {
    drawData = drawData.filter(d => d.id !== id);
    saveData();
    renderTable();
    updateStats();
    analyzeData();
    generatePrediction();
}

// Load Sample Data
function loadSampleData() {
    if (drawData.length > 0) {
        if (!confirm('Data saat ini akan diganti. Lanjutkan?')) return;
    }
    
    drawData = sampleData.map((data, index) => ({
        id: index + 1,
        date: data.date,
        period: data.period,
        numbers: data.numbers
    }));
    currentId = drawData.length + 1;
    
    saveData();
    renderTable();
    updateStats();
    analyzeData();
    generatePrediction();
}

// Clear All Data
function clearAllData() {
    if (!confirm('Hapus semua data? Tindakan ini tidak bisa dibatalkan!')) return;
    drawData = [];
    currentId = 1;
    saveData();
    renderTable();
    updateStats();
    analyzeData();
    generatePrediction();
}

// Render Table
function renderTable() {
    if (drawData.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align: center; color: var(--text-secondary); padding: 2rem;">
                    Belum ada data. Tambahkan data atau muat data sample.
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = drawData.slice().reverse().map(data => `
        <tr>
            <td>${data.date}</td>
            <td>${data.period}</td>
            <td>
                <span style="display: flex; gap: 8px;">
                    ${data.numbers.map(n => `<span class="number-badge" style="width: 35px; height: 35px; font-size: 0.9rem;">${n}</span>`).join('')}
                </span>
            </td>
            <td>
                <button onclick="deleteDraw(${data.id})" class="action-btn">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Update Stats
function updateStats() {
    document.getElementById('totalDraws').textContent = drawData.length;
    
    if (drawData.length === 0) {
        document.getElementById('hotNumbers').textContent = '-';
        document.getElementById('coldNumbers').textContent = '-';
        return;
    }

    const frequency = getFrequency();
    const sorted = Object.entries(frequency).sort((a, b) => b[1] - a[1]);
    const hot = sorted.slice(0, 3).map(d => d[0]);
    const cold = sorted.slice(-3).map(d => d[0]);

    document.getElementById('hotNumbers').textContent = hot.join(', ');
    document.getElementById('coldNumbers').textContent = cold.join(', ');
}

// Get Frequency
function getFrequency() {
    const frequency = {};
    drawData.forEach(data => {
        data.numbers.forEach(num => {
            frequency[num] = (frequency[num] || 0) + 1;
        });
    });
    return frequency;
}

// Analyze Data
function analyzeData() {
    if (drawData.length === 0) {
        hotNumbersList.innerHTML = '<p class="empty-message">Belum ada data untuk dianalisis</p>';
        coldNumbersList.innerHTML = '<p class="empty-message">Belum ada data untuk dianalisis</p>';
        frequencyChart.innerHTML = '<p class="empty-message">Belum ada data untuk dianalisis</p>';
        return;
    }

    const frequency = getFrequency();
    const sorted = Object.entries(frequency).sort((a, b) => b[1] - a[1]);
    const hot = sorted.slice(0, 5);
    const cold = sorted.slice(-5).reverse();

    // Hot Numbers
    hotNumbersList.innerHTML = hot.map(([num, count]) => `
        <span class="number-badge hot">${num}<span class="count">×${count}</span></span>
    `).join('');

    // Cold Numbers
    coldNumbersList.innerHTML = cold.map(([num, count]) => `
        <span class="number-badge cold">${num}<span class="count">×${count}</span></span>
    ).join('');

    // Frequency Chart
    const allNumbers = Array.from({ length: 10 }, (_, i) => i);
    const maxCount = Math.max(...Object.values(frequency), 1);
    
    frequencyChart.innerHTML = allNumbers.map(num => {
        const count = frequency[num] || 0;
        const height = (count / maxCount) * 180;
        return `
            <div class="chart-bar-wrapper">
                <div class="chart-bar" style="height: ${height}px; background: linear-gradient(to top, ${count > 0 ? '#6C3CE1' : '#2a2a5a'}, ${count > 0 ? '#FF6B6B' : '#2a2a5a'});"></div>
                <span class="chart-label">${num}</span>
            </div>
        `;
    }).join('');
}

// Generate Prediction
function generatePrediction() {
    const method = document.querySelector('input[name="method"]:checked').value;
    
    if (drawData.length === 0) {
        predictionResult.innerHTML = '<p class="empty-message">Tambahkan data terlebih dahulu untuk prediksi yang akurat</p>';
        predictionExplanation.innerHTML = '';
        return;
    }

    const frequency = getFrequency();
    const sorted = Object.entries(frequency).sort((a, b) => b[1] - a[1]);
    const hotNumbers = sorted.slice(0, 4).map(d => parseInt(d[0]));
    const coldNumbers = sorted.slice(-4).map(d => parseInt(d[0]));

    let prediction = [];
    let explanation = '';

    switch(method) {
        case 'frequency':
            // Mix of hot and cold numbers
            const hot = hotNumbers.slice(0, 2);
            const cold = coldNumbers.slice(0, 2);
            prediction = [...hot, ...cold];
            explanation = `Prediksi berdasarkan frekuensi: Menggabungkan angka panas (${hot.join(', ')}) dan angka dingin (${cold.join(', ')}) untuk kombinasi seimbang.`;
            break;
            
        case 'pattern':
            // Find most common position patterns
            const posFreq = Array.from({ length: 4 }, () => ({}));
            drawData.forEach(data => {
                data.numbers.forEach((num, idx) => {
                    posFreq[idx][num] = (posFreq[idx][num] || 0) + 1;
                });
            });
            
            prediction = posFreq.map(pos => {
                const sortedPos = Object.entries(pos).sort((a, b) => b[1] - a[1]);
                return parseInt(sortedPos[0][0]);
            });
            explanation = `Prediksi berdasarkan pola posisi: Menganalisis angka yang paling sering muncul di setiap posisi (As, Kop, Kepala, Ekor).`;
            break;
            
        case 'combined':
            // Combined approach
            const hot2 = hotNumbers.slice(0, 2);
            const cold2 = coldNumbers.slice(0, 2);
            // Randomly select from hot and cold
            const combined = [...hot2, ...cold2];
            // Shuffle
            for (let i = combined.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [combined[i], combined[j]] = [combined[j], combined[i]];
            }
            prediction = combined;
            explanation = `Prediksi kombinasi: Menggabungkan metode frekuensi dan pola, dengan shuffle acak untuk variasi.`;
            break;
    }

    // Ensure 4 numbers
    while (prediction.length < 4) {
        const randomNum = Math.floor(Math.random() * 10);
        if (!prediction.includes(randomNum)) {
            prediction.push(randomNum);
        }
    }
    prediction = prediction.slice(0, 4);

    // Display prediction
    predictionResult.innerHTML = prediction.map(num => `
        <span class="prediction-number">${num}</span>
    `).join('');

    predictionExplanation.innerHTML = `
        <strong>Metode:</strong> ${method === 'frequency' ? 'Frekuensi' : method === 'pattern' ? 'Pola' : 'Kombinasi'}<br>
        <strong>Analisis:</strong> ${explanation}<br>
        <strong>Data Historis:</strong> ${drawData.length} undian dianalisis
    `;
}

// Save to LocalStorage
function saveData() {
    localStorage.setItem('totoMacauData', JSON.stringify(drawData));
}

// Event Listeners for number inputs
document.querySelectorAll('.number-inputs input').forEach((input, index, inputs) => {
    input.addEventListener('input', function() {
        if (this.value.length === 1 && index < inputs.length - 1) {
            inputs[index + 1].focus();
        }
        // Only allow single digit
        if (this.value.length > 1) {
            this.value = this.value.slice(-1);
        }
    });
});

// Initialize on load
document.addEventListener('DOMContentLoaded', init);

// Auto-generate prediction when method changes
document.querySelectorAll('input[name="method"]').forEach(radio => {
    radio.addEventListener('change', generatePrediction);
});
