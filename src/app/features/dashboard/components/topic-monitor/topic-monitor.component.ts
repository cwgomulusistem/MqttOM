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
import { MqttTopic, MqttTopicService } from '../../../../core/services/mqtt-topic.service';
import { PrettyJsonPipe } from '../../../../shared/pipes/json.pipe';
import { AuthService } from '../../../../core/services/auth.service';

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
  private readonly mqttTopicService = inject(MqttTopicService);
  private readonly authService = inject(AuthService);

  public readonly selectedDevice = toSignal(
    this.deviceStateService.selectedDevice$
  );
  public readonly selectedTopic = signal<MqttTopic | null>(null);

  // MqttTopicService'ten gelen tüm topic şablonlarını doğrudan sinyale dönüştür
  private readonly allTopicTemplates = toSignal(this.mqttTopicService.topics$, { initialValue: [] });

  // availableTopics artık bir computed sinyal
  public readonly availableTopics = computed<MqttTopic[]>(() => {
    const device = this.selectedDevice();
    const tenant = this.authService.tenant();
    // allTopicTemplates sinyalini burada kullanıyoruz
    const currentTopicTemplates = this.allTopicTemplates(); 

    if (device && tenant) {
      // Sadece seçilen cihaza ve tenant'a özel topic'leri oluştur
      return this.mqttTopicService.generateTopicsForDevice(device.serialNo, tenant);
    } else {
      return [];
    }
  });

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

    // Wildcard topic eşleşmesi için yardımcı fonksiyon
    const matchesWildcard = (messageTopic: string, subscribedTopic: string): boolean => {
      if (subscribedTopic === '#') {
        return true; // Her şeyi eşleştir
      }

      const subParts = subscribedTopic.split('/');
      const msgParts = messageTopic.split('/');

      if (subParts.length > msgParts.length && subscribedTopic.indexOf('#') === -1) {
        return false; // Abone olunan topic mesaj topic'inden uzunsa ve # içermiyorsa eşleşmez
      }

      for (let i = 0; i < subParts.length; i++) {
        const subPart = subParts[i];
        const msgPart = msgParts[i];

        if (subPart === '#') {
          return true; // # varsa geri kalan her şeyi eşleştir
        }
        if (subPart === '+') {
          if (msgPart === undefined) return false; // + varsa mesajda karşılığı olmalı
          continue; // Sonraki parçaya geç
        }
        if (subPart !== msgPart) {
          return false; // Parçalar eşleşmiyorsa
        }
      }
      return subParts.length === msgParts.length; // Tam eşleşme veya # ile bitiyorsa
    };

    // Eğer seçilen topic bir wildcard ise, ona göre filtrele
    if (topic.name.includes('#') || topic.name.includes('+')) {
      return messages.filter(msg => matchesWildcard(msg.topic, topic.name));
    } else {
      // Değilse, tam eşleşme yap
      return messages.filter(msg => msg.topic === topic.name);
    }
  });

  public readonly isSelectedTopicWildcard = computed(() => {
    const topic = this.selectedTopic();
    return topic ? (topic.name.includes('#') || topic.name.includes('+')) : false;
  });

  constructor() {
    // Abonelikleri yöneten effect
    effect(onCleanup => {
      const topicsToSubscribe = this.availableTopics().map(t => t.name); // availableTopics değiştiğinde tetiklenecek

      // Önceki tüm aboneliklerden çık
      this.mqttService.unsubscribeAllTopics();

      // Yeni topic'lere abone ol
      if (topicsToSubscribe.length > 0) {
        this.mqttService.subscribeToTopics(topicsToSubscribe);
      }

      // Effect temizlendiğinde abonelikleri kaldır
      onCleanup(() => {
        this.mqttService.unsubscribeAllTopics();
      });
    });

    // selectedDevice değiştiğinde selectedTopic'i sıfırla
    effect(() => {
      this.selectedDevice(); // selectedDevice değiştiğinde bu effect tetiklenir
      this.selectedTopic.set(null);
    });

    // Scroll to the bottom when new messages arrive
    effect(() => {
      if (this.topicMessages() && this.messageContainer) {
        this.scrollToBottom();
      }
    });

    // Temporary log for allMessages to debug
    effect(() => {
      console.log('[TopicMonitorComponent] All messages:', this.allMessages());
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
}
