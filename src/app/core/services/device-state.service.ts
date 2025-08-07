import { Injectable, signal, NgZone, inject, computed } from '@angular/core';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class DeviceStateService {
  private readonly TOPICS_CONFIG_KEY = 'custom-topics-config';
  private readonly ngZone = inject(NgZone);
  private readonly authService = inject(AuthService);

  // --- State Signals ---
  public selectedDevice = signal<any | null>(null);
  public customTopics = signal<string[]>(['#']); // These are the raw templates

  // --- Computed Signal for Final Subscriptions ---
  public readonly subscribableTopics = computed<string[]>(() => {
    const templates = this.customTopics();
    const device = this.selectedDevice();
    const tenant = this.authService.tenant();

    const resolvedTopics = new Set<string>();

    templates.forEach(template => {
      if (!template.includes('{')) {
        // If no placeholders, add directly
        resolvedTopics.add(template);
      } else {
        // If there are placeholders, resolve them
        let resolved = template;
        if (tenant) {
          resolved = resolved.replace(/{tenant}/g, tenant);
        }
        if (device && device.serialNo) {
          resolved = resolved.replace(/{serialNo}/g, device.serialNo);
        }
        // Add the topic only if all placeholders are resolved
        if (!resolved.includes('{')) {
          resolvedTopics.add(resolved);
        }
      }
    });

    // Always include '#' if it's in the templates, regardless of device selection
    if (templates.includes('#')) {
        resolvedTopics.add('#');
    }

    // If no device is selected, we might still have global topics like '#'
    return Array.from(resolvedTopics);
  });

  constructor() {
    this.loadCustomTopics();
  }

  // --- Persistence Methods ---
  private async loadCustomTopics(): Promise<void> {
    try {
      const topics = await window.electronAPI.invoke('load-config', this.TOPICS_CONFIG_KEY);
      this.ngZone.run(() => {
        if (topics && Array.isArray(topics) && topics.length > 0) {
          this.customTopics.set(topics);
        } else {
          // Set a default and save it if nothing is loaded
          this.customTopics.set(['#', 'MQTTnet.RPC/+/{serialNo}.+']);
          this.saveCustomTopics();
        }
      });
    } catch (error) {
      console.error('Failed to load custom topics:', error);
      this.customTopics.set(['#']); // Fallback
    }
  }

  private saveCustomTopics(): void {
    try {
      window.electronAPI.send('save-config', {
        key: this.TOPICS_CONFIG_KEY,
        data: this.customTopics(),
      });
    } catch (error) {
      console.error('Failed to save custom topics:', error);
    }
  }

  // --- Topic Management ---
  public setAllCustomTopics(newTopics: string[]): void {
    this.customTopics.set(newTopics);
    this.saveCustomTopics();
  }
}
