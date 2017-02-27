import { Component } from '@angular/core';

import { ApiService } from '../services';

import '../style/app.scss';

@Component({
  selector: 'my-app', // <my-app></my-app>
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title: string;

  constructor(private api: ApiService) {
    this.title = this.api.title;
  }
}
