
import { Injectable, NgZone, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Subject } from 'rxjs';

declare global {
  interface Window {
    electronAPI: {
      send: (channel: string, data?: any) => void;
      invoke: (channel: string, data?: any) => Promise<any>;
      on: (channel: string, func: (...args: any[]) => void) => () => void;
      loadCredentials: () => Promise<any>;
      saveCredentials: (credentials: any) => void;
    };
  }
}

export interface MqttConfig {
  host: string;
  port: number;
  username?: string;
  password?: string;
  protocol?: 'ws' | 'wss' | 'mqtt' | 'mqtts';
}

export type MqttConnectionState = 'Disconnected' | 'Connecting' | 'Connected' | 'Error';

@Injectable({
  providedIn: 'root',
})
export class MqttService {
  private zone = inject(NgZone);
  private router = inject(Router);

  public connectionState$ = new BehaviorSubject<MqttConnectionState>('Disconnected');
  public messageStream$ = new Subject<{ topic: string; payload: string }>();
  public connectedClients$ = new BehaviorSubject<any[]>([]);

  private cleanupFunctions: (() => void)[] = [];

  constructor() {
    this.setupElectronListeners();
  }

  private setupElectronListeners() {
    const cleanupStatus = window.electronAPI.on('mqtt-status', ({ status, error }) => {
      this.zone.run(() => {
        if (status === 'connected') {
          this.connectionState$.next('Connected');
          this.router.navigate(['/dashboard']);
          this.connectedClients$.next([]);
        } else if (status === 'disconnected') {
          this.connectionState$.next('Disconnected');
        } else if (status === 'error') {
          console.error('MQTT Error from main process:', error);
          this.connectionState$.next('Error');
        }
      });
    });

    const cleanupMessage = window.electronAPI.on('mqtt-message', ({ topic, message }) => {
      this.zone.run(() => {
        this.messageStream$.next({ topic, payload: message });
      });
    });

    this.cleanupFunctions.push(cleanupStatus, cleanupMessage);
  }

  async connect(config: MqttConfig): Promise<void> {
    this.connectionState$.next('Connecting');
    try {
      const result = await window.electronAPI.invoke('mqtt-connect', config);
      if (!result.success) {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Failed to connect via Electron:', error);
      this.connectionState$.next('Error');
    }
  }

  disconnect(): void {
    window.electronAPI.send('mqtt-disconnect');
    this.connectionState$.next('Disconnected');
    this.connectedClients$.next([]);
  }

  subscribeToTopic(topic: string, options?: { qos: number }): void {
    const subscribeOptions = options || { qos: 2 }; // Varsayılan QoS seviyesi 2 olarak ayarlandı
    window.electronAPI.send('mqtt-subscribe', { topic, options: subscribeOptions });
  }

  unsubscribeFromTopic(topic: string): void {
    window.electronAPI.send('mqtt-unsubscribe', topic);
  }

  publish(topic: string, message: string, options: any): void {
    window.electronAPI.send('mqtt-publish', { topic, message, options });
  }

  ngOnDestroy() {
    this.cleanupFunctions.forEach(cleanup => cleanup());
  }
}
