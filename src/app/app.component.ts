/******************************************************************************
app.components.ts
---------------------------------------
Author: Dylan Wang
CSE 235 - Spring 2018
---------------------------------------
Main source file that contains typescript logic for application. Composed of
two main components, AppComponent for the main page and DetailPopup for the
popup dialog page.
******************************************************************************/

import { Component, Inject, AfterViewInit } from '@angular/core';
import { StatsService } from './stats.service';
import { Chart } from 'chart.js';
import { trigger, state, style, transition,
    animate, group, query, stagger, keyframes
} from '@angular/animations';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material';

/**********************************************************
Component that handles logic for main page.
**********************************************************/
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  animations: [
    trigger('fade_selection', [
        transition(':enter', [
            style({opacity: 0}), animate('2s')
        ])
    ])
  ]
})
export class AppComponent {
    title = 'FE Heroes - Hero Stat Comparison';

    hero_stats = [];
    selection_visibility = 'true';
    audio = new Audio();

    constructor(private stats: StatsService, public dialog: MatDialog) {}

    /**********************************************************
    Uses the stat service to obtain data from a source JSON.
    Cleans and stores the data in an array. Also starts music.
    **********************************************************/
    ngOnInit() {
        this.stats.getStatsJSON().subscribe(data => {
            let id_count = 0;
            let useless_data = ['origin', 'rarities', 'releaseDate', 'poolDate',
            'assets', 'skills', 'growthPoints', 'stats'];

            for (let hero of data['heroes']) {
                hero['id'] = id_count++;
                hero['color'] = hero['weaponType'].split(" ", 1)[0];
                hero['weapon'] = hero['weaponType'].split(" ", 2)[1];
                hero['hp'] = hero['stats']['40']['5'].hp[1];
                hero['atk'] = hero['stats']['40']['5'].atk[1];
                hero['spd'] = hero['stats']['40']['5'].spd[1];
                hero['def'] = hero['stats']['40']['5'].def[1];
                hero['res'] = hero['stats']['40']['5'].res[1];
                hero['bst'] = hero['hp'] + hero['atk'] + hero['spd'] +
                hero['def'] + hero['res'];

                let image = new Image(25, 25);
                image.src = '../assets/Art/' + hero['name'] + '/Face_FC.png';
                hero['icon'] = image;

                image = new Image();
                image.src = '../assets/Art/' + hero['name'] + '/Face.png';
                hero['portrait'] = image;

                for(let s of useless_data)
                    delete hero[s];
                this.hero_stats.push(hero);
            }
        });

        this.audio.src = "./assets/MenuTheme.mp3";
        this.audio.load();
        this.audio.play();
        this.audio.volume = 0.1;
        this.audio.loop = true;
    }
    /**********************************************************
    Opens up dialog page with selected hero as focus.
    **********************************************************/
    openDialog(selected_hero): void {
        let dialogRef = this.dialog.open(DetailPopup, {
            panelClass: "unit-detail",
            width: '100%',
            height: '100%',
            data: {selected_hero: selected_hero, hero_stats: this.hero_stats}
        });
    }
    
    /**********************************************************
    Toggles the background music on/off.
    **********************************************************/
    shutup() {
        this.audio.muted = !this.audio.muted;
        document.getElementById('feh').src = this.audio.muted ? "../assets/feh2.png" : "../assets/feh.png";
    }
}

/**********************************************************
Component that handles logic for popup dialog page.
**********************************************************/
@Component({
    selector: 'detailpopup',
    templateUrl: 'detailpopup.html',
    styleUrls: ['./detailpopup.css']
})
export class DetailPopup implements AfterViewInit {

    selected_hero = [];
    hero_stats = [];
    filterStates = [];
    radarChart = [];
    scatterChart = [];
    xAxis = 0;
    yAxis = 1;
    chart1_visibility = 'true';
    stat_names = ['hp', 'atk', 'spd', 'def', 'res', 'bst'];
    
    /**********************************************************
    Constructor that saves passed in data from main page.
    **********************************************************/
    constructor(
        public dialogRef: MatDialogRef<DetailPopup>,
        @Inject(MAT_DIALOG_DATA) public data: any) {
            this.selected_hero = data.selected_hero;
            this.hero_stats = data.hero_stats;
            for(let i = 0; i < 16; i++)
                this.filterStates.push(true);
        }
    
    /**********************************************************
    Filters data set based on selected filters, as well as
    calculates average of the new set. Returns both.
    **********************************************************/
    calcAverageHero () {
        let average_hero = [], filtered_heroes = [];
        let count = 0;
        
        for(let s of this.stat_names)
            average_hero[s] = 0;
        filtered_heroes = [];
        
        for (let hero of this.hero_stats) {
            if(this.checkHeroFilter(hero)) {
                filtered_heroes.push(hero);
                for(let s of this.stat_names)
                    average_hero[s] += hero[s];
                count++;
            }
        }
        for(let s of this.stat_names)
            average_hero[s] = (count == 0) ? 0 : Math.round(average_hero[s] / count);
        filtered_heroes.push(this.selected_hero);
        
        return [filtered_heroes, average_hero];
    }
    
    /**********************************************************
    Calculates data set for scatter-plot chart based on passed
    in hero list. Returns formatted and chart-ready data.
    **********************************************************/
    calcChart(filtered_heroes) {
        let xMin = -1, xMax = 1, yMin = -1, yMax = 1;
    
        let chart_data = [];
        let hero_icons = [];
        for (let hero of filtered_heroes) {
            let data_point = [];
            data_point['name'] = hero['name'];
            data_point['x'] = hero[this.stat_names[this.xAxis]] - this.selected_hero[this.stat_names[this.xAxis]];
            data_point['y'] = hero[this.stat_names[this.yAxis]] - this.selected_hero[this.stat_names[this.yAxis]];
            
            xMax = Math.max(data_point['x'], xMax);
            xMin = Math.min(data_point['x'], xMin);
            yMax = Math.max(data_point['y'], yMax);
            yMin = Math.min(data_point['y'], yMin);
            
            chart_data.push(data_point);
            hero_icons.push(hero['icon']);
        }
        let xScale = Math.max(Math.abs(xMin), Math.abs(xMax));
        let yScale = Math.max(Math.abs(yMin), Math.abs(yMax));
        
        return [chart_data, hero_icons, xScale, yScale];
    }
    
    /**********************************************************
    Returns a radar chart ready version of passed in hero.
    **********************************************************/
    heroToRadar(hero) {
        let radar_hero = [];
        radar_hero.push(hero['hp']);
        radar_hero.push(hero['atk']);
        radar_hero.push(hero['spd']);
        radar_hero.push(hero['def']);
        radar_hero.push(hero['res']);
        return radar_hero;
    }
    
    /**********************************************************
    Toggles passed in filter.
    **********************************************************/
    toggle(i) {
        this.filterStates[i] = !this.filterStates[i];
        this.updateAllCharts();
    }
    
    /**********************************************************
    Recalculate and redraw both the scatter chart and radar chart.
    **********************************************************/
    updateAllCharts() {
        let filterData = this.calcAverageHero();
        let scatterData = this.calcChart(filterData[0]);
        
        this.updateRadarChart(filterData[1]);
        this.updateScatterChart(scatterData);
    }
    
    /**********************************************************
    Updates the radar chart with new passed in average.
    **********************************************************/
    updateRadarChart(average_hero) {
        this.radarChart.data.datasets[1].data = this.heroToRadar(average_hero);
        this.radarChart.update();
    }
    
    /**********************************************************
    Updates the scatter chart with passed in data.
    **********************************************************/
    updateScatterChart(scatterData) {
        this.scatterChart.data.datasets[0].data = scatterData[0];
        this.scatterChart.data.datasets[0].pointStyle = scatterData[1];
        this.scatterChart.data.xAxis = this.stat_names[this.xAxis].toUpperCase();
        this.scatterChart.data.yAxis = this.stat_names[this.yAxis].toUpperCase();
        this.scatterChart.options.scales.yAxes[0].ticks.min = -scatterData[3];
        this.scatterChart.options.scales.yAxes[0].ticks.max = scatterData[3];
        this.scatterChart.options.scales.xAxes[0].ticks.min = -scatterData[2];
        this.scatterChart.options.scales.xAxes[0].ticks.max = scatterData[2];
        this.scatterChart.options.title.text =
            'Hero vs. Other Heroes (X:' + this.stat_names[this.xAxis].toUpperCase()
             + ',Y:' + this.stat_names[this.yAxis].toUpperCase() + ')'
        this.scatterChart.update();
    }
    
    /**********************************************************
    Checks if the the passed in hero meets filter criteria.
    **********************************************************/
    checkHeroFilter(hero) {
        let colorCheck = false;
        let weaponCheck = false;
        let moveCheck = false;
        
        if((this.filterStates[0] && hero['color'] == 'Red') ||
           (this.filterStates[1] && hero['color'] == 'Green') ||
           (this.filterStates[2] && hero['color'] == 'Blue') ||
           (this.filterStates[3] && hero['color'] == 'Colorless')) colorCheck = true;
           
        if((this.filterStates[4] && hero['weapon'] == 'Sword') ||
           (this.filterStates[5] && hero['weapon'] == 'Axe') ||
           (this.filterStates[6] && hero['weapon'] == 'Lance') ||
           (this.filterStates[7] && hero['weapon'] == 'Tome') ||
           (this.filterStates[8] && hero['weapon'] == 'Breath') ||
           (this.filterStates[9] && hero['weapon'] == 'Bow') ||
           (this.filterStates[10] && hero['weapon'] == 'Dagger') ||
           (this.filterStates[11] && hero['weapon'] == 'Staff')) weaponCheck = true;
           
        if((this.filterStates[12] && hero['moveType'] == 'Infantry') ||
           (this.filterStates[13] && hero['moveType'] == 'Cavalry') ||
           (this.filterStates[14] && hero['moveType'] == 'Flying') ||
           (this.filterStates[15] && hero['moveType'] == 'Armored')) moveCheck = true;
        
        return colorCheck && weaponCheck && moveCheck;
    }
    
    /**********************************************************
    Changes the graphed data on the passed in scatter chart axis.
    **********************************************************/
    changeAxis(axis, i) {
        if(axis == 0) this.xAxis = parseInt(i);
        else if(axis == 1) this.yAxis = parseInt(i);
        
        this.updateAllCharts();
    }
    
    /**********************************************************
    Sets flag to switch which chart is displayed.
    **********************************************************/
    changeChart(i) {
        if(i == 0) this.chart1_visibility = 'true';
        else if(i == 1) this.chart1_visibility = 'false';
    }
    
    /**********************************************************
    Closes the popup dialog and returns to main page.
    **********************************************************/
    closePopup(): void {
        this.dialogRef.close();
    }

    /**********************************************************
    Initializes both the scatter-plot chart and radar chart when
    opening the popup dialog.
    **********************************************************/
    ngAfterViewInit() {
        Chart.defaults.global.defaultFontSize = 15;
        Chart.defaults.global.defaultFontColor = "white";
        
        let filterData = this.calcAverageHero();
        let scatterData = this.calcChart(filterData[0]);
        
        /**Options for scatter-plot chart*/
        this.scatterChart = new Chart(document.getElementById("myChart2"), {
            type: 'scatter',
            data: {
                xAxis: this.stat_names[this.xAxis].toUpperCase(),
                yAxis: this.stat_names[this.yAxis].toUpperCase(),
                datasets: [{
                    label: 'Scatter Dataset',
                    data: scatterData[0],
                    pointStyle: scatterData[1]
                }]
            },
            options: {
                scales: {
                    yAxes: [{
                        display: true,
                        ticks: {
                            min: -scatterData[3],
                            max: scatterData[3],
                            stepSize: 1
                        },
                        gridLines: {
                            color: "#757575",
                            zeroLineColor: 'white'
                        }
                    }],
                    xAxes: [{
                        display: true,
                        type: 'linear',
                        ticks: {
                            min: -scatterData[2],
                            max: scatterData[2],
                            stepSize: 1
                        },
                        gridLines: {
                            color: "#757575",
                            zeroLineColor: 'white'
                        }
                    }]
                },
                tooltips: {
                   callbacks: {
                      label: function(tooltipItem, data) {
                         var label = data['datasets'][0]['data'][tooltipItem.index]['name'];
                         return label + (tooltipItem.xLabel >= 0 ? ': +' : ': ') + tooltipItem.xLabel + ' ' + data.xAxis + ', '
                                + (tooltipItem.yLabel >= 0 ? '+' : '') + tooltipItem.yLabel + ' ' + data.yAxis;
                      }
                   }
                },
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: 'Hero vs. Other Heroes (X:' + this.stat_names[this.xAxis].toUpperCase() +
                           ',Y:' + this.stat_names[this.yAxis].toUpperCase() + ')',
                    fontSize: 40
                },
                responsive: true,
                maintainAspectRatio: false
            }
        });
        
        /**Options for radar chart*/
        this.radarChart = new Chart(document.getElementById("myChart1"), {
            type: 'radar',
            data: {
                labels: ['HP', 'Atk', 'Spd', 'Def', 'Res'],
                datasets: [{
                        label: this.selected_hero['name'],
                        backgroundColor: "rgba(255,99,132,0.2)",
                        borderColor: "rgba(255,99,132,1)",
                        pointBackgroundColor: "rgba(255,99,132,1)",
                        pointBorderColor: "#fff",
                        data: this.heroToRadar(this.selected_hero)
                    },
                    {
                        label: 'Average',
                        backgroundColor: "rgba(179,181,198,0.2)",
                        borderColor: "rgba(179,181,198,1)",
                        pointBorderColor: "#fff",
                        pointBackgroundColor: "rgba(179,181,198,1)",
                        data: this.heroToRadar(filterData[1])
                    }]
            },
            options: {
                scale: {
                    ticks: {
                        showLabelBackdrop: false,
                        beginAtZero: true,
                        min: 0,
                        max: 60,
                        stepSize: 10
                    },
                    pointLabels: {
                        fontSize: 20
                    },
                    gridLines: {
                        color: "#D3D3D3"
                    },
                    angleLines: {
                        color: "#757575"
                    }
                },
                title: {
                    display: true,
                    text: 'Hero vs. Averages',
                    fontSize: 40
                },
                layout: {
                    padding: {
                        left: 0,
                        right: 0,
                        top: 0,
                        bottom: 120
                    }
                },
                responsive: true
            }
        });
    }
}
