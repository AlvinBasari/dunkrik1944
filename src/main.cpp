#include <Arduino.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include <HTTPClient.h>
#include <WiFi.h>

// ==================== GANTI WIFI KAMU ====================
const char *ssid = "Xiaomi 13T";
const char *password = "najfa1303";

// ==================== URL CLOUD (HEROKU) ====================
const char *serverUrl =
    "https://mercusuar-smart-chicken-farm-3c0d8a6e74d4.herokuapp.com/api/"
    "telemetry";

// ==================== PIN ====================
#define DHT_PIN 4
#define MQ2_PIN 35
#define PIR_PIN 13
#define BUZZER_PIN 26
#define RELAY_PIN 27

// ==================== LOGIKA AKTIF ====================
// Sama persis dengan kode lama Anda yang sudah jalan:
#define BUZZER_ON LOW
#define BUZZER_OFF HIGH
#define RELAY_ON HIGH
#define RELAY_OFF LOW

// ==================== KONFIGURASI ====================
#define DHT_TYPE DHT11
#define PIR_HOLD_TIME 10000   // ms: hold PIR detected state
#define SEND_INTERVAL 5000    // ms: interval kirim data ke cloud
#define SENSOR_INTERVAL 2000  // ms: interval baca sensor + kontrol aktuator

// ==================== INISIALISASI ====================
DHT dht(DHT_PIN, DHT_TYPE);

// ==================== VARIABEL SENSOR ====================
float suhu = 0;
float kelembaban = 0;
int nilaiGas = 0;
bool gerakanTerdeteksi = false;

unsigned long lastPirDetected = 0;
bool pirHoldActive = false;

// ==================== VARIABEL AKTUATOR ====================
bool kipasNyala = false;
bool buzzerNyala = false;
bool ledNyala = false;
bool gasBahaya = false;

// ==================== VARIABEL SETTING (dari server) ====================
// Nilai default — akan di-update dari respon server
float suhuBatas = 32.0;
int gasBatas = 1500;
int modeKipas = 0; // 0 = Auto, 1 = Manual ON, 2 = Manual OFF
int modeBuzzer = 0; // 0 = Auto, 1 = Manual ON (Sirine Pengusir Predator), 2 = Manual OFF

// ==================== VARIABEL TIMING ====================
unsigned long lastSendTime = 0;
unsigned long lastSensorRead = 0;

// ==================== FUNGSI: Baca Sensor ====================
void bacaSensor() {
  float h = dht.readHumidity();
  float t = dht.readTemperature();
  if (!isnan(h) && !isnan(t)) {
    suhu = t;
    kelembaban = h;
  }

  nilaiGas = analogRead(MQ2_PIN);

  // PIR dengan hold time (sama persis kode lama)
  bool pirNow = digitalRead(PIR_PIN) == HIGH;
  unsigned long now = millis();

  if (pirNow) {
    lastPirDetected = now;
    pirHoldActive = true;
    gerakanTerdeteksi = true;
  } else {
    if (pirHoldActive) {
      if (now - lastPirDetected >= PIR_HOLD_TIME) {
        gerakanTerdeteksi = false;
        pirHoldActive = false;
      }
    } else {
      gerakanTerdeteksi = false;
    }
  }
}

// ==================== FUNGSI: Kontrol Aktuator (LOKAL & SERVER SYNC) ====================
void kontrolAktuator() {
  // ===== LOGIKA GAS BAHAYA =====
  gasBahaya = (nilaiGas >= gasBatas);

  // ===== LOGIKA BUZZER (Dapat dikontrol manual dari Web Dashboard) =====
  if (modeBuzzer == 1) {
    // Manual ON (Sirine Pengusir Predator dari Web Dashboard)
    digitalWrite(BUZZER_PIN, BUZZER_ON);
    buzzerNyala = true;
  } else if (modeBuzzer == 2) {
    // Manual OFF
    digitalWrite(BUZZER_PIN, BUZZER_OFF);
    buzzerNyala = false;
  } else {
    // Auto: nyala jika Gas bahaya
    if (gasBahaya) {
      digitalWrite(BUZZER_PIN, BUZZER_ON);
      buzzerNyala = true;
    } else {
      digitalWrite(BUZZER_PIN, BUZZER_OFF);
      buzzerNyala = false;
    }
  }

  // ===== LOGIKA KIPAS (sama persis kode lama) =====
  if (modeKipas == 1) {
    // Manual ON
    digitalWrite(RELAY_PIN, RELAY_ON);
    kipasNyala = true;
  } else if (modeKipas == 2) {
    // Manual OFF
    digitalWrite(RELAY_PIN, RELAY_OFF);
    kipasNyala = false;
  } else {
    // Auto: nyala jika suhu tinggi ATAU gas bahaya
    if (suhu >= suhuBatas || gasBahaya) {
      digitalWrite(RELAY_PIN, RELAY_ON);
      kipasNyala = true;
    } else {
      digitalWrite(RELAY_PIN, RELAY_OFF);
      kipasNyala = false;
    }
  }

  ledNyala = gasBahaya;
}

// ==================== FUNGSI: Kirim Data ke Cloud ====================
void kirimDataKeCloud() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[WiFi] Tidak terhubung, mencoba reconnect...");
    WiFi.reconnect();
    return;
  }

  HTTPClient http;
  http.begin(serverUrl);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(8000);

  // Buat payload JSON — kirim juga status aktuator yg sdh dihitung lokal
  StaticJsonDocument<256> doc;
  doc["suhu"] = round(suhu * 10.0) / 10.0;
  doc["kelembaban"] = round(kelembaban * 10.0) / 10.0;
  doc["gas"] = nilaiGas;
  doc["gasTerdeteksi"] = gasBahaya;
  doc["gerakan"] = gerakanTerdeteksi;

  String payload;
  serializeJson(doc, payload);

  Serial.println("[HTTP] Mengirim data ke Heroku...");

  int httpCode = http.POST(payload);

  if (httpCode > 0) {
    Serial.printf("[HTTP] Response code: %d\n", httpCode);

    if (httpCode == HTTP_CODE_OK) {
      String responseStr = http.getString();

      // Parse respon JSON untuk MENGAMBIL SETTING terbaru
      StaticJsonDocument<512> resp;
      DeserializationError err = deserializeJson(resp, responseStr);

      if (!err && resp["status"] == "ok") {
        JsonObject ctrl = resp["control"];

        // Update setting lokal dari server
        float newSuhuBatas = ctrl["suhuThreshold"] | suhuBatas;
        int newGasBatas = ctrl["gasThreshold"] | gasBatas;
        int newModeKipas = ctrl["modeKipas"] | modeKipas;
        int newModeBuzzer = ctrl["modeBuzzer"] | modeBuzzer;

        // Hanya log jika ada perubahan
        if (newSuhuBatas != suhuBatas || newGasBatas != gasBatas ||
            newModeKipas != modeKipas || newModeBuzzer != modeBuzzer) {
          Serial.println("[SYNC] Setting diperbarui dari server!");
          Serial.printf("  Suhu threshold: %.1f -> %.1f\n", suhuBatas,
                        newSuhuBatas);
          Serial.printf("  Gas threshold : %d -> %d\n", gasBatas, newGasBatas);
          Serial.printf("  Mode kipas    : %d -> %d\n", modeKipas,
                        newModeKipas);
          Serial.printf("  Mode buzzer   : %d -> %d\n", modeBuzzer,
                        newModeBuzzer);
        }

        suhuBatas = newSuhuBatas;
        gasBatas = newGasBatas;
        modeKipas = newModeKipas;
        modeBuzzer = newModeBuzzer;
      } else if (err) {
        Serial.println("[JSON] Gagal parse respon: " + String(err.c_str()));
      }
    }
  } else {
    Serial.printf("[HTTP] Gagal kirim! Error: %s\n",
                  http.errorToString(httpCode).c_str());
  }

  http.end();
}

// ==================== SETUP ====================
void setup() {
  Serial.begin(115200);
  Serial.println("\n🐔 Kandang Ayam Pintar - Cloud Edition Starting...");

  // Setup Pin
  pinMode(MQ2_PIN, INPUT);
  pinMode(PIR_PIN, INPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(RELAY_PIN, OUTPUT);

  // Aktuator OFF saat startup
  digitalWrite(BUZZER_PIN, BUZZER_OFF);
  digitalWrite(RELAY_PIN, RELAY_OFF);

  // Mulai DHT
  dht.begin();

  // Koneksi WiFi
  Serial.printf("Menghubungkan ke WiFi: %s\n", ssid);
  WiFi.begin(ssid, password);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ WiFi Terhubung!");
    Serial.printf("   IP Lokal : %s\n", WiFi.localIP().toString().c_str());
    Serial.printf("   Cloud URL: %s\n\n", serverUrl);
  } else {
    Serial.println("\n❌ Gagal konek WiFi! Restart...");
    ESP.restart();
  }

  // 🔧 Self-test: tes kipas & buzzer saat boot
  Serial.println("🔧 [SELF-TEST] Mengetes aktuator...");
  Serial.println("  ▶ Relay (Kipas) ON...");
  digitalWrite(RELAY_PIN, RELAY_ON);
  delay(1000);
  digitalWrite(RELAY_PIN, RELAY_OFF);
  Serial.println("  ■ Relay (Kipas) OFF");
  delay(300);
  Serial.println("  ▶ Buzzer ON...");
  digitalWrite(BUZZER_PIN, BUZZER_ON);
  delay(500);
  digitalWrite(BUZZER_PIN, BUZZER_OFF);
  Serial.println("  ■ Buzzer OFF");
  Serial.println(
      "✅ [SELF-TEST] Selesai! Jika kipas & buzzer menyala sebentar, wiring "
      "OK.\n");
}

// ==================== LOOP ====================
void loop() {
  unsigned long now = millis();

  // 1. Baca sensor + kontrol aktuator setiap 2 detik (seperti kode lama)
  if (now - lastSensorRead >= SENSOR_INTERVAL) {
    lastSensorRead = now;

    bacaSensor();
    kontrolAktuator();

    // Serial Monitor
    Serial.println("============================");
    Serial.printf("Suhu: %.1f C (batas: %.1f) | Lembab: %.1f%%\n", suhu,
                  suhuBatas, kelembaban);
    Serial.printf("Gas: %d (batas: %d) %s | PIR: %s\n", nilaiGas, gasBatas,
                  gasBahaya ? "BAHAYA" : "Aman",
                  gerakanTerdeteksi ? "Ada" : "Tidak");
    Serial.printf("Buzzer: %s | Kipas: %s (%s)\n", buzzerNyala ? "ON" : "OFF",
                  kipasNyala ? "ON" : "OFF",
                  modeKipas == 0   ? "Auto"
                  : modeKipas == 1 ? "Manual-ON"
                                   : "Manual-OFF");
  }

  // 2. Kirim ke cloud setiap 5 detik (hanya untuk sync data & ambil setting)
  if (now - lastSendTime >= SEND_INTERVAL) {
    lastSendTime = now;
    kirimDataKeCloud();
  }
}