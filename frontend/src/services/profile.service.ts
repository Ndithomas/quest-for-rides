// src/app/services/profile.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private readonly baseUrl = 'http://localhost:8000/api';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

private get endpoint(): string {
  const user = this.authService.getUser();

  if (!user || !user.role) {
    console.error('User or role not found');
    return '';
  }

  const role = user.role.toLowerCase(); 

  return `${this.baseUrl}/${role}/${role}-profile/`;
}

  getProfile(): Observable<any> {
    return this.http.get(this.endpoint);
  }

  updateProfile(formData: FormData): Observable<any> {
    return this.http.patch(this.endpoint, formData);
  }
}