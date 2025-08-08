import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { MqttTopic, MqttTopicService } from '../../core/services/mqtt-topic.service';

@Component({
  selector: 'app-topic-management',
  templateUrl: './topic-management.component.html',
  styleUrls: ['./topic-management.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule
  ]
})
export class TopicManagementComponent {
  private fb = inject(FormBuilder);
  private topicService = inject(MqttTopicService);
  private snackBar = inject(MatSnackBar);

  public topics = toSignal(this.topicService.topics$, { initialValue: [] });
  public displayedColumns: string[] = ['name', 'type', 'description', 'actions'];
  public topicForm: FormGroup;

  public showForm = signal(false);
  public isEditing = signal(false);
  private currentTopicId = signal<string | null>(null);

  constructor() {
    this.topicForm = this.fb.group({
      name: ['', Validators.required],
      type: ['general', Validators.required],
      description: ['', Validators.required]
    });
  }

  openForm(topic?: MqttTopic): void {
    this.showForm.set(true);
    this.isEditing.set(!!topic);
    if (topic) {
      this.currentTopicId.set(topic.id!);
      this.topicForm.setValue({
        name: topic.name,
        type: topic.type,
        description: topic.description
      });
    } else {
      this.topicForm.reset({ type: 'general' });
      this.currentTopicId.set(null);
    }
  }

  saveTopic(): void {
    if (this.topicForm.invalid) {
      return;
    }

    const topicData = this.topicForm.value;

    if (this.isEditing() && this.currentTopicId()) {
      this.topicService.updateTopic({ ...topicData, id: this.currentTopicId()! });
      this.snackBar.open('Topic updated successfully', 'Close', { duration: 3000 });
    } else {
      this.topicService.addTopic(topicData);
      this.snackBar.open('Topic added successfully', 'Close', { duration: 3000 });
    }

    this.closeForm();
  }

  deleteTopic(topicId: string): void {
    this.topicService.deleteTopic(topicId);
    this.snackBar.open('Topic deleted successfully', 'Close', { duration: 3000 });
  }

  closeForm(): void {
    this.showForm.set(false);
    this.isEditing.set(false);
    this.currentTopicId.set(null);
    this.topicForm.reset();
  }
}