import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-auth-aside',
  standalone: true,
  templateUrl: './auth-aside.component.html',
  styleUrl: './auth-aside.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthAsideComponent {
  @Input({ required: true }) heading = '';
  @Input() text = '';
  @Input() steps: string[] = [];
  @Input() activeStep = 0;
}
