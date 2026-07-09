// ====================================
// Smart Kandang Ayam Dashboard
// ====================================

let ESP_IP = localStorage.getItem('esp_ip') || '192.168.1.100';
let currentTab = 'dashboard';

// ====================================
// TAB SWITCHING
// ====================================
function switchTab(tabName) {
    currentTab = tabName;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    event.target.classList.add('active');
    document.getElementById('tab-' + tabName).classList.add('active');
}

// ====================================
// SAVE IP
// ====================================
function saveIP() {
    const ip = document.getElementById('espIP').value.trim();
    if (ip) {
        ESP_IP = ip;
        localStorage.setItem('esp_ip', ip);
        alert('✅ IP disimpan: ' + ip);
        fetchData();
    }
}

// ====================================
// FETCH DATA
// ====================================
function fetchData() {
    fetch(`http://${ESP_IP}/api/data`, {
        signal: AbortSignal.timeout(5000)
    })
    .then(res => res.json())
    .then(data => {
        updateUI(data);
        setConnStatus(true);
    })
    .catch(err => {
        console.error('Error:', err);
        setConnStatus(false);
    });
}

// ====================================
// UPDATE UI
// ====================================
function updateUI(data) {
    // Sensor values
    document.getElementById('suhu').textContent = data.suhu.toFixed(1) + '°C';
    document.getElementById('kelembaban').textContent = data.kelembaban.toFixed(1) + '%';
    document.getElementById('gas').textContent = data.gas;
    document.getElementById('gerakan').textContent = data.gerakan ? '⚠️ AKTIF' : '✅ Tenang';
    
    // Progress bars
    document.getElementById('progSuhu').style.width = Math.min(data.suhu / 50 * 100, 100) + '%';
    document.getElementById('progKelembaban').style.width = data.kelembaban + '%';
    document.getElementById('progGas').style.width = Math.min(data.gas / 4095 * 100, 100) + '%';
    
    // Thresholds display
    document.getElementById('threshSuhuDisplay').textContent = data.suhuThreshold.toFixed(1);
    document.getElementById('threshGasDisplay').textContent = data.gasThreshold;
    document.getElementById('infoSuhu').textContent = data.suhuThreshold.toFixed(1);
    document.getElementById('infoGas').textContent = data.gasThreshold;
    
    // Update slider/input nilai (hanya kalau tab settings tidak aktif)
    if (currentTab !== 'settings') {
        document.getElementById('suhuSlider').value = data.suhuThreshold;
        document.getElementById('suhuInput').value = data.suhuThreshold;
        document.getElementById('suhuSliderValue').textContent = data.suhuThreshold.toFixed(1);
        
        document.getElementById('gasSlider').value = data.gasThreshold;
        document.getElementById('gasInput').value = data.gasThreshold;
        document.getElementById('gasSliderValue').textContent = data.gasThreshold;
    }
    
    // WiFi
    document.getElementById('currentSSID').textContent = data.wifiSSID || '-';
    
    // Badges
    setBadge('badgeGerakan', data.gerakan, '🚶 Ada Aktivitas', 'Standby', data.gerakan ? 'badge-warn' : 'badge-off');
    setBadge('badgeKipas', data.kipas, '🌀 BERPUTAR', '⚫ MATI', data.kipas ? 'badge-on' : 'badge-off');
    setBadge('badgeLed', data.led, '🔴 MENYALA', '⚫ MATI', data.led ? 'badge-on' : 'badge-off');
    setBadge('badgeBuzzer', data.buzzer, '🔊 BUNYI', '⚫ DIAM', data.buzzer ? 'badge-warn' : 'badge-off');
    
    // Mode Kipas
    const modeNames = ['🤖 OTOMATIS', '✅ MANUAL ON', '⛔ MANUAL OFF'];
    document.getElementById('modeKipasText').textContent = modeNames[data.modeKipas];
    
    // Highlight active button kipas
    highlightActiveButton('btnKipasAuto', 'btnKipasOn', 'btnKipasOff', data.modeKipas);
    
    // Mode Buzzer
    const buzzerModeNames = ['🤖 OTOMATIS', '🔕 MUTE (Manual OFF)'];
    document.getElementById('modeBuzzerText').textContent = buzzerModeNames[data.modeBuzzer] || '--';
    
    // Highlight active button buzzer
    ['btnBuzzerAuto', 'btnBuzzerMute'].forEach(id => document.getElementById(id).classList.remove('btn-active'));
    if (data.modeBuzzer === 0) document.getElementById('btnBuzzerAuto').classList.add('btn-active');
    if (data.modeBuzzer === 1) document.getElementById('btnBuzzerMute').classList.add('btn-active');
    
    // Alerts
    document.getElementById('alertGas').style.display = data.gas >= data.gasThreshold ? 'block' : 'none';
    document.getElementById('alertHeat').style.display = data.suhu >= data.suhuThreshold ? 'block' : 'none';
    
    // Time
    const now = new Date();
    document.getElementById('updateTime').textContent = '⏱️ ' + now.toLocaleTimeString('id-ID');
    document.getElementById('lastUpdate').textContent = now.toLocaleString('id-ID');
}

// ====================================
// HELPERS
// ====================================
function setBadge(id, condition, onText, offText, className) {
    const el = document.getElementById(id);
    el.textContent = condition ? onText : offText;
    el.className = 'badge ' + className;
}

function highlightActiveButton(idAuto, idOn, idOff, mode) {
    [idAuto, idOn, idOff].forEach(id => {
        document.getElementById(id).classList.remove('btn-active');
    });
    if (mode === 0) document.getElementById(idAuto).classList.add('btn-active');
    if (mode === 1) document.getElementById(idOn).classList.add('btn-active');
    if (mode === 2) document.getElementById(idOff).classList.add('btn-active');
}

function setConnStatus(ok) {
    const el = document.getElementById('connStatus');
    if (ok) {
        el.textContent = '🟢 Terhubung';
        el.className = 'status conn-ok';
    } else {
        el.textContent = '🔴 Tidak Terhubung';
        el.className = 'status conn-fail';
    }
}

// ====================================
// CONTROL KIPAS
// ====================================
function setKipas(mode) {
    fetch(`http://${ESP_IP}/api/kipas?mode=${mode}`)
        .then(res => res.json())
        .then(data => {
            console.log('Kipas:', data);
            fetchData();
        })
        .catch(err => alert('⚠️ Gagal kontrol kipas'));
}

// ====================================
// CONTROL BUZZER
// ====================================
function setBuzzer(mode) {
    fetch(`http://${ESP_IP}/api/buzzer?mode=${mode}`)
        .then(res => res.json())
        .then(data => {
            console.log('Buzzer:', data);
            fetchData();
        })
        .catch(err => alert('⚠️ Gagal kontrol buzzer'));
}

// ====================================
// SETTINGS: THRESHOLD
// ====================================
function updateSuhuDisplay() {
    const val = document.getElementById('suhuSlider').value;
    document.getElementById('suhuSliderValue').textContent = parseFloat(val).toFixed(1);
    document.getElementById('suhuInput').value = val;
}

function updateGasDisplay() {
    const val = document.getElementById('gasSlider').value;
    document.getElementById('gasSliderValue').textContent = val;
    document.getElementById('gasInput').value = val;
}

// Sync input dengan slider
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('suhuInput').addEventListener('input', e => {
        document.getElementById('suhuSlider').value = e.target.value;
        document.getElementById('suhuSliderValue').textContent = parseFloat(e.target.value).toFixed(1);
    });
    
    document.getElementById('gasInput').addEventListener('input', e => {
        document.getElementById('gasSlider').value = e.target.value;
        document.getElementById('gasSliderValue').textContent = e.target.value;
    });
});

function saveThreshold() {
    const suhu = document.getElementById('suhuInput').value;
    const gas = document.getElementById('gasInput').value;
    
    fetch(`http://${ESP_IP}/api/threshold?suhu=${suhu}&gas=${gas}`)
        .then(res => res.json())
        .then(data => {
            showStatus('settingStatus', '✅ Pengaturan tersimpan!', true);
            fetchData();
        })
        .catch(err => {
            showStatus('settingStatus', '❌ Gagal menyimpan', false);
        });
}

// ====================================
// WIFI
// ====================================
function scanWifi() {
    const list = document.getElementById('netList');
    list.innerHTML = '<div class="network-item">⏳ Scanning...</div>';
    list.classList.add('show');
    
    fetch(`http://${ESP_IP}/api/scan`)
        .then(res => res.json())
        .then(data => {
            let html = '';
            data.networks.forEach(n => {
                html += `<div class="network-item" onclick="selectNetwork('${n.ssid}')">
                    📶 ${n.ssid} ${n.secure ? '🔒' : ''} <small>(${n.rssi}dBm)</small>
                </div>`;
            });
            list.innerHTML = html || '<div class="network-item">Tidak ada WiFi</div>';
        })
        .catch(err => {
            list.innerHTML = '<div class="network-item">❌ Gagal scan</div>';
        });
}

function selectNetwork(ssid) {
    document.getElementById('newSSID').value = ssid;
    document.getElementById('netList').classList.remove('show');
}

function saveWifi() {
    const ssid = document.getElementById('newSSID').value.trim();
    const pass = document.getElementById('newPass').value;
    
    if (!ssid) {
        showStatus('wifiStatus', '❌ SSID kosong', false);
        return;
    }
    
    if (!confirm(`Simpan WiFi "${ssid}"?\nESP32 akan restart.`)) return;
    
    fetch(`http://${ESP_IP}/api/setwifi?ssid=${encodeURIComponent(ssid)}&pass=${encodeURIComponent(pass)}`)
        .then(res => res.json())
        .then(data => {
            showStatus('wifiStatus', '✅ ' + data.message, true);
        })
        .catch(err => {
            showStatus('wifiStatus', '❌ Error', false);
        });
}

function resetWifi() {
    if (!confirm('Yakin reset WiFi?\nESP32 akan jadi mode Setup lagi.')) return;
    
    fetch(`http://${ESP_IP}/api/resetwifi`)
        .then(res => res.json())
        .then(data => {
            showStatus('wifiStatus', '✅ ' + data.message, true);
        })
        .catch(err => {
            showStatus('wifiStatus', '❌ Error', false);
        });
}

function showStatus(id, msg, ok) {
    const el = document.getElementById(id);
    el.textContent = msg;
    el.className = 'status-msg ' + (ok ? 'success' : 'error');
    setTimeout(() => {
        el.className = 'status-msg';
        el.textContent = '';
    }, 3000);
}

// ====================================
// INIT
// ====================================
window.onload = function() {
    document.getElementById('espIP').value = ESP_IP;
    fetchData();
    setInterval(fetchData, 2000);
};

// ====================================
// DEBUG
// ====================================
function fetchDebug() {
    const el = document.getElementById('debugContent');
    el.innerHTML = '<small>⏳ Mengambil data dari ESP32...</small>';

    fetch(`http://${ESP_IP}/api/debug`, { signal: AbortSignal.timeout(5000) })
        .then(res => res.json())
        .then(data => renderDebug(data))
        .catch(err => {
            el.innerHTML = `<div style="color:#e74c3c;padding:10px;background:rgba(231,76,60,0.1);border-radius:8px;">
                ❌ Gagal konek ke ESP32.<br><small>${err.message}</small>
            </div>`;
        });
}

function renderDebug(d) {
    const ok  = (v) => `<span style="color:#2ecc71;font-weight:bold;">${v}</span>`;
    const err = (v) => `<span style="color:#e74c3c;font-weight:bold;">${v}</span>`;
    const warn = (v) => `<span style="color:#f39c12;font-weight:bold;">${v}</span>`;
    const val = (v) => `<code style="background:rgba(255,255,255,0.1);padding:2px 6px;border-radius:4px;">${v}</code>`;

    const relayColor = d.kipas_status ? ok('ON ✅') : err('OFF ⛔');
    const pinColor   = d.relay_pin_state === 'HIGH' ? warn('HIGH') : warn('LOW');
    const alColor    = d.relay_active_low ? ok('true') : err('false');

    let konflikHTML = '';
    if (d.konflik_polaritas) {
        konflikHTML = `
        <div style="background:rgba(231,76,60,0.15);border:1px solid #e74c3c;border-radius:8px;padding:12px;margin:10px 0;">
            ⚠️ <strong>KONFLIK POLARITAS TERDETEKSI!</strong><br>
            <small>${d.konflik_pesan}</small>
        </div>`;
    }

    let suhuColor = d.suhu_tinggi ? err(`${d.suhu}°C`) : ok(`${d.suhu}°C`);
    let gasColor  = d.gas_tinggi  ? err(`${d.nilai_gas}`) : ok(`${d.nilai_gas}`);

    document.getElementById('debugContent').innerHTML = `
        ${konflikHTML}

        <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <tr style="border-bottom:1px solid rgba(255,255,255,0.1);">
            <td style="padding:6px 4px;opacity:0.7;">🔌 RELAY_ACTIVE_LOW</td>
            <td style="padding:6px 4px;">${alColor}</td>
        </tr>
        <tr style="border-bottom:1px solid rgba(255,255,255,0.1);">
            <td style="padding:6px 4px;opacity:0.7;">📍 Pin Relay (GPIO${d.relay_pin_number})</td>
            <td style="padding:6px 4px;">${pinColor}</td>
        </tr>
        <tr style="border-bottom:1px solid rgba(255,255,255,0.1);">
            <td style="padding:6px 4px;opacity:0.7;">🌀 Status Kipas</td>
            <td style="padding:6px 4px;">${relayColor}</td>
        </tr>
        <tr style="border-bottom:1px solid rgba(255,255,255,0.1);">
            <td style="padding:6px 4px;opacity:0.7;">🎮 Mode Kipas</td>
            <td style="padding:6px 4px;">${val(d.mode_kipas_str)}</td>
        </tr>
        <tr style="border-bottom:1px solid rgba(255,255,255,0.1);">
            <td style="padding:6px 4px;opacity:0.7;">💬 Alasan Kipas</td>
            <td style="padding:6px 4px;font-size:12px;">${d.alasan_kipas}</td>
        </tr>
        <tr style="border-bottom:1px solid rgba(255,255,255,0.1);">
            <td style="padding:6px 4px;opacity:0.7;">🌡️ Suhu</td>
            <td style="padding:6px 4px;">${suhuColor} / batas ${d.suhu_threshold}°C → ${d.suhu_tinggi ? err('TINGGI') : ok('AMAN')}</td>
        </tr>
        <tr style="border-bottom:1px solid rgba(255,255,255,0.1);">
            <td style="padding:6px 4px;opacity:0.7;">💨 Gas</td>
            <td style="padding:6px 4px;">${gasColor} / batas ${d.gas_threshold} → ${d.gas_tinggi ? err('TINGGI') : ok('AMAN')}</td>
        </tr>
        <tr style="border-bottom:1px solid rgba(255,255,255,0.1);">
            <td style="padding:6px 4px;opacity:0.7;">📡 MQ2 DO Pin Raw</td>
            <td style="padding:6px 4px;">${val(d.mq2_pin_raw)} ${d.gas_terdeteksi_do ? err('(gas terdeteksi!)') : ok('(aman)')}</td>
        </tr>
        <tr>
            <td style="padding:6px 4px;opacity:0.7;">🔔 Mode Buzzer</td>
            <td style="padding:6px 4px;">${val(d.mode_buzzer === 0 ? 'OTOMATIS' : 'MUTE')}</td>
        </tr>
        </table>
        <small style="opacity:0.5;display:block;margin-top:8px;">Terakhir refresh: ${new Date().toLocaleTimeString('id-ID')}</small>
    `;
}