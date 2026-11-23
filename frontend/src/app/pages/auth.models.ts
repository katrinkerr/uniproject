export type AvatarId = 'fox' | 'cat' | 'owl' | 'bear' | 'rabbit' | 'wolf';

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  nickname: string;
  avatarId: AvatarId;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: 'bearer';
}
