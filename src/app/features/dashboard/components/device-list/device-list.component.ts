import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';

import { DeviceDataService, DeviceData } from '../../core/services/device-data.service';
import { DeviceStateService } from '../../core/services/device-state.service';
import { MqttTopicService, MqttTopic } from '../../core/services/mqtt-topic.service';
import { AuthService } from '../../core/services/auth.service';

/**
 * Cihaz verilerini ve o cihaza ait topic listesini bir arada tutan arayüz.
 * Arayüzde gösterilecek cihaz nesneleri bu yapıyı kullanır.
 */
export interface DisplayDevice extends DeviceData {
  topics: MqttTopic[];
}

@Component({
  selector: 'app-device-list',
  templateUrl: './device-list.component.html',
  styleUrls: ['./device-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatListModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
  ],
})
export class DeviceListComponent {
  // Servisleri inject et
  private readonly deviceDataService = inject(DeviceDataService);
  private readonly deviceStateService = inject(DeviceStateService);
  private readonly mqttTopicService = inject(MqttTopicService);
  private readonly authService = inject(AuthService);

  // Sinyaller ve Form Kontrolleri
  public readonly allDevices = this.deviceDataService.devices;
  public readonly selectedDevice = this.deviceStateService.selectedDevice;
  private readonly tenant = this.authService.tenant;

  public readonly deviceFilterControl = new FormControl('');
  public readonly topicFilterControl = new FormControl('');

  /**
   * Cihaz listesini filtreleyen ve her bir cihaza ait topic'leri oluşturan hesaplanmış sinyal.
   * Sadece 'isConnected' durumu true olan cihazları dikkate alır.
   */
  public readonly filteredDevices = computed<DisplayDevice[]>(() => {
    const devices = this.allDevices();
    const filterText = this.deviceFilterControl.value?.toLowerCase() || '';

    return devices
      .filter(device => device.isConnected) // Sadece bağlı olanları filtrele
      .map(device => this.createDisplayDevice(device)) // Her birini DisplayDevice'a dönüştür
      .filter(device => {
        // Filtre metnine göre ara
        if (!filterText) return true;
        return (
          device.serialNo.toLowerCase().includes(filterText) ||
          device.branchName.toLowerCase().includes(filterText) ||
          device.branchCode.toLowerCase().includes(filterText)
        );
      });
  });

  /**
   * Seçili olan cihaza ait topic listesini filtreleyen hesaplanmış sinyal.
   */
  public readonly filteredTopics = computed<MqttTopic[]>(() => {
    const selected = this.selectedDevice();
    const filterText = this.topicFilterControl.value?.toLowerCase() || '';

    if (!selected) return [];
    if (!filterText) return selected.topics;

    return selected.topics.filter(
      topic =>
        topic.name.toLowerCase().includes(filterText) ||
        topic.type.toLowerCase().includes(filterText) ||
        topic.description.toLowerCase().includes(filterText)
    );
  });

  constructor() {
    // Form kontrollerindeki değişiklikleri dinleyerek sinyallerin yeniden hesaplanmasını tetikle
    this.deviceFilterControl.valueChanges.subscribe(() => this.filteredDevices());
    this.topicFilterControl.valueChanges.subscribe(() => this.filteredTopics());

    // Başlangıçta cihaz listesini yenilemek için bir `effect` kullanalım
    effect(() => {
      this.deviceDataService.refreshDevices();
    });
  }

  /**
   * Bir cihaz seçildiğinde çağrılır ve seçili cihaz durumunu günceller.
   * @param device Seçilen DisplayDevice nesnesi.
   */
  public selectDevice(device: DisplayDevice): void {
    this.deviceStateService.setSelectedDevice(device);
    // Topic filtresini temizle
    this.topicFilterControl.setValue('');
  }

  /**
   * Bir DeviceData nesnesini, topic listesi eklenmiş bir DisplayDevice nesnesine dönüştürür.
   * @param device Dönüştürülecek cihaz verisi.
   * @returns Topic listesi eklenmiş DisplayDevice nesnesi.
   */
  private createDisplayDevice(device: DeviceData): DisplayDevice {
    const topics = this.mqttTopicService.generateTopicsForDevice(
      device.serialNo,
      this.tenant()
    );
    return { ...device, topics };
  }

  /**
   * Angular'ın `for` döngüsünde performansı artırmak için kullanılır.
   * @param index Döngüdeki elemanın indeksi.
   * @param device Döngüdeki cihaz nesnesi.
   * @returns Cihazın benzersiz seri numarası.
   */
  public trackByDevice(index: number, device: DisplayDevice): string {
    return device.serialNo;
  }

  /**
   * Angular'ın `for` döngüsünde performansı artırmak için kullanılır.
   * @param index Döngüdeki elemanın indeksi.
   * @param topic Döngüdeki topic nesnesi.
   * @returns Topic'in benzersiz adı.
   */
  public trackByTopic(index: number, topic: MqttTopic): string {
    return topic.name;
  }
}
