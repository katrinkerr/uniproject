import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { MissionApiService } from './mission-api.service';

describe('MissionApiService', () => {
  let authService: AuthService;
  let httpTestingController: HttpTestingController;
  let missionApi: MissionApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    authService = TestBed.inject(AuthService);
    httpTestingController = TestBed.inject(HttpTestingController);
    missionApi = TestBed.inject(MissionApiService);
  });

  afterEach(() => {
    httpTestingController.verify();
    authService.endSession();
  });

  it('sends the stored session token when requesting a filtered mission', () => {
    authService.startSession('test-token');

    missionApi.getRandomMission({ category: 'sport', difficulty: 'easy' }).subscribe();

    const request = httpTestingController.expectOne(
      (req) => req.url === 'http://127.0.0.1:8000/missions/random',
    );
    expect(request.request.params.get('category')).toBe('sport');
    expect(request.request.params.get('difficulty')).toBe('easy');
    expect(request.request.headers.get('Authorization')).toBe('Bearer test-token');
    request.flush({
      id: 2,
      title: 'Планка з віршем',
      description: 'Виконай місію',
      category: 'sport',
      difficulty: 'easy',
      xp: 30,
    });
  });
});
