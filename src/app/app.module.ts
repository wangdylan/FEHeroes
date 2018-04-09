/******************************************************************************
app.module.ts
---------------------------------------
Author: Dylan Wang
CSE 235 - Spring 2018
---------------------------------------
Angular file that declares and loads dependencies and modules.
******************************************************************************/

import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import {MatGridListModule} from '@angular/material/grid-list';
import {MatDialogModule} from '@angular/material/dialog';
import {MatSelectModule} from '@angular/material/select';
import {MatCheckboxModule} from '@angular/material/checkbox';

import { AppComponent, DetailPopup } from './app.component';

import { HttpClientModule } from '@angular/common/http';
import { StatsService } from './stats.service';


@NgModule({
  declarations: [
    AppComponent,
    DetailPopup
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    MatGridListModule,
    MatDialogModule,
    MatSelectModule,
    MatCheckboxModule,
    HttpClientModule
  ],
  entryComponents: [
    DetailPopup
  ],
  providers: [StatsService],
  bootstrap: [AppComponent]
})
export class AppModule { }
