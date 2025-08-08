import { Injectable, NgZone, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Subject } from 'rxjs';

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
  private activeSubscriptions: Set<string> = new Set(); // Abone olunan topic'leri takip et

  constructor() {
    this.setupElectronListeners();
  }

  private setupElectronListeners() {
    const cleanupStatus = window.electronAPI.on('mqtt-status', ({ status, error }) => {
      this.zone.run(() => {
        if (status === 'connected') {
          this.connectionState$.next('Connected');
          this.router.navigate(['/dashboard']);
        } else if (status === 'disconnected') {
          this.connectionState$.next('Disconnected');
          this.activeSubscriptions.clear(); // Bağlantı kesildiğinde abonelikleri temizle
        } else if (status === 'error') {
          console.error('MQTT Error from main process:', error);
          this.connectionState$.next('Error');
        }
      });
    });

    const cleanupMessage = window.electronAPI.on('mqtt-message', ({ topic, message }) => {
      this.zone.run(() => {
        console.log(`[MqttService] Received message for topic: ${topic}`);
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
    if (!this.activeSubscriptions.has(topic)) {
      window.electronAPI.send('mqtt-subscribe', { topic, options });
      this.activeSubscriptions.add(topic);
    }
  }

  unsubscribeFromTopic(topic: string): void {
    if (this.activeSubscriptions.has(topic)) {
      window.electronAPI.send('mqtt-unsubscribe', topic);
      this.activeSubscriptions.delete(topic);
    }
  }

  subscribeToTopics(topics: string[], options?: { qos: number }): void {
    topics.forEach(topic => this.subscribeToTopic(topic, options));
  }

  unsubscribeAllTopics(): void {
    this.activeSubscriptions.forEach(topic => this.unsubscribeFromTopic(topic));
    this.activeSubscriptions.clear();
  }

  publish(topic: string, message: string, options?: { qos: number; retain: boolean }): void {
    window.electronAPI.send('mqtt-publish', { topic, message, options });
  }

  ngOnDestroy() {
    this.cleanupFunctions.forEach(cleanup => cleanup());
    this.unsubscribeAllTopics(); // Servis yok edildiğinde tüm abonelikleri kaldır
  }
}