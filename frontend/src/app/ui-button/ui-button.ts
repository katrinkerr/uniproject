import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  imports: [RouterLink],
  selector: 'app-ui-button',
  styleUrl: './ui-button.css',
  templateUrl: './ui-button.html',
})
export class UiButton {
  label = input('Кнопка');
  variant = input<'primary' | 'secondary' | 'danger'>('primary');
  disabled = input(false);
  link = input<string | null>(null);

  btnClick = output<void>();

  onClick() {
    if (!this.disabled()) {
      this.btnClick.emit();
    }
  }
}