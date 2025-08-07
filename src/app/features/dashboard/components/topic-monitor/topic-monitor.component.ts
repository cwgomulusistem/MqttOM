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
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatListModule } from '@angular/material/list';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';

import { DeviceStateService } from '../../../../core/services/device-state.service';
import { MqttService } from '../../../../core/services/mqtt.service';
import { MqttTopic } from '../../../../core/services/mqtt-topic.service';
import { DisplayDevice } from '../device-list/device-list.component';
import { PrettyJsonPipe } from '../../../shared/pipes/json.pipe';

@Component({
  selector: 'app-topic-monitor',
  standalone: true,
  imports: [
    CommonModule,
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
  // Servisleri inject et
  private readonly deviceStateService = inject(DeviceStateService);
  private readonly mqttService = inject(MqttService);

  // Sinyaller
  public readonly selectedDevice = toSignal(
    this.deviceStateService.selectedDevice$
  );
  public readonly selectedTopic = signal<MqttTopic | null>(null);

  @ViewChild('messageContainer') private messageContainer!: ElementRef;

  // Tüm mesaj akışını bir sinyale dönüştür
  private readonly allMessages = toSignal(this.mqttService.messageStream$);

  /**
   * Sadece seçili olan topic'e ait mesajları filtreleyen hesaplanmış sinyal.
   */
  public readonly topicMessages = computed(() => {
    const messages = this.allMessages();
    const topic = this.selectedTopic();
    if (!messages || !topic) {
      return [];
    }
    return messages.filter(msg => msg.topic === topic.name);
  });

  constructor() {
    // Cihaz değiştiğinde seçili topic'i temizle
    effect(() => {
      this.selectedDevice(); // Bu effect'in selectedDevice değişimine tepki vermesini sağlar
      this.selectedTopic.set(null); // Cihaz değişince topic seçimini sıfırla
    });

    // Seçili topic değiştiğinde MQTT aboneliğini yönet
    effect(onCleanup => {
      const topic = this.selectedTopic();
      if (topic) {
        this.mqttService.subscribeToTopic(topic.name);
        console.log(`[TopicMonitor] Subscribed to: ${topic.name}`);

        onCleanup(() => {
          this.mqttService.unsubscribeFromTopic(topic.name);
          console.log(`[TopicMonitor] Unsubscribed from: ${topic.name}`);
        });
      }
    });

    // Yeni mesaj geldiğinde scrollbar'ı en alta kaydır
    effect(() => {
      if (this.topicMessages() && this.messageContainer) {
        this.scrollToBottom();
      }
    });
  }

  /**
   * Listeden bir topic seçildiğinde çağrılır.
   * @param topic Seçilen MqttTopic nesnesi.
   */
  public selectTopic(topic: MqttTopic): void {
    this.selectedTopic.set(topic);
  }

  /**
   * Monitördeki scrollbar'ı en alta kaydırır.
   */
  private scrollToBottom(): void {
    try {
      setTimeout(() => {
        this.messageContainer.nativeElement.scrollTop =
          this.messageContainer.nativeElement.scrollHeight;
      }, 50);
    } catch (err) {
      console.error('[TopicMonitor] Scroll to bottom failed:', err);
    }
  }

  /**
   * Angular'ın @for döngüsünde performansı artırmak için kullanılır.
   * @param index Döngüdeki elemanın indeksi.
   * @param topic Döngüdeki topic nesnesi.
   * @returns Topic'in benzersiz adı.
   */
  public trackByTopic(index: number, topic: MqttTopic): string {
    return topic.name;
  }
}
