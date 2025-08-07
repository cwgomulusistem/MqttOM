import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { FormsModule } from '@angular/forms';
import { DeviceStateService } from '../../../../core/services/device-state.service';

@Component({
  selector: 'app-topic-manager',
  templateUrl: './topic-manager.component.html',
  styleUrls: ['./topic-manager.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
  ],
})
export class TopicManagerComponent {
  private deviceStateService = inject(DeviceStateService);
  public newTopic = signal('');

  public customTopics = this.deviceStateService.customTopics;

  addTopic(): void {
    const topic = this.newTopic().trim();
    if (topic) {
      this.deviceStateService.addCustomTopic(topic);
      this.newTopic.set('');
    }
  }

  removeTopic(topic: string): void {
    this.deviceStateService.removeCustomTopic(topic);
  }
}
