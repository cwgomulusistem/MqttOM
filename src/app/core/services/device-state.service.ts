import { Injectable, signal, NgZone, inject } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class DeviceStateService {
  private readonly TOPICS_CONFIG_KEY = 'custom-topics-config';
  private readonly ngZone = inject(NgZone);

  public selectedDevice = signal<any | null>(null);
  public customTopics = signal<string[]>(['#']);

  constructor() {
    this.loadCustomTopics();
  }

  /**
   * Loads the list of custom topics from the persistent storage via Electron.
   */
  private async loadCustomTopics(): Promise<void> {
    try {
      const topics = await window.electronAPI.invoke('load-config', this.TOPICS_CONFIG_KEY);
      if (topics && Array.isArray(topics) && topics.length > 0) {
        this.ngZone.run(() => {
          this.customTopics.set(topics);
        });
      } else {
        // If no topics are saved, set a default and save it
        this.saveCustomTopics();
      }
    } catch (error) {
      console.error('Failed to load custom topics:', error);
      // Fallback to default if loading fails
      this.customTopics.set(['#']);
    }
  }

  /**
   * Saves the current list of custom topics to persistent storage via Electron.
   */
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

  /**
   * Adds a new topic and saves the updated list.
   */
  addCustomTopic(topic: string): void {
    if (!topic || topic.trim() === '') return;
    this.customTopics.update(currentTopics => {
      if (currentTopics.includes(topic)) {
        return currentTopics;
      }
      const updatedTopics = [...currentTopics, topic];
      this.saveCustomTopics(); // Save after update
      return updatedTopics;
    });
  }

  /**
   * Removes a topic and saves the updated list.
   */
  removeCustomTopic(topicToRemove: string): void {
    this.customTopics.update(currentTopics => {
      const updatedTopics = currentTopics.filter(t => t !== topicToRemove);
      this.saveCustomTopics(); // Save after update
      return updatedTopics;
    });
  }

  /**
   * Replaces the entire list of topics with a new one and saves it.
   * @param newTopics The new array of topic strings.
   */
  setAllCustomTopics(newTopics: string[]): void {
    this.customTopics.set(newTopics);
    this.saveCustomTopics();
  }
}
