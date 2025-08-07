# MQTT Dashboard Projesi

## Proje Özeti

Bu proje, yüzlerce IoT cihazını gerçek zamanlı olarak izlememize, onlarla etkileşime geçmemize olanak tanıyan, ölçeklenebilir, bakımı kolay ve modern bir web uygulamasıdır. Uygulama, MQTT altyapısına bağlanarak cihaz verilerini görselleştirir ve yönetir.

---

## **Güncel Plan: Entegre Dashboard ve Eksiksiz İşlevsellik**

**Amaç:** Login akışını ve `DeviceListComponent`'i sisteme yeniden entegre etmek. Dashboard'u, hem cihaz listesini hem de yeni Monitör/Publisher düzenini bir arada sunacak şekilde yeniden tasarlamak. Ayarlar sayfasında tanımlanan topic şablonlarının, seçilen cihaza göre dinamik olarak çözümlenmesini sağlamak.

**Adımlar:**

1.  **Dashboard Arayüzünün Yeniden Kurulması:**
    *   Dashboard, üç panelli modern bir yapıya kavuşturulacak:
        *   **Sol Panel:** Cihaz seçimi için kritik olan `DeviceListComponent` geri eklenecek.
        *   **Sağ Panel:** Dikey olarak ikiye bölünecek. Üstte `TopicMonitorComponent`, altta ise `MessagePublisherComponent` yer alacak.
2.  **Dinamik Topic Çözümleme Servisi (`DeviceStateService`):**
    *   `DeviceStateService`, seçili cihaz (`selectedDevice`) değiştiğinde, kaydedilmiş topic şablonlarını (`customTopics`) alıp `{serialNo}` gibi yer tutucuları gerçek değerlerle doldurarak **nihai abone olunacak topic listesini** üreten bir `computed` sinyal içerecek şekilde güncellenecek.
3.  **MQTT Servisinin Güncellenmesi:**
    *   `MqttService`, artık ham şablonlara değil, `DeviceStateService`'teki bu yeni, çözümlenmiş nihai topic listesine abone olacak.
4.  **Login ve Rota Korumasının Geri Getirilmesi:**
    *   `app.routes.ts`, varsayılan olarak `/login`'e yönlendirecek şekilde düzeltilecek.
    *   `/dashboard` rotası, kullanıcının bağlı olup olmadığını kontrol eden bir `canActivate` guard'ı ile korunacak.

---

## **Tamamlanan Planlar**

### Gelişmiş Topic Yönetim Sayfası (Faz 2)

*   **Kalıcı Ayarlar:** `DeviceStateService` ve `main.js`, topic ayarlarını bir dosyaya kaydedip okuyacak şekilde güncellendi.
*   **Ayarlar Sayfası:** Kullanıcıların `{serialNo}` gibi yer tutucular kullanarak topic şablonları oluşturabildiği, `/settings` altında tam fonksiyonel bir yönetim sayfası oluşturuldu.
*   **İnatçı Derleme Hatalarının Giderilmesi:** Önbellek temizleme, bileşen sıfırlama ve `[attr.aria-label]` düzeltmesi ile tüm derleme sorunları çözüldü.

### Gelişmiş Topic Yönetimi (Faz 1)

*   **Arayüz İyileştirmeleri:** `Publisher` ve `Monitor` bileşenleri daha kompakt ve modern bir tasarıma kavuşturuldu.
*   **Dinamik Topic Yönetimi:** Kullanıcıların anlık olarak özel topic'ler (`#` dahil) ekleyip çıkarmasına olanak tanıyan bir `TopicManagerComponent` ve `DeviceStateService` entegrasyonu yapıldı.
*   **Dinamik MQTT Abonelikleri:** `MqttService`, `DeviceStateService`'teki topic listesindeki değişiklikleri otomatik olarak algılayıp abonelikleri güncelleyecek yeteneğe kavuşturuldu.

### Proje Başlangıcı ve Çekirdek Yapı (Faz 0)

*   Proje iskeleti kuruldu, çekirdek servisler (`MqttService`, `DeviceStateService`, `AuthService` vb.) oluşturuldu.
*   Login ve Dashboard bileşenleri geliştirildi, temel arayüz ve yönlendirme yapısı kuruldu.

---
