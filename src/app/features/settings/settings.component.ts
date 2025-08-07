import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

// Angular Material Modules
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

// Core Services
import { DeviceStateService } from '../../core/services/device-state.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatListModule,
    MatIconModule,
    MatTooltipModule,
    MatSnackBarModule,
  ],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsComponent {
  private readonly deviceStateService = inject(DeviceStateService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  public newTopicTemplate = signal('');
  public topicTemplates = signal<string[]>([]);

  constructor() {
    this.topicTemplates.set(this.deviceStateService.customTopics());
  }

  addTemplate(): void {
    const template = this.newTopicTemplate().trim();
    if (template && !this.topicTemplates().includes(template)) {
      this.topicTemplates.update(templates => [...templates, template]);
      this.newTopicTemplate.set('');
    }
  }

  removeTemplate(templateToRemove: string): void {
    this.topicTemplates.update(templates =>
      templates.filter(t => t !== templateToRemove)
    );
  }

  saveSettings(): void {
    this.deviceStateService.setAllCustomTopics(this.topicTemplates());
    this.snackBar.open('Topic settings have been saved!', 'Close', {
      duration: 3000,
    });
    this.router.navigate(['/dashboard']);
  }

  cancel(): void {
    this.router.navigate(['/dashboard']);
  }
}
