// src/app/profile/profile.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProfileService } from '../services/profile.service';
import { NavbarComponent } from '../navbar/navbar.component';
import { FooterComponent } from '../footer/footer.component';
import { DateFormatPipe } from '../shared/pipes';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, FooterComponent, DateFormatPipe],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {

  profile: any = {
    username: '',
    email: '',
    phone_number: '',
    profile_picture: null,
    created_at: new Date()
  };

  isEditing = false;
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  loading = true;
  saving = false;

  constructor(private profileService: ProfileService) { }

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.loading = true;
    this.profileService.getProfile().subscribe({
      next: (data: any) => {
        this.profile = {
          username: data.username || '',
          email: data.email || '',
          phone_number: data.phone_number || '',
          profile_picture: data.profile_picture || null,
          created_at: data.created_at || new Date()
        };
        this.previewUrl = this.profile.profile_picture;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load profile:', err);
        alert('Could not load profile. Please log in again.');
        this.loading = false;
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.[0]) {
      this.selectedFile = input.files[0];
      const reader = new FileReader();
      reader.onload = () => this.previewUrl = reader.result as string;
      reader.readAsDataURL(this.selectedFile);
    }
  }

  save(): void {
    this.saving = true;

    const formData = new FormData();
    formData.append('username', this.profile.username);
    formData.append('email', this.profile.email);
    formData.append('phone_number', this.profile.phone_number || '');

    if (this.selectedFile) {
    formData.append('profile_picture', this.selectedFile);
  } else if (this.previewUrl === null && this.profile.profile_picture) {
    formData.append('profile_picture', ''); 
  }

    this.profileService.updateProfile(formData).subscribe({
      next: (updated: any) => {
        this.profile = {
          username: updated.username,
          email: updated.email,
          phone_number: updated.phone_number || '',
          profile_picture: updated.profile_picture || null,
          created_at: updated.created_at || this.profile.created_at
        };
        this.previewUrl = this.profile.profile_picture;
        this.isEditing = false;
        this.selectedFile = null;
        this.saving = false;
      },
      error: (err) => {
        console.error('Update failed:', err);
        alert('Failed to update profile. Please try again.');
        this.saving = false;
      }
    });
  }

  removePicture(): void {
    this.selectedFile = null;
    this.previewUrl = null;

  }

  cancelEdit(): void {
    this.isEditing = false;
    this.selectedFile = null;
    this.previewUrl = this.profile.profile_picture;
    
  }
}