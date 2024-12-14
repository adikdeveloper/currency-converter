// API sozlamalari
const API_KEY = '8ca7934bf466570063357080';
const BASE_URL = 'https://v6.exchangerate-api.com/v6';

// HTML elementlarni tanlab olish
const amountInput = document.getElementById('amount');
const fromSelect = document.getElementById('fromCurrency');
const toSelect = document.getElementById('toCurrency');
const resultDiv = document.getElementById('result');
const lastUpdatedDiv = document.getElementById('lastUpdated');
const swapBtn = document.getElementById('swapBtn');
const ctx = document.getElementById('rateChart').getContext('2d');

// Grafik sozlamalari va yaratish
let rateChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: [], // Sana belgilari
        datasets: [{
            label: 'Valyuta kursi',
            data: [], // Kurs ma'lumotlari
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.1)',
            borderWidth: 2,
            tension: 0.1,
            fill: true
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
            },
            tooltip: {
                mode: 'index',
                intersect: false,
            }
        },
        scales: {
            y: {
                beginAtZero: false,
                ticks: {
                    // Raqamlarni formatlash
                    callback: function(value) {
                        return value.toFixed(2);
                    }
                }
            },
            x: {
                grid: {
                    display: false
                }
            }
        },
        interaction: {
            mode: 'nearest',
            axis: 'x',
            intersect: false
        }
    }
});

// Hodisalarni tinglash
amountInput.addEventListener('input', convertCurrency);
fromSelect.addEventListener('change', handleCurrencyChange);
toSelect.addEventListener('change', handleCurrencyChange);
swapBtn.addEventListener('click', swapCurrencies);

// Valyutani konvertatsiya qilish
async function convertCurrency() {
    try {
        const amount = amountInput.value;
        const from = fromSelect.value;
        const to = toSelect.value;

        // Yuklanish holatini qo'shish
        resultDiv.classList.add('loading');

        // API dan ma'lumotlarni olish
        const response = await fetch(`${BASE_URL}/${API_KEY}/latest/${from}`);
        const data = await response.json();

        if (data.result === 'success') {
            const rate = data.conversion_rates[to];
            const result = (amount * rate).toFixed(2);
            
            // Natijani ko'rsatish
            resultDiv.textContent = `${amount} ${from} = ${result} ${to}`;
            updateLastUpdated();
            resultDiv.classList.remove('loading');
        } else {
            throw new Error(data['error-type']);
        }
    } catch (error) {
        handleError(error);
    }
}

// Kurs tarixi grafigini yangilash
async function updateRateHistory() {
    try {
        const from = fromSelect.value;
        const to = toSelect.value;
        
        // Oxirgi 7 kun sanalarini olish
        const dates = Array.from({length: 7}, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - i);
            return date.toISOString().split('T')[0];
        }).reverse();

        const rates = [];
        
        // Har bir sana uchun kurs ma'lumotlarini olish
        for (const date of dates) {
            const response = await fetch(
                `${BASE_URL}/${API_KEY}/history/${from}/${date}`
            );
            const data = await response.json();
            
            if (data.result === 'success') {
                rates.push(data.conversion_rates[to]);
            } else {
                throw new Error(data['error-type']);
            }
        }

        // Grafikni yangilash
        updateChart(dates, rates, from, to);
    } catch (error) {
        handleError(error);
    }
}

// Grafikni yangilash funksiyasi
function updateChart(dates, rates, from, to) {
    rateChart.data.labels = dates;
    rateChart.data.datasets[0].data = rates;
    rateChart.data.datasets[0].label = `${from} dan ${to} ga kurs`;
    rateChart.update();
}

// Valyuta o'zgartirilganda
function handleCurrencyChange() {
    convertCurrency();
    updateRateHistory();
}

// Valyutalarni almashtirish
function swapCurrencies() {
    const temp = fromSelect.value;
    fromSelect.value = toSelect.value;
    toSelect.value = temp;
    handleCurrencyChange();
}

// Oxirgi yangilanish vaqtini ko'rsatish
function updateLastUpdated() {
    const now = new Date();
    lastUpdatedDiv.textContent = `Oxirgi yangilanish: ${now.toLocaleTimeString()}`;
}

// Xatolarni qayta ishlash
function handleError(error) {
    console.error('Xatolik:', error);
    resultDiv.textContent = 'Xatolik yuz berdi. Qaytadan urinib ko\'ring.';
    resultDiv.classList.remove('loading');
    resultDiv.classList.add('error-message');
}

// Dastlabki yuklash
handleCurrencyChange();
