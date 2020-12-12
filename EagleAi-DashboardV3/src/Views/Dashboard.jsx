import React, { Component } from "react";
import moment from "moment";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimesCircle } from "@fortawesome/free-solid-svg-icons";
import "./../Styles/Dashboard.css";
import Header from "./Header";
import HeartRate from "../Common/Charts/HeartRate";
import { Card, Button } from "react-bootstrap";
import socketIOClient from "socket.io-client";
import * as Constants from "../Common/Constatnts";

export default class Dashboard extends Component {
  red = "#ae0001";
  gnvData = [];
  nnvData = [];
  numData = [];
  anomData = [];
  socket = [];
  radius = 2;
  colors = ["#2f7ed8", "#0d233a", "#8bbc21"];
  agg_types = ["GROSS NV", "Net NV", "NUM ORDERS"];
  constructor() {
    super();
    this.models = [];
    this.hierarchy = [];
    this.state = {
      gnvData: [],
      nnvData: [],
      numData: [],
      anomData: [],
      models: [],
      hierarchy: this.hierarchy
    };
    this.callSockets = this.callSockets.bind(this);
  }

  componentDidMount() {
    Constants.axios
      .get(Constants.restAPIServerName + "/getEventStream")
      .then(res => {
        res.data.forEach((pred_factor, index) => {
          var key;
          var target_type = pred_factor.event_type
            .split("_")
            .join(" ")
            .toUpperCase();
          if (pred_factor.isanom) {
            key = "anomData";
          } else if (target_type === "GROSS NV") {
            key = "gnvData";
          } else if (target_type === "NET NV") {
            key = "nnvData";
          } else {
            key = "numData";
          }
          this[key].push({
            name: pred_factor.primary_value,
            title: pred_factor.primary_value,
            x: new Date(
              moment(new Date()).format("YYYY-MM-DD") + " " + pred_factor.ts
            ).getTime(),
            y: pred_factor.anomscore,
            root: pred_factor.root_value,
            type: pred_factor.primary_type,
            target_type: target_type
          });
        });
        this.setState(() => ({
          anomData: this.anomData,
          gnvData: this.gnvData,
          nnvData: this.nnvData,
          numData: this.numData
        }));
      });
    Constants.axios
      .get(Constants.restAPIServerName + "/getAlertCards")
      .then(res => {
        res.data.forEach(data => {
          data.alert.alertid = data.alertid;
          this.models.push(data.alert);
        });
        this.setState({ models: this.models });
      });
  }

  callSockets(chart) {
    this.cardSocket = socketIOClient(
      Constants.restAPISocketName + "EAGLEAI_ALERT_CARDS"
    );
    this.cardSocket.on("client_update", data => {
      data = JSON.parse(data);
      this.models.unshift(data);
      //this.setState({ models: this.models });
    });
    this.streamSocket = socketIOClient(
      Constants.restAPISocketName + "EAGLEAI_STREAM"
    );
    this.streamSocket.on("client_update", data => {
      data = JSON.parse(data);
      data.events.forEach((pred_factor, index) => {
        var key;
        var target_type = pred_factor.event_type
          .split("_")
          .join(" ")
          .toUpperCase();
        if (pred_factor.isanom) {
          key = "anomData";
        } else if (target_type === "GROSS NV") {
          key = "gnvData";
        } else if (target_type === "NET NV") {
          key = "nnvData";
        } else {
          key = "numData";
        }
        this[key].push({
          name: data.primary.value,
          title: data.primary.value,
          x: new Date(
            moment(new Date()).format("YYYY-MM-DD") + " " + pred_factor.ts
          ).getTime(),
          y: pred_factor.anomscore,
          root: data.root.value,
          type: data.primary.type,
          target_type: target_type
        });
      });
    });
    this.turnOffRedTimeout = setInterval(() => {
      this.setState(() => ({
        models: this.models,
        anomData: this.anomData,
        gnvData: this.gnvData,
        nnvData: this.nnvData,
        numData: this.numData
      }));
    }, 5000);
  }

  getDetails(model) {
    this.props.history.push({
      pathname: "/Details",
      state: { detail: model }
    });
  }

  closeAlert(model) {
    Constants.axios
      .get(Constants.restAPIServerName + "/setAlertInactive/" + model.alertid)
      .then(res => {
        var index = this.models.indexOf(model);
        this.models.splice(index, 1);
        this.setState({ models: this.models });
      });
  }

  componentWillUnmount() {
    clearInterval(this.turnOffRedTimeout);
    this.cardSocket.disconnect();
    this.streamSocket.disconnect();
    // this.socket.forEach(socket => socket.disconnect());
  }

  render() {
    return (
      <div className="bg-color">
        <Header />
        <div className="details-row">
          <div className="col-12">
            <h6 className="textheading mart11">Anomaly Detector</h6>
          </div>
          <div className="col-9 graph-border graph-bg">
            <HeartRate
              anomData={this.state.anomData}
              gnvData={this.state.gnvData}
              nnvData={this.state.nnvData}
              numData={this.state.numData}
              callSockets={this.callSockets}
              {...this.props}
            />
          </div>
          <div className="col-3 graph-border graph-bg marl1 fd-height scroll scroll-width-thin">
            {this.state.models.map((model, index) => {
              return (
                <Card key={index} className="col-12 mart15">
                  <Card.Title className="db-card-title row">
                    <span className="col-1 anomaly"></span>
                    <span className="col-9 ">
                      {model.title["1_preamble"]}
                      {model.title["2_entity_type"]}
                      {model.title["3_entity_value"]}
                    </span>
                    <span className="col-2 pull-right">
                      <FontAwesomeIcon
                        icon={faTimesCircle}
                        onClick={this.closeAlert.bind(this, model)}
                      />
                    </span>
                  </Card.Title>
                  <Card.Body className="db-card-body offset-1">
                    {model.subtitle["1_preamble"]}
                    {model.subtitle["2_event_type"]}
                  </Card.Body>
                  <Card.Footer className="db-card-footer footer-bg-color text-center">
                    <Button
                      variant="link"
                      onClick={this.getDetails.bind(this, model)}
                    >
                      More Details
                    </Button>
                  </Card.Footer>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    );
  }
}
