/******************************************************************************
stats.service.ts
---------------------------------------
Author: Dylan Wang
CSE 235 - Spring 2018
---------------------------------------
Service class that returns required JSON data.
******************************************************************************/

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable()
export class StatsService {

  constructor(private http: HttpClient) { }

  getStatsJSON() {
    return this.http.get("./assets/stats.json")
  }
}
