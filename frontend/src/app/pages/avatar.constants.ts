import { AvatarId } from './auth.models';

export const AVATARS: readonly { id: AvatarId; label: string }[] = [
  { id: 'fox', label: 'Лисиця' },
  { id: 'cat', label: 'Кіт' },
  { id: 'owl', label: 'Сова' },
  { id: 'bear', label: 'Ведмідь' },
  { id: 'rabbit', label: 'Кролик' },
  { id: 'wolf', label: 'Вовк' },
];
