
import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import mqtt, { MqttClient, IClientPublishOptions } from 'mqtt'; // Use default import

// Define a type for the MQTT configuration for clarity
export interface MqttConfig {
  hostname: string;
  port: number;
  username?: string;
  password?: string;
  protocol?: 'ws' | 'wss';
}

export type MqttConnectionState = 'Disconnected' | 'Connecting' | 'Connected' | 'Error';

@Injectable({
  providedIn: 'root',
})
export class MqttService {
  private client?: MqttClient;

  public connectionState$ = new BehaviorSubject<MqttConnectionState>('Disconnected');
  public messageStream$ = new Subject<{ topic: string; payload: string }>();
  public connectedClients$ = new BehaviorSubject<any[]>([]);

  constructor() {}

  connect(config: MqttConfig): void {
    if (this.client) {
      this.client.end();
    }
    this.connectionState$.next('Connecting');

    const protocol = config.protocol || 'ws';
    const brokerUrl = `${protocol}://${config.hostname}:${config.port}/mqtt`;

    try {
      this.client = mqtt.connect(brokerUrl, {
        username: config.username,
        password: config.password,
        reconnectPeriod: 1000,
      });

      this.client.on('connect', () => {
        this.connectionState$.next('Connected');
        const fakeClients = [
          { clientId: 'TenantA@SN-12345@1.2.3@2.0.0@192.168.1.10' },
          { clientId: 'TenantA@SN-ABCDE@1.2.4@2.0.1@192.168.1.12' },
          { clientId: 'TenantB@SN-FGHIJ@2.0.0@2.1.0@192.168.2.25' },
          { clientId: 'TenantC@SN-KLMNO@3.1.0@3.0.0@10.0.0.5' },
          { clientId: 'TenantA@SN-PQRST@1.2.3@2.0.0@192.168.1.18' },
        ];
        this.connectedClients$.next(fakeClients);
      });

      this.client.on('message', (topic, payload) => {
        this.messageStream$.next({ topic, payload: payload.toString() });
      });

      this.client.on('error', (err) => {
        console.error('MQTT Error:', err);
        this.connectionState$.next('Error');
        this.client?.end();
      });

      this.client.on('close', () => {
         if (this.connectionState$.value !== 'Disconnected') {
            // this.connectionState$.next('Error');
         }
      });

    } catch (error) {
      console.error('Failed to create MQTT client:', error);
      this.connectionState$.next('Error');
    }
  }

  disconnect(): void {
    if (this.client) {
      this.client.end();
      this.client = undefined;
    }
    this.connectionState$.next('Disconnected');
    this.connectedClients$.next([]);
  }

  subscribeToTopic(topic: string): void {
    if (this.client && this.client.connected) {
      this.client.subscribe(topic, (err) => {
        if (err) {
          console.error(`Failed to subscribe to topic: ${topic}`, err);
        } else {
          console.log(`Subscribed to ${topic}`);
        }
      });
    }
  }

  unsubscribeFromTopic(topic: string): void {
    if (this.client && this.client.connected) {
      this.client.unsubscribe(topic, (err) => {
        if (err) {
          console.error(`Failed to unsubscribe from topic: ${topic}`, err);
        } else {
          console.log(`Unsubscribed from ${topic}`);
        }
      });
    }
  }

  publish(topic: string, message: string, options: IClientPublishOptions): void {
    if (this.client && this.client.connected) {
      this.client.publish(topic, message, options, (err) => {
        if (err) {
          console.error(`Failed to publish to topic: ${topic}`, err);
        }
      });
    }
  }
}
