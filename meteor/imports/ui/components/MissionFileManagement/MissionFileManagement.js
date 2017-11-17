import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Button, Row, Col, Panel, ListGroup, ListGroupItem } from 'react-bootstrap';
import FileTransferUi from '../FileTransferUi/FileTransferUi';

import WebSocketTelemetry from '../../../modules/flight-telemetry';

class MissionFileManagement extends Component {
  constructor(props) {
    super(props);
    this.state = {
      noData: true,
      connStatus: false,
      logList: [],
    };
    this.renderLogList = this.renderLogList.bind(this);
    this.requestLogList = this.requestLogList.bind(this);
    this.requestLog = this.requestLog.bind(this);
  }

  componentDidMount() {
    const client = new WebSocketTelemetry();
    this.client = client;

    client.on('connStatus', (msg) => {
      this.setState({ connStatus: msg.status });
    });

    client.on('itemLogList', (msg) => {
      this.setState(prevState => ({
        logList: [...prevState.logList, msg],
      }));
    });

    client.on('logData', (msg) => {
      const logId = msg.id;
      const updatedLogArray = this.state.logList.slice();
      const totalSize = updatedLogArray[logId - 1].MbSize;
      const transferPercentage = ((msg.ofset / totalSize) * 100).toFixed(0);
      updatedLogArray[logId - 1].transferPercentage = transferPercentage;
      this.setState({ logList: updatedLogArray });
    });

    client.on('logConverted', (msg) => {
      console.log(msg);
      const logId = msg.id;
      const updatedLogArray = this.state.logList.slice();
      updatedLogArray[logId - 1].ready = true;
      updatedLogArray[logId - 1].loading = false;
      updatedLogArray[logId - 1].transferPercentage = 100;
      this.setState({ logList: updatedLogArray });
    });


    client.on('noData', (value) => {
      this.setState({ noData: value });
    });

    client.on('webServiceClosed', (value) => {
      this.setState({ connStatus: value, noData: true });
    });
  }

  componentWillUnmount() {
    this.client.closeWebService();
  }

  requestLogList() {
    this.setState({ logList: [] });
    this.client.requestLogList();
  }

  requestLog(logId) {
    const updatedLogArray = this.state.logList.slice();
    updatedLogArray[logId - 1].loading = true;
    updatedLogArray[logId - 1].transferPercentage = 0;
    this.setState({ logList: updatedLogArray });
    this.client.requestLog(logId);
  }

  renderLogList(logList) {
    return logList.map(logItem => (
      <ListGroupItem key={logItem.id} onClick={() => this.requestLog(logItem.id)}>
        {`Nº ${logItem.id} : ${logItem.MbSize} Mb`}
        {logItem.loading ? <span className="pull-right"><span className="fa fa-spinner fa-spin fa-lg fa-fw text-primary" aria-hidden="true" /> {logItem.transferPercentage}%</span> : ''}
        {logItem.ready ? <span className="fa fa-check-square-o fa-lg pull-right text-success" aria-hidden="true" /> : ''}
      </ListGroupItem>
    ));
  }


  render() {
    const LogListTitle = (
      <h3 onClick={this.requestLogList} style={{ cursor: 'pointer' }}>
        {this.state.logList.length === 0 ? 'Request Log List' : 'Log List'}
      </h3>
    );
    return (
      <div>
        <h5>Request Log Files</h5>
        <Row>
          <Col xs={12} sm={8} md={8} lg={8}>
            <Button
              bsStyle={this.state.connStatus ? 'primary' : 'default'}
              block
              onClick={() => this.client.connectToServer()}
            >
              {this.state.connStatus ? 'Connected' : 'No Conection'}
            </Button>
          </Col>
          <Col xs={12} sm={4} md={4} lg={4}>
            <Button
              bsStyle={this.state.noData ? 'warning' : 'info'}
              block
            >
              {this.state.noData ? 'No Data' : 'Data ON'}
            </Button>
          </Col>
        </Row>
        <br />
        <Row>
          <Col xs={12} sm={8} md={6} lg={4}>
            <Panel
              defaultExpanded
              header={LogListTitle}
              bsStyle={this.state.logList.length === 0 ? 'primary' : 'default'}
            >
              <ListGroup fill style={{ maxHeight: '25vh', overflow: 'auto' }}>
                {this.renderLogList(this.state.logList)}
              </ListGroup>
            </Panel>
          </Col>
        </Row>
        <FileTransferUi missionId={this.props.mission._id} />
      </div>
    );
  }
}


MissionFileManagement.propTypes = {
  mission: PropTypes.object.isRequired,
};


export default MissionFileManagement;
