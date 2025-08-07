
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule, DatePipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, startWith } from 'rxjs';

// Angular Material Modules
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

// Core Services and Components
import { DeviceStateService } from '../../../../core/services/device-state.service';
import { MqttService } from '../../../../core/services/mqtt.service';
import { PrettyJsonPipe } from '../../../../shared/pipes/json.pipe';
import { DeviceDataService } from '../../../../core/services/device-data.service';

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
    ReactiveFormsModule,
    MatListModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDividerModule,
    MatProgressBarModule,
    MatFormFieldModule,
    MatInputModule,
    PrettyJsonPipe, // Import the new pipe
  ],
})
export class TopicMonitorComponent {
  // Services
  private deviceStateService = inject(DeviceStateService);
  private mqttService = inject(MqttService);
  private deviceDataService = inject(DeviceDataService);

  // State Signals
  public selectedDevice = toSignal(this.deviceStateService.selectedDevice$);
  public subscribedTopics = signal<Set<string>>(new Set());
  public messages = signal<MonitoredMessage[]>([]);
  private rawMessageStream = toSignal(this.mqttService.messageStream$);

  // Filter Control for messages
  public messageFilterControl = new FormControl('');
  private messageFilterTerm = toSignal(
    this.messageFilterControl.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
    ),
    { initialValue: '' }
  );

  // Computed signal to generate topics based on the selected device and tenant
  public availableTopics = computed(() => {
    const device = this.selectedDevice();
    const tenant = this.deviceDataService.currentTenant();

    if (!device || !tenant) return [];

    const { serialNo } = device;
    // Use serialNo for moduleSerial in topic generation
    const moduleSerial = serialNo;

    // Define QoS options for subscription
    const qosOptions = { qos: 2 };

    return [
      { name: `${tenant}_${moduleSerial}.PriceChange`, qos: qosOptions },
      { name: `MQTTnet.RPC/+/${tenant}_${moduleSerial}.StartGame`, qos: qosOptions },
      { name: `${tenant}_${moduleSerial}.FunctionalStatusChanged`, qos: qosOptions },
      { name: `MQTTnet.RPC/+/${tenant}_${moduleSerial}.StartGameError`, qos: qosOptions },
      { name: `${tenant}_${moduleSerial}.ParametersChanged`, qos: qosOptions },
      { name: `${tenant}_${moduleSerial}.ModuleDeleted`, qos: qosOptions },
      { name: `${tenant}.NewModuleVersionCreated`, qos: qosOptions },
      { name: `${tenant}.QrStateChanged`, qos: qosOptions },
      { name: `${tenant}_${moduleSerial}.Log`, qos: qosOptions },
      { name: `MQTTnet.RPC/+/${tenant}_${moduleSerial}.TicketLoaded`, qos: qosOptions },
      { name: `${tenant}_${moduleSerial}.ModuleReset`, qos: qosOptions },
      { name: `${tenant}_${moduleSerial}.Log/response`, qos: qosOptions },
      // Control topics (if needed, adjust as per your application logic)
      { name: `${tenant}_${moduleSerial}.StartGame`, qos: qosOptions },
      { name: `${tenant}_${moduleSerial}.StartGameError`, qos: qosOptions },
      { name: `${tenant}_${moduleSerial}.TicketLoaded`, qos: qosOptions },
    ];
  });

  // Computed signal for filtered messages
  public filteredMessages = computed(() => {
    const messages = this.messages();
    const term = this.messageFilterTerm()?.toLowerCase() || '';

    if (!term) return messages;

    return messages.filter(message =>
      message.topic.toLowerCase().includes(term) ||
      message.payload.toLowerCase().includes(term)
    );
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
    effect(() => {
      const device = this.selectedDevice();
      // Sadece cihaz değiştiğinde abonelikleri temizle
      if (device) {
        this.clearAllSubscriptions();
        this.clearLogs();
      }
    });
  }

  toggleSubscription(topic: string, qos: number): void {
    const currentSubs = this.subscribedTopics();
    if (currentSubs.has(topic)) {
      this.mqttService.unsubscribeFromTopic(topic);
      this.subscribedTopics.update(subs => {
        subs.delete(topic);
        return new Set(subs);
      });
    } else {
      this.mqttService.subscribeToTopic(topic, { qos });
      this.subscribedTopics.update(subs => {
        subs.add(topic);
        return new Set(subs);
      });
    }
  }

  clearLogs(): void {
    this.messages.set([]);
  }

  clearAllSubscriptions(): void {
    for (const topic of this.subscribedTopics()) {
      this.mqttService.unsubscribeFromTopic(topic);
    }
    this.subscribedTopics.set(new Set());
  }

  isSubscribed(topic: string): boolean {
    return this.subscribedTopics().has(topic);
  }
}

