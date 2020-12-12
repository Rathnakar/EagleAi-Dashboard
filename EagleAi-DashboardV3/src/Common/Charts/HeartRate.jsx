import React from "react";
import moment from "moment";
import HighchartsReact from "highcharts-react-official";
import Highcharts from "highcharts/highstock";
import HC_more from "highcharts/highcharts-more"; //module
import Boost from "highcharts/modules/boost"; //module
HC_more(Highcharts);
Boost(Highcharts); //init module

export default class HeartRate extends React.Component {
  constructor() {
    super();
    this.state = {
      chartOptions: {
        time: {
          useUTC: false
        },
        chart: {
          backgroundColor: "transparent",
          height: 55 + "%", // 16:9 ratio
          marginBottom: 30,
          zoomType: "x",
          resetZoomButton: {
            position: {
              align: "right",
              verticalAlign: "top",
              x: -10,
              y: 0
            }
          }
        },
        legend: {
          enabled: true,
          align: "right",
          verticalAlign: "top"
        },
        credits: {
          enabled: false
        },
        yAxis: {
          opposite: false,
          offset: 0,
          lineWidth: 1
        },
        rangeSelector: {
          enabled: true,
          allButtonsEnabled: true,
          buttons: [
            {
              count: 2,
              type: "minute",
              text: "2M"
            },
            {
              count: 5,
              type: "minute",
              text: "5M"
            },
            {
              count: 15,
              type: "minute",
              text: "15M"
            },
            {
              count: 30,
              type: "minute",
              text: "30M"
            },
            {
              count: 3,
              type: "hour",
              text: "3H"
            },
            {
              count: 1,
              type: "day",
              text: "1D"
            },
            {
              type: "all",
              text: "All"
            }
          ],
          selected: 0,
          inputEnabled: false
        },
        // rangeSelector: {
        //   selected: 5,
        //   inputEnabled: false,
        //   buttonTheme: {
        //     visibility: "hidden"
        //   },
        //   labelStyle: {
        //     visibility: "hidden"
        //   }
        // },
        scrollbar: {
          enabled: true
        },
        title: {
          text: ""
        },
        tooltip: {
          formatter: function() {
            if (this.point !== undefined) {
              return (
                "<div>" +
                this.point.type +
                ":" +
                this.point.name +
                "</div><br/> <div>Time: " +
                moment(this.x).format("MM/DD/YYYY HH:mm:ss") +
                "</div><br/>  <div>Anomaly Score: " +
                this.y +
                "</div>"
              );
            } else {
              return null;
            }
          },
          split: true
        },
        navigator: {
          enabled: true
        },
        plotOptions: {
          boostThreshold: 1,
          series: {
            showInLegend: true,
            showInNavigator: true,
            turboThreshold: 0,
            cursor: "pointer",
            events: {
              click: event => {
                this.props.history.push({
                  pathname: "/Details",
                  state: { detail: event.point }
                });
              }
            },
            dataLabels: {
              enabled: false,
              formatter: function() {
                if (this.color === "#ae0001") {
                  return this.key;
                }
              }
            }
          }
        },
        series: [
          {
            type: "scatter",
            name: "Anomaly",
            marker: {
              symbol: "circle",
              fillColor: "#ae0001",
              radius: 4.5
            }
          },
          {
            type: "scatter",
            name: "Gross NV",
            marker: {
              symbol: "circle",
              fillColor: "#2f7ed8",
              radius: 3
            }
          },
          {
            type: "scatter",
            name: "Net NV",
            marker: {
              symbol: "circle",
              fillColor: "#0d233a",
              radius: 3
            }
          },
          {
            type: "scatter",
            name: "Num Orders",
            marker: {
              symbol: "circle",
              fillColor: "#8bbc21",
              radius: 3
            }
          }
        ]
      }
    };
  }

  componentWillReceiveProps(props) {
    this.setState({
      chartOptions: {
        navigator: {
          adaptToUpdatedData: true,
          series: {
            data: props.data
          }
        },
        boost: {
          useGPUTranslations: false,
          usePreAllocated: false
        },
        scrollbar: {
          liveRedraw: true
        },
        series: [
          {
            data: props.anomData.sort(function(a, b) {
              return a.x - b.x;
            })
          },
          {
            data: props.gnvData.sort(function(a, b) {
              return a.x - b.x;
            })
          },
          {
            data: props.nnvData.sort(function(a, b) {
              return a.x - b.x;
            })
          },
          {
            data: props.numData.sort(function(a, b) {
              return a.x - b.x;
            })
          }
        ]
      }
    });
  }

  componentDidMount() {
    this.props.callSockets(this.chart);
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
