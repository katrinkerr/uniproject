import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { AvatarId } from '../auth.models';

const AVATAR_ICONS: Record<AvatarId, string> = {
  fox: '🦊',
  cat: '🐱',
  owl: '🦉',
  bear: '🐻',
  rabbit: '🐰',
  wolf: '🐺',
};

@Component({
  selector: 'app-avatar-icon',
  standalone: true,
  template: '<span aria-hidden="true">{{ icon }}</span>',
  styles: [
    `
      :host {
        width: 100%;
        height: 100%;
        display: grid;
        place-items: center;
        font-size: 1.8rem;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvatarIconComponent {
  @Input({ required: true }) avatarId!: AvatarId;

  get icon(): string {
    return AVATAR_ICONS[this.avatarId];
  }
}
