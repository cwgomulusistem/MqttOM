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

## **Güncel Plan: Gelişmiş Topic Yönetimi ve Arayüz İyileştirmeleri**

**Amaç:** Uygulamaya esnek bir topic yönetim sistemi eklemek, RPC dahil tüm topic'leri dinleyebilmek ve arayüzü daha kullanışlı hale getirmek. Kullanıcılar artık istedikleri topic'leri (örn. `#` veya `MQTTnet.RPC/+/+`) manuel olarak ekleyip kaldırabilecekler.

**Adımlar:**

1.  **Arayüzün Yeniden Düzenlenmesi:**
    *   `DashboardComponent`'te **Publisher** ve **Topic Monitor** bileşenleri yan yana, yatay bir düzende konumlandırılacak. Bu, özellikle geniş ekranlarda daha iyi bir genel bakış sağlayacak.
2.  **Topic Yönetim Arayüzünün Oluşturulması:**
    *   `TopicManagerComponent` adında yeni bir bileşen oluşturulacak. Bu bileşen, kullanıcıların abone olunacak topic'leri ekleyip silebileceği bir form içerecek.
3.  **Merkezi Topic Yönetim Servisinin Geliştirilmesi:**
    *   `DeviceStateService`, artık sadece cihaz durumunu değil, aynı zamanda kullanıcı tarafından eklenen özel topic listesini de yönetecek. Varsayılan olarak bu liste `['#']` topic'ini içerecek.
4.  **MQTT Servisinin Dinamik Abonelik Yeteneği Kazanması:**
    *   `MqttService`, başlangıçta `DeviceStateService`'teki varsayılan topic'lere abone olacak ve bu listede yapılan her değişikliği (yeni topic ekleme/çıkarma) anında MQTT broker'ına yansıtacak.
5.  **Bileşenlerin Entegrasyonu:**
    *   Yeni `TopicManagerComponent`, `DashboardComponent`'e entegre edilecek ve tüm sistemin uyumlu bir şekilde çalışması sağlanacak.

---

## **Tamamlanan Planlar**

### Faz 1-5 & Kodun Yeniden Yapılandırılması

*   Proje iskeleti kuruldu, çekirdek servisler oluşturuldu, login ve dashboard bileşenleri geliştirildi.
*   `DeviceListComponent`, servis tabanlı ve sinyal odaklı çalışacak şekilde tamamen yeniden yapılandırıldı. Arayüzü iki panelli (cihaz listesi ve topic detayları) modern bir yapıya kavuşturuldu.
*   `TopicMonitorComponent`'in `DeviceListComponent`'teki değişikliklerle uyumlu hale getirilmesi sağlandı.
*   Tüm derleme hataları giderilerek projenin kararlı bir duruma getirilmesi sağlandı.

---
