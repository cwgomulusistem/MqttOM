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

## **Güncel Plan: Topic Monitörünün Yeniden Yapılandırılması**

**Amaç:** `TopicMonitorComponent`'i, `DeviceListComponent`'te yapılan son değişikliklerle uyumlu hale getirmek ve kullanıcı deneyimini iyileştirmek. Yeni yapıda, bir cihaz seçildiğinde o cihaza ait topic'ler monitörde listelenecek, kullanıcı bir topic seçtiğinde ise sadece o topic'e ait mesajlar gerçek zamanlı olarak görüntülenecektir.

**Adımlar:**

1.  **`topic-monitor.component.ts`'in Yeniden Yazılması:**
    *   Bileşen artık kendi topic listesini oluşturmayacak; bunun yerine `DeviceStateService`'ten gelen `selectedDevice` sinyalindeki hazır topic listesini kullanacak.
    *   Kullanıcının seçtiği topic'i saklamak için `selectedTopic` adında bir sinyal oluşturulacak.
    *   Seçilen topic değiştiğinde MQTT aboneliklerini yönetecek (eskiyi bırak, yeniye abone ol) bir `effect` mekanizması kurulacak.
    *   `MqttService`'teki genel mesaj akışını `selectedTopic`'e göre filtreleyen bir `computed` sinyal oluşturulacak.
2.  **`topic-monitor.component.html`'in Modernizasyonu:**
    *   Arayüz, seçilen cihaza ait topic'lerin listelendiği bir alan ve bu topic'lerden birine tıklandığında mesajların gösterildiği bir monitör alanı olarak ikiye ayrılacak.
3.  **`topic-monitor.component.scss`'in Güncellenmesi:**
    *   Yeni arayüz düzenini destekleyen ve seçili olan topic'i vurgulayan stiller eklenecek.

---

## **Tamamlanan Planlar**

### Faz 1-5 & Kodun Yeniden Yapılandırılması

*   Proje iskeleti kuruldu, çekirdek servisler oluşturuldu, login ve dashboard bileşenleri geliştirildi.
*   `DeviceListComponent`, servis tabanlı ve sinyal odaklı çalışacak şekilde tamamen yeniden yapılandırıldı. Arayüzü iki panelli (cihaz listesi ve topic detayları) modern bir yapıya kavuşturuldu.
*   Tüm derleme hataları giderilerek projenin kararlı bir duruma getirilmesi sağlandı.

---
