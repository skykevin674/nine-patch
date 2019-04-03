import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { NgNinePatchModule } from 'ng-nine-patch';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule, NgNinePatchModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
