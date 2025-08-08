import { Injectable, NgZone, inject, effect, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Subject } from 'rxjs';
import { DeviceStateService } from './device-state.service';

// The 'declare global' block has been removed from here.
// TypeScript will now automatically use the centralized definition
// in /src/electron-api.d.ts

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
export class MqttService implements OnDestroy {
  private readonly zone = inject(NgZone);
  private readonly router = inject(Router);
  private readonly deviceStateService = inject(DeviceStateService);

  public connectionState$ = new BehaviorSubject<MqttConnectionState>('Disconnected');
  public messageStream$ = new Subject<{ topic: string; payload: string }>();

  private cleanupFunctions: (() => void)[] = [];
  private lastSubscribedTopics: string[] = [];

  constructor() {
    this.setupElectronListeners();

    // Effect to dynamically manage MQTT subscriptions based on the final, resolved topics
    effect(() => {
      if (this.connectionState$.value !== 'Connected') {
        return; // Only manage subscriptions when connected
      }

      const newTopics = this.deviceStateService.subscribableTopics();
      const oldTopics = this.lastSubscribedTopics;

      const topicsToUnsubscribe = oldTopics.filter(t => !newTopics.includes(t));
      const topicsToSubscribe = newTopics.filter(t => !oldTopics.includes(t));

      if (topicsToUnsubscribe.length > 0) {
        topicsToUnsubscribe.forEach(topic => this.unsubscribeFromTopic(topic));
      }

      if (topicsToSubscribe.length > 0) {
        topicsToSubscribe.forEach(topic => this.subscribeToTopic(topic));
      }

      this.lastSubscribedTopics = newTopics;
    });
  }

  private setupElectronListeners() {
    const cleanupStatus = window.electronAPI.on('mqtt-status', ({ status, error }) => {
      this.zone.run(() => {
        if (status === 'connected') {
          this.connectionState$.next('Connected');
          this.router.navigate(['/dashboard']);
          // On initial connection, lastSubscribedTopics is empty, so all topics will be subscribed to.
        } else if (status === 'disconnected') {
          this.connectionState$.next('Disconnected');
          this.lastSubscribedTopics = []; // Clear subscriptions on disconnect
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
  }

  private subscribeToTopic(topic: string, options: { qos: 2 } = { qos: 2 }): void {
    console.log(`Subscribing to: ${topic}`);
    window.electronAPI.send('mqtt-subscribe', { topic, options });
  }

  private unsubscribeFromTopic(topic: string): void {
    console.log(`Unsubscribing from: ${topic}`);
    window.electronAPI.send('mqtt-unsubscribe', topic);
  }

  publish(topic: string, message: string, options: any): void {
    window.electronAPI.send('mqtt-publish', { topic, message, options });
  }

  public topicMatches(pattern: string, topic: string): boolean {
    if (pattern === '#' || pattern === topic) return true;
    const patternSegments = pattern.split('/');
    const topicSegments = topic.split('/');
    const patternLength = patternSegments.length;
    const topicLength = topicSegments.length;

    if (patternSegments[patternLength - 1] === '#') {
      if (topicLength < patternLength - 1) return false;
      for (let i = 0; i < patternLength - 1; i++) {
        if (patternSegments[i] !== '+' && patternSegments[i] !== topicSegments[i]) {
          return false;
        }
      }
      return true;
    }

    if (patternLength !== topicLength) return false;

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
