import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { MainComponent } from './components/main/main.component';
import { BannerComponent } from './components/banner/banner.component';

@Component({
  selector: 'app-root',
  imports: [HeaderComponent, FooterComponent, MainComponent, BannerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'graphCalc';
}
