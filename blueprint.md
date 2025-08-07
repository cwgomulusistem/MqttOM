# MQTT Dashboard Projesi

## Proje Özeti

Bu proje, yüzlerce IoT cihazını gerçek zamanlı olarak izlememize, onlarla etkileşime geçmemize olanak tanıyan, ölçeklenebilir, bakımı kolay ve modern bir web uygulamasıdır. Uygulama, MQTT altyapısına bağlanarak cihaz verilerini görselleştirir ve yönetir.

## Uygulanan Tasarım ve Özellikler

*   **Mimari:** %100 Standalone bileşenler, servis tabanlı mimari, reaktif durum yönetimi (RxJS & Sinyaller).
*   **Teknoloji:** Angular v20+, Angular Material, MQTT.js, RxJS.
*   **Tasarım:** Modern, mobil uyumlu ve kullanıcı dostu arayüz. Çok katmanlı gölgeler, canlı renk paleti, etkileşimli bileşenler.
*   **Erişilebilirlik (A11Y):** Tüm kullanıcı grupları için erişilebilirlik standartlarına uygunluk.
*   **Çekirdek Servisler:** `MqttService` ve `DeviceStateService` oluşturuldu.

---

## **Güncel Plan: Kodun Yeniden Yapılandırılması ve Geliştirilmesi**

**Amaç:** Kod kalitesini artırmak, `device-list` bileşenini daha modüler hale getirmek ve kullanıcı arayüzünü daha işlevsel kılmak. Bu yeniden yapılandırma, `isConnected: true` olan cihazların listelenmesini, bu cihazlara ait dinamik MQTT topic'lerinin `tenant` kimliği ile oluşturulmasını ve hem cihazlar hem de topic'ler için ayrı ayrı filtreleme yapılmasını sağlayacaktır.

**Adımlar:**

1.  **`auth.service.ts` Oluşturulması:** Kullanıcı `tenant` kimliğini simüle eden ve uygulama genelinde erişilebilir kılan bir servis oluşturulacak.
2.  **`mqtt-topic.service.ts` Oluşturulması:** Cihaza ve `tenant`'a özel MQTT topic'lerini dinamik olarak üretme mantığını barındıran yeni bir servis eklenecek.
3.  **`device-list.component`'in Yeniden Yazılması:**
    *   Bileşen, yeni oluşturulan servisleri kullanacak.
    *   `filteredDevices` sinyali, artık sadece bağlı cihazları gösterecek ve her cihaz için topic listesini de içerecek şekilde güncellenecek.
    *   `filteredTopics` adında yeni bir hesaplanmış sinyal eklenerek seçili cihaza ait topic'lerin filtrelenmesi sağlanacak.
4.  **Arayüzün (HTML/SCSS) Modernizasyonu:**
    *   Ekran ikiye bölünecek: Sol panelde filtrelenebilir cihaz listesi, sağ panelde ise seçilen cihaza ait filtrelenebilir topic listesi yer alacak.
    *   Topic'ler, türlerine (`rpc`, `general` vb.) göre `mat-chip` bileşeni ve özel stillerle görsel olarak etiketlenecek.

---

## **Tamamlanan Planlar**

### Faz 1: Proje İskeletinin Kurulması ve Çekirdek Servislerin Oluşturulması
*   Proje iskeleti modern Angular standartlarına göre oluşturuldu.
*   Çekirdek servisler (`MqttService`, `DeviceStateService`) tanımlandı.
*   Temel yönlendirme ve klasör yapısı kuruldu.

### Faz 2: Bağlantı (Login) Ekranının Geliştirilmesi
*   `LoginComponent` reaktif bir form ile oluşturuldu.
*   `MqttService` aracılığıyla gerçek MQTT bağlantı mantığı entegre edildi.
*   Başlangıç rotası (`/login`) ve başarılı bağlantı sonrası yönlendirme için altyapı hazırlandı.

### Faz 3: Ana Panel (Dashboard) ve Cihaz Listesi
*   `DashboardComponent` ve `DeviceListComponent` oluşturuldu.
*   Cihaz listeleme, filtreleme ve seçme işlevselliği eklendi.
*   `DeviceStateService` ile bileşenler arası iletişim sağlandı.

### Faz 4: Topic Monitörü ve Gerçek Zamanlı Veri Akışı
*   `TopicMonitorComponent` oluşturuldu.
*   Seçilen cihaza göre dinamik topic üretimi ve abonelik yönetimi sağlandı.
*   `MqttService.messageStream$` üzerinden gerçek zamanlı mesaj akışı gösterildi.

### Faz 5: Yayınlama (Publisher) ve Son Dokunuşlar
*   Kullanıcının MQTT mesajı göndermesini sağlayacak `PublisherComponent` oluşturuldu.
*   `MqttService`'e `unsubscribeFromTopic` metodu eklendi ve entegre edildi.
*   Gelen JSON mesajlarının okunabilirliğini artırmak için bir `PrettyJsonPipe` oluşturuldu.
*   Tüm bileşenler ana panele entegre edildi ve genel stil iyileştirmeleri yapıldı.
*   Tüm derleme hataları giderilerek projenin kararlı bir duruma getirilmesi sağlandı.

---

**PROJE BAŞARIYLA TAMAMLANDI.**
