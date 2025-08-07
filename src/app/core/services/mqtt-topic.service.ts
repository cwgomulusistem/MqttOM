import { Injectable } from '@angular/core';

/**
 * Uygulama içinde kullanılacak MQTT topic'lerini temsil eden arayüz.
 * @property {string} name - Topic'in tam adı (örn: CCTR_12345.StartGame).
 * @property {'rpc' | 'device-specific' | 'general' | 'telemetry'} type - Topic'in türünü belirtir. Arayüzde renklendirme veya gruplama için kullanılır.
 * @property {string} description - Topic'in ne işe yaradığını açıklayan kısa bilgi.
 */
export interface MqttTopic {
  name: string;
  type: 'rpc' | 'device-specific' | 'general' | 'telemetry';
  description: string;
}

/**
 * Cihazlara özel MQTT topic'lerini dinamik olarak oluşturmaktan sorumlu servis.
 */
@Injectable({
  providedIn: 'root',
})
export class MqttTopicService {
  /**
   * Belirtilen bir cihaz seri numarası ve tenant kimliği için
   * standartlaştırılmış MQTT topic'lerinin bir listesini oluşturur.
   *
   * @param serialNo - Cihazın benzersiz seri numarası.
   * @param tenant - Kullanıcının veya sistemin tenant kimliği.
   * @returns {MqttTopic[]} Oluşturulan MQTT topic'lerinin bir dizisi.
   */
  generateTopicsForDevice(serialNo: string, tenant: string): MqttTopic[] {
    const topics: MqttTopic[] = [
      // --- RPC Topics (require a response) ---
      {
        name: `MQTTnet.RPC/+/${tenant}_${serialNo}.PriceChange`,
        type: 'rpc',
        description: 'Request a price change for the device.',
      },
      {
        name: `MQTTnet.RPC/+/${tenant}_${serialNo}.StartGame`,
        type: 'rpc',
        description: 'Request to start a game on the device.',
      },
      {
        name: `MQTTnet.RPC/+/${tenant}_${serialNo}.StartGameError`,
        type: 'rpc',
        description: 'Listens for errors during game start.',
      },
      {
        name: `MQTTnet.RPC/+/${tenant}_${serialNo}.TicketLoaded`,
        type: 'rpc',
        description: 'Indicates a ticket has been loaded.',
      },

      // --- Device-Specific Topics ---
      {
        name: `${tenant}_${serialNo}.FunctionalStatusChanged`,
        type: 'device-specific',
        description: "Fires when the device's functional status changes.",
      },
      {
        name: `${tenant}_${serialNo}.ParametersChanged`,
        type: 'device-specific',
        description: 'Fires when device parameters are updated.',
      },
      {
        name: `${tenant}_${serialNo}.ModuleDeleted`,
        type: 'device-specific',
        description: 'Fires when the module is marked as deleted.',
      },
      {
        name: `${tenant}_${serialNo}.Log`,
        type: 'device-specific',
        description: 'Topic for device logs.',
      },
      {
        name: `${tenant}_${serialNo}.ModuleReset`,
        type: 'device-specific',
        description: 'Fires when the module is reset.',
      },

      // --- General Tenant Topics (not specific to one module) ---
      {
        name: `${tenant}.NewModuleVersionCreated`,
        type: 'general',
        description: 'Fires when a new firmware version is available for any module.',
      },
      {
        name: `${tenant}.QrStateChanged`,
        type: 'general',
        description: 'Fires when the QR payment state changes for the tenant.',
      },
    ];

    // Adding the control topics
    topics.push({
      name: `${tenant}_${serialNo}.StartGame`,
      type: 'device-specific',
      description: 'Control topic to start game.',
    });
    topics.push({
      name: `${tenant}_${serialNo}.StartGameError`,
      type: 'device-specific',
      description: 'Control topic for game start errors.',
    });
    topics.push({
      name: `${tenant}_${serialNo}.TicketLoaded`,
      type: 'device-specific',
      description: 'Control topic for loaded tickets.',
    });

    return topics;
  }
}
