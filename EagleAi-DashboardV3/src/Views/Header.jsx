import React, { Component } from "react";
import "./../Styles/Header.css";
import { Dropdown } from "react-bootstrap";

export default class Header extends Component {
  logout = function() {
    //Utils.deauthenticateUser();
    //this.props.history.push("/");
  };
  render() {
    return (
      <header>
        <nav className="navbar navbar-expand-sm navbar-dark">
          <div className="navbar-collapse collapse" id="collapsingNavbar">
            <ul className="navbar-nav">
              <li className="nav-item active">
                <span className="logo">
                  <a href="./#/">
                    <img
                      alt="Logo"
                      className="img-fluid"
                      src={require("./../img/eagleeye.png")}
                    />
                  </a>
                </span>
              </li>
            </ul>
            <ul className="navbar-nav center">
              <div className="nav-item mr-md-4">
                <a href="./">
                  <h6 className="menuitem">Dashboard</h6>
                </a>
              </div>
              <div className="nav-item mr-md-4 seperator">
                <a href="#/Anomalies" target="_blank">
                  <h6>Anom Generator</h6>
                </a>
              </div>
            </ul>
            <ul className="navbar-nav right">
              <div className="nav-item ">
                <span className="header-icon mr-md-3">
                  <img
                    alt="Search"
                    className="img-fluid"
                    src={require("./../img/searchicon.png")}
                  />
                </span>
              </div>
              <div className="nav-item mr-md-4">
                <Dropdown>
                  <Dropdown.Toggle className="no-btn" id="dropdown-basic">
                    <span className="header-icon mr-md-1">
                      <img
                        alt="User"
                        className="img-fluid"
                        src={require("./../img/usericon.png")}
                      />
                    </span>
                  </Dropdown.Toggle>

                  <Dropdown.Menu>
                    <Dropdown.Item
                      variant="link"
                      onClick={this.logout.bind(this)}
                    >
                      Logout
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </div>
            </ul>
          </div>
        </nav>
      </header>
    );
  }
}
