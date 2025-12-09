import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ManagementUserActionsService {
  private readonly api = 'http://localhost:8000/api/management/users/';

  constructor(private readonly http: HttpClient) {}

  changeUserStatus(userId: number, status: 'active' | 'inactive' | 'suspended'): Observable<any> {
    return this.http.patch(`${this.api}${userId}/change-status/`, { status });
  }
}
