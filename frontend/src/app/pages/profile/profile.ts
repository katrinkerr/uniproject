import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import {
  MissionApiService,
  MissionCategory,
} from '../../services/mission-api.service';
import type { Mission as ApiMission } from '../../services/mission-api.service';
import { AvatarId } from '../auth.models';
import { AvatarIconComponent } from '../avatar-icon/avatar-icon.component';

interface Stat {
  icon: string;
  value: number;
  label: string;
  tone: 'fire' | 'friends' | 'done';
}

interface ProfileMission {
  id: number;
  category: string;
  categoryTone: 'sport' | 'creative';
  title: string;
  xp: number;
}

interface Friend {
  name: string;
  handle: string;
  level: number;
  avatarId: AvatarId;
}

interface StoredProfile {
  name: string;
  nickname: string;
  avatarId: AvatarId;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [RouterLink, AvatarIconComponent],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Profile implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly missionApi = inject(MissionApiService);
  private readonly router = inject(Router);
  private profileEmail = '';

  readonly user = signal({
    name: 'Користувач',
    handle: '@user',
    level: 1,
    xp: 900,
    xpMax: 1000,
    avatar: 'K',
    avatarId: 'cat' as AvatarId,
    photoUrl: '' as string,
  });
  readonly profileLoading = signal(true);
  readonly profileError = signal('');
  readonly missionLoading = signal(true);
  readonly missionError = signal('');
  readonly avatarError = signal('');

  readonly progress = computed(() => {
    const { xp, xpMax } = this.user();
    return Math.min(100, Math.round((xp / xpMax) * 100));
  });

  readonly stats = signal<Stat[]>([
    { icon: '🔥', value: 2, label: 'Днів поспіль', tone: 'fire' },
    { icon: '👥', value: 2, label: 'Друзі', tone: 'friends' },
    { icon: '✔', value: 13, label: 'Виконаних місій', tone: 'done' },
  ]);

  readonly missions = signal<ProfileMission[]>([]);

  readonly friends = signal<Friend[]>([
    { name: 'Олексійко', handle: '@alex', level: 4, avatarId: 'rabbit' },
    { name: 'Сергій', handle: '@serhii', level: 2, avatarId: 'wolf' },
  ]);

  ngOnInit(): void {
    this.loadProfile();
    this.loadMissions();
  }

  private loadProfile(): void {
    this.authService.getCurrentUser().subscribe({
      next: (currentUser) => {
        if (!currentUser) {
          this.profileLoading.set(false);
          return;
        }

        this.profileEmail = currentUser.email;
        const localName = currentUser.email.split('@')[0];
        const storedProfile = this.getStoredProfile(currentUser.email);
        const photoUrl = this.getStoredPhoto(currentUser.email);
        this.user.update((user) => ({
          ...user,
          name: storedProfile?.name || localName,
          handle: storedProfile?.nickname
            ? `@${storedProfile.nickname}`
            : `@${localName}`,
          avatar: (storedProfile?.name || localName).charAt(0).toUpperCase(),
          avatarId: storedProfile?.avatarId || user.avatarId,
          photoUrl,
        }));
        this.profileLoading.set(false);
      },
      error: (error: unknown) => {
        this.profileLoading.set(false);
        this.profileError.set(
          error instanceof HttpErrorResponse && error.status === 401
            ? 'Сеанс завершено. Увійдіть до акаунта ще раз.'
            : 'Не вдалося завантажити дані профілю.',
        );
      },
    });
  }

  private loadMissions(): void {
    forkJoin([
      this.missionApi.getRandomMission(),
      this.missionApi.getRandomMission(),
    ]).subscribe({
      next: (missions) => {
        this.missions.set(missions.map((mission) => this.toProfileMission(mission)));
        this.missionLoading.set(false);
      },
      error: () => {
        this.missionLoading.set(false);
        this.missionError.set('Не вдалося завантажити активні місії.');
      },
    });
  }

  private toProfileMission(mission: ApiMission): ProfileMission {
    return {
      id: mission.id,
      category: this.categoryLabel(mission.category),
      categoryTone: mission.category === 'sport' ? 'sport' : 'creative',
      title: mission.title,
      xp: mission.xp,
    };
  }

  private categoryLabel(category: MissionCategory): string {
    const labels: Record<MissionCategory, string> = {
      sport: 'Спорт',
      good_deeds: 'Добрі справи',
      mental_health: 'Ментальне здоров’я',
      education: 'Навчання',
      household: 'Побут',
      creativity: 'Творчість',
    };
    return labels[category];
  }

  categoryIcon(category: string): string {
    const icons: Record<string, string> = {
      Спорт: '🚴',
      'Добрі справи': '🤝',
      'Ментальне здоров’я': '🧠',
      Навчання: '📖',
      Побут: '🏠',
      Творчість: '🎨',
    };
    return icons[category] || '★';
  }

  completeMission(id: number): void {
    this.missions.update((list) => list.filter((m) => m.id !== id));
    this.user.update((u) => ({ ...u, xp: Math.min(u.xpMax, u.xp + 30) }));
  }

  startSurvey(): void {
    void this.router.navigate(['/']);
  }

  addFriend(): void {
    // TODO: відкрити діалог додавання друга
  }

  editAvatar(input: HTMLInputElement): void {
    input.click();
  }

  onAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      this.avatarError.set('Оберіть зображення у форматі JPG, PNG або WebP.');
      input.value = '';
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      this.avatarError.set('Розмір фото не може перевищувати 2 МБ.');
      input.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const photoUrl = String(reader.result);
      this.user.update((user) => ({ ...user, photoUrl }));
      this.saveStoredPhoto(photoUrl);
      this.avatarError.set('');
    };
    reader.onerror = () => {
      this.avatarError.set('Не вдалося прочитати обране фото.');
    };
    reader.readAsDataURL(file);
  }

  avatarLabel(): string {
    const labels: Record<AvatarId, string> = {
      fox: 'Лисиця',
      cat: 'Кіт',
      owl: 'Сова',
      bear: 'Ведмідь',
      rabbit: 'Кролик',
      wolf: 'Вовк',
    };
    return labels[this.user().avatarId];
  }

  private getStoredProfile(email: string): StoredProfile | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }

    try {
      const stored = localStorage.getItem(
        `plot-profile:${email.toLowerCase()}`,
      );
      return stored ? JSON.parse(stored) as StoredProfile : null;
    } catch {
      return null;
    }
  }

  private getStoredPhoto(email: string): string {
    if (typeof localStorage === 'undefined') {
      return '';
    }

    return localStorage.getItem(`plot-avatar-photo:${email.toLowerCase()}`) || '';
  }

  private saveStoredPhoto(photoUrl: string): void {
    if (typeof localStorage === 'undefined' || !this.profileEmail) {
      return;
    }

    try {
      localStorage.setItem(
        `plot-avatar-photo:${this.profileEmail.toLowerCase()}`,
        photoUrl,
      );
    } catch {
      this.avatarError.set(
        'Фото занадто велике для локального збереження.',
      );
    }
  }
}