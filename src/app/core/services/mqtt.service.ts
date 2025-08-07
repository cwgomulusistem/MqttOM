import { Injectable, NgZone, inject, effect } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Subject } from 'rxjs';
import { DeviceStateService } from './device-state.service';

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
  private deviceStateService = inject(DeviceStateService);

  public connectionState$ = new BehaviorSubject<MqttConnectionState>('Disconnected');
  public messageStream$ = new Subject<{ topic: string; payload: string }>();

  private cleanupFunctions: (() => void)[] = [];
  private lastSubscribedTopics: string[] = [];

  constructor() {
    this.setupElectronListeners();

    // Effect to dynamically manage MQTT subscriptions
    effect(() => {
      if (this.connectionState$.value !== 'Connected') {
        return; // Only manage subscriptions when connected
      }

      const newTopics = this.deviceStateService.customTopics();
      const oldTopics = this.lastSubscribedTopics;

      const topicsToUnsubscribe = oldTopics.filter(t => !newTopics.includes(t));
      const topicsToSubscribe = newTopics.filter(t => !oldTopics.includes(t));

      topicsToUnsubscribe.forEach(topic => this.unsubscribeFromTopic(topic));
      topicsToSubscribe.forEach(topic => this.subscribeToTopic(topic));

      this.lastSubscribedTopics = newTopics;
    });
  }

  private setupElectronListeners() {
    const cleanupStatus = window.electronAPI.on('mqtt-status', ({ status, error }) => {
      this.zone.run(() => {
        if (status === 'connected') {
          this.connectionState$.next('Connected');
          this.router.navigate(['/dashboard']);
          // On connection, subscribe to all current custom topics
          this.lastSubscribedTopics = []; // Reset before subscribing
          const topicsToSubscribe = this.deviceStateService.customTopics();
          topicsToSubscribe.forEach(topic => this.subscribeToTopic(topic));
          this.lastSubscribedTopics = topicsToSubscribe;
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
  }

  subscribeToTopic(topic: string, options?: { qos: number }): void {
    const subscribeOptions = options || { qos: 2 };
    window.electronAPI.send('mqtt-subscribe', { topic, options: subscribeOptions });
  }

  unsubscribeFromTopic(topic: string): void {
    window.electronAPI.send('mqtt-unsubscribe', topic);
  }

  publish(topic: string, message: string, options: any): void {
    window.electronAPI.send('mqtt-publish', { topic, message, options });
  }

  /**
   * Checks if a topic matches a subscription pattern with wildcards.
   * @param pattern The subscription pattern (e.g., 'devices/+/status', 'devices/#').
   * @param topic The topic from the message (e.g., 'devices/123/status').
   * @returns True if the topic matches the pattern.
   */
  public topicMatches(pattern: string, topic: string): boolean {
    if (pattern === topic) {
        return true;
    }
    if (pattern === '#') {
        return true;
    }

    const patternSegments = pattern.split('/');
    const topicSegments = topic.split('/');

    const patternLength = patternSegments.length;
    const topicLength = topicSegments.length;

    if (patternSegments[patternLength - 1] === '#') {
        if (topicLength < patternLength - 1) {
            return false;
        }
        for (let i = 0; i < patternLength - 1; i++) {
            if (patternSegments[i] !== '+' && patternSegments[i] !== topicSegments[i]) {
                return false;
            }
        }
        return true;
    }

    if (patternLength !== topicLength) {
        return false;
    }

    for (let i = 0; i < patternLength; i++) {
        if (patternSegments[i] !== '+' && patternSegments[i] !== topicSegments[i]) {
            return false;
        }
    }
    return true;
  }

  ngOnDestroy() {
    this.cleanupFunctions.forEach(cleanup => cleanup());
  }
}
