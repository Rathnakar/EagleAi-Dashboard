import React, { Component } from "react";
import ReactDOM from "react-dom";
import { Route, HashRouter as Router } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

import Dashboard from "./Views/Dashboard";
import Details from "./Views/Details";
import Anomalies from "./Views/Anomalies";

export default class Index extends Component {
  render() {
    return (
      <Router>
        <Route exact path="/" component={Dashboard} />
        <Route path="/Details" component={Details} />
        <Route path="/Anomalies" component={Anomalies} />
      </Router>
    );
  }
}

ReactDOM.render(<Index />, document.getElementById("root"));
