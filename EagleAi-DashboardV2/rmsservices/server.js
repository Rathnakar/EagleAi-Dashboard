const express = require('express');
var async = require("async");
var cors = require('cors')
const port = 8222;
const serverName =  'ec2-54-191-51-162.us-west-2.compute.amazonaws.com';
//const serverName =  '159.203.112.185';
const app = express();
const log4js = require('log4js');
log4js.configure({
  appenders: { commonApi: { type: 'file', filename: 'commonApi.log' } },
  categories: { default: { appenders: ['commonApi'], level: 'debug' } }
});

const logger = log4js.getLogger('commonApi');

const { Pool, Client } = require('pg')

//Database connection properties
const pool = new Pool({
  user: 'eagle',
  host: '159.65.41.104',
  database: 'tenjin',
  password: 'tenjin2019',
  port: 5432,
})

//To make app run on any cross origin
app.use(cors())
//////////////////////////////////////
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
//////////////////////////////////////

//To Make app listen at particular port
app.listen(port, serverName,function () {
  console.log("Server is running on "+ port +" port");
});

//To Get all divisions
app.get('/', function (req, res) {
	res.setHeader('Content-Type', 'application/json');
	let start = new Date();
	var sql = "select (riskanalytics.get_divisions())";
	logger.debug("QUERY: "+sql);
	pool.query(sql, (err, response) => {
		var json=formatJson(response);
		let end=new Date();
		logger.debug("Time taken for execution of divisions list is "+Math.abs((end.getTime() - start.getTime())/1000));
		res.send(json);
	});
})

//To Get all Desks
app.get('/desks', function (req, res) {
	res.setHeader('Content-Type', 'application/json');
	let start = new Date();
	var sql = "select row_to_json(riskanalytics.get_desks(NULL))";
	logger.debug("QUERY: "+sql);
	pool.query(sql, (err, response) => {
		var json=formatJson(response);
		let end=new Date();
		logger.debug("Time taken for execution of divisions list is "+Math.abs((end.getTime() - start.getTime())/1000));
		res.send(json);
	});
})

/* Get List of all issue types by filter.
 * Here filter is division values.
 */
app.get('/getIssues/:filter', function (req, res) {
	let start = new Date();
	res.setHeader('Content-Type', 'application/json');
	var filter=req.params.filter.charAt(0).toUpperCase()+req.params.filter.substr(1);
	if(filter!='NULL'){
		filter="'"+filter+"'";
	}
	var sql = "select row_to_json(riskanalytics.get_issuetypes("+filter+"))";
	logger.debug("QUERY: "+sql);
	pool.query(sql , (err, response) => {
		var json=formatJson(response);
		let end=new Date();
		logger.debug("Time taken for execution of get issues by "+filter+" "+Math.abs((end.getTime() - start.getTime())/1000))
		res.send(json);
	});
})

/* Get Time series based on type(DIVISION,DESK,CLIENT,SYMBOL etc.).
 * Here filter is division value/Client value individual.
 * Issue is either null or issue type of particular division
 * Last Read value is either null or last time of request that sent in format "yyyy-MM-dd hh:mm"
 */
app.get('/getTs/:type/:filter/:issue/:lastRead/:dateFilter', function (req, res) {
	let start = new Date();
	res.setHeader('Content-Type', 'application/json');
	var type=req.params.type.toUpperCase();
	if(type!='NULL'){
		type="'"+type+"'";
	}
	var filter=req.params.filter.charAt(0).toUpperCase()+req.params.filter.substr(1);
	var issue=req.params.issue.toUpperCase();
	if(issue!='NULL'){
		issue="'"+issue+"'";
	}
	var lastRead=req.params.lastRead.toUpperCase();
	if(lastRead!='NULL'){
		lastRead=lastRead.toUpperCase();
	}
	var dateFilter=req.params.dateFilter;
	if(dateFilter!='NULL'){
		dateFilter="'"+dateFilter+"'";
	}
	var sql = "select row_to_json(riskanalytics.get_tsdata("+type+","+ filter+","+issue+","+lastRead+","+dateFilter+"))";
	logger.debug("QUERY: "+sql);
	pool.query(sql, (err, response) => {
		var json=formatJson(response);
		var filtered=json.filter(function(item){
			return item.division==req.params.filter;
		});
		let end=new Date();
		logger.debug("Time taken for execution of Time Series of "+filter+" is "+Math.abs((end.getTime() - start.getTime())/1000));
		res.send(json);
	});
})

app.get('/getRMS/:filter/:issue/:lastRead/:dateFilter', function (req, res) {
	let start = new Date();
	res.setHeader('Content-Type', 'application/json');
	var filter=req.params.filter;
	if(filter!='NULL'){
		filter="'"+filter+"'";
	}
	var issue=req.params.issue.toUpperCase();
	if(issue!='NULL'){
		issue="'"+issue+"'";
	}
	var lastRead=req.params.lastRead.toUpperCase();
	if(lastRead!='NULL'){
		lastRead=lastRead.toUpperCase();
	}
	var dateFilter=req.params.dateFilter;
	if(dateFilter!='NULL'){
		dateFilter="'"+dateFilter+"'";
	}
	var tdate='NULL';
	var finRes=[];
	async.series({
	tsData: function(callback){
		  logger.debug("select row_to_json(riskanalytics.get_tsdata('DIVISION',"+filter+","+issue+","+lastRead+","+dateFilter+","+filter+"))");
	let s = new Date();
	pool.query("select row_to_json(riskanalytics.get_tsdata('DIVISION',"+filter+","+issue+","+lastRead+","+dateFilter+","+filter+"))", (err, response) => {
	var json=formatJson(response);
	/*var filtered=json.filter(function(item){
	return item.division==req.params.filter;
	});*/
	let e=new Date();
	logger.debug("Time taken for "+filter+" tsData execution "+Math.abs((e.getTime() - s.getTime())/1000))
	callback(null, json);
	});
	},
	ClientData: function(callback){
		  logger.debug("select row_to_json(riskanalytics.get_scatterdata('CLIENT',"+issue+","+lastRead+","+dateFilter+","+filter+"))");
	let s = new Date();
	pool.query("select row_to_json(riskanalytics.get_scatterdata('CLIENT',"+issue+","+lastRead+","+dateFilter+","+filter+"))", (err, response) => {
	var json=formatJson(response);
	//console.log(json);
	/*var filtered=json.filter(function(item){
	return item.division==req.params.filter;
	});*/
	let e=new Date();
	logger.debug("Time taken for "+filter+" ClientData execution "+Math.abs((e.getTime() - s.getTime())/1000))
	callback(null, json);
	});
	},
	SymbolData: function(callback){
		  logger.debug("select row_to_json(riskanalytics.get_scatterdata('SYMBOL',"+issue+","+lastRead+","+dateFilter+","+filter+"))");
	let s = new Date();
	pool.query("select row_to_json(riskanalytics.get_scatterdata('SYMBOL',"+issue+","+lastRead+","+dateFilter+","+filter+"))", (err, response) => {
	var json=formatJson(response);
	/*var filtered=json.filter(function(item){
	return item.division==req.params.filter;
	});*/
	let e=new Date();
	logger.debug("Time taken for "+filter+" SymbolData execution "+Math.abs((e.getTime() - s.getTime())/1000))
	callback(null, json);
	});
	},
	TRADER: function(callback){
		  logger.debug("select row_to_json(riskanalytics.get_heatmapdata('TRADER',"+ issue+","+lastRead+","+dateFilter+","+filter+"))");
	let s = new Date();
	pool.query("select row_to_json(riskanalytics.get_heatmapdata('TRADER',"+ issue+","+lastRead+","+dateFilter+","+filter+"))", (err, response) => {
	var json=formatJson(response);
	/*var filtered=json.filter(function(item){
	return item.division==req.params.filter;
	});*/
	let e=new Date();
	logger.debug("Time taken for "+filter+" TRADER execution "+Math.abs((e.getTime() - s.getTime())/1000))
	callback(null, json);
	});
	},
	OMPROCESS: function(callback){
		  logger.debug("select row_to_json(riskanalytics.get_heatmapdata('OMPROCESS',"+ issue+","+lastRead+","+dateFilter+","+filter+"))");
	let s = new Date();
	pool.query("select row_to_json(riskanalytics.get_heatmapdata('OMPROCESS',"+ issue+","+lastRead+","+dateFilter+","+filter+"))", (err, response) => {
	var json=formatJson(response);
	/*var filtered=json.filter(function(item){
	return item.division==req.params.filter;
	});*/
	let e=new Date();
	logger.debug("Time taken for "+filter+" OMPROCESS execution "+Math.abs((e.getTime() - s.getTime())/1000))
	callback(null, json);
	});
	},
	Outlier: function(callback){
		  logger.debug("select row_to_json(riskanalytics.get_singleorder_outlierdata("+issue+","+lastRead+","+filter+"))");
	let s = new Date();
	pool.query("select row_to_json(riskanalytics.get_singleorder_outlierdata("+issue+","+lastRead+","+filter+"))", (err, response) => {
	var json=formatJson(response);
	/*var filtered=json.filter(function(item){
	return item.division==req.params.filter;
	});*/
	let e=new Date();
	logger.debug("Time taken for "+filter+" Outlier execution "+Math.abs((e.getTime() - s.getTime())/1000))
	callback(null, json);
	});
	},
	Bar: function(callback){
		  logger.debug("select row_to_json(riskanalytics.get_barchartdata('DESK',"+ issue+","+lastRead+","+tdate+","+filter+"))");
	let s = new Date();
	pool.query("select row_to_json(riskanalytics.get_barchartdata('DESK',"+ issue+","+lastRead+","+tdate+","+filter+"))", (err, response) => {
	var json=formatJson(response);
	/*var filtered=json.filter(function(item){
	return item.division==req.params.filter;
	});*/
	let e=new Date();
	logger.debug("Time taken for "+filter+" Bar execution "+Math.abs((e.getTime() - s.getTime())/1000))
	logger.debug("bar json :"+json);
	callback(null, json);
	});
	}	
	},
	function(err, results) {
	let end=new Date();
	logger.debug("Time taken for execution of "+filter+" is "+Math.abs((end.getTime() - start.getTime())/1000))
	  res.send(results);
	});
	
	})

//Get List of traders by individual
app.get('/getOrders/:division/:filterType/:filterValue/:issue/:startTime/:endTime', function (req, res) {
	res.setHeader('Content-Type', 'application/json');
	let s = new Date();
	var division=req.params.division;
	if(division!='NULL'){
		division="'"+division+"'";
	}
	var filterType=req.params.filterType.toUpperCase();
	if(filterType!='NULL'){
		filterType="'"+filterType+"'";
	}
	var filterValue=req.params.filterValue;
	if(filterType!='NULL'){
		filterValue="'"+filterValue+"'";
	}
	var issue=req.params.issue.toUpperCase();
	if(issue!='NULL'){
		issue="'"+issue+"'";
	}
	var startTime=req.params.startTime;
	if(startTime!='NULL'){
		startTime="'"+startTime+"'";
	}
	var endTime=req.params.endTime;
	if(endTime!='NULL'){
		endTime="'"+endTime+"'";
	}
	var sql = "select row_to_json(riskanalytics.get_orders_history("+division+","+filterType+","+filterValue+","+issue+","+startTime+","+endTime+"))";
	logger.debug("QUERY: "+sql);
	pool.query(sql, (err, response) => {
		var json=formatJson(response);
		var filtered=json.filter(function(item){
			return item.division==req.params.filter;
		});
		let e=new Date();
		logger.debug("Time taken for orders history execution "+Math.abs((e.getTime() - s.getTime())/1000))
		res.send(json);
	});
})

//Get piecharts of traders by individual
app.get('/getParticipation/:division/:filterType/:filterValue/:aggType/:issue/:startTime/:endTime', function (req, res) {
	res.setHeader('Content-Type', 'application/json');
	let s = new Date();
	var division=req.params.division;
	if(division!='NULL'){
		division="'"+division+"'";
	}
	var filterType=req.params.filterType.toUpperCase();
	if(filterType!='NULL'){
		filterType="'"+filterType+"'";
	}
	var aggType=req.params.aggType.toUpperCase();
	if(aggType!='NULL'){
		aggType="'"+aggType+"'";
	}
	var filterValue=req.params.filterValue;
	if(filterType!='NULL'){
		filterValue="'"+filterValue+"'";
	}
	var issue=req.params.issue.toUpperCase();
	if(issue!='NULL'){
		issue="'"+issue+"'";
	}
	var startTime=req.params.startTime;
	if(startTime!='NULL'){
		startTime="'"+startTime+"'";
	}
	var endTime=req.params.endTime;
	if(endTime!='NULL'){
		endTime="'"+endTime+"'";
	}
	var sql = "select row_to_json(riskanalytics.get_participation_details("+division+","+filterType+","+filterValue+","+aggType+","+issue+","+startTime+","+endTime+"))";
	logger.debug("QUERY: "+sql);
	pool.query(sql , (err, response) => {
		var json=formatJson(response);
		var filtered=json.filter(function(item){
			return item.division==req.params.filter;
		});
		let e=new Date();
		logger.debug("Time taken for participation details "+Math.abs((e.getTime() - s.getTime())/1000))
		res.send(json);
	});
})

app.get('/getRegNms', function (req, res) {
	let start = new Date();
	res.setHeader('Content-Type', 'application/json');
	var sql = "select row_to_json(riskanalytics.get_regnms_agg_data())";
	logger.debug("QUERY: "+sql);
	pool.query(sql, (err, response) => {
		var json=formatJson(response);
		let end=new Date();
		logger.debug("Time taken for execution of REG NMS is "+Math.abs((end.getTime() - start.getTime())/1000))
		res.send(json);
	});
})

app.get('/getShortSellClient', function (req, res) {
	let start = new Date();
	res.setHeader('Content-Type', 'application/json');
	var sql = "select row_to_json(riskanalytics.get_shortsell_client_agg_data())";
	logger.debug("QUERY: "+sql);
	pool.query(sql, (err, response) => {
		var json=formatJson(response);
		let end=new Date();
		logger.debug("Time taken for execution of REG NMS is "+Math.abs((end.getTime() - start.getTime())/1000))
		res.send(json);
	});
})

app.get('/getShortSellSymbol', function (req, res) {
	let start = new Date();
	res.setHeader('Content-Type', 'application/json');
	var sql = "select row_to_json(riskanalytics.get_shortsell_symbol_agg_data())";
	logger.debug("QUERY: "+sql);
	pool.query(sql, (err, response) => {
		var json=formatJson(response);
		let end=new Date();
		logger.debug("Time taken for execution of REG NMS is "+Math.abs((end.getTime() - start.getTime())/1000))
		res.send(json);
	});
})

app.get('/getMar', function (req, res) {
	let start = new Date();
	res.setHeader('Content-Type', 'application/json');
	var sql = "select row_to_json(riskanalytics.get_mar_agg_data())";
	logger.debug("QUERY: "+sql);
	pool.query(sql, (err, response) => {
		var json=formatJson(response);
		let end=new Date();
		logger.debug("Time taken for execution of REG NMS is "+Math.abs((end.getTime() - start.getTime())/1000))
		res.send(json);
	});
})

app.get('/getLocateAnoms', function (req, res) {
	let start = new Date();
	res.setHeader('Content-Type', 'application/json');
	var sql = "select row_to_json(riskanalytics.get_locate_anomaly_data())"
	logger.debug("QUERY: "+sql);
	pool.query(sql, (err, response) => {
		var json=formatJson(response);
		let end=new Date();
		logger.debug("Time taken for execution of REG NMS is "+Math.abs((end.getTime() - start.getTime())/1000))
		res.send(json);
	});
})

app.get('/getOrderCapacityAnoms', function (req, res) {
	let start = new Date();
	res.setHeader('Content-Type', 'application/json');
	var sql = "select row_to_json(riskanalytics.get_ordercapacity_anomaly_data())";
	logger.debug("QUERY: "+sql);
	pool.query(sql, (err, response) => {
		var json=formatJson(response);
		let end=new Date();
		logger.debug("Time taken for execution of REG NMS is "+Math.abs((end.getTime() - start.getTime())/1000))
		res.send(json);
	});
})

app.get('/getSpoofing', function (req, res) {
	let start = new Date();
	res.setHeader('Content-Type', 'application/json');
	var d = new Date().toISOString().split('T')[0];
	var sql = "select row_to_json(riskanalytics.get_spoofingincidents('2019-03-29'))";
	logger.debug("QUERY: "+sql);
	pool.query(sql, (err, response) => {
		var json=formatJson(response);
		let end=new Date();
		logger.debug("Time taken for execution of REG NMS is "+Math.abs((end.getTime() - start.getTime())/1000))
		res.send(json);
	});
})

app.get('/getfrontrunning', function (req, res) {
	let start = new Date();
	res.setHeader('Content-Type', 'application/json');
	var d = new Date().toISOString().split('T')[0];
	var sql = "select row_to_json(riskanalytics.get_frontrunningincidents('2019-3-29'))";
	logger.debug("QUERY: "+sql);
	pool.query(sql, (err, response) => {
		var json=formatJson(response);
		let end=new Date();
		logger.debug("Time taken for execution of REG NMS is "+Math.abs((end.getTime() - start.getTime())/1000))
		res.send(json);
	});
})



app.get('/getModelOutputs', function (req, res) {
	let start = new Date();
	res.setHeader('Content-Type', 'application/json');
	var sql = "select row_to_json(riskanalytics.get_model_outputs())";
	logger.debug("QUERY: "+sql);
	pool.query(sql, (err, response) => {
		var json=formatJson(response);
		let end=new Date();
		logger.debug("Time taken for execution of model outputs is "+Math.abs((end.getTime() - start.getTime())/1000))
		res.send(json);
	});
})



app.get('/getModelLists', function (req, res) {
	let start = new Date();
	res.setHeader('Content-Type', 'application/json');
	var sql = "select * from riskanalytics.modelhierarchy where rank>2 order by rank";
	logger.debug("QUERY: "+sql);
	pool.query(sql, (err, response) => {
		var json=formatJson(response);
		let end=new Date();
		logger.debug("Time taken for execution of model outputs is "+Math.abs((end.getTime() - start.getTime())/1000))
		//logger.debug( json)
		res.send(json);
	});
})

app.get('/getScatterData/:modelfeature/:issuetype', function (req, res) {
	var modelfeature=req.params.modelfeature;
	var issuetype=req.params.issuetype.toUpperCase();
	if(issuetype!='NULL'){
		issuetype="'"+issuetype+"'";
	}
	var sql = "select row_to_json(riskanalytics.get_scatterdata('"+modelfeature+"', 'ALL'))";
	logger.debug("QUERY: "+sql);
    	let s = new Date()
    if(modelfeature=="DIVISION" || modelfeature=="DESK"){
	var sql = "select row_to_json(riskanalytics.get_scatterdata('"+modelfeature+"',"+issuetype+"))";
	logger.debug("QUERY: "+sql);
    	pool.query(sql, (err, response) => {
        var json=formatJson(response);
        let e=new Date();
        logger.debug("Time taken for "+modelfeature+" execution "+Math.abs((e.getTime() - s.getTime())/1000))
        res.send(json);
     });
    }else if(modelfeature=="CLIENT" || modelfeature=="SYMBOL" || modelfeature=="OMPROCESS" || modelfeature=="TRADER"){
	var sql = "select row_to_json(riskanalytics.get_scatterdata('"+modelfeature+"',"+issuetype+",NULL,NULL))";
	logger.debug("QUERY: "+sql);
     	pool.query(sql, (err, response) => {
    	var json=formatJson(response);
        logger.debug('json');
        let e=new Date();
        logger.debug("Time taken for "+modelfeature+" execution "+Math.abs((e.getTime() - s.getTime())/1000))
        res.send(json);
    });
    }

});

app.get('/getDivisionsList', function (req, res) {
	let start = new Date();
	res.setHeader('Content-Type', 'application/json');
	var sql = "select riskanalytics.get_divisions()" ;
	logger.debug("QUERY: "+sql);
	pool.query(sql, (err, response) => {
		var json=formatJson(response);
		let end=new Date();
		logger.debug("Time taken for execution of  Division List is "+Math.abs((end.getTime() - start.getTime())/1000))
		res.send(json);
	});
})

app.get('/getDivisionData/:modeldata/:divisionType', function (req, res) {
	   var modeldata=req.params.modeldata;
	   var divisionType=req.params.divisionType;
	let start = new Date();
	res.setHeader('Content-Type', 'application/json');
	
	if(modeldata=="CLIENT"){
		var sql = "select row_to_json(riskanalytics.get_clientids("+divisionType+"))";
		logger.debug("QUERY: "+sql);
		pool.query(sql, (err, response) => {
		var json=formatJson(response);
		let end=new Date();
		logger.debug("Time taken for execution of  Client List is "+Math.abs((end.getTime() - start.getTime())/1000))
	//	logger.debug( json)
		res.send(json);
	});
	}else if(modeldata=="DESK"){
		var sql = "select row_to_json(riskanalytics.get_desks("+divisionType+"))";
		logger.debug("QUERY: "+sql);
		pool.query(sql, (err, response) => {
			var json=formatJson(response);
			let end=new Date();
			logger.debug("Time taken for execution of Desk List is "+Math.abs((end.getTime() - start.getTime())/1000))
		//	logger.debug( json)
			res.send(json);
		});	
	}else if(modeldata=="SYMBOL"){
		var sql = "select row_to_json(riskanalytics.get_symbols("+divisionType+"))";
		logger.debug("QUERY: "+sql);
		
		pool.query(sql, (err, response) => {
			var json=formatJson(response);
			let end=new Date();
			logger.debug("Time taken for execution of Symbol List is "+Math.abs((end.getTime() - start.getTime())/1000))
		//	logger.debug( json)
			res.send(json);
		});
	}else if(modeldata=="TRADER"){
		var sql = "select row_to_json(riskanalytics.get_traderids("+divisionType+"))";
		logger.debug("QUERY: "+sql);

		pool.query(sql, (err, response) => {
			var json=formatJson(response);
			let end=new Date();
			logger.debug("Time taken for execution of Trader List is "+Math.abs((end.getTime() - start.getTime())/1000))
		//	logger.debug( json)
			res.send(json);
		});
	}else if(modeldata=="OMPROCESS"){
		var sql = "select row_to_json(riskanalytics.get_omprocessids("+divisionType+"))";
		logger.debug("QUERY: "+sql);
		pool.query(sql, (err, response) => {
			var json=formatJson(response);
			let end=new Date();
			logger.debug("Time taken for execution of  OMProcess List is "+Math.abs((end.getTime() - start.getTime())/1000))
		//	logger.debug( json)
			res.send(json);
		});	
	}
})


app.get('/getData/:type/:filter/:issue/:lastRead/:dateFilter', function (req, res) {
	let start = new Date();
	res.setHeader('Content-Type', 'application/json');
	var type=req.params.type;
	
	var filter=req.params.filter;
	if(filter!='NULL'){
		filter="'"+filter+"'";
	}
	var issue=req.params.issue.toUpperCase();
	if(issue!='NULL'){
		issue="'"+issue+"'";
	}
	var lastRead=req.params.lastRead.toUpperCase();
	if(lastRead!='NULL'){
		lastRead=lastRead.toUpperCase();
	}
	var dateFilter=req.params.dateFilter;
	if(dateFilter!='NULL'){
		dateFilter="'"+dateFilter+"'";
	}

	if(type!='NULL'){
		if(type=='DIVISION'){
			var sql = "select row_to_json(riskanalytics.get_tsdata('DIVISION',"+filter+","+issue+","+lastRead+","+dateFilter+","+filter+"))";
		}else if(type=='DESK'){
			var sql = "select row_to_json(riskanalytics.get_barchartdata('DESK',"+ issue+","+lastRead+","+dateFilter+","+filter+"))";
		}else if(type=='OMPROCESS'){
			var sql = "select row_to_json(riskanalytics.get_heatmapdata('OMPROCESS',"+ issue+","+lastRead+","+dateFilter+","+filter+"))";
		}else if(type=='TRADER'){
			var sql = "select row_to_json(riskanalytics.get_heatmapdata('TRADER',"+ issue+","+lastRead+","+dateFilter+","+filter+"))";
		}else if(type=='Outlier'){
			var sql = "select row_to_json(riskanalytics.get_singleorder_outlierdata("+issue+","+lastRead+","+filter+"))";
		}
	}
    logger.debug("QUERY: "+sql);
	let s = new Date();
		pool.query(sql, (err, response) => {
			var json=formatJson(response);
			/*var filtered=json.filter(function(item){
				return item.division==req.params.filter;
			});*/
			let e=new Date();
			logger.debug("Time taken for "+type+": "+filter+"  execution "+Math.abs((e.getTime() - s.getTime())/1000))
			res.send(json);
		});
})
 

app.get('/getAggTotalsEod/:type/:filter/:issue/:tDate/:division', function (req, res) {
	let start = new Date();
	res.setHeader('Content-Type', 'application/json');
	var type=req.params.type;
	if(type!='NULL'){
		type="'"+type+"'";
	}
	var filter=req.params.filter;
	if(filter!='NULL'){
		filter="'"+filter+"'";
	}
	var issue=req.params.issue.toUpperCase();
	if(issue!='NULL'){
		issue="'"+issue+"'";
	}
	var tdate=req.params.tDate;
	if(tdate!='NULL'){
		tdate="'"+tdate+"'";
	}
	var division=req.params.division;
	if(division!='NULL'){
		division="'"+division+"'";
	}
	var sql = "select row_to_json(riskanalytics.get_aggtotals_eod("+type+","+filter+","+issue+",NULL,"+division+"))";
	//var sql = "select * from riskanalytics.get_aggtotals_eod('CLIENT', 'Client_101', isstype=>NULL, tdate=>NULL,div=>'Equity')";
    logger.debug("QUERY: "+sql);
	let s = new Date();
		pool.query(sql, (err, response) => {
			var json=formatJson(response);
			var filtered=json.filter(function(item){
				return item.division==req.params.filter;
			});
			let e=new Date();
		logger.debug("Time taken for Trend Analysis "+type+": "+filter+"  execution "+Math.abs((e.getTime() - s.getTime())/1000))
			res.send(json);
		});
})


app.get('/getAggtotalsPiedata/:type/:filter/:tDate/:division', function (req, res) {
	let start = new Date();
	res.setHeader('Content-Type', 'application/json');
	var type=req.params.type;
	if(type!='NULL'){
		type="'"+type+"'";
	}
	var filter=req.params.filter;
	if(filter!='NULL'){
		filter="'"+filter+"'";
	}
	var tdate=req.params.tDate;
	if(tdate!='NULL'){
		tdate="'"+tdate+"'";
	}
	var division=req.params.division;
	if(division!='NULL'){
		division="'"+division+"'";
	}
	var sql = "select row_to_json(riskanalytics.get_aggtotals_piedata("+type+","+filter+",NULL,"+division+"))";
	//var sql = "select * from riskanalytics.get_aggtotals_eod('CLIENT', 'Client_101', isstype=>NULL, tdate=>NULL,div=>'Equity')";
    logger.debug("QUERY: "+sql);
	let s = new Date();
		pool.query(sql, (err, response) => {
			var json=formatJson(response);
			var filtered=json.filter(function(item){
				return item.division==req.params.filter;
			});
			let e=new Date();
		logger.debug("Time taken for Trend Analysis Pie Data"+type+": "+filter+"  execution "+Math.abs((e.getTime() - s.getTime())/1000))
			res.send(json);
		});
}) 
 
//Extract 'Rows' data from above request's response to send array of data in json
var formatJson=function(response){
	var finResponse=[];
	if(response!=undefined && response.rows!=undefined){
		response.rows.forEach(function(row){
			if(row.row_to_json!=undefined){
				finResponse.push(row.row_to_json);
			}else{
				finResponse.push(row);
			}
		})
	}
	return finResponse;
}



