import React, { Component } from "react";
import "./../Styles/Dashboard.css";
import Header from "./Header";
import { Button } from "react-bootstrap";
import * as Constants from "../Common/Constatnts";

export default class Anomalies extends Component {
  constructor() {
    super();

    this.state = {
      anomalies: [
        { name: "Agg Gross NV Anomaly", id: 9 },
        { name: "Agg Net NV Anomaly", id: 10 },
        { name: "Agg Number of orders Anomaly", id: 11 },
        { name: "Gross Order Qty", id: 13 },
        { name: "Participation rate anomaly", id: 12 },
        { name: "Notional Value Anomaly", id: 1 },
        { name: "PriceAway Anomaly", id: 2 },
        { name: "ShortSell Anomaly", id: 3 },
        { name: "Order Capacity Anomaly", id: 4 },
        { name: "Issue Type Anomaly", id: 5 },
        { name: "Exchange Anomaly", id: 6 },
        { name: "Exec Broker Anomaly", id: 7 },
        { name: "Duplicate Order Anomaly", id: 8 }
      ]
    };
  }

  generateAnom(id) {
    Constants.axios
      .get(Constants.restAPIServerName + "/generateAnomaly/" + id)
      .then(res => {
        console.log(res.data);
      });
  }

  render() {
    return (
      <div className="col-md-12">
        <Header />
        <div className="details-row">
          <div className="col-md-12">
            <h4>Anomaly Generator</h4>
          </div>
          <div className="col-md-12 row graph-border fd-height">
            {this.state.anomalies.map((anom, index) => {
              return (
                <div className="col-2" key={index}>
                  <Button
                    className="anomalie-box-size"
                    variant="primary"
                    onClick={this.generateAnom.bind(this, anom.id)}
                  >
                    {anom.name}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }
}
