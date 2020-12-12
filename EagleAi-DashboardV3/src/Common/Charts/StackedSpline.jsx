import React from "react";
import moment from "moment";
import "./../../Styles/Global.css";
import HighchartsReact from "highcharts-react-official";
import Highcharts from "highcharts/highstock";
import HC_more from "highcharts/highcharts-more"; //module
HC_more(Highcharts); //init module

export default class StackedSpline extends React.Component {
  data = [];
  constructor() {
    super();
    this.series = [];
    this.yAxis = [];
    this.colors = [
      "#2f7ed8",
      "#0d233a",
      "#8bbc21",
      "#910000",
      "#1aadce",
      "#492970",
      "#f28f43",
      "#77a1e5",
      "#c42525",
      "#a6c96a"
    ];
    this.state = {
      chartOptions: {
        chart: {
          backgroundColor: "transparent",
          zoomType: "xy",
          resetZoomButton: {
            position: {
              align: "right",
              verticalAlign: "top",
              x: 0,
              y: 0
            }
          }
        },
        credits: {
          enabled: false
        },
        rangeSelector: {
          selected: 5,
          inputEnabled: false,
          buttonTheme: {
            visibility: "hidden"
          },
          labelStyle: {
            visibility: "hidden"
          }
        },
        scrollbar: {
          enabled: false
        },
        title: {
          text: ""
        },
        tooltip: {
          split: true
        },
        navigator: {
          enabled: false,
          adaptToUpdatedData: false
        },
        xAxis: {},
        plotOptions: {
          series: {
            turboThreshold: 100000000,
            connectNulls: true
          }
        },
        series: this.series
      }
    };
  }

  setExtremesCallBack(start, end) {
    if (this.props.participation && this.props.details) {
      this.props.participation(
        this.props.details,
        moment(start).format("HH:mm:ss"),
        moment(end).format("HH:mm:ss")
      );
    }
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.data) {
      var height;
      if (nextProps.height) {
        height = nextProps.height;
      } else {
        height = 65 / nextProps.length;
        if (nextProps.length > 1) height = 65 / nextProps.length;
        else height = 50;
      }
      var i = nextProps.index;
      this.setState({
        chartOptions: {
          chart: {
            height: height + "%"
          },
          title: {
            text: nextProps.title
          },
          subtitle: {
            text: nextProps.subtitle
          },
          xAxis: {
            categories: nextProps.xCategories,
            margin: 100,
            labels: {
              formatter: function() {
                if (nextProps.type && nextProps.type === "trend")
                  return moment(this.value).format("MM/DD/YYYY");
                else return moment(this.value).format("HH:mm");
              }
            },
            events: {
              afterSetExtremes: e => {
                if (nextProps.type && nextProps.type === "main") {
                  var categories = this.chart.xAxis[0].categories;
                  this.setExtremesCallBack(
                    categories[Math.round(e.min)],
                    categories[Math.round(e.max)]
                  );
                }
              }
            }
          },
          yAxis: {
            title: {
              text: null
            },
            opposite: false,
            offset: 0,
            lineWidth: 2,
            minPadding: 0.05,
            maxPadding: 0.05
          },
          series: [
            {
              id: "actual",
              data: nextProps.data.actualSeries,
              name: "Actual Series",
              color: this.colors[i],
              marker: {
                enabled: false
              }
            },
            {
              id: "est",
              data: nextProps.data.estSeries,
              color: this.colors[i + 1],
              name: "Est. Series",
              marker: {
                enabled: false
              }
            },
            {
              id: "estRange",
              name: "Range",
              data: nextProps.data.rangeSeries,
              type: "arearange",
              lineWidth: 0,
              linkedTo: ":previous",
              color: this.colors[i + 2],
              fillOpacity: 0.3,
              marker: {
                enabled: false
              }
            }
          ]
        }
      });
      if (!nextProps.reRender) {
        var status = nextProps.xCategories.findIndex(element => {
          return moment(element).format("HH:mm:ss") === nextProps.alertTime;
        });
        var min, max;
        if (status > 10) {
          min = status - 10;
          max = status + 10;
        } else {
          min = 0;
          max = 10;
        }
        this.chart.xAxis[0].zoom(min, max);
        this.chart.showResetZoom();
      }
    }
  }
  render() {
    return (
      <HighchartsReact
        highcharts={Highcharts}
        constructorType={"stockChart"}
        options={this.state.chartOptions}
        callback={chart => {
          this.chart = chart;
        }}
      />
    );
  }
}
