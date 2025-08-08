import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { scan, map } from 'rxjs/operators';
import { MatListModule } from '@angular/material/list';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';

import { DeviceStateService } from '../../../../core/services/device-state.service';
import { MqttService } from '../../../../core/services/mqtt.service';
import { MqttTopic } from '../../../../core/services/mqtt-topic.service';
import { PrettyJsonPipe } from '../../../../shared/pipes/json.pipe';

// Define the message structure used within this component
export interface MonitoredMessage {
  topic: string;
  payload: string;
  timestamp: number;
}

@Component({
  selector: 'app-topic-monitor',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    MatListModule,
    MatCardModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
    PrettyJsonPipe,
  ],
  templateUrl: './topic-monitor.component.html',
  styleUrls: ['./topic-monitor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopicMonitorComponent {
  private readonly deviceStateService = inject(DeviceStateService);
  private readonly mqttService = inject(MqttService);

  public readonly selectedDevice = toSignal(
    this.deviceStateService.selectedDevice$
  );
  public readonly selectedTopic = signal<MqttTopic | null>(null);

  @ViewChild('messageContainer') private messageContainer!: ElementRef;

  // Accumulate all messages and add a timestamp
  private readonly allMessages = toSignal(
    this.mqttService.messageStream$.pipe(
      map(msg => ({ ...msg, timestamp: Date.now() })), // Add timestamp
      scan(
        (acc: MonitoredMessage[], value: MonitoredMessage) => [...acc, value],
        []
      )
    ),
    { initialValue: [] }
  );

  /**
   * Filters messages for the selected topic.
   */
  public readonly topicMessages = computed(() => {
    const messages = this.allMessages();
    const topic = this.selectedTopic();
    if (!topic) {
      return [];
    }
    return messages.filter(msg => msg.topic === topic.name);
  });

  constructor() {
    // Reset topic selection when device changes
    effect(() => {
      this.selectedDevice();
      this.selectedTopic.set(null);
    });

    // Manage MQTT subscriptions based on the selected topic
    effect(onCleanup => {
      const topic = this.selectedTopic();
      if (topic) {
        this.mqttService.subscribeToTopic(topic.name);
        onCleanup(() => {
          this.mqttService.unsubscribeFromTopic(topic.name);
        });
      }
    });

    // Scroll to the bottom when new messages arrive
    effect(() => {
      if (this.topicMessages() && this.messageContainer) {
        this.scrollToBottom();
      }
    });
  }

  public selectTopic(topic: MqttTopic): void {
    this.selectedTopic.set(topic);
  }

  private scrollToBottom(): void {
    try {
      setTimeout(() => {
        this.messageContainer.nativeElement.scrollTop =
          this.messageContainer.nativeElement.scrollHeight;
      }, 50);
    } catch (err) {}
  }

  // Not needed when tracking by property in the template
  // public trackByTopic(index: number, topic: MqttTopic): string {
  //   return topic.name;
  // }
}
