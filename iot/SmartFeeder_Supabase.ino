#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <RTClib.h>
#include <Servo.h>
#include <time.h>

// --- KONFIGURASI WIFI ---
const char* ssid = "Sam";
const char* password = "modalll cokk";

// --- KONFIGURASI SUPABASE ---
// Ambil dari file .env proyek Anda
const char* supabase_url = "https://smpluwvjqrpaqvwrwity.supabase.co"; 
const char* supabase_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtcGx1d3ZqcXJwYXF2d3J3aXR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MjI5NTQsImV4cCI6MjA5NDA5ODk1NH0.6OIZ3e_ioJz87wm9Mmu99FHJGwrRklKQwevjWbreUdk"; 
const char* device_id = "72dc30fb-6952-4a19-9834-d2addb4bc426"; 

// --- HARDWARE ---
RTC_DS3231 rtc;
Servo servoKatup;
const int pinServo = D6;
int sudutTutup = 0;
int sudutBuka = 180;

// --- TIMING ---
unsigned long lastHeartbeat = 0;
unsigned long lastCheckTrigger = 0;
unsigned long lastCheckSchedule = 0;
int menitTerakhirMakan = -1;

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n--- SMART FISH FEEDER STARTING ---");
  
  servoKatup.attach(pinServo);
  servoKatup.write(sudutTutup);
  
  Wire.begin(D2, D1);
  if (!rtc.begin()) {
    Serial.println("[ERROR] RTC tidak ditemukan! Cek kabel SDA/SCL.");
  } else {
    Serial.println("[OK] RTC Terdeteksi.");
  }

  // Koneksi WiFi
  Serial.print("Menghubungkan ke WiFi: ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);
  
  int retry = 0;
  while (WiFi.status() != WL_CONNECTED && retry < 30) {
    delay(1000);
    Serial.print(".");
    retry++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[OK] WiFi Terhubung!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());

    // Sinkronisasi Jam Internet (NTP) - WIB (GMT+7)
    configTime(7 * 3600, 0, "pool.ntp.org", "time.nist.gov");
    Serial.print("Menyinkronkan Jam Internet");
    time_t now = time(nullptr);
    while (now < 1000000) {
      delay(500);
      Serial.print(".");
      now = time(nullptr);
    }
    Serial.println("\n[OK] Waktu Terupdate dari Internet!");

    // Update RTC dari Jam Internet
    struct tm * ptm = localtime(&now);
    rtc.adjust(DateTime(ptm->tm_year + 1900, ptm->tm_mon + 1, ptm->tm_mday, ptm->tm_hour, ptm->tm_min, ptm->tm_sec));
    Serial.printf("Waktu RTC sekarang: %02d:%02d:%02d\n", ptm->tm_hour, ptm->tm_min, ptm->tm_sec);
  } else {
    Serial.println("\n[ERROR] Gagal menyambung ke WiFi. Cek SSID/Password atau pastikan WiFi 2.4GHz!");
  }
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    unsigned long now = millis();

    // 1. Cek Trigger Manual (Setiap 1 detik agar lebih responsif)
    if (now - lastCheckTrigger > 1000) {
      checkManualTrigger();
      lastCheckTrigger = now;
    }

    // 2. Heartbeat (Setiap 15 detik)
    if (now - lastHeartbeat > 15000) {
      sendHeartbeat();
      lastHeartbeat = now;
    }

    // 3. Cek Jadwal Otomatis (Setiap 30 detik untuk akurasi menit)
    if (now - lastCheckSchedule > 30000) {
      checkAutoSchedule();
      lastCheckSchedule = now;
    }
  } else {
    // Jika WiFi putus, coba hubungkan kembali
    Serial.println("WiFi Terputus! Menghubungkan kembali...");
    WiFi.begin(ssid, password);
    delay(5000);
  }
}

void sendHeartbeat() {
  WiFiClientSecure client;
  client.setInsecure();
  HTTPClient http;

  String url = String(supabase_url) + "/rest/v1/device_status?id=eq." + device_id;
  http.begin(client, url);
  http.addHeader("apikey", supabase_key);
  http.addHeader("Authorization", String("Bearer ") + supabase_key);
  http.addHeader("Content-Type", "application/json");
  
  int httpResponseCode = http.PATCH("{\"last_heartbeat\": \"now()\"}");
  if (httpResponseCode > 0) {
    Serial.print("Heartbeat Sent! Code: ");
    Serial.println(httpResponseCode);
  } else {
    Serial.print("Heartbeat Failed: ");
    Serial.println(http.errorToString(httpResponseCode));
  }
  http.end();
}

void checkManualTrigger() {
  WiFiClientSecure client;
  client.setInsecure();
  HTTPClient http;

  String url = String(supabase_url) + "/rest/v1/device_status?select=manual_feed_trigger&id=eq." + device_id;
  http.begin(client, url);
  http.addHeader("apikey", supabase_key);
  http.addHeader("Authorization", String("Bearer ") + supabase_key);

  int httpResponseCode = http.GET();
  if (httpResponseCode == 200) {
    String payload = http.getString();
    StaticJsonDocument<200> doc;
    deserializeJson(doc, payload);
    
    bool trigger = doc[0]["manual_feed_trigger"];
    if (trigger) {
      Serial.println("--- Trigger Manual Terdeteksi! ---");
      jalankanPakan("MANUAL");
      resetManualTrigger();
    }
  }
  http.end();
}

void resetManualTrigger() {
  WiFiClientSecure client;
  client.setInsecure();
  HTTPClient http;
  String url = String(supabase_url) + "/rest/v1/device_status?id=eq." + device_id;
  http.begin(client, url);
  http.addHeader("apikey", supabase_key);
  http.addHeader("Authorization", String("Bearer ") + supabase_key);
  http.addHeader("Content-Type", "application/json");
  http.PATCH("{\"manual_feed_trigger\": false}");
  http.end();
}

void checkAutoSchedule() {
  DateTime now = rtc.now();
  int jam = now.hour();
  int menit = now.minute();
  
  // Debug waktu setiap 1 menit (saat menit berubah)
  if (menit != menitTerakhirMakan) {
    Serial.printf("[SYSTEM] Jam RTC: %02d:%02d | Cek Jadwal...\n", jam, menit);
  } else {
    return; // Sudah diproses di menit ini
  }

  WiFiClientSecure client;
  client.setInsecure();
  HTTPClient http;
  
  // Ambil semua jadwal aktif
  String url = String(supabase_url) + "/rest/v1/schedules?is_active=eq.true&select=time,duration";
  http.begin(client, url);
  http.addHeader("apikey", supabase_key);
  http.addHeader("Authorization", String("Bearer ") + supabase_key);

  int httpResponseCode = http.GET();
  if (httpResponseCode == 200) {
    String payload = http.getString();
    DynamicJsonDocument doc(2048); // Kapasitas lebih besar
    DeserializationError error = deserializeJson(doc, payload);

    if (error) {
      Serial.print("[JSON] Gagal parsing: ");
      Serial.println(error.c_str());
      return;
    }

    JsonArray arr = doc.as<JsonArray>();
    bool foundMatch = false;

    for (JsonObject s : arr) {
      String schedTime = s["time"].as<String>(); 
      if (schedTime.length() < 5) continue;

      // Parsing format HH:mm:ss atau HH:mm menggunakan substring
      int sJam = schedTime.substring(0, 2).toInt();
      int sMenit = schedTime.substring(3, 5).toInt();
      
      // Munculkan di log setiap ada jadwal yang diperiksa
      Serial.printf("[DEBUG] Jadwal DB: %02d:%02d | RTC: %02d:%02d\n", sJam, sMenit, jam, menit);

      if (jam == sJam && menit == sMenit) {
        Serial.printf(">>> MATCH! Jadwal %02d:%02d ditemukan.\n", sJam, sMenit);
        int durasi = s["duration"] | 3;
        jalankanPakanCustom(durasi * 1000, "AUTO");
        menitTerakhirMakan = menit;
        foundMatch = true;
        break; 
      }
    }
    
    if (!foundMatch) {
      // Tandai menit ini sudah dicek meskipun tidak ada jadwal
      menitTerakhirMakan = menit;
    }

  } else {
    Serial.printf("[HTTP] Gagal cek jadwal. Error: %d\n", httpResponseCode);
  }
  http.end();
}

void jalankanPakan(String tipe) {
  jalankanPakanCustom(3000, tipe); // Default 3 detik
}

void jalankanPakanCustom(int durasi, String tipe) {
  Serial.printf("[ACT] Menjalankan Pakan (%s) selama %d ms...\n", tipe.c_str(), durasi);
  
  servoKatup.attach(pinServo); 
  delay(100);
  
  servoKatup.write(sudutBuka);
  delay(durasi);
  
  servoKatup.write(sudutTutup);
  delay(500); 
  
  servoKatup.detach(); // Lepas agar tidak interferensi dengan WiFi
  Serial.println("[ACT] Selesai menggerakkan servo.");
  
  catatRiwayat(tipe);
}

void catatRiwayat(String tipe) {
  WiFiClientSecure client;
  client.setInsecure();
  HTTPClient http;
  String url = String(supabase_url) + "/rest/v1/feed_history";
  http.begin(client, url);
  http.addHeader("apikey", supabase_key);
  http.addHeader("Authorization", String("Bearer ") + supabase_key);
  http.addHeader("Content-Type", "application/json");
  
  String body = "{\"type\": \"" + tipe + "\", \"success\": true}";
  int httpResponseCode = http.POST(body);
  
  if (httpResponseCode > 0) {
    Serial.printf("[LOG] Riwayat tercatat: %d\n", httpResponseCode);
  } else {
    Serial.printf("[LOG] Gagal catat riwayat: %s\n", http.errorToString(httpResponseCode).c_str());
  }
  
  http.end();
}
