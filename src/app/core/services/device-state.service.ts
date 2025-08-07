import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class DeviceStateService {
  /**
   * Holds the state of the currently selected device from the device list.
   * Components can react to changes in this signal.
   * Emits `null` when no device is selected.
   */
  public selectedDevice = signal<any | null>(null);

  /**
   * Manages a list of user-defined topics for MQTT subscription.
   * Initialized with a wildcard topic '#' to subscribe to all topics by default.
   */
  public customTopics = signal<string[]>(['#']);

  constructor() {}

  /**
   * Adds a new topic to the custom subscription list if it's not already included.
   * @param topic The topic string to add (e.g., 'devices/+/status', '#').
   */
  addCustomTopic(topic: string): void {
    if (!topic || topic.trim() === '') return;
    this.customTopics.update(currentTopics => {
      if (currentTopics.includes(topic)) {
        return currentTopics; // Topic already exists, return the same array
      }
      return [...currentTopics, topic];
    });
  }

  /**
   * Removes a topic from the custom subscription list.
   * @param topicToRemove The topic string to remove.
   */
  removeCustomTopic(topicToRemove: string): void {
    this.customTopics.update(currentTopics =>
      currentTopics.filter(topic => topic !== topicToRemove)
    );
  }
}
