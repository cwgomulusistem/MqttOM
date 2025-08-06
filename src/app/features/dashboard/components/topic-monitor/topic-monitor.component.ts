
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule, DatePipe } from '@angular/common';

// Angular Material Modules
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';

// Core Services and Components
import { DeviceStateService } from '../../../../core/services/device-state.service';
import { MqttService } from '../../../../core/services/mqtt.service';
import { PrettyJsonPipe } from '../../../../shared/pipes/json.pipe';

// A type for our messages to keep them structured
interface MonitoredMessage {
  topic: string;
  payload: string;
  timestamp: Date;
}

@Component({
  selector: 'app-topic-monitor',
  templateUrl: './topic-monitor.component.html',
  styleUrls: ['./topic-monitor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    DatePipe,
    MatListModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDividerModule,
    MatProgressBarModule,
    PrettyJsonPipe, // Import the new pipe
  ],
})
export class TopicMonitorComponent {
  // Services
  private deviceStateService = inject(DeviceStateService);
  private mqttService = inject(MqttService);

  // State Signals
  public selectedDevice = toSignal(this.deviceStateService.selectedDevice$);
  public subscribedTopics = signal<Set<string>>(new Set());
  public messages = signal<MonitoredMessage[]>([]);
  private rawMessageStream = toSignal(this.mqttService.messageStream$);

  // Computed signal to generate topics based on the selected device
  public availableTopics = computed(() => {
    const device = this.selectedDevice();
    if (!device) return [];

    const { tenant, moduleSerial } = device;
    return [
      `MQTTnet.RPC/+/${tenant}_${moduleSerial}.StartGame`,
      `MQTTnet.RPC/+/${tenant}_${moduleSerial}.TicketLoaded`,
      `${tenant}_${moduleSerial}.PriceChange`,
      `${tenant}_${moduleSerial}.ModuleReset`,
      `${tenant}_${moduleSerial}.Log`,
      `${tenant}_${moduleSerial}.FunctionalStatusChanged`,
      `${tenant}_${moduleSerial}.Log/response`,
    ];
  });

  constructor() {
    // Effect to handle incoming messages
    effect(() => {
      const message = this.rawMessageStream();
      if (message && this.subscribedTopics().has(message.topic)) {
        const newMessage: MonitoredMessage = { ...message, timestamp: new Date() };
        this.messages.update(currentMessages => [newMessage, ...currentMessages]);
      }
    });

    // Effect to clear state when the selected device changes
    effect((onCleanup) => {
        const device = this.selectedDevice();
        this.clearSubscriptions();
        this.clearLogs();
    });
  }

  toggleSubscription(topic: string): void {
    const currentSubs = this.subscribedTopics();
    if (currentSubs.has(topic)) {
      this.mqttService.unsubscribeFromTopic(topic);
      this.subscribedTopics.update(subs => {
        subs.delete(topic);
        return new Set(subs);
      });
    } else {
      this.mqttService.subscribeToTopic(topic);
      this.subscribedTopics.update(subs => {
        subs.add(topic);
        return new Set(subs);
      });
    }
  }

  clearLogs(): void {
    this.messages.set([]);
  }

  clearSubscriptions(): void {
    for (const topic of this.subscribedTopics()) {
      this.mqttService.unsubscribeFromTopic(topic);
    }
    this.subscribedTopics.set(new Set());
  }

  isSubscribed(topic: string): boolean {
    return this.subscribedTopics().has(topic);
  }
}
