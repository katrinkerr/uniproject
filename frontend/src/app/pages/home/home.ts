import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';

type View = 'home' | 'random' | 'generate';
type Difficulty = 'easy' | 'medium' | 'hard';

interface Mission {
  id: number;
  category: string;
  difficulty: Difficulty;
  xp: number;
  text: string;
}

interface Category { id: string; label: string; icon: string; }

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.html',
  styleUrl: './home.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {
  // ---- стан сторінки: головна / рандом / генерація ----
  readonly view = signal<View>('home');

  readonly categories: Category[] = [
    { id: 'sport', label: 'Спорт', icon: '🚴' },
    { id: 'creative', label: 'Творчість', icon: '🎨' },
    { id: 'study', label: 'Навчання', icon: '📖' },
    { id: 'home', label: 'Дім', icon: '🏠' },
    { id: 'mind', label: 'Ментальне здоров’я', icon: '💜' },
    { id: 'social', label: 'Спілкування', icon: '💬' },
  ];

  readonly difficulties: { id: Difficulty; label: string }[] = [
    { id: 'easy', label: 'Легка' },
    { id: 'medium', label: 'Середня' },
    { id: 'hard', label: 'Складна' },
  ];

  private readonly pool: Mission[] = [
    { id: 1, category: 'sport', difficulty: 'easy', xp: 50, text: 'Зробіть 10-хвилинну розминку просто зараз.' },
    { id: 2, category: 'sport', difficulty: 'medium', xp: 100, text: 'Пройдіть 6 000 кроків за сьогодні.' },
    { id: 3, category: 'sport', difficulty: 'hard', xp: 150, text: 'Пробіжіть 5 км без зупинок.' },
    { id: 4, category: 'mind', difficulty: 'easy', xp: 50, text: 'Запишіть три речі, за які вдячні сьогодні.' },
    { id: 5, category: 'mind', difficulty: 'medium', xp: 100, text: 'Проведіть годину без соцмереж.' },
    { id: 6, category: 'mind', difficulty: 'hard', xp: 150, text: 'Цілий день без телефону після 18:00.' },
    { id: 7, category: 'creative', difficulty: 'easy', xp: 50, text: 'Намалюйте швидкий скетч за 5 хвилин.' },
    { id: 8, category: 'creative', difficulty: 'medium', xp: 100, text: 'Напишіть коротке оповідання на 200 слів.' },
    { id: 9, category: 'study', difficulty: 'easy', xp: 50, text: 'Прочитайте 10 сторінок книжки.' },
    { id: 10, category: 'study', difficulty: 'hard', xp: 150, text: 'Вивчіть 20 нових слів іноземною мовою.' },
    { id: 11, category: 'home', difficulty: 'easy', xp: 50, text: 'Наведіть лад на робочому столі.' },
    { id: 12, category: 'home', difficulty: 'medium', xp: 100, text: 'Приготуйте новий рецепт, якого ще не пробували.' },
    { id: 13, category: 'social', difficulty: 'easy', xp: 50, text: 'Напишіть другу, з яким давно не спілкувались.' },
    { id: 14, category: 'social', difficulty: 'hard', xp: 150, text: 'Організуйте зустріч з друзями цього тижня.' },
  ];

  // ---- статистика ----
  readonly streak = signal(0);
  readonly xp = signal(900);
  readonly completed = signal(13);

  // ---- рандом ----
  readonly randomOptions = signal<Mission[]>([]);
  readonly selectedRandomId = signal<number | null>(null);

  // ---- генерація ----
  readonly difficulty = signal<Difficulty>('easy');
  readonly category = signal<string | null>(null);
  readonly generated = signal<Mission | null>(null);

  // ---- мої місії / друзі ----
  readonly myMissions = signal<Mission[]>([
    { id: 100, category: 'sport', difficulty: 'easy', xp: 150, text: 'Ідь на велику хвилю' },
    { id: 101, category: 'mind', difficulty: 'medium', xp: 150, text: 'Саморозвиватись.' },
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

  difficultyLabel(d: Difficulty): string {
    return this.difficulties.find(x => x.id === d)!.label;
  }

  // ---- навігація між станами ----
  openRandom(): void {
    this.selectedRandomId.set(null);
    this.randomOptions.set(this.pickRandom(3));
    this.view.set('random');
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
    const matches = this.pool.filter(m => m.category === cat && m.difficulty === this.difficulty());
    const list = matches.length ? matches : this.pool.filter(m => m.category === cat);
    this.generated.set(list[Math.floor(Math.random() * list.length)]);
  }

  acceptGenerated(): void {
    const m = this.generated();
    if (m) this.accept(m);
  }

  private accept(m: Mission): void {
    this.myMissions.update(list => [m, ...list.filter(x => x.id !== m.id)].slice(0, 2));
    this.view.set('home');
  }

  private pickRandom(n: number): Mission[] {
    return [...this.pool].sort(() => Math.random() - 0.5).slice(0, n);
  }
}