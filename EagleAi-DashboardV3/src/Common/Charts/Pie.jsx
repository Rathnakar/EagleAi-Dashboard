import React, { Component } from "react";
import HighchartsReact from "highcharts-react-official";
import Highcharts from "highcharts/highstock";
import HC_more from "highcharts/highcharts-more"; //module
HC_more(Highcharts); //init module

export default class Pie extends Component {
  constructor() {
    super();
    this.state = {
      chartOptions: {
        chart: {
          backgroundColor: "transparent",
          marginTop: 1,
          zoomType: "xy"
        },
        title: {
          text: " ",
          align: "center",
          verticalAlign: "top"
        },
        credits: {
          enabled: false
        },
        legend: {
          align: "right",
          verticalAlign: "top",
          layout: "vertical",
          x: 0,
          y: 50,
          labelFormatter: function() {
            return this.name;
          }
        },
        plotOptions: {
          pie: {
            dataLabels: {
              enabled: true,
              distance: "5%",
              formatter: function() {
                return '<b style="font-size:0.8vw">' + this.point.name + "</b>";
              }
            },
            showInLegend: false
          }
        },
        series: []
      }
    };
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      chartOptions: {
        chart: {
          height: nextProps.height
        },
        title: {
          text: nextProps.title
        },
        series: [
          {
            type: "pie",
            name: nextProps.title,
            data: nextProps.data
          }
        ]
      }
    });
  }

  render() {
    return (
      <HighchartsReact
        highcharts={Highcharts}
        options={this.state.chartOptions}
        callback={chart => {
          this.chart = chart;
        }}
      />
    );
  }
}
