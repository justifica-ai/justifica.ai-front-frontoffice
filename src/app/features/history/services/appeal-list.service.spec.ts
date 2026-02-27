import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AppealListService } from './appeal-list.service';
import { environment } from '../../../../environments/environment';
import { API_ROUTES } from '../../../core/constants/api-routes';
import { AppealListResponse } from '../../../core/models/appeal.model';

describe('AppealListService', () => {
  let service: AppealListService;
  let httpTesting: HttpTestingController;

  const baseUrl = `${environment.apiUrl}${API_ROUTES.APPEALS.BASE}`;

  const mockResponse: AppealListResponse = {
    data: [
      {
        id: 'appeal-1',
        status: 'draft',
        appealType: 'prior_defense',
        createdAt: '2026-02-26T10:00:00.000Z',
        updatedAt: '2026-02-26T10:00:00.000Z',
        vehiclePlate: 'ABC1D23',
        infractionCode: '74550',
        aitCode: 'AB12345678',
        infractionDate: '2026-01-15T00:00:00.000Z',
        infractionNature: 'Gravíssima',
        organName: 'DETRAN-SP',
        amountPaid: null,
      },
    ],
    total: 1,
    page: 1,
    limit: 10,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(AppealListService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('loadAppeals', () => {
    it('should load appeals with no query params', async () => {
      const promise = service.loadAppeals({});
      const req = httpTesting.expectOne(baseUrl);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.keys().length).toBe(0);
      req.flush(mockResponse);

      const result = await promise;
      expect(result).toEqual(mockResponse);
    });

    it('should load appeals with status filter', async () => {
      const promise = service.loadAppeals({ status: 'draft' });
      const req = httpTesting.expectOne(`${baseUrl}?status=draft`);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('status')).toBe('draft');
      req.flush(mockResponse);

      const result = await promise;
      expect(result).toEqual(mockResponse);
    });

    it('should load appeals with search query', async () => {
      const promise = service.loadAppeals({ q: 'ABC' });
      const req = httpTesting.expectOne(`${baseUrl}?q=ABC`);
      expect(req.request.params.get('q')).toBe('ABC');
      req.flush(mockResponse);

      const result = await promise;
      expect(result).toEqual(mockResponse);
    });

    it('should load appeals with pagination params', async () => {
      const promise = service.loadAppeals({ page: 2, limit: 20 });
      const req = httpTesting.expectOne(`${baseUrl}?page=2&limit=20`);
      expect(req.request.params.get('page')).toBe('2');
      expect(req.request.params.get('limit')).toBe('20');
      req.flush(mockResponse);

      const result = await promise;
      expect(result).toEqual(mockResponse);
    });

    it('should load appeals with all params', async () => {
      const promise = service.loadAppeals({ status: 'paid', q: 'XYZ', page: 3, limit: 5 });
      const req = httpTesting.expectOne(`${baseUrl}?status=paid&q=XYZ&page=3&limit=5`);
      expect(req.request.params.get('status')).toBe('paid');
      expect(req.request.params.get('q')).toBe('XYZ');
      expect(req.request.params.get('page')).toBe('3');
      expect(req.request.params.get('limit')).toBe('5');
      req.flush(mockResponse);

      const result = await promise;
      expect(result).toEqual(mockResponse);
    });

    it('should handle load error', async () => {
      const promise = service.loadAppeals({});
      const req = httpTesting.expectOne(baseUrl);
      req.flush('Error', { status: 500, statusText: 'Server Error' });

      await expectAsync(promise).toBeRejected();
    });
  });

  describe('deleteAppeal', () => {
    it('should delete appeal by id', async () => {
      const id = 'appeal-1';
      const promise = service.deleteAppeal(id);
      const req = httpTesting.expectOne(`${environment.apiUrl}${API_ROUTES.APPEALS.BY_ID(id)}`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);

      await expectAsync(promise).toBeResolved();
    });

    it('should handle delete error', async () => {
      const id = 'appeal-1';
      const promise = service.deleteAppeal(id);
      const req = httpTesting.expectOne(`${environment.apiUrl}${API_ROUTES.APPEALS.BY_ID(id)}`);
      req.flush('Error', { status: 404, statusText: 'Not Found' });

      await expectAsync(promise).toBeRejected();
    });
  });

  describe('downloadDocument', () => {
    it('should download document as blob', async () => {
      const id = 'appeal-1';
      const mockBlob = new Blob(['PDF content'], { type: 'application/pdf' });
      const promise = service.downloadDocument(id);
      const req = httpTesting.expectOne(`${environment.apiUrl}${API_ROUTES.APPEALS.DOWNLOAD(id)}`);
      expect(req.request.method).toBe('GET');
      expect(req.request.responseType).toBe('blob');
      req.flush(mockBlob);

      const result = await promise;
      expect(result).toBeTruthy();
      expect(result instanceof Blob).toBeTrue();
    });

    it('should handle download error', async () => {
      const id = 'appeal-1';
      const promise = service.downloadDocument(id);
      const req = httpTesting.expectOne(`${environment.apiUrl}${API_ROUTES.APPEALS.DOWNLOAD(id)}`);
      req.error(new ProgressEvent('error'), { status: 500, statusText: 'Server Error' });

      await expectAsync(promise).toBeRejected();
    });
  });
});
