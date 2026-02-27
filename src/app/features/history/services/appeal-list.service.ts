import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { API_ROUTES } from '../../../core/constants/api-routes';
import { AppealListQuery, AppealListResponse } from '../../../core/models/appeal.model';

@Injectable({ providedIn: 'root' })
export class AppealListService {
  private readonly http = inject(HttpClient);

  async loadAppeals(query: AppealListQuery): Promise<AppealListResponse> {
    let params = new HttpParams();
    if (query.status) params = params.set('status', query.status);
    if (query.q) params = params.set('q', query.q);
    if (query.page != null) params = params.set('page', String(query.page));
    if (query.limit != null) params = params.set('limit', String(query.limit));

    return firstValueFrom(
      this.http.get<AppealListResponse>(
        `${environment.apiUrl}${API_ROUTES.APPEALS.BASE}`,
        { params },
      ),
    );
  }

  async deleteAppeal(id: string): Promise<void> {
    return firstValueFrom(
      this.http.delete<void>(
        `${environment.apiUrl}${API_ROUTES.APPEALS.BY_ID(id)}`,
      ),
    );
  }

  async downloadDocument(id: string): Promise<Blob> {
    return firstValueFrom(
      this.http.get(
        `${environment.apiUrl}${API_ROUTES.APPEALS.DOWNLOAD(id)}`,
        { responseType: 'blob' },
      ),
    );
  }
}
