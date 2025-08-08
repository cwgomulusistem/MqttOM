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

  // Directly use the signal from the service
  public readonly selectedDevice = this.deviceStateService.selectedDevice;
  public readonly selectedTopic = signal<MqttTopic | null>(null);

  @ViewChild('messageContainer') private messageContainer!: ElementRef;

  // Accumulate all messages and add a timestamp
  private readonly allMessages = toSignal(
    this.mqttService.messageStream$.pipe(
      map(msg => ({ ...msg, timestamp: Date.now() })), // Add timestamp
      scan(
        (acc: MonitoredMessage[], value: MonitoredMessage) => {
          // Keep the list from growing indefinitely, cap at 200 messages
          const newAcc = [...acc, value];
          if (newAcc.length > 200) {
            return newAcc.slice(newAcc.length - 200);
          }
          return newAcc;
        },
        []
      )
    ),
    { initialValue: [] }
  );

  /**
   * Filters messages for the selected topic.
   * If no topic is selected, it shows all messages.
   */
  public readonly topicMessages = computed(() => {
    const messages = this.allMessages();
    const topic = this.selectedTopic();
    if (!topic) {
      // If no topic is selected, show all messages.
      return messages;
    }
    return messages.filter(msg => this.mqttService.topicMatches(topic.name, msg.topic));
  });

  public readonly deviceTopics = computed(() => {
    const device = this.selectedDevice();
    return device && device.topics ? device.topics : [];
  });

  constructor() {
    // Reset topic selection when device changes
    effect(() => {
      this.selectedDevice(); // React to device changes
      this.selectedTopic.set(null);
    });

    // Scroll to the bottom when new messages arrive
    effect(() => {
      if (this.topicMessages() && this.messageContainer) {
        this.scrollToBottom();
      }
    });
  }

  public selectTopic(topic: MqttTopic | null): void {
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
}
