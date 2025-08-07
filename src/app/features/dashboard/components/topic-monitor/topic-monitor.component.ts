
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
import { MatSelectModule } from '@angular/material/select';

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

interface AvailableTopic {
  name: string;
  qos: { qos: number };
  category: 'module-based' | 'general';
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
    MatSelectModule,
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

  // Filter Control for available topics
  public topicFilterControl = new FormControl('');
  private topicFilterTerm = toSignal(
    this.topicFilterControl.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
    ),
    { initialValue: '' }
  );

  public topicCategoryFilterControl = new FormControl('all');
  private topicCategoryFilter = toSignal(
    this.topicCategoryFilterControl.valueChanges.pipe(
      startWith('all'),
    ),
    { initialValue: 'all' }
  );

  // Computed signal to generate topics based on the selected device and tenant
  public availableTopics = computed(() => {
    const device = this.selectedDevice();
    const tenant = this.deviceDataService.currentTenant();

    if (!device || !tenant) return [];

    const { serialNo } = device;
    const moduleSerial = serialNo; // Use serialNo for moduleSerial in topic generation

    const qosOptions = { qos: 2 };

    const moduleBasedTopics: AvailableTopic[] = [
      { name: `${tenant}_${moduleSerial}.PriceChange`, qos: qosOptions, category: 'module-based' },
      { name: `MQTTnet.RPC/+/${tenant}_${moduleSerial}.StartGame`, qos: qosOptions, category: 'module-based' },
      { name: `${tenant}_${moduleSerial}.FunctionalStatusChanged`, qos: qosOptions, category: 'module-based' },
      { name: `MQTTnet.RPC/+/${tenant}_${moduleSerial}.StartGameError`, qos: qosOptions, category: 'module-based' },
      { name: `${tenant}_${moduleSerial}.ParametersChanged`, qos: qosOptions, category: 'module-based' },
      { name: `${tenant}_${moduleSerial}.ModuleDeleted`, qos: qosOptions, category: 'module-based' },
      { name: `${tenant}_${moduleSerial}.Log`, qos: qosOptions, category: 'module-based' },
      { name: `MQTTnet.RPC/+/${tenant}_${moduleSerial}.TicketLoaded`, qos: qosOptions, category: 'module-based' },
      { name: `${tenant}_${moduleSerial}.ModuleReset`, qos: qosOptions, category: 'module-based' },
      { name: `${tenant}_${moduleSerial}.Log/response`, qos: qosOptions, category: 'module-based' },
      { name: `${tenant}_${moduleSerial}.StartGame`, qos: qosOptions, category: 'module-based' },
      { name: `${tenant}_${moduleSerial}.StartGameError`, qos: qosOptions, category: 'module-based' },
      { name: `${tenant}_${moduleSerial}.TicketLoaded`, qos: qosOptions, category: 'module-based' },
    ];

    const generalTopics: AvailableTopic[] = [
      { name: `${tenant}.NewModuleVersionCreated`, qos: qosOptions, category: 'general' },
      { name: `${tenant}.QrStateChanged`, qos: qosOptions, category: 'general' },
    ];

    return [...moduleBasedTopics, ...generalTopics];
  });

  // Computed signal for filtered available topics
  public filteredAvailableTopics = computed(() => {
    const topics = this.availableTopics();
    const term = this.topicFilterTerm()?.toLowerCase() || '';
    const categoryFilter = this.topicCategoryFilter();

    return topics.filter(topic => {
      const matchesCategory = categoryFilter === 'all' || topic.category === categoryFilter;
      const matchesTerm = topic.name.toLowerCase().includes(term);
      return matchesCategory && matchesTerm;
    });
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
    console.log('[TopicMonitorComponent] Constructor çalıştı.');
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
      console.log('[TopicMonitorComponent] selectedDevice değişti:', device);
      // Sadece cihaz değiştiğinde abonelikleri temizle
      if (device) {
        this.clearAllSubscriptions();
        this.clearLogs();
      }
    });

    // Log availableTopics computation
    effect(() => {
      const topics = this.availableTopics();
      console.log('[TopicMonitorComponent] availableTopics hesaplandı:', topics);
    });

    // Log filteredAvailableTopics computation
    effect(() => {
      const filteredTopics = this.filteredAvailableTopics();
      console.log('[TopicMonitorComponent] filteredAvailableTopics hesaplandı:', filteredTopics);
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

