# 🐔 Smart Chicken Coop (ESP32 + Web Dashboard)

Kandang ayam pintar IoT dengan pemantauan suhu, kelembaban, deteksi gerakan, dan gas amonia (MQ2 DO). 

Proyek ini menggunakan PlatformIO (ESP32) dan dashboard web sederhana.

---

## 🐛 Mengatasi Kipas & Buzzer Nyala Terus (Polaritas & Sensor)

Masalah umum pada hardware: Kipas (Relay) atau Buzzer bunyi terus/tidak bisa dimatikan walau dari web statusnya OFF.

### 🔌 1. Konflik Polaritas (Active-Low vs Active-High)
Banyak modul relay atau buzzer aktif yang menggunakan logika **Active-Low** (menyala saat pin `LOW`, mati saat `HIGH`). Jika kode berasumsi sebaliknya, komponen akan menyala terus saat program ingin mematikannya.

**Cara Memperbaiki:**
Sesuaikan konstanta polaritas di bagian atas [main.cpp](file:///c:/Users/alvin/OneDrive/Dokumen/PlatformIO/Projects/SMARTCHICKENCOOP/src/main.cpp):
```cpp
#define RELAY_ACTIVE_LOW true   // Ubah ke true jika kipas nyala terus
#define BUZZER_ACTIVE_LOW false // Ubah ke true jika buzzer nyala terus
```

### 💨 2. Sensor MQ2 Terlalu Sensitif
Sensor MQ2 digital output (DO) mengirim sinyal `LOW` ke ESP32 saat mendeteksi gas. Jika potentiometer pada modul sensor terlalu sensitif atau tidak sengaja terputar, pin akan terus membaca `LOW` (gas terdeteksi), sehingga kipas & buzzer otomatis berbunyi.

---

## 🛠️ Cara Menggunakan Debug Panel

Dashboard memiliki **Debug Panel** di bagian bawah untuk membaca kondisi fisik pin:
1. Klik **🔄 Refresh Debug Info**.
2. Periksa baris **Peringatan Konflik**. Jika program mendeteksi ketidaksesuaian (logika program vs status fisik pin), warning merah akan muncul di dashboard.
3. Periksa **MQ2 DO Pin Raw**. Jika nilainya `0` (LOW) tapi tidak ada gas di sekitar kandang, putar potentiometer sensitivitas pada modul MQ2 hingga nilai raw pin menjadi `1` (HIGH / aman).
