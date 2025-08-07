
import { Injectable, NgZone, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Subject } from 'rxjs';

// Electron API'sini pencere nesnesinde tanımla
// Bu, preload.js'de tanımlanan API ile eşleşmelidir
declare global {
  interface Window {
    electronAPI: {
      send: (channel: string, data?: any) => void;
      invoke: (channel: string, data?: any) => Promise<any>;
      on: (channel: string, func: (...args: any[]) => void) => () => void;
      loadCredentials: () => Promise<any>; // Yeni eklendi
      saveCredentials: (credentials: any) => void; // Yeni eklendi
    };
  }
}

export interface MqttConfig {
  host: string; // Electron tarafı `host` bekliyor
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
    // MQTT durum güncellemelerini dinle
    const cleanupStatus = window.electronAPI.on('mqtt-status', ({ status, error }) => {
      console.log(`[MqttService] Electron'dan durum alındı: ${status}`);
      this.zone.run(() => {
        if (status === 'connected') {
          console.log('[MqttService] Durum: Connected. Yönlendirme denenecek...');
          this.connectionState$.next('Connected');
          this.router.navigate(['/dashboard']);
          console.log('[MqttService] /dashboard adresine yönlendirildi.');
          // Simüle edilmiş istemci listesi kaldırıldı.
          this.connectedClients$.next([]); // Listeyi boşalt
        } else if (status === 'disconnected') {
          this.connectionState$.next('Disconnected');
          // this.router.navigate(['/login']); // Geçici olarak devre dışı bırakıldı
        } else if (status === 'error') {
          console.error('MQTT Error from main process:', error);
          this.connectionState$.next('Error');
        }
      });
    });

    // Gelen MQTT mesajlarını dinle
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
    window.electronAPI.send('mqtt-subscribe', { topic, options });
  }

  unsubscribeFromTopic(topic: string): void {
    window.electronAPI.send('mqtt-unsubscribe', topic);
  }

  publish(topic: string, message: string, options: any): void {
    window.electronAPI.send('mqtt-publish', { topic, message, options });
  }

  // Bileşen yok edildiğinde listener'ları temizle
  ngOnDestroy() {
    this.cleanupFunctions.forEach(cleanup => cleanup());
  }
}

