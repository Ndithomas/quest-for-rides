import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({ providedIn: 'root' })
export class ManagementUserActionsService {
  private readonly api = `${environment.apiBaseUrl}/api/management/users/`;
  constructor(private readonly http: HttpClient) {}

  changeUserStatus(userId: number, status: 'active' | 'inactive' | 'suspended'): Observable<any> {
    return this.http.patch(`${this.api}${userId}/change-status/`, { status });
  }
}
