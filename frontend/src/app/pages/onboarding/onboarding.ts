import { Component, OnDestroy, signal, WritableSignal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UiButton } from '../../ui-button/ui-button';

type LevelId = 'easy' | 'mid' | 'hard';

interface Level {
  id: LevelId;
  title: string;
  xp: number;
}

interface Category {
  id: string;
  icon: string;
  title: string;
  tint: string;
  examples: Record<LevelId, string[]>;
}

@Component({
  imports: [RouterLink, UiButton],
  selector: 'app-onboarding',
  styleUrl: './onboarding.css',
  templateUrl: './onboarding.html',
})
export class Onboarding implements OnDestroy {
  readonly levels: Level[] = [
    { id: 'easy', title: 'Легко', xp: 10 },
    { id: 'mid', title: 'Середньо', xp: 25 },
    { id: 'hard', title: 'Складно', xp: 40 },
  ];

  readonly categories: Category[] = [
    {
      id: 'sport', icon: '🚴', title: 'Спорт', tint: '#3aa8ff',
      examples: {
        easy: ['10 присідань', '15 хвилин прогулянки'],
        mid: ['7 000 кроків за день', '20 хвилин розтяжки'],
        hard: ['Пробіжка на 5 км', '30 хвилин інтервалів'],
      },
    },
    {
      id: 'kindness', icon: '🤝', title: 'Добрі справи', tint: '#33c9b0',
      examples: {
        easy: ['Тепле повідомлення другу', 'Усмішка незнайомцю'],
        mid: ['Допомога з дрібною справою', 'Віддай непотрібну річ'],
        hard: ['Година волонтерства', 'Міні-збір речей'],
      },
    },
    {
      id: 'mind', icon: '🧠', title: 'Ментальне здоров’я', tint: '#a78bff',
      examples: {
        easy: ['5 глибоких вдихів', 'Склянка води й тиша'],
        mid: ['3 речі, за які вдячний', '10 хвилин медитації'],
        hard: ['Вечір без соцмереж', 'Лист собі в майбутнє'],
      },
    },
    {
      id: 'edu', icon: '📖', title: 'Освіта', tint: '#6f8bff',
      examples: {
        easy: ['Нове слово іноземною', 'Сторінка книжки'],
        mid: ['Лекція на 20 хвилин', 'Розбір теми з конспекту'],
        hard: ['Поясни тему вголос', 'Заверши розділ курсу'],
      },
    },
    {
      id: 'home', icon: '🏠', title: 'Побут', tint: '#42c6a0',
      examples: {
        easy: ['Застели ліжко', 'Прибери робочий стіл'],
        mid: ['Розбери шухляду', 'Вечеря з нуля'],
        hard: ['Генеральне прибирання кімнати', 'Меню на тиждень'],
      },
    },
    {
      id: 'creative', icon: '🎨', title: 'Творчість', tint: '#c07dff',
      examples: {
        easy: ['Скетч за 3 хвилини', 'Чотири рядки вірша'],
        mid: ['10 кадрів на тему «світло»', 'Плейлист під настрій'],
        hard: ['Історія на 500 слів', 'Заверши міні-проєкт'],
      },
    },
  ];

  readonly week = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];

  readonly levelId = signal<LevelId>('hard');

  /** Значення, які «заповнюються» при наведенні. */
  readonly xp = signal(0);
  readonly streak = signal(0);
  readonly xpMax = 2000;
  readonly streakMax = 7;

  private readonly frames = new Map<WritableSignal<number>, number>();

  currentXp(): number {
    return this.levels.find((l) => l.id === this.levelId())!.xp;
  }

  playerLevel(): number {
    return Math.min(4, Math.floor(this.xp() / 500) + 1);
  }

  daysWord(n: number): string {
    const last = n % 10;
    if (n % 100 >= 11 && n % 100 <= 14) return 'днів';
    if (last === 1) return 'день';
    if (last >= 2 && last <= 4) return 'дні';
    return 'днів';
  }

  fillXp(on: boolean): void {
    this.animate(this.xp, on ? this.xpMax : 0, on ? 1100 : 500);
  }

  fillStreak(on: boolean): void {
    this.animate(this.streak, on ? this.streakMax : 0, on ? 900 : 400);
  }

  private animate(target: WritableSignal<number>, to: number, ms: number): void {
    const running = this.frames.get(target);
    if (running !== undefined) cancelAnimationFrame(running);

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      target.set(to);
      return;
    }

    const from = target();
    const start = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / ms);
      const eased = 1 - Math.pow(1 - p, 3);
      target.set(Math.round(from + (to - from) * eased));
      if (p < 1) this.frames.set(target, requestAnimationFrame(step));
      else this.frames.delete(target);
    };
    this.frames.set(target, requestAnimationFrame(step));
  }

  ngOnDestroy(): void {
    this.frames.forEach((id) => cancelAnimationFrame(id));
  }
}