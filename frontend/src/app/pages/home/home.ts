import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import {
  Mission,
  MissionApiService,
  MissionCategory,
  MissionDifficulty,
} from '../../services/mission-api.service';

type View = 'home' | 'random' | 'generate';
interface Category { id: MissionCategory; label: string; icon: string; }

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.html',
  styleUrl: './home.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {
  private readonly missionApi = inject(MissionApiService);

  // ---- стан сторінки: головна / рандом / генерація ----
  readonly view = signal<View>('home');

  readonly categories: Category[] = [
    { id: 'sport', label: 'Спорт', icon: '🚴' },
    { id: 'creativity', label: 'Творчість', icon: '🎨' },
    { id: 'education', label: 'Навчання', icon: '📖' },
    { id: 'household', label: 'Дім', icon: '🏠' },
    { id: 'mental_health', label: 'Ментальне здоров’я', icon: '💜' },
    { id: 'good_deeds', label: 'Добрі справи', icon: '💬' },
  ];

  readonly difficulties: { id: MissionDifficulty; label: string }[] = [
    { id: 'easy', label: 'Легка' },
    { id: 'medium', label: 'Середня' },
    { id: 'hard', label: 'Складна' },
  ];

  // ---- статистика ----
  readonly streak = signal(0);
  readonly xp = signal(900);
  readonly completed = signal(13);

  // ---- рандом ----
  readonly randomOptions = signal<Mission[]>([]);
  readonly selectedRandomId = signal<number | null>(null);

  // ---- генерація ----
  readonly difficulty = signal<MissionDifficulty>('easy');
  readonly category = signal<MissionCategory | null>(null);
  readonly generated = signal<Mission | null>(null);
  readonly loading = signal(false);
  readonly requestError = signal('');

  // ---- мої місії / друзі ----
  readonly myMissions = signal<Mission[]>([
    {
      id: 100,
      title: 'Спортивна місія',
      description: 'Ідь на велику хвилю',
      category: 'sport',
      difficulty: 'easy',
      xp: 150,
    },
    {
      id: 101,
      title: 'Місія для себе',
      description: 'Саморозвиватись.',
      category: 'mental_health',
      difficulty: 'medium',
      xp: 150,
    },
  ]);

  readonly friends = [
    { name: 'Qwerty123', status: 'Грає зараз', online: true },
    { name: 'Nazar99', status: 'Саморозвивається.', online: false },
    { name: 'Серйозний', status: '', online: false },
  ];

  readonly canGenerate = computed(() => this.category() !== null);

  categoryOf(id: string): Category {
    return this.categories.find(c => c.id === id) ?? this.categories[0];
  }

  difficultyLabel(d: MissionDifficulty): string {
    return this.difficulties.find(x => x.id === d)!.label;
  }

  // ---- навігація між станами ----
  openRandom(): void {
    this.selectedRandomId.set(null);
    this.view.set('random');
    this.loading.set(true);
    this.requestError.set('');
    forkJoin([
      this.missionApi.getRandomMission(),
      this.missionApi.getRandomMission(),
      this.missionApi.getRandomMission(),
    ]).subscribe({
      next: (missions) => {
        this.randomOptions.set(missions);
        this.loading.set(false);
      },
      error: (error: unknown) => this.handleMissionError(error),
    });
  }

  openGenerate(): void {
    this.generated.set(null);
    this.view.set('generate');
  }

  back(): void {
    this.view.set('home');
  }

  // ---- дії ----
  selectRandom(m: Mission): void {
    this.selectedRandomId.set(m.id);
  }

  acceptRandom(): void {
    const m = this.randomOptions().find(x => x.id === this.selectedRandomId());
    if (m) this.accept(m);
  }

  generate(): void {
    const cat = this.category();
    if (!cat) return;
    this.loading.set(true);
    this.requestError.set('');
    this.missionApi
      .getRandomMission({
        category: cat,
        difficulty: this.difficulty(),
      })
      .subscribe({
        next: (mission) => {
          this.generated.set(mission);
          this.loading.set(false);
        },
        error: (error: unknown) => this.handleMissionError(error),
      });
  }

  acceptGenerated(): void {
    const m = this.generated();
    if (m) this.accept(m);
  }

  private accept(m: Mission): void {
    this.myMissions.update(list => [m, ...list.filter(x => x.id !== m.id)].slice(0, 2));
    this.view.set('home');
  }

  private handleMissionError(error: unknown): void {
    this.loading.set(false);
    const status = error instanceof HttpErrorResponse ? error.status : 0;
    this.requestError.set(
      status === 401
        ? 'Потрібно увійти до акаунта, щоб отримувати місії.'
        : status === 404
          ? 'Для вибраних параметрів немає місії.'
          : status === 0
            ? 'Сервер недоступний. Перевір, чи запущено бекенд.'
            : 'Не вдалося отримати місію. Спробуй ще раз.',
    );
  }
}