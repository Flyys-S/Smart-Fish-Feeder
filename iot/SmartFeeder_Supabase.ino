#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <RTClib.h>
#include <Servo.h>

// --- KONFIGURASI WIFI ---
const char* ssid = "NAMA_WIFI_ANDA";
const char* password = "PASSWORD_WIFI_ANDA";

// --- KONFIGURASI SUPABASE ---
// Ambil dari file .env proyek Anda
const char* supabase_url = "https://smpluwvjqrpaqvwrwity.supabase.co"; 
const char* supabase_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."; // Isi dengan Anon Key lengkap
const char* device_id = "MASUKKAN_ID_DARI_TABLE_DEVICE_STATUS"; // Cek di dashboard Supabase

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
  
  servoKatup.attach(pinServo);
  servoKatup.write(sudutTutup);
  
  Wire.begin(D2, D1);
  if (!rtc.begin()) {
    Serial.println("RTC tidak ditemukan!");
  }

  // Koneksi WiFi
  WiFi.begin(ssid, password);
  Serial.print("Menghubungkan ke WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi Terhubung!");
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    unsigned long now = millis();

    // 1. Heartbeat & Cek Trigger Manual (Setiap 3 detik)
    if (now - lastCheckTrigger > 3000) {
      checkManualTrigger();
      lastCheckTrigger = now;
    }

    // 2. Heartbeat (Setiap 15 detik)
    if (now - lastHeartbeat > 15000) {
      sendHeartbeat();
      lastHeartbeat = now;
    }

    // 3. Cek Jadwal Otomatis (Setiap 1 menit)
    checkAutoSchedule();
  }
}

void sendHeartbeat() {
  WiFiClientSecure client;
  client.setInsecure(); // Supabase butuh HTTPS
  HTTPClient http;

  String url = String(supabase_url) + "/rest/v1/device_status?id=eq." + device_id;
  http.begin(client, url);
  http.addHeader("apikey", supabase_key);
  http.addHeader("Authorization", String("Bearer ") + supabase_key);
  http.addHeader("Content-Type", "application/json");
  
  int httpResponseCode = http.PATCH("{\"last_heartbeat\": \"now()\"}");
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
      Serial.println("Trigger Manual Terdeteksi!");
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
  if (sekarang.minute() == menitTerakhirMakan) return;

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
    DynamicJsonDocument doc(1024);
    deserializeJson(doc, payload);
    JsonArray arr = doc.as<JsonArray>();

    char jamSekarang[6];
    sprintf(jamSekarang, "%02d:%02d", sekarang.hour(), sekarang.minute());

    for (JsonObject v : arr) {
      if (String(v["time"].as<const char*>()) == String(jamSekarang)) {
        Serial.println("Waktunya Makan (Otomatis)!");
        int durasi = v["duration"].as<int>() * 1000;
        jalankanPakanCustom(durasi, "AUTO");
        menitTerakhirMakan = sekarang.minute();
        break;
      }
    }
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
