# MQTT Dashboard Projesi

## Proje Özeti

Bu proje, yüzlerce IoT cihazını gerçek zamanlı olarak izlememize, onlarla etkileşime geçmemize olanak tanıyan, ölçeklenebilir, bakımı kolay ve modern bir web uygulamasıdır. Uygulama, MQTT altyapısına bağlanarak cihaz verilerini görselleştirir ve yönetir.

---

## **Güncel Plan: Gelişmiş Topic Yönetim Sayfası ve Dinamik Dashboard**

**Amaç:** Kullanıcıların dinamik olarak topic şablonları (`{tenant}`, `{serialNo}` gibi değişkenlerle) oluşturup kaydedebileceği özel bir ayarlar sayfası eklemek. Bu ayarlar, uygulama kapatılıp açıldığında dahi korunacak. Dashboard, bu yeni esnek yapıya hizmet edecek şekilde tamamen yeniden düzenlenecektir.

**Adımlar:**

1.  **Dashboard Arayüzünün Yeniden Tasarlanması:**
    *   `DashboardComponent`'in yerleşimi değiştirilecek: Üstte tam genişlikte `TopicMonitorComponent`, altta ise `MessagePublisherComponent` yer alacak. `DeviceListComponent` bu ekrandan kaldırılacak.
2.  **Kalıcı Ayarlar Servisi (`DeviceStateService`):**
    *   `DeviceStateService`, artık topic listesini Electron aracılığıyla bir yapılandırma dosyasına kaydedip okuyacak.
    *   Uygulama başladığında, kaydedilmiş topic listesini otomatik olarak yükleyecek.
3.  **Yeni Rota ve Ayarlar Sayfası (`/settings`):**
    *   `/settings` rotası ve bu rotaya bağlı, kullanıcıların topic şablonlarını yönetebileceği `SettingsComponent` oluşturulacak.
    *   Ana arayüze, bu yeni sayfaya yönlendiren kalıcı bir "Ayarlar" butonu eklenecek.
4.  **Topic Şablon Yönetimi:**
    *   `SettingsComponent`, kullanıcıların `{tenant}` ve `{serialNo}` gibi yer tutucular kullanarak topic kalıpları eklemesine, görmesine ve silmesine olanak tanıyacak bir arayüz sunacak.
    *   `DeviceStateService`, seçili olan cihaza göre bu şablonları gerçek topic'lere dönüştürecek ve `MqttService` bu topic'lere abone olacak.

---

## **Tamamlanan Planlar**

### Gelişmiş Topic Yönetimi (Faz 1)

*   **Arayüz İyileştirmeleri:** `Publisher` ve `Monitor` bileşenleri daha kompakt ve modern bir tasarıma kavuşturuldu.
*   **Dinamik Topic Yönetimi:** Kullanıcıların anlık olarak özel topic'ler (`#` dahil) ekleyip çıkarmasına olanak tanıyan bir `TopicManagerComponent` ve `DeviceStateService` entegrasyonu yapıldı.
*   **Dinamik MQTT Abonelikleri:** `MqttService`, `DeviceStateService`'teki topic listesindeki değişiklikleri otomatik olarak algılayıp abonelikleri güncelleyecek yeteneğe kavuşturuldu.
*   **Hata Giderme:** `DeviceStateService`'in `BehaviorSubject`'ten sinyale geçişiyle ilgili tüm derleme hataları düzeltildi.

### Proje Başlangıcı ve Çekirdek Yapı (Faz 0)

*   Proje iskeleti kuruldu, çekirdek servisler (`MqttService`, `DeviceStateService`, `AuthService` vb.) oluşturuldu.
*   Login ve Dashboard bileşenleri geliştirildi, temel arayüz ve yönlendirme yapısı kuruldu.
*   `DeviceListComponent` ve `TopicMonitorComponent`'in ilk versiyonları oluşturuldu.
*   Proje, standalone bileşenler ve sinyal tabanlı durum yönetimi gibi modern Angular prensiplerine uygun olarak yapılandırıldı.

---
