import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface MqttTopic {
  id?: string;
  name: string;
  type: 'rpc' | 'device-specific' | 'general' | 'telemetry';
  description: string;
}

@Injectable({
  providedIn: 'root',
})
export class MqttTopicService {
  private initialTopics: MqttTopic[] = [
    { id: '1', name: 'MQTTnet.RPC/+/{tenant}_{serialNo}/PriceChange', type: 'rpc', description: 'Request a price change for the device.' },
    { id: '2', name: 'MQTTnet.RPC/+/{tenant}_{serialNo}/StartGame', type: 'rpc', description: 'Request to start a game on the device.' },
    { id: '3', name: 'MQTTnet.RPC/+/{tenant}_{serialNo}/StartGameError', type: 'rpc', description: 'Listens for errors during game start.' },
    { id: '4', name: 'MQTTnet.RPC/+/{tenant}_{serialNo}/TicketLoaded', type: 'rpc', description: 'Indicates a ticket has been loaded.' },
    { id: '5', name: '{tenant}_{serialNo}.FunctionalStatusChanged', type: 'device-specific', description: "Fires when the device's functional status changes." },
    { id: '6', name: '{tenant}_{serialNo}.ParametersChanged', type: 'device-specific', description: 'Fires when device parameters are updated.' },
    { id: '7', name: '{tenant}_{serialNo}.ModuleDeleted', type: 'device-specific', description: 'Fires when the module is marked as deleted.' },
    { id: '8', name: '{tenant}_{serialNo}.Log', type: 'device-specific', description: 'Topic for device logs.' },
    { id: '9', name: '{tenant}_{serialNo}.ModuleReset', type: 'device-specific', description: 'Fires when the module is reset.' },
    { id: '10', name: '{tenant}.NewModuleVersionCreated', type: 'general', description: 'Fires when a new firmware version is available for any module.' },
    { id: '11', name: '{tenant}.QrStateChanged', type: 'general', description: 'Fires when the QR payment state changes for the tenant.' },
    { id: '12', name: '{tenant}_{serialNo}.StartGame', type: 'device-specific', description: 'Control topic to start game.' },
    { id: '13', name: '{tenant}_{serialNo}.StartGameError', type: 'device-specific', description: 'Control topic for game start errors.' },
    { id: '14', name: '{tenant}_{serialNo}.TicketLoaded', type: 'device-specific', description: 'Control topic for loaded tickets.' },
    // Eğer bu topic'i eklediyseniz, aşağıdaki gibi düzeltin:
    { id: '15', name: 'MQTTnet.RPC/+/{tenant}_{serialNo}/#', type: 'rpc', description: 'Wildcard subscription for RPC topics.' },
  ];

  private topicsSubject = new BehaviorSubject<MqttTopic[]>([]);
  public topics$ = this.topicsSubject.asObservable();

  constructor() {
    this.loadTopics();
  }

  private async loadTopics() {
    const savedTopics = await window.electronAPI.loadTopics();
    if (savedTopics && savedTopics.length > 0) {
      this.topicsSubject.next(savedTopics);
    } else {
      this.topicsSubject.next(this.initialTopics);
      this.saveTopics();
    }
  }

  private saveTopics() {
    window.electronAPI.saveTopics(this.topicsSubject.getValue());
  }

  getTopics(): MqttTopic[] {
    return this.topicsSubject.getValue();
  }

  addTopic(topic: Omit<MqttTopic, 'id'>): void {
    const newTopic = { ...topic, id: Date.now().toString() };
    const currentTopics = this.getTopics();
    this.topicsSubject.next([...currentTopics, newTopic]);
    this.saveTopics();
  }

  updateTopic(updatedTopic: MqttTopic): void {
    const currentTopics = this.getTopics().map(t =>
      t.id === updatedTopic.id ? updatedTopic : t
    );
    this.topicsSubject.next(currentTopics);
    this.saveTopics();
  }

  deleteTopic(topicId: string): void {
    const currentTopics = this.getTopics().filter(t => t.id !== topicId);
    this.topicsSubject.next(currentTopics);
    this.saveTopics();
  }

  generateTopicsForDevice(serialNo: string, tenant: string): MqttTopic[] {
    const topicTemplates = this.getTopics();
    return topicTemplates.map(template => ({
      ...template,
      name: template.name
        .replace(/{tenant}/g, tenant)
        .replace(/{serialNo}/g, serialNo),
    }));
  }
}