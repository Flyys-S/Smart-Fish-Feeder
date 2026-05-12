#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <Wire.h>
#include <RTClib.h>
#include <Servo.h>
#include <EEPROM.h>

const char* ssid = "AlatPakanIkan"; 
const char* password = "";            

ESP8266WebServer server(80);
RTC_DS3231 rtc;
Servo servoKatup;

const int pinServo = D6;
int sudutTutup = 0;   
int sudutBuka = 180;   

struct ConfigAlat {
  int jamJadwal[5];
  int menitJadwal[5];
  int durasiJadwal[5]; 
  int jumlahJadwal;
  int magicNumber; 
};
ConfigAlat EEPROMData;

int menitTerakhirMakan = -1; 
unsigned long waktuBacaRTCTerakhir = 0;
bool rtcTerhubung = false; 

int jamV = 0, menitV = 0, detikV = 0;
bool jamVirtualAktif = false;
unsigned long timerVirtual = 0;

const char halamanUtamaHTML[] PROGMEM = R"rawliteral(
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dashboard Pakan Ikan</title>
  <style>
    :root {
      --primary: #0083B0;
      --secondary: #00B4DB;
      --dark: #2c3e50;
      --light: #f8f9fa;
      --success: #20bf6b;
      --warning: #f7b731;
      --danger: #eb3b5a;
    }
    body {
      margin: 0; padding: 0;
      font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: linear-gradient(135deg, var(--primary), var(--secondary));
      min-height: 100vh;
      color: var(--dark);
      display: flex;
      justify-content: center;
      align-items: flex-start;
      padding-top: 30px;
      padding-bottom: 50px;
    }
    .container {
      width: 100%;
      max-width: 420px;
      padding: 0 20px;
      box-sizing: border-box;
    }
    
    .header {
      text-align: center;
      color: white;
      margin-bottom: 25px;
    }
    .header h2 { 
      margin: 0; 
      font-size: 32px; 
      font-weight: 800; 
      letter-spacing: 1px;
      text-shadow: 0 4px 10px rgba(0,0,0,0.2); 
    }
    .header p { 
      margin: 5px 0 0 0; 
      font-size: 15px;
      opacity: 0.9; 
    }

    .layar-jam {
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(255,255,255,0.3);
      border-radius: 20px;
      text-align: center;
      padding: 25px 20px;
      color: white;
      margin-bottom: 25px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.15);
    }
    .layar-jam p { 
      margin: 0; 
      font-size: 14px; 
      font-weight: 600; 
      text-transform: uppercase; 
      letter-spacing: 1.5px;
    }
    .layar-jam h1 { 
      margin: 10px 0 0 0; 
      font-size: 50px; 
      font-variant-numeric: tabular-nums; 
      font-weight: 700; 
      text-shadow: 0 4px 15px rgba(0,0,0,0.2); 
    }

    .kartu {
      background: #ffffff;
      border-radius: 20px;
      padding: 25px 20px;
      margin-bottom: 20px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.1);
    }
    .kartu h3 {
      margin-top: 0; 
      font-size: 18px; 
      font-weight: 700; 
      color: var(--dark);
      display: flex; 
      align-items: center; 
      gap: 10px; 
      margin-bottom: 20px;
      border-bottom: 2px solid #ecf0f1; 
      padding-bottom: 12px;
    }

    .form-group {
      margin-bottom: 15px;
      text-align: left;
    }
    label { 
      font-size: 14px; 
      font-weight: 600; 
      color: #7f8c8d; 
      margin-bottom: 8px; 
      display: block; 
    }
    input {
      width: 100%; 
      padding: 14px 15px; 
      border-radius: 12px;
      border: 1.5px solid #dcdde1; 
      background: #fdfdfd;
      font-size: 16px; 
      font-family: inherit; 
      color: var(--dark);
      box-sizing: border-box; 
      transition: all 0.3s ease;
    }
    input:focus { 
      border-color: var(--primary); 
      outline: none; 
      box-shadow: 0 0 0 4px rgba(0, 180, 219, 0.15); 
      background: #fff;
    }

    .tombol {
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
      color: white; 
      border: none; 
      padding: 15px 20px; 
      border-radius: 12px;
      font-size: 16px; 
      font-weight: bold; 
      width: 100%; 
      cursor: pointer;
      transition: all 0.2s ease; 
      box-shadow: 0 6px 15px rgba(79, 172, 254, 0.3);
    }
    .tombol:active { transform: scale(0.97); }
    .tombol-hijau {
      background: linear-gradient(135deg, #20bf6b 0%, #0fb9b1 100%);
      box-shadow: 0 6px 15px rgba(32, 191, 107, 0.3);
    }
    .tombol-merah {
      background: linear-gradient(135deg, #fc5c65 0%, #eb3b5a 100%);
      box-shadow: 0 6px 15px rgba(235, 59, 90, 0.3);
      margin-top: 10px;
    }

    .item-jadwal {
      background: var(--light);
      border-radius: 12px; 
      padding: 15px; 
      margin-bottom: 12px;
      display: flex; 
      justify-content: space-between; 
      align-items: center;
      border-left: 6px solid var(--primary);
    }
    .item-jadwal span.jam { 
      font-size: 18px; 
      font-weight: 700;
      color: var(--dark); 
    }
    .item-jadwal span.durasi { 
      background: white; 
      padding: 6px 12px; 
      border-radius: 8px; 
      font-size: 13px; 
      font-weight: 600;
      color: #7f8c8d; 
      border: 1px solid #dcdde1;
    }
    .jadwal-kosong {
      text-align: center;
      color: #95a5a6;
      font-style: italic;
      padding: 10px 0;
    }

    .notif-error {
      display: none; 
      background: #fff3cd; 
      color: #856404;
      font-weight: 600; 
      padding: 15px; 
      border-radius: 15px;
      margin-bottom: 25px; 
      text-align: center; 
      border: 1px solid #ffeeba;
      font-size: 14px; 
      box-shadow: 0 4px 15px rgba(0,0,0,0.05);
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="container">
    
    <div class="header">
      <h2>Fish Feeder</h2>
      <p>Sistem Pakan Ikan Otomatis</p>
    </div>
    
    <div id="peringatan" class="notif-error">⚠️ Modul RTC tidak terdeteksi!</div>

    <div class="layar-jam">
      <p id="labelJam">Waktu Sistem Saat Ini</p>
      <h1 id="tampilanJam">--:--:--</h1>
    </div>

    <div class="kartu">
      <h3>⌚ Sinkronisasi Waktu</h3>
      <div class="form-group">
        <label>Sesuaikan Jam Alat (Otomatis Tersimpan)</label>
        <input type="time" id="inputJamSekarang">
      </div>
      <button class="tombol" onclick="simpanWaktu()">Simpan Waktu Sekarang</button>
    </div>

    <div class="kartu">
      <h3>🍽️ Tambah Jadwal Pakan</h3>
      <div class="form-group">
        <label>Pilih Jam Buka Katup</label>
        <input type="time" id="inputJamMakan">
      </div>
      <div class="form-group">
        <label>Durasi Katup Terbuka (1 - 10 Detik)</label>
        <input type="number" id="inputDurasi" placeholder="Misal: 2" min="1" max="10">
      </div>
      <button class="tombol tombol-hijau" onclick="tambahJadwal()">+ Tambahkan Jadwal</button>
    </div>

    <div class="kartu">
      <h3>📋 Daftar Jadwal Aktif</h3>
      <div id="wadahJadwal">
        <div class="jadwal-kosong">Memuat data dari alat...</div>
      </div>
      <button class="tombol tombol-merah" onclick="hapusSemuaJadwal()">🗑️ Hapus Semua Jadwal</button>
    </div>
    
  </div>

  <script>
    function ambilDataDariAlat() {
      fetch('/status')
        .then(response => {
          if(!response.ok) throw new Error("Gagal respon");
          return response.json();
        })
        .then(data => {
          // Sistem Peringatan Cerdas
          let p = document.getElementById('peringatan');
          let label = document.getElementById('labelJam');
          
          if(data.rtc == 0 && data.jam == "--:--:--") {
            p.style.display = 'block';
            p.style.background = '#fff3cd';
            p.style.color = '#856404';
            p.style.borderColor = '#ffeeba';
            p.innerHTML = "⚠️ <b>Modul RTC tidak terbaca.</b><br>Silakan atur waktu secara manual di menu Sinkronisasi Waktu untuk mengaktifkan Jam Virtual.";
            label.innerText = "Waktu Sistem Saat Ini";
          } else if (data.rtc == 0 && data.jam != "--:--:--") {
            p.style.display = 'block';
            p.style.background = '#d4edda';
            p.style.color = '#155724';
            p.style.borderColor = '#c3e6cb';
            p.innerHTML = "⚡ <b>Mode Jam Virtual Aktif</b><br>Sistem berjalan menggunakan jam internal memori (RTC terputus).";
            label.innerText = "Jam Virtual Internal";
          } else {
            p.style.display = 'none';
            label.innerText = "Waktu Sistem (RTC Aktif)";
          }
          
          document.getElementById('tampilanJam').innerText = data.jam;
          
          let wadah = document.getElementById('wadahJadwal');
          if(data.jml == 0) {
             wadah.innerHTML = '<div class="jadwal-kosong">Belum ada jadwal pakan yang diatur.</div>';
          } else {
             let htmlList = "";
             for(let i = 0; i < data.jml; i++) {
                let jamFormat = data.jadwal[i].h < 10 ? "0" + data.jadwal[i].h : data.jadwal[i].h;
                let menitFormat = data.jadwal[i].m < 10 ? "0" + data.jadwal[i].m : data.jadwal[i].m;
                // Modifikasi struktur list agar CSS bisa memisahkan kiri dan kanan dengan rapi
                htmlList += `<div class="item-jadwal">
                               <span class="jam">⏰ ${jamFormat}:${menitFormat}</span>
                               <span class="durasi">⏳ ${data.jadwal[i].d / 1000} Detik</span>
                             </div>`;
             }
             wadah.innerHTML = htmlList;
          }
        })
        .catch(err => console.log("Menunggu koneksi alat..."))
        .finally(() => { setTimeout(ambilDataDariAlat, 1000); });
    }

    function simpanWaktu() {
      let waktu = document.getElementById('inputJamSekarang').value;
      if(!waktu) { alert("Mohon isi jam terlebih dahulu!"); return; }
      fetch('/setWaktu?jam=' + encodeURIComponent(waktu))
        .then(response => {
           alert("✅ Waktu berhasil disinkronkan ke alat!");
           document.getElementById('inputJamSekarang').value = "";
        });
    }

    function tambahJadwal() {
      let waktu = document.getElementById('inputJamMakan').value;
      let durasi = document.getElementById('inputDurasi').value;
      if(!waktu || !durasi) { alert("Mohon lengkapi jam dan durasi!"); return; }
      fetch(`/tambahJadwal?jam=${encodeURIComponent(waktu)}&durasi=${durasi}`)
        .then(response => response.text())
        .then(pesan => {
           if(pesan == "PENUH") alert("⚠️ Slot Penuh! Alat hanya bisa menyimpan maksimal 5 jadwal.");
           else {
             alert("✅ Jadwal baru berhasil ditambahkan!");
             document.getElementById('inputJamMakan').value = "";
             document.getElementById('inputDurasi').value = "";
           }
        });
    }

    function hapusSemuaJadwal() {
      if(confirm("Apakah Anda yakin ingin menghapus seluruh jadwal pakan?")) { 
        fetch('/hapusJadwal').then(res => alert("✅ Semua jadwal telah dihapus.")); 
      }
    }
    
    window.onload = ambilDataDariAlat;
  </script>
</body>
</html>
)rawliteral";

void muatPengaturanEEPROM() {
  EEPROM.begin(512);
  EEPROM.get(0, EEPROMData);
  if (EEPROMData.magicNumber != 77777 || EEPROMData.jumlahJadwal < 0 || EEPROMData.jumlahJadwal > 5) {
    EEPROMData.jumlahJadwal = 0;
    EEPROMData.magicNumber = 77777;
    for(int i=0; i<5; i++) { EEPROMData.jamJadwal[i] = 0; EEPROMData.menitJadwal[i] = 0; EEPROMData.durasiJadwal[i] = 0; }
    EEPROM.put(0, EEPROMData); EEPROM.commit();
  }
}

void setup() {
  Serial.begin(115200);
  muatPengaturanEEPROM();
  servoKatup.attach(pinServo);
  servoKatup.write(sudutTutup); 
  Wire.begin(D2, D1); 
  
  if (rtc.begin()) { 
    rtcTerhubung = true; 
  } else { 
    rtcTerhubung = false; 
  }

  WiFi.mode(WIFI_AP);
  WiFi.softAPConfig(IPAddress(192,168,4,1), IPAddress(192,168,4,1), IPAddress(255,255,255,0));
  WiFi.softAP(ssid, password);
  
  server.on("/", []() {
    server.sendHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    server.sendHeader("Pragma", "no-cache");
    server.sendHeader("Expires", "-1");
    server.sendHeader("Content-Type", "text/html; charset=utf-8");
    server.client().setNoDelay(true); 
    server.send_P(200, "text/html", halamanUtamaHTML);
  });

  server.on("/status", []() {
    String jamFormat = "--:--:--";
    
    if (rtcTerhubung) {
      DateTime sekarang = rtc.now();
      jamFormat = (sekarang.hour() < 10 ? "0" : "") + String(sekarang.hour()) + ":" +
                  (sekarang.minute() < 10 ? "0" : "") + String(sekarang.minute()) + ":" +
                  (sekarang.second() < 10 ? "0" : "") + String(sekarang.second());
    } else if (jamVirtualAktif) {
      jamFormat = (jamV < 10 ? "0" : "") + String(jamV) + ":" +
                  (menitV < 10 ? "0" : "") + String(menitV) + ":" +
                  (detikV < 10 ? "0" : "") + String(detikV);
    }

    int batasJadwal = EEPROMData.jumlahJadwal;
    if(batasJadwal > 5) batasJadwal = 5;

    String jsonString = "{";
    jsonString += "\"jam\":\"" + jamFormat + "\",";
    jsonString += "\"rtc\":" + String(rtcTerhubung ? 1 : 0) + ",";
    jsonString += "\"jml\":" + String(batasJadwal) + ",";
    jsonString += "\"jadwal\":[";
    
    for(int i = 0; i < batasJadwal; i++) {
      jsonString += "{\"h\":" + String(EEPROMData.jamJadwal[i]) + ",\"m\":" + String(EEPROMData.menitJadwal[i]) + ",\"d\":" + String(EEPROMData.durasiJadwal[i]) + "}";
      if(i < batasJadwal - 1) jsonString += ",";
    }
    jsonString += "]}";
    server.send(200, "application/json", jsonString);
  });

  server.on("/setWaktu", []() {
    if (server.hasArg("jam")) {
      String waktuMasuk = server.arg("jam");
      int jamInput = waktuMasuk.substring(0, 2).toInt();
      int menitInput = waktuMasuk.substring(3, 5).toInt();
      
      if(rtcTerhubung) { 
        rtc.adjust(DateTime(2026, 1, 1, jamInput, menitInput, 0)); 
      } 
      
      jamV = jamInput;
      menitV = menitInput;
      detikV = 0;
      jamVirtualAktif = true;
    }
    server.send(200, "text/plain", "OK");
  });

  server.on("/tambahJadwal", []() {
    if (EEPROMData.jumlahJadwal >= 5) { server.send(200, "text/plain", "PENUH"); return; }
    if (server.hasArg("jam") && server.hasArg("durasi")) {
      String waktuMakan = server.arg("jam");
      int indeks = EEPROMData.jumlahJadwal;
      EEPROMData.jamJadwal[indeks] = waktuMakan.substring(0, 2).toInt();
      EEPROMData.menitJadwal[indeks] = waktuMakan.substring(3, 5).toInt();
      EEPROMData.durasiJadwal[indeks] = server.arg("durasi").toInt() * 1000; 
      EEPROMData.jumlahJadwal++;
      EEPROM.put(0, EEPROMData); EEPROM.commit(); 
    }
    server.send(200, "text/plain", "OK");
  });

  server.on("/hapusJadwal", []() {
    EEPROMData.jumlahJadwal = 0;
    EEPROM.put(0, EEPROMData); EEPROM.commit();
    server.send(200, "text/plain", "OK");
  });

  server.begin();
}

void loop() {
  server.handleClient(); 
  
  if (millis() - waktuBacaRTCTerakhir > 1000) {
    waktuBacaRTCTerakhir = millis();
    
    if (!rtcTerhubung && jamVirtualAktif) {
      detikV++;
      if (detikV >= 60) { detikV = 0; menitV++; }
      if (menitV >= 60) { menitV = 0; jamV++; }
      if (jamV >= 24) { jamV = 0; }
    }

    int jamSekarang = rtcTerhubung ? rtc.now().hour() : jamV;
    int menitSekarang = rtcTerhubung ? rtc.now().minute() : menitV;
    
    if ((rtcTerhubung || jamVirtualAktif) && menitSekarang != menitTerakhirMakan) {
      for (int i = 0; i < EEPROMData.jumlahJadwal; i++) {
        if (jamSekarang == EEPROMData.jamJadwal[i] && menitSekarang == EEPROMData.menitJadwal[i]) {
          servoKatup.write(sudutBuka);      
          delay(EEPROMData.durasiJadwal[i]);    
          servoKatup.write(sudutTutup);     
          menitTerakhirMakan = menitSekarang; 
          break; 
        }
      }
    }
  }
}
