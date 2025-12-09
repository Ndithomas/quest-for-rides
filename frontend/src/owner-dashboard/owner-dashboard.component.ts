import { Component } from '@angular/core';
import { NavbarComponent } from '../navbar/navbar.component';
import { FooterComponent } from '../footer/footer.component';
import { RouterLink } from '@angular/router';


@Component({
  selector: 'app-owner-dashboard',
  standalone: true,
  imports: [NavbarComponent,FooterComponent,RouterLink],
  templateUrl: './owner-dashboard.component.html',
  styleUrls: ['./owner-dashboard.component.scss']
})
export class OwnerDashboardComponent {

}
