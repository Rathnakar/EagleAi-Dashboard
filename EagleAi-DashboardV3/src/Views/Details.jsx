import React, { Component } from "react";
import "./../Styles/Details.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimesCircle } from "@fortawesome/free-solid-svg-icons";
import moment from "moment";
import Header from "./Header";
import * as Constants from "../Common/Constatnts";
import StackedSpline from "../Common/Charts/StackedSpline";
import Pie from "../Common/Charts/Pie";

export default class Details extends Component {
  constructor(props) {
    super(props);
    this.issueType = "NULL";
    if (this.props.location.state) {
      this.state = this.props.location.state;
      if (this.state.detail.alertid === undefined) {
        this.details = {
          primary: {
            type: this.state.detail.type,
            value: this.state.detail.name
          },
          root: { value: this.state.detail.root },
          events: [{ event_type: "GROSS NV" }]
        };
      } else {
        this.details = this.state.detail;
      }
      if (this.details.primary.type === "TRADERID") {
        this.details.primary.type = "TRADER";
      }
    } else {
      this.props.history.push("/");
    }
    this.data = [];
    this.trendData = [];
    this.alertTime = [];
    this.divFilter = ["gross_notionalvalue", "net_notionalvalue", "num_orders"];
    this.divNames = ["GROSS NV", "NET NV", "NUM ORDERS"];
    this.state = {
      cardResponse: [],
      divFilter: [],
      divNames: this.divNames,
      data: [],
      alertTime: [],
      names: [],
      pieData: [],
      pieGnvData: [],
      pieNnvData: [],
      pieNuoData: [],
      pieGnvData30: [],
      pieNnvData30: [],
      pieNuoData30: [],
      trendData: [],
      trendX: [],
      trednAlertTime: [],
      reRender: false
    };
    this.names = [];
    this.getParticipationDetails = this.getParticipationDetails.bind(this);
  }

  getTimes(data, keys) {
    if (!(data && keys)) return;
    var result = [];
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      for (var j = 0; j < data[key].length; j++) {
        var time = moment(
          moment(new Date()).format("YYYY-MM-DD") + " " + data[key][j]
        );
        if (result.indexOf(time) === -1) {
          result.push(time);
        }
      }
    }
    return result;
  }

  generateTsGraphData(result) {
    if (result !== undefined) {
      var xValues = this.getTimes(result, ["actual_ts", "pred_ts"]);
      var xCategories = xValues.sort((a, b) => a - b);
      var actualSeries = new Array(xCategories.length).fill(null);
      var estSeries = new Array(xCategories.length).fill(null);
      var rangeSeries = new Array(xCategories.length).fill(null);
      var lastIndex = xCategories.findIndex(
        x =>
          moment(x).format("HH:mm:ss") ===
          result["actual_ts"][result["actual_ts"].length - 1]
      );
      xValues.forEach((x, index) => {
        var xValue = moment(x).format("HH:mm:ss");
        if (result["actual_ts"].findIndex(x => x === xValue) !== -1) {
          actualSeries[index] = {
            y:
              result["actual"][result["actual_ts"].findIndex(x => x === xValue)]
          };
        } else {
          if (index < lastIndex) {
            if (
              actualSeries[index] == null &&
              actualSeries[index - 1] != null
            ) {
              actualSeries[index] = actualSeries[index - 1];
            } else {
              actualSeries[index] = 0;
            }
          } else actualSeries[index] = null;
        }
        if (result["pred_ts"].findIndex(x => x === xValue) !== -1) {
          estSeries[index] = {
            y: result["pred"][result["pred_ts"].findIndex(x => x === xValue)]
          };
          rangeSeries[index] = {
            low:
              result["conf_lower_95"][
                result["pred_ts"].findIndex(x => x === xValue)
              ],
            high:
              result["conf_upper_95"][
                result["pred_ts"].findIndex(x => x === xValue)
              ]
          };
        } else {
          estSeries[index] = null;
          if (estSeries[index] == null && estSeries[index - 1] != null) {
            estSeries[index] = estSeries[index - 1];
          } else {
            estSeries[index] = 0;
          }
          rangeSeries[index] = null;
          if (rangeSeries[index] == null && rangeSeries[index - 1] != null) {
            rangeSeries[index] = rangeSeries[index - 1];
          } else {
            rangeSeries[index] = 0;
          }
        }
      });
      this.data.push({
        actualSeries: actualSeries,
        estSeries: estSeries,
        rangeSeries: rangeSeries
      });
      this.alertTime.push(result.alert_time);
      this.setState({
        data: this.data,
        xCategories: xCategories,
        alertTime: this.alertTime
      });
    }
  }

  generateParticipationData(response) {
    this.names = [...new Set(response.map(a => a["participant_type"]))];
    this.names.forEach((name, index) => {
      this[name] = [];
    });
    response.forEach((value, index) => {
      if (this[value["participant_type"]] !== undefined) {
        var key = value["participant_type"];
        if (value["participant_filter"].includes("OTHERS")) {
          value["participant_filter"] = "Others";
        }
        if (value["is_anom"] === true) {
          this[key].push({
            name: value["participant_filter"],
            y: value["participation_percent"],
            amount: value["participation_amount"],
            color: "#ae0001"
          });
        } else {
          this[key].push({
            name: value["participant_filter"],
            y: value["participation_percent"],
            amount: value["participation_amount"]
          });
        }
      }
    });
    var pieData = [];
    this.names.forEach(name => {
      pieData.push(this[name]);
    });
    this.setState({ names: this.names, pieData: pieData, reRender: true });
    this.forceUpdate();
  }

  generateTrend(response, key) {
    key = key.toLowerCase();
    var pieGnvData = [];
    var pieNnvData = [];
    var pieNuoData = [];
    var pieGnvData30 = [];
    var pieNnvData30 = [];
    var pieNuoData30 = [];
    response.forEach((f, fIndex) => {
      var name = f.issuetype;
      pieGnvData.push({
        name: name,
        y: f.pct_total_gnv,
        amount: f.gross_notionalvalue,
        issuetype: f.issuetype,
        sector: f.sector,
        total: f.total_gnv
      });
      pieGnvData30.push({
        name: name,
        y: f.pct_total_gnv_30d_sma,
        amount: f.gnv_30d_sma,
        issuetype: f.issuetype,
        sector: f.sector,
        total: f.total_gnv_30d_sma
      });

      pieNnvData.push({
        name: name,
        y: f.pct_total_nnv,
        amount: f.net_notionalvalue,
        issuetype: f.issuetype,
        sector: f.sector,
        total: f.total_nnv
      });
      pieNnvData30.push({
        name: name,
        y: f.pct_total_nnv_30d_sma,
        amount: f.nnv_30d_sma,
        issuetype: f.issuetype,
        sector: f.sector,
        total: f.total_nnv_30d_sma
      });
      pieNuoData.push({
        name: name,
        y: f.pct_total_noo,
        amount: f.num_orders,
        issuetype: f.issuetype,
        sector: f.sector,
        total: f.total_noo
      });
      pieNuoData30.push({
        name: name,
        y: f.pct_total_noo_30d_sma,
        amount: f.noo_30d_sma,
        issuetype: f.issuetype,
        sector: f.sector,
        total: f.total_noo_30d_sma
      });
    });
    this.setState({
      pieGnvData: pieGnvData,
      pieNnvData: pieNnvData,
      pieNuoData: pieNuoData,
      pieGnvData30: pieGnvData30,
      pieNnvData30: pieNnvData30,
      pieNuoData30: pieNuoData30
    });
  }

  getParticipationDetails(details, start, end) {
    Constants.axios
      .get(
        Constants.restAPIServerName +
          "/getParticipation/" +
          details.root.value +
          "/" +
          details.primary.type.toUpperCase() +
          "/" +
          details.primary.value +
          "/" +
          details.events[0].event_type
            .split("_")
            .join(" ")
            .toUpperCase() +
          "/" +
          this.issueType +
          "/" +
          start +
          "/" +
          end
      )
      .then(res => {
        if (res !== undefined) {
          var response = res.data;
          this.generateParticipationData(response);
        }
      });
  }
  getAggPieData() {
    Constants.axios
      .get(
        Constants.restAPIServerName +
          "/getAggtotalsPiedata/" +
          this.details.primary.type.toUpperCase() +
          "/" +
          this.details.primary.value +
          "/NULL/" +
          this.details.root.value
      )
      .then(res => {
        if (res !== undefined) {
          var response = res.data;
          this.generateTrend(response, this.details.primary.type);
        }
      });
  }
  getTrendAnalysisTimeSeries() {
    Constants.axios
      .get(
        Constants.restAPIServerName +
          "/getAggTotalsEod/" +
          this.details.primary.type.toUpperCase() +
          "/" +
          this.details.primary.value +
          "/" +
          this.issueType +
          "/" +
          "NULL" +
          "/" +
          this.details.root.value
      )
      .then(response => {
        this.trednAlertTime = [];
        var timeSeries = response.data;
        var xSeries = [];
        var actualSeries = [];
        var netSeries = [];
        var numSeries = [];
        timeSeries.forEach((actual, index) => {
          xSeries[index] = actual["tradedate"]; //(new Date(tsTime)).getTime() / 1000;
          actualSeries[index] = parseInt(
            timeSeries[index][this.divFilter[0].toLowerCase()]
          );
          netSeries[index] = parseInt(
            timeSeries[index][this.divFilter[1].toLowerCase()]
          );
          numSeries[index] = parseInt(
            timeSeries[index][this.divFilter[2].toLowerCase()]
          );
        });
        if (
          xSeries.length > 0 &&
          actualSeries.length > 0 &&
          netSeries.length > 0 &&
          numSeries.length > 0
        ) {
          this.trendData.push({
            actualSeries: actualSeries,
            estSeries: [],
            rangeSeries: []
          });
          this.trendData.push({
            actualSeries: netSeries,
            estSeries: [],
            rangeSeries: []
          });
          this.trendData.push({
            actualSeries: numSeries,
            estSeries: [],
            rangeSeries: []
          });
          this.trednAlertTime.push(
            timeSeries[timeSeries.length - 1]["tradedate"]
          );
          this.trednAlertTime.push(
            timeSeries[timeSeries.length - 1]["tradedate"]
          );
          this.trednAlertTime.push(
            timeSeries[timeSeries.length - 1]["tradedate"]
          );
          this.setState({
            divFilter: this.divFilter,
            trendData: this.trendData,
            trendX: xSeries,
            trednAlertTime: this.trednAlertTime
          });
          this.forceUpdate();
        }
      });
  }
  closeEvent(event) {
    Constants.axios
      .get(Constants.restAPIServerName + "/setAlertInactive/" + event.eventid)
      .then(res => {
        var cardResponse = this.state.cardResponse;
        var index = cardResponse.indexOf(event);
        cardResponse.splice(index, 1);
        this.details.events.splice(index, 1);
        this.setState({ cardResponse: cardResponse });
      });
  }

  componentWillMount() {
    if (this.details && this.details.alertid) {
      if (this.details.events[0].secondary.length > 0) {
        var issue = this.details.events[0].secondary.filter(
          e => e.type === "ISSUETYPE"
        );
        if (issue.length > 0) this.issueType = issue[0].value;
      }
      Constants.axios
        .get(
          Constants.restAPIServerName +
            "/getCardEventDetails/" +
            this.details.alertid
        )
        .then(res => {
          if (res !== undefined) {
            this.setState({ cardResponse: res.data });
            res.data.forEach(data => {
              this.generateTsGraphData(data);
            });
          }
        });
      //this.getParticipationDetails(this.details, "NULL", "NULL");
      this.getTrendAnalysisTimeSeries();
      this.getAggPieData();
    } else if (this.details) {
      Constants.axios
        .get(
          Constants.restAPIServerName +
            "/getTs/" +
            this.details.primary.type +
            "/'" +
            this.details.primary.value +
            "'/NULL/NULL/NULL/" +
            this.details.root.value
        )
        .then(res => {
          if (res !== undefined) {
            this.setState({ cardResponse: res.data });
            res.data.forEach(data => {
              this.generateTsGraphData(data);
              this.getTrendAnalysisTimeSeries();
              this.getAggPieData();
            });
          }
        });
    }
  }
  render() {
    return (
      <div className="bg-color">
        <Header />
        <div className="details-row mart11">
          <div className="col-9 graph-border graph-bg">
            {this.state.cardResponse.map((event, index) => {
              if (
                this.details.alertid !== undefined &&
                this.state.data[index] !== undefined &&
                this.details.events !== undefined
              ) {
                var eventCard = this.details.events[index];
                return (
                  <div key={index} className="martb20 sgrph-border">
                    <div className="titles">
                      <div className="tmseries-heading">
                        <span>{eventCard.title["1_preamble"]}</span>
                        <span className="evnttpe">
                          {eventCard.title["2_event_type"]}
                        </span>
                        <span>{eventCard.title["3_verb"]}</span>
                        <span className="evnttpe">
                          {eventCard.title["4_entity_type"]}
                        </span>
                        <span className="evnttpe">
                          {eventCard.title["5_entity_value"]}
                        </span>
                        <FontAwesomeIcon
                          className="pull-right"
                          icon={faTimesCircle}
                          onClick={this.closeEvent.bind(this, event)}
                        />
                      </div>
                      <div className="tmseries-subheading">
                        <span>{eventCard.subtitle["1_preamble"]}</span>
                        <span className="evnttpe">
                          {eventCard.subtitle["2_cmp_data"]}
                        </span>
                        <span>{eventCard.subtitle["3_postamble"]}</span>
                      </div>
                    </div>
                    <StackedSpline
                      showAxis={false}
                      data={this.state.data[index]}
                      xCategories={this.state.xCategories}
                      index={index}
                      length={this.state.cardResponse.length}
                      title={""}
                      subtitle={""}
                      alertTime={this.state.alertTime[index]}
                      type="main"
                      participation={this.getParticipationDetails}
                      details={this.details}
                      reRender={this.state.reRender}
                    />
                  </div>
                );
              } else {
                return (
                  <div key={index} className="martb20 sgrph-border">
                    <div className="titles">
                      <div className="tmseries-heading">
                        <span>{this.divNames[index]} for </span>
                        <span className="evnttpe">
                          {this.details.primary.type}:
                        </span>
                        <span className="evnttpe">
                          {this.details.primary.value}
                        </span>
                      </div>
                    </div>
                    <StackedSpline
                      showAxis={false}
                      data={this.state.data[index]}
                      xCategories={this.state.xCategories}
                      index={index}
                      length={this.state.cardResponse.length}
                      title={""}
                      subtitle={""}
                      alertTime={this.state.alertTime[index]}
                      type="main"
                      participation={this.getParticipationDetails}
                      details={this.details}
                      reRender={this.state.reRender}
                    />
                  </div>
                );
              }
            })}
          </div>
          <div className="col-3 marl1 graph-border graph-bg">
            <h6 className="sec-heading text-center mart10">
              Participation Details
            </h6>
            {this.state.pieData.map((data, index) => {
              return (
                <div key={index}>
                  <div className="col-12 pie-title">
                    {this.state.names[index]}
                  </div>
                  <Pie data={data} height={150} title={""} key={index} />
                </div>
              );
            })}
          </div>
          {/*<div className="col-md-12 graph-border mart15">
            <h5>Details On the Anomaly</h5>
            <hr />
            <p>
              Details here can be expected range of Gross NV trading at this
              time vs actual
            </p>
          </div>*/}
          <div className="col-12 mart10 graph-border graph-bg">
            <div className="h6 trend-heading">Trend Analysis</div>
            <div className="row">
              {this.state.divFilter.map((div, index) => {
                if (this.state.trendData[index] !== undefined) {
                  return (
                    <div key={index} className="col-4 marlr5 sgrph-border">
                      <div className="pie-title mart5">
                        <div>
                          <span>{this.divNames[index]}</span>
                        </div>
                      </div>
                      <StackedSpline
                        showAxis={false}
                        height={100}
                        data={this.state.trendData[index]}
                        xCategories={this.state.trendX}
                        index={index}
                        length={this.state.divFilter.length}
                        title={""}
                        subtitle={""}
                        alertTime={this.state.trednAlertTime[index]}
                        type={"trend"}
                        reRender={this.state.reRender}
                      />
                    </div>
                  );
                } else {
                  return <div key={index}></div>;
                }
              })}
            </div>
          </div>
          <div className="col-12  graph-border mart10 graph-bg">
            <div className="h6 trend-heading">Group By Issue type</div>
            <div className="row">
              <span className="col-2 marl7 sgrph-border">
                <div className="pie-title mart5">{"Gross NV"}</div>
                <Pie data={this.state.pieGnvData} height={150} title={""} />
              </span>
              <span className="col-2 marl7 sgrph-border">
                <div className="pie-title mart5">{"Gross NV 30"}</div>
                <Pie data={this.state.pieGnvData30} height={150} title={" "} />
              </span>
              <span className="col-2 marl7 sgrph-border">
                <div className="pie-title mart5">{"Net NV"}</div>
                <Pie data={this.state.pieNnvData} height={150} title={""} />
              </span>
              <span className="col-2 marl7 sgrph-border">
                <div className="pie-title mart5">{"Net NV 30"}</div>
                <Pie data={this.state.pieNnvData30} height={150} title={""} />
              </span>
              <span className="col-2 marl7 sgrph-border">
                <div className="pie-title mart5">{"Num Orders "}</div>
                <Pie data={this.state.pieNuoData} height={150} title={""} />
              </span>

              <span className="col-2 marl7 sgrph-border">
                <div className="pie-title mart5">{"Num Orders 30"}</div>
                <Pie data={this.state.pieNuoData30} height={150} title={""} />
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
