import { MqttTopic } from "./app/core/services/mqtt-topic.service";

declare global {
  interface Window {
    electronAPI: {
      // Genel
      send: (channel: string, data?: any) => void;
      invoke: (channel: string, data?: any) => Promise<any>;
      on: (channel: string, func: (...args: any[]) => void) => () => void;

      // Kimlik Bilgileri
      loadCredentials: () => Promise<any | null>;
      saveCredentials: (credentials: any) => void;

      // MQTT Topic'leri
      loadTopics: () => Promise<MqttTopic[] | null>;
      saveTopics: (topics: MqttTopic[]) => void;
    };
  }
}
