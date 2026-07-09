// ============================================
// SMART CHICKEN COOP - ESP32
// Kandang Ayam Cerdas dengan IoT
//
// VERSI: MQ2 pakai DO (Digital Output)
// Tanpa pembagi tegangan
// Tanpa LED (sudah dilepas)
//
// Fitur:
// - Monitor suhu, kelembaban, gas amonia, gerakan
// - Kipas otomatis (suhu/gas tinggi) + manual override
// - Buzzer alarm (gas tinggi) + manual mute
// - Pengaturan threshold via web
// - Pengaturan WiFi via web
// - Manual control via web
// - Support relay active-LOW maupun active-HIGH (tinggal ubah flag)
// ============================================

#include <Arduino.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include <DNSServer.h>
#include <Preferences.h>
#include <WebServer.h>
#include <WiFi.h>


// ==================
// KONFIGURASI PIN
// ==================
#define DHT_PIN 4
#define BUZZER_PIN 5
#define RELAY_PIN 26
#define PIR_PIN 27
#define MQ2_PIN 34 // Pakai DO MQ2 (digital)

#define DHT_TYPE DHT11

// ==================
// POLARITAS RELAY & BUZZER
// ==================
// Banyak modul relay 1/2-channel murah itu ACTIVE-LOW:
// LOW = relay ON (closed), HIGH = relay OFF (open).
// Kalau kipas kamu nyala terus / gak bisa mati dari web,
// coba ganti nilai ini ke true.
#define RELAY_ACTIVE_LOW true

// Jika buzzer kamu tipe active-LOW (bunyi saat LOW, mati saat HIGH),
// ganti nilai ini ke true.
#define BUZZER_ACTIVE_LOW false

// ==================
// MODE WIFI
// ==================
const char *AP_SSID = "KandangAyam-Setup";
const char *AP_PASS = "12345678";

// ⚡⚡⚡ RESET WIFI FLAG ⚡⚡⚡
// Set true sekali untuk hapus WiFi lama, lalu ubah ke false dan upload lagi
#define RESET_WIFI_ON_BOOT false

// ==================
// VARIABEL GLOBAL
// ==================
DHT dht(DHT_PIN, DHT_TYPE);
WebServer server(80);
DNSServer dnsServer;
Preferences preferences;

// Data sensor
float suhu = 0;
float kelembaban = 0;
int nilaiGas = 0;           // 100 = aman, 3000 = bahaya
bool gasTerdeteksi = false; // status gas dari DO MQ2
bool gerakanTerdeteksi = false;

// Status output
bool kipasStatus = false;
bool buzzerStatus = false;

// Threshold
float suhuThreshold = 32.0;
int gasThreshold = 1500; // Tetap dipake biar dashboard kompatibel

// Mode kontrol kipas
// 0 = OTOMATIS, 1 = MANUAL ON, 2 = MANUAL OFF
int modeKipas = 0;

// Mode kontrol buzzer
// 0 = OTOMATIS, 1 = MANUAL OFF (mute)
int modeBuzzer = 0;

// WiFi
String wifiSSID = "";
String wifiPassword = "";
bool wifiConnected = false;
bool apMode = false;

// Timing
unsigned long lastRead = 0;
unsigned long lastBuzzerToggle = 0;
bool buzzerState = false;

// ==================
// FUNGSI: SET KIPAS (handle polaritas relay)
// ==================
void setKipas(bool nyala) {
  if (RELAY_ACTIVE_LOW) {
    digitalWrite(RELAY_PIN, nyala ? LOW : HIGH);
  } else {
    digitalWrite(RELAY_PIN, nyala ? HIGH : LOW);
  }
  kipasStatus = nyala;
}

// ==================
// FUNGSI: SET BUZZER (handle polaritas buzzer)
// ==================
void setBuzzerState(bool nyala) {
  if (BUZZER_ACTIVE_LOW) {
    digitalWrite(BUZZER_PIN, nyala ? LOW : HIGH);
  } else {
    digitalWrite(BUZZER_PIN, nyala ? HIGH : LOW);
  }
  buzzerStatus = nyala;
}

// ==================
// FUNGSI: RESET WIFI
// ==================
void resetWiFiCredentials() {
  Serial.println("🔄 Menghapus WiFi lama...");
  preferences.begin("kandang", false);
  preferences.remove("wifiSSID");
  preferences.remove("wifiPass");
  preferences.end();
  Serial.println("✅ WiFi lama dihapus!");
  Serial.println("⚠️ Ubah RESET_WIFI_ON_BOOT jadi false dan upload lagi");
  Serial.println("⚠️ setelah berhasil setup WiFi baru!\n");
}

// ==================
// FUNGSI: LOAD PREFERENCES
// ==================
void loadPreferences() {
  preferences.begin("kandang", false);

  suhuThreshold = preferences.getFloat("suhuTh", 32.0);
  gasThreshold = preferences.getInt("gasTh", 1500);
  wifiSSID = preferences.getString("wifiSSID", "");
  wifiPassword = preferences.getString("wifiPass", "");

  preferences.end();

  Serial.println("✅ Preferences loaded:");
  Serial.printf("   Suhu threshold: %.1f°C\n", suhuThreshold);
  Serial.printf("   Gas threshold : %d\n", gasThreshold);
  Serial.printf("   WiFi SSID     : %s\n", wifiSSID.c_str());
}

// ==================
// FUNGSI: SAVE PREFERENCES
// ==================
void savePreferences() {
  preferences.begin("kandang", false);
  preferences.putFloat("suhuTh", suhuThreshold);
  preferences.putInt("gasTh", gasThreshold);
  preferences.putString("wifiSSID", wifiSSID);
  preferences.putString("wifiPass", wifiPassword);
  preferences.end();
  Serial.println("✅ Preferences saved!");
}

// ==================
// FUNGSI: CONNECT WIFI
// ==================
bool connectWiFi() {
  if (wifiSSID == "") {
    Serial.println("❌ WiFi SSID kosong, masuk AP Mode");
    return false;
  }

  Serial.print("📡 Connecting to: ");
  Serial.println(wifiSSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(wifiSSID.c_str(), wifiPassword.c_str());

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ WiFi Connected!");
    Serial.print("📡 IP Address: ");
    Serial.println(WiFi.localIP());
    wifiConnected = true;
    apMode = false;
    return true;
  } else {
    Serial.println("\n❌ WiFi Failed!");
    wifiConnected = false;
    return false;
  }
}

// ==================
// FUNGSI: START AP MODE
// ==================
void startAPMode() {
  Serial.println("🔧 Starting AP Mode...");
  WiFi.mode(WIFI_AP);
  WiFi.softAP(AP_SSID, AP_PASS);

  IPAddress IP = WiFi.softAPIP();
  Serial.print("📡 AP IP: ");
  Serial.println(IP);

  dnsServer.start(53, "*", IP);

  apMode = true;
  wifiConnected = false;

  Serial.println("⚠️ Connect ke WiFi: KandangAyam-Setup");
  Serial.println("⚠️ Password: 12345678");
  Serial.println("⚠️ Buka browser ke: http://192.168.4.1");
}

// ==================
// FUNGSI: BACA SENSOR
// ==================
void bacaSensor() {
  // DHT11
  float s = dht.readTemperature();
  float k = dht.readHumidity();

  if (!isnan(s) && !isnan(k)) {
    suhu = s;
    kelembaban = k;
  }

  // ⚡ MQ2 pakai DO (Digital Output)
  // DO MQ2: LOW = ada gas, HIGH = aman
  int rawMQ2 = digitalRead(MQ2_PIN);
  Serial.printf("   [DEBUG] MQ2 raw DO: %d\n", rawMQ2);
  gasTerdeteksi = rawMQ2 == LOW;

  // Konversi ke nilai numerik untuk kompatibilitas dashboard
  // Aman = 100, Bahaya = 3000
  nilaiGas = gasTerdeteksi ? 3000 : 100;

  // PIR
  gerakanTerdeteksi = digitalRead(PIR_PIN) == HIGH;
}

// ==================
// FUNGSI: KONTROL OTOMATIS
// ==================
void kontrolOtomatis() {
  bool suhuTinggi = suhu >= suhuThreshold;
  bool gasTinggi = nilaiGas >= gasThreshold; // 3000 >= 1500 = TRUE

  // ===== KIPAS =====
  if (modeKipas == 0) {
    // OTOMATIS
    setKipas(suhuTinggi || gasTinggi);
  } else if (modeKipas == 1) {
    // MANUAL ON
    setKipas(true);
  } else if (modeKipas == 2) {
    // MANUAL OFF
    setKipas(false);
  }

  // ===== BUZZER =====
  if (modeBuzzer == 1) {
    // MANUAL MUTE
    setBuzzerState(false);
  } else if (gasTinggi) {
    // BEEP BEEP saat gas tinggi
    if (millis() - lastBuzzerToggle >= 300) {
      lastBuzzerToggle = millis();
      buzzerState = !buzzerState;
      setBuzzerState(buzzerState);
    }
  } else {
    setBuzzerState(false);
  }
}

// ==================
// CORS HEADERS
// ==================
void sendCORS() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
}

// ==================
// API: GET DATA
// ==================
void handleGetData() {
  StaticJsonDocument<512> doc;
  doc["suhu"] = suhu;
  doc["kelembaban"] = kelembaban;
  doc["gas"] = nilaiGas;
  doc["gasTerdeteksi"] = gasTerdeteksi;
  doc["gerakan"] = gerakanTerdeteksi;
  doc["kipas"] = kipasStatus;
  doc["buzzer"] = buzzerStatus;
  doc["modeKipas"] = modeKipas;
  doc["modeBuzzer"] = modeBuzzer;
  doc["suhuThreshold"] = suhuThreshold;
  doc["gasThreshold"] = gasThreshold;
  doc["wifiSSID"] = wifiSSID;
  doc["apMode"] = apMode;

  String response;
  serializeJson(doc, response);

  sendCORS();
  server.send(200, "application/json", response);
}

// ==================
// API: SET THRESHOLD
// ==================
void handleSetThreshold() {
  if (server.hasArg("suhu")) {
    suhuThreshold = server.arg("suhu").toFloat();
  }
  if (server.hasArg("gas")) {
    gasThreshold = server.arg("gas").toInt();
  }

  savePreferences();

  StaticJsonDocument<200> doc;
  doc["status"] = "ok";
  doc["suhuThreshold"] = suhuThreshold;
  doc["gasThreshold"] = gasThreshold;

  String response;
  serializeJson(doc, response);

  sendCORS();
  server.send(200, "application/json", response);

  Serial.printf("🔧 Threshold updated: suhu=%.1f, gas=%d\n", suhuThreshold,
                gasThreshold);
}

// ==================
// API: CONTROL KIPAS
// ==================
void handleControlKipas() {
  String mode = server.arg("mode");

  if (mode == "auto")
    modeKipas = 0;
  else if (mode == "on")
    modeKipas = 1;
  else if (mode == "off")
    modeKipas = 2;

  StaticJsonDocument<200> doc;
  doc["status"] = "ok";
  doc["modeKipas"] = modeKipas;

  String response;
  serializeJson(doc, response);

  sendCORS();
  server.send(200, "application/json", response);

  Serial.printf("🌀 Mode Kipas: %s\n", mode.c_str());
}

// ==================
// API: CONTROL BUZZER
// ==================
void handleControlBuzzer() {
  String mode = server.arg("mode");

  if (mode == "auto")
    modeBuzzer = 0;
  else if (mode == "off")
    modeBuzzer = 1;

  StaticJsonDocument<200> doc;
  doc["status"] = "ok";
  doc["modeBuzzer"] = modeBuzzer;

  String response;
  serializeJson(doc, response);

  sendCORS();
  server.send(200, "application/json", response);

  Serial.printf("🔔 Mode Buzzer: %s\n", mode.c_str());
}

// ==================
// API: SET WIFI
// ==================
void handleSetWiFi() {
  String newSSID = server.arg("ssid");
  String newPass = server.arg("pass");

  if (newSSID.length() > 0) {
    wifiSSID = newSSID;
    wifiPassword = newPass;
    savePreferences();

    StaticJsonDocument<200> doc;
    doc["status"] = "ok";
    doc["message"] = "WiFi tersimpan. ESP32 akan restart...";

    String response;
    serializeJson(doc, response);

    sendCORS();
    server.send(200, "application/json", response);

    Serial.printf("📡 WiFi baru disimpan: %s\n", newSSID.c_str());
    Serial.println("🔄 Restarting in 3 seconds...");
    delay(3000);
    ESP.restart();
  } else {
    sendCORS();
    server.send(400, "application/json",
                "{\"status\":\"error\",\"message\":\"SSID kosong\"}");
  }
}

// ==================
// API: SCAN WIFI
// ==================
void handleScanWiFi() {
  Serial.println("🔍 Scanning WiFi...");
  int n = WiFi.scanNetworks();

  StaticJsonDocument<2048> doc;
  JsonArray networks = doc.createNestedArray("networks");

  for (int i = 0; i < n; i++) {
    JsonObject net = networks.createNestedObject();
    net["ssid"] = WiFi.SSID(i);
    net["rssi"] = WiFi.RSSI(i);
    net["secure"] = WiFi.encryptionType(i) != WIFI_AUTH_OPEN;
  }

  String response;
  serializeJson(doc, response);

  sendCORS();
  server.send(200, "application/json", response);
}

// ==================
// API: RESET WIFI
// ==================
void handleResetWiFi() {
  preferences.begin("kandang", false);
  preferences.remove("wifiSSID");
  preferences.remove("wifiPass");
  preferences.end();

  sendCORS();
  server.send(
      200, "application/json",
      "{\"status\":\"ok\",\"message\":\"WiFi direset. Restarting...\"}");

  Serial.println("🔄 WiFi reset, restarting...");
  delay(2000);
  ESP.restart();
}

// ==================
// HALAMAN SETUP WIFI (AP MODE)
// ==================
String getSetupHTML() {
  String html = R"=====(
<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>🐔 Setup Kandang Ayam</title>
<style>
* { margin:0; padding:0; box-sizing:border-box; font-family:Arial; }
body { background:linear-gradient(135deg,#667eea,#764ba2); min-height:100vh; padding:20px; color:#fff; }
.container { max-width:500px; margin:0 auto; background:rgba(255,255,255,0.1); 
  padding:30px; border-radius:20px; backdrop-filter:blur(10px); margin-top:50px; }
h1 { text-align:center; margin-bottom:10px; }
p { text-align:center; margin-bottom:25px; opacity:0.8; }
input, select { width:100%; padding:12px; margin:8px 0; border:none; border-radius:8px; 
  background:rgba(255,255,255,0.2); color:#fff; font-size:16px; }
input::placeholder { color:rgba(255,255,255,0.6); }
button { width:100%; padding:14px; margin-top:15px; border:none; border-radius:8px; 
  background:#00d4aa; color:#fff; font-size:16px; font-weight:bold; cursor:pointer; }
button:hover { background:#00b894; }
.btn-scan { background:#0984e3; margin-top:8px; }
.btn-scan:hover { background:#0770c4; }
label { display:block; margin-top:15px; font-weight:bold; }
.network-list { background:rgba(0,0,0,0.2); padding:10px; border-radius:8px; 
  max-height:200px; overflow-y:auto; margin-top:10px; display:none; }
.network-item { padding:10px; cursor:pointer; border-radius:5px; }
.network-item:hover { background:rgba(255,255,255,0.1); }
.status { padding:12px; border-radius:8px; margin-top:15px; text-align:center; display:none; }
.status-ok { background:rgba(0,255,136,0.3); }
.status-err { background:rgba(255,0,0,0.3); }
</style>
</head>
<body>
<div class="container">
  <h1>🐔 Smart Kandang Ayam</h1>
  <p>Setup WiFi untuk konek ke jaringan</p>
  
  <button class="btn-scan" onclick="scanWifi()">🔍 Scan WiFi</button>
  <div class="network-list" id="netList"></div>
  
  <label>Nama WiFi (SSID):</label>
  <input type="text" id="ssid" placeholder="Nama WiFi rumah kamu">
  
  <label>Password WiFi:</label>
  <input type="password" id="pass" placeholder="Password WiFi">
  
  <button onclick="saveWifi()">💾 Simpan & Connect</button>
  
  <div class="status" id="status"></div>
</div>

<script>
function scanWifi() {
  document.getElementById('netList').innerHTML = '⏳ Scanning...';
  document.getElementById('netList').style.display = 'block';
  
  fetch('/api/scan')
    .then(r => r.json())
    .then(data => {
      let html = '';
      data.networks.forEach(n => {
        html += `<div class="network-item" onclick="selectNet('${n.ssid}')">
          📶 ${n.ssid} ${n.secure ? '🔒' : ''} (${n.rssi}dBm)
        </div>`;
      });
      document.getElementById('netList').innerHTML = html || 'Tidak ada WiFi ditemukan';
    });
}

function selectNet(ssid) {
  document.getElementById('ssid').value = ssid;
  document.getElementById('netList').style.display = 'none';
}

function saveWifi() {
  const ssid = document.getElementById('ssid').value.trim();
  const pass = document.getElementById('pass').value;
  
  if (!ssid) {
    showStatus('❌ SSID tidak boleh kosong', false);
    return;
  }
  
  showStatus('⏳ Menyimpan...', true);
  
  fetch(`/api/setwifi?ssid=${encodeURIComponent(ssid)}&pass=${encodeURIComponent(pass)}`)
    .then(r => r.json())
    .then(data => {
      showStatus('✅ ' + data.message, true);
    })
    .catch(e => showStatus('❌ Error', false));
}

function showStatus(msg, ok) {
  const el = document.getElementById('status');
  el.textContent = msg;
  el.className = 'status ' + (ok ? 'status-ok' : 'status-err');
  el.style.display = 'block';
}
</script>
</body>
</html>
)=====";
  return html;
}

// ==================
// API: DEBUG INFO
// ==================
void handleDebug() {
  bool suhuTinggi = suhu >= suhuThreshold;
  bool gasTinggi  = nilaiGas >= gasThreshold;
  int  relayPin   = digitalRead(RELAY_PIN);
  int  mq2Pin     = digitalRead(MQ2_PIN);
  int  buzzerPin  = digitalRead(BUZZER_PIN);

  // Evaluasi kenapa kipas ON/OFF
  String alasan = "";
  if (modeKipas == 1) {
    alasan = "MANUAL ON dari web";
  } else if (modeKipas == 2) {
    alasan = "MANUAL OFF dari web";
  } else {
    if (suhuTinggi && gasTinggi)  alasan = "OTOMATIS: suhu DAN gas tinggi";
    else if (suhuTinggi)          alasan = "OTOMATIS: suhu tinggi";
    else if (gasTinggi)           alasan = "OTOMATIS: gas tinggi";
    else                          alasan = "OTOMATIS: kondisi aman (seharusnya MATI)";
  }

  // Deteksi konflik polaritas relay
  bool konflikPolaritas = false;
  String konflikPesan = "";
  if (!kipasStatus && relayPin == LOW && !RELAY_ACTIVE_LOW) {
    konflikPolaritas = true;
    konflikPesan = "Pin LOW tapi RELAY_ACTIVE_LOW=false. Relay mungkin aktif! Coba ganti ke true.";
  } else if (!kipasStatus && relayPin == HIGH && RELAY_ACTIVE_LOW) {
    konflikPolaritas = true;
    konflikPesan = "Pin HIGH tapi RELAY_ACTIVE_LOW=true. Relay mungkin aktif! Coba ganti ke false.";
  }

  // Deteksi konflik polaritas buzzer
  bool konflikBuzzer = false;
  String konflikBuzzerPesan = "";
  if (!buzzerStatus && buzzerPin == LOW && !BUZZER_ACTIVE_LOW) {
    konflikBuzzer = true;
    konflikBuzzerPesan = "Pin LOW tapi BUZZER_ACTIVE_LOW=false. Buzzer mungkin aktif! Coba ganti ke true.";
  } else if (!buzzerStatus && buzzerPin == HIGH && BUZZER_ACTIVE_LOW) {
    konflikBuzzer = true;
    konflikBuzzerPesan = "Pin HIGH tapi BUZZER_ACTIVE_LOW=true. Buzzer mungkin aktif! Coba ganti ke false.";
  }

  StaticJsonDocument<1024> doc;
  // Relay
  doc["relay_active_low"]   = RELAY_ACTIVE_LOW;
  doc["relay_pin_number"]   = RELAY_PIN;
  doc["relay_pin_state"]    = relayPin == HIGH ? "HIGH" : "LOW";
  doc["relay_pin_raw"]      = relayPin;
  doc["kipas_status"]       = kipasStatus;
  doc["mode_kipas"]         = modeKipas;
  doc["mode_kipas_str"]     = modeKipas==0 ? "OTOMATIS" : modeKipas==1 ? "MANUAL ON" : "MANUAL OFF";
  doc["alasan_kipas"]       = alasan;
  // Konflik Relay
  doc["konflik_polaritas"]  = konflikPolaritas;
  doc["konflik_pesan"]      = konflikPesan;
  // Sensor
  doc["suhu"]               = suhu;
  doc["suhu_threshold"]     = suhuThreshold;
  doc["suhu_tinggi"]        = suhuTinggi;
  doc["nilai_gas"]          = nilaiGas;
  doc["gas_threshold"]      = gasThreshold;
  doc["gas_tinggi"]         = gasTinggi;
  doc["gas_terdeteksi_do"]  = gasTerdeteksi;
  doc["mq2_pin_raw"]        = mq2Pin;
  // Buzzer
  doc["mode_buzzer"]        = modeBuzzer;
  doc["buzzer_status"]      = buzzerStatus;
  doc["buzzer_active_low"]  = BUZZER_ACTIVE_LOW;
  doc["buzzer_pin_number"]  = BUZZER_PIN;
  doc["buzzer_pin_state"]   = buzzerPin == HIGH ? "HIGH" : "LOW";
  doc["buzzer_pin_raw"]     = buzzerPin;
  doc["konflik_buzzer"]     = konflikBuzzer;
  doc["konflik_buzzer_pesan"] = konflikBuzzerPesan;

  String response;
  serializeJson(doc, response);
  sendCORS();
  server.send(200, "application/json", response);

  Serial.println("\n=== [DEBUG REQUEST] ===");
  Serial.printf("  RELAY_ACTIVE_LOW : %s\n", RELAY_ACTIVE_LOW ? "true" : "false");
  Serial.printf("  Relay pin state  : %s\n", relayPin == HIGH ? "HIGH" : "LOW");
  Serial.printf("  kipasStatus      : %s\n", kipasStatus ? "ON" : "OFF");
  Serial.printf("  modeKipas        : %d (%s)\n", modeKipas, doc["mode_kipas_str"].as<const char*>());
  Serial.printf("  Alasan Kipas     : %s\n", alasan.c_str());
  if (konflikPolaritas) Serial.printf("  ⚠️ KONFLIK RELAY: %s\n", konflikPesan.c_str());
  Serial.printf("  BUZZER_ACTIVE_LOW: %s\n", BUZZER_ACTIVE_LOW ? "true" : "false");
  Serial.printf("  Buzzer pin state : %s\n", buzzerPin == HIGH ? "HIGH" : "LOW");
  Serial.printf("  buzzerStatus     : %s\n", buzzerStatus ? "ON" : "OFF");
  if (konflikBuzzer) Serial.printf("  ⚠️ KONFLIK BUZZER: %s\n", konflikBuzzerPesan.c_str());
  Serial.println("========================");
}

// ==================
// ROOT HANDLER
// ==================
void handleRoot() {
  if (apMode) {
    server.send(200, "text/html", getSetupHTML());
  } else {
    String html = "<h1>🐔 Smart Kandang Ayam</h1>";
    html += "<p>ESP32 berjalan normal!</p>";
    html += "<p>IP: " + WiFi.localIP().toString() + "</p>";
    html += "<p>WiFi: " + wifiSSID + "</p>";
    html += "<p>Buka dashboard dari VS Code (Live Server)</p>";
    html += "<hr><h3>API Endpoints:</h3><ul>";
    html += "<li>GET /api/data</li>";
    html += "<li>GET /api/threshold?suhu=X&gas=Y</li>";
    html += "<li>GET /api/kipas?mode=auto|on|off</li>";
    html += "<li>GET /api/buzzer?mode=auto|off</li>";
    html += "<li>GET /api/setwifi?ssid=X&pass=Y</li>";
    html += "<li>GET /api/scan</li>";
    html += "<li>GET /api/resetwifi</li></ul>";
    server.send(200, "text/html", html);
  }
}

// ==================
// SETUP
// ==================
void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n\n=== 🐔 SMART KANDANG AYAM ===");
  Serial.println("=== MQ2 Mode: DO (Digital) ===\n");

  // ⚡⚡⚡ AUTO RESET WIFI ⚡⚡⚡
  if (RESET_WIFI_ON_BOOT) {
    resetWiFiCredentials();
  }

  // Setup pins
  pinMode(RELAY_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(PIR_PIN, INPUT);
  pinMode(MQ2_PIN, INPUT); // ⚡ MQ2 DO (digital input)

  setKipas(false);
  setBuzzerState(false);

  dht.begin();

  // Load preferences (threshold, wifi)
  loadPreferences();

  // Try connect WiFi, else start AP mode
  if (!connectWiFi()) {
    startAPMode();
  } else {
    // Beep 2x tanda siap
    setBuzzerState(true);
    delay(100);
    setBuzzerState(false);
    delay(100);
    setBuzzerState(true);
    delay(100);
    setBuzzerState(false);
  }

  // Setup routes
  server.on("/", handleRoot);
  server.on("/api/data", handleGetData);
  server.on("/api/threshold", handleSetThreshold);
  server.on("/api/kipas", handleControlKipas);
  server.on("/api/buzzer", handleControlBuzzer);
  server.on("/api/setwifi", handleSetWiFi);
  server.on("/api/scan", handleScanWiFi);
  server.on("/api/resetwifi", handleResetWiFi);
  server.on("/api/debug", handleDebug);

  // Handle CORS preflight
  server.onNotFound([]() {
    if (server.method() == HTTP_OPTIONS) {
      sendCORS();
      server.send(204);
    } else {
      sendCORS();
      server.send(404, "text/plain", "Not Found");
    }
  });

  server.begin();
  Serial.println("🌐 Web Server Started!");
}

// ==================
// LOOP
// ==================
void loop() {
  server.handleClient();

  if (apMode) {
    dnsServer.processNextRequest();
  }

  if (millis() - lastRead >= 2000) {
    lastRead = millis();

    if (!apMode) {
      bacaSensor();
      kontrolOtomatis();

      Serial.println("───────────────────────────");
      Serial.printf("🌡️  Suhu     : %.1f°C (threshold: %.1f)\n", suhu,
                    suhuThreshold);
      Serial.printf("💧 Lembab    : %.1f%%\n", kelembaban);
      Serial.printf("💨 Gas       : %s (nilai: %d)\n",
                    gasTerdeteksi ? "TERDETEKSI ⚠️" : "AMAN ✅", nilaiGas);
      Serial.printf("🚶 Gerakan   : %s\n", gerakanTerdeteksi ? "YA" : "TIDAK");
      Serial.printf("🌀 Kipas     : %s\n", kipasStatus ? "ON" : "OFF");
      Serial.printf("🔔 Buzzer    : %s (mode: %s)\n",
                    buzzerStatus ? "ON" : "OFF",
                    modeBuzzer == 1 ? "MUTE" : "AUTO");
    }
  }
}