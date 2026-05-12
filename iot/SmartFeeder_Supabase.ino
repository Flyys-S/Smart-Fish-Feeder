#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <RTClib.h>
#include <Servo.h>

// --- KONFIGURASI WIFI ---
const char* ssid = "Flyys";
const char* password = "Ra150105";

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
  DateTime sekarang = rtc.now();
  
  // Pastikan hanya cek satu kali per menit
  if (sekarang.minute() == menitTerakhirMakan) return;
  
  Serial.print("Mengecek Jadwal pada ");
  Serial.print(sekarang.hour());
  Serial.print(":");
  Serial.println(sekarang.minute());

  WiFiClientSecure client;
  client.setInsecure();
  HTTPClient http;

  String url = String(supabase_url) + "/rest/v1/schedules?is_active=eq.true&select=time,duration";
  http.begin(client, url);
  http.addHeader("apikey", supabase_key);
  http.addHeader("Authorization", String("Bearer ") + supabase_key);

  int httpResponseCode = http.GET();
  if (httpResponseCode == 200) {
    String payload = http.getString();
    DynamicJsonDocument doc(2048);
    deserializeJson(doc, payload);
    JsonArray arr = doc.as<JsonArray>();

    char jamSekarang[6];
    sprintf(jamSekarang, "%02d:%02d", sekarang.hour(), sekarang.minute());

    for (JsonObject v : arr) {
      if (String(v["time"].as<const char*>()).substring(0, 5) == String(jamSekarang)) {
        Serial.println("--- Waktunya Makan (Otomatis)! ---");
        int durasi = v["duration"].as<int>() * 1000;
        jalankanPakanCustom(durasi, "AUTO");
        break;
      }
    }
    // Tandai menit ini sudah dicek agar tidak spamming
    menitTerakhirMakan = sekarang.minute();
  }
  http.end();
}

void jalankanPakan(String tipe) {
  jalankanPakanCustom(3000, tipe); // Default 3 detik
}

void jalankanPakanCustom(int durasi, String tipe) {
  servoKatup.write(sudutBuka);
  delay(durasi);
  servoKatup.write(sudutTutup);
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
  http.POST(body);
  http.end();
}
