# Panduan Deployment: Dashboard Smart Coop ke Heroku & Neon DB

Dokumen ini memandu Anda langkah demi langkah untuk men-deploy aplikasi **Smart Coop Web Dashboard** ke Heroku dan menghubungkannya dengan database serverless **Neon PostgreSQL**.

---

## Langkah 1: Registrasi & Pembuatan Database di Neon DB

Neon adalah layanan database PostgreSQL serverless gratis yang sangat cepat.

1. Buka [neon.tech](https://neon.tech/) dan buat akun (gratis).
2. Buat proyek baru dengan nama: `SmartCoopDB`.
3. Setelah proyek dibuat, Neon akan menampilkan **Connection String** (URI koneksi).
   Bentuknya seperti ini:
   ```text
   postgres://[username]:[password]@[hostname]/neondb?sslmode=require
   ```
4. Salin string koneksi ini dan simpan. Ini adalah nilai untuk variabel `DATABASE_URL`.

---

## Langkah 2: Deploy ke Heroku

### Opsi A: Menggunakan Heroku CLI (Terminal)

Jika Anda memiliki Heroku CLI di komputer Anda:

1. Buka terminal di folder `web-dashboard/`.
2. Login ke Heroku:
   ```bash
   heroku login
   ```
3. Buat aplikasi baru di Heroku:
   ```bash
   heroku create nama-app-kandang-kamu
   ```
4. Tambahkan Config Var untuk database (Ganti dengan string koneksi dari Neon Anda):
   ```bash
   heroku config:set DATABASE_URL="postgres://username:password@hostname/neondb?sslmode=require"
   heroku config:set NEXT_PUBLIC_DB_TYPE="postgres"
   ```
5. Deploy kode ke Heroku:
   ```bash
   git add .
   git commit -m "Deploy dashboard smart chicken coop"
   git push heroku main
   ```

### Opsi B: Menggunakan Web Dashboard Heroku (Tanpa CLI)

1. Buka [Heroku Dashboard](https://dashboard.heroku.com/) dan buat aplikasi baru.
2. Hubungkan akun GitHub Anda, pilih repositori project ini.
3. Buka tab **Settings** -> klik **Reveal Config Vars**.
4. Tambahkan dua variabel berikut:
   - **Key**: `DATABASE_URL` 
     **Value**: `postgres://[user]:[pass]@[host]/neondb?sslmode=require` (Connection string dari Neon)
   - **Key**: `NEXT_PUBLIC_DB_TYPE`
     **Value**: `postgres`
5. Buka tab **Deploy** -> pilih branch `main`/`master` lalu klik **Deploy Branch**.

---

## Langkah 3: Menghubungkan Perangkat ESP32 Fisik ke Heroku

Begitu web dashboard Anda sukses berjalan di Heroku (misalnya pada alamat `https://smartcoop-dashboard.herokuapp.com`), Anda dapat memperbarui kode ESP32 [main.cpp](file:///c:/Users/alvin/OneDrive/Dokumen/PlatformIO/Projects/SMARTCHICKENCOOP/src/main.cpp) agar mengirim data sensor langsung ke web server Anda di awan.

### Gambaran Perubahan Kode ESP32:
Gunakan library `HTTPClient` pada ESP32 untuk melakukan request HTTP POST secara terus menerus:

```cpp
#include <HTTPClient.h>

void kirimDataKeCloud() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    
    // Ganti dengan URL Heroku Anda sendiri
    http.begin("https://smartcoop-dashboard.herokuapp.com/api/telemetry");
    http.addHeader("Content-Type", "application/json");
    
    // Buat JSON data sensor
    String jsonPayload = "{\"suhu\":" + String(suhu) + 
                         ",\"kelembaban\":" + String(kelembaban) + 
                         ",\"gas\":" + String(nilaiGas) + 
                         ",\"gasTerdeteksi\":" + (gasTerdeteksi ? "true" : "false") + 
                         ",\"gerakan\":" + (gerakanTerdeteksi ? "true" : "false") + "}";
    
    int httpResponseCode = http.POST(jsonPayload);
    
    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.println("Response dari Server: " + response);
      
      // PARSE JSON RESPON UNTUK MENERAPKAN PERINTAH KIPAS / THRESHOLD
      // (Menggunakan ArduinoJson)
      // DynamicJsonDocument doc(512);
      // deserializeJson(doc, response);
      // bool kipasHarusNyala = doc["control"]["kipas"];
      // digitalWrite(RELAY_PIN, kipasHarusNyala ? HIGH : LOW);
    } else {
      Serial.print("Error sending POST: ");
      Serial.println(httpResponseCode);
    }
    http.end();
  }
}
```

Panggil fungsi `kirimDataKeCloud()` ini di dalam `loop()` ESP32 setiap beberapa detik.
