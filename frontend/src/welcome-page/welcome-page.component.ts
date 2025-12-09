import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';
import { FooterComponent } from '../footer/footer.component';
import { ListingsComponent } from '../listings/listings.component';


@Component({
  selector: 'app-welcome-page',
  standalone: true,
  imports: [CommonModule, FormsModule,NavbarComponent,FooterComponent,ListingsComponent],
  templateUrl: './welcome-page.component.html',
  styleUrls: ['./welcome-page.component.scss']
})
export class WelcomePageComponent  {
  
}