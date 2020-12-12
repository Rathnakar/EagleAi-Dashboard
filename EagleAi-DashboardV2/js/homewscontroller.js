app.controller('HomewsController',HomewsController);

HomewsController.$inject = ['$scope','$q','$http','$cookieStore','$location','$window','UserService','$filter','$interval','$routeParams','$uibModal','$rootScope'];


function HomewsController($scope,$q,$http,$cookieStore,$location,$window,UserService,$filter,$interval,$routeParams,$uibModal,$rootScope) {
	var red="#ae0001";
	//Heatmap colors
	var heatGreen="#03c72d";
	var heatBlue="#0066dc";
	//Timeseries colors
	var timeGreen="#2E8B57";
	var timeGrey="rgba(98,100,112,0.3)";
	var timeBlueEst="rgba(168,245,254,0.3)";
	var timeBlueActual='#0066dc';
	//Bar graph colors
	var barDBlue='#0066dc';
	var barMBlue='#23c0f5';
	var barLBlue='#e4f4ff';
	//Scatter colors
	/*var scatterGreen='rgba(44,160,69,1.0)';*/
	var scatterGreen='rgba(46,139,87,2.0)';
	var scatterBlue='rgba(26,162,180,1.0)';
	var scatterOrange='rgba(265,165,0,1.2)';
	var scatterRed='rgba(255,0,0,1.5)';

	//Marker Select color
	var markerSelect='#00ff00';

	$scope.alertCount=0;
	$scope.alerts=[];
	$scope.user=$cookieStore.get("user");
	$rootScope.divisions=[];
	$rootScope.dateFilter='NULL';
	$scope.FixedIncome={anomaly:false,issueTypes:[],issue:'null'};
	$scope.Equity={anomaly:false,issueTypes:[],issue:'null'};
	var divTypes=['gross_nv','net_nv','num_orders'];
	$scope.lastTime = new Date().toLocaleTimeString(navigator.language, {hour: '2-digit', minute:'2-digit'});
	const divisionSocket = io.connect('http://159.203.112.185:7878/division_pred_vs_obs');
	const deskSocket = io.connect('http://159.203.112.185:7878/desk_pred_vs_obs');
	const clientSocket = io.connect('http://159.203.112.185:7878/client_pred_vs_obs');
	const symbolSocket = io.connect('http://159.203.112.185:7878/symbol_pred_vs_obs');
	const traderSocket = io.connect('http://159.203.112.185:7878/trader_pred_vs_obs');
	const omprocessSocket = io.connect('http://159.203.112.185:7878/omprocess_pred_vs_obs');
	const outlierSocket=io.connect('http://159.203.112.185:7879/singleorder_anomaly');
	const divisionIssueSocket = io.connect('http://159.203.112.185:7878/division_issuetype_pred_vs_obs');
	const deskIssueSocket = io.connect('http://159.203.112.185:7878/desk_issuetype_pred_vs_obs');
	const clientIssueSocket = io.connect('http://159.203.112.185:7878/client_issuetype_pred_vs_obs');
	const symbolIssueSocket = io.connect('http://159.203.112.185:7878/symbol_issuetype_pred_vs_obs');
	const traderIssueSocket = io.connect('http://159.203.112.185:7878/trader_isseutype_pred_vs_obs');
	const omprocessIssueSocket = io.connect('http://159.203.112.185:7878/omprocess_issuetype_pred_vs_obs');
	$rootScope.restAPIServerName = 'http://eai-node:3000'; 
	const restAPIServerName = $rootScope.restAPIServerName;
	$rootScope.isPopOpened=false;

	function nFormatter(num, digits,isCurrency) {
		if (isNaN(num)) return num;
		var negative="";
		if(num<0){
			negative="-";
			num=Math.abs(num);
		}
		if(isCurrency){
			negative=negative+'$';
		}
		var si = [
			{ value: 1, symbol: "" },
			{ value: 1E3, symbol: "K" },
			{ value: 1E6, symbol: "M" },
			{ value: 1E9, symbol: "B" },
			{ value: 1E12, symbol: "T" },
			{ value: 1E15, symbol: "P" },
			{ value: 1E18, symbol: "E" }
		];
		var rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
		var i;
		for (i = si.length - 1; i > 0; i--) {
			if (num >= si[i].value) {
			  break;
			}
		}
		return negative+(num / si[i].value).toFixed(digits).replace(rx, "$1") + si[i].symbol;
	}
	
	function msToTime(duration) {
		var milliseconds = parseInt((duration%1000))
			, seconds = parseInt((duration/1000)%60)
			, minutes = parseInt((duration/(1000*60))%60)
			, hours = parseInt((duration/(1000*60*60))%24);

		hours = (hours < 10) ? "0" + hours : hours;
		minutes = (minutes < 10) ? "0" + minutes : minutes;
		seconds = (seconds < 10) ? "0" + seconds : seconds;

		return hours + ":" + minutes + ":" + seconds + "." + milliseconds;
	}

	var cDate=new Date();
	var x = 1; //minutes interval
	var times = []; // time array
	var tt = 0; // start time
	var limit=(cDate.getHours())*60+(cDate.getMinutes())

	//loop to increment the time and push results in array
	for (var i=0;tt<24*60; i++) {
		var hh = Math.floor(tt/60); // getting hours of day in 0-24 format
		var mm = (tt%60); // getting minutes of the hour in 0-55 format
		times[i] = ("0" + (hh)).slice(-2) + ':' + ("0" + mm).slice(-2)+':00'; // pushing data in array in [00:00:00 - 24:00:00 format]
		tt = tt + x;
	}
	$scope.lastRead=null;

	//Get Issue type
	$scope.getDivisionIssues=function(division){
		if($scope[division]!=undefined && $scope[division].issueTypes.length==0){
			$http.get(restAPIServerName+"/getIssues/"+division).then(function(response){
				$scope[division].issueTypes=response.data;
			});
		}
	}

	$scope.getDivisionDesks=function(division){
		if($scope[division]!=undefined && $scope[division].desks.length==0){
			$http.get(restAPIServerName+"/getDesks/"+division).then(function(response){
				$scope[division].desks=response.data;
			});
		}
	}

	$scope.getDivisionClients=function(division){
		if($scope[division]!=undefined && $scope[division].clients.length==0){
			$http.get(restAPIServerName+"/getClients/"+division).then(function(response){
				$scope[division].clients=response.data;
			});
		}
	}

	$scope.getDivisionSymbols=function(division){
		if($scope[division]!=undefined && $scope[division].symbols.length==0){
			$http.get(restAPIServerName+"/getSymbols/"+division).then(function(response){
				$scope[division].symbols=response.data;
			});
		}
	}

	$scope.getDivisionTraders=function(division){
		if($scope[division]!=undefined && $scope[division].traders.length==0){
			$http.get(restAPIServerName+"/getIssues/"+division).then(function(response){
				$scope[division].traders=response.data;
			});
		}
	}

        // global options for highcharts
	Highcharts.setOptions({
		chart: {
			className:'chart-width',
			height:216,
			backgroundColor:'transparent',
			style: {
				fontFamily:'Montserrat'
			},
			zoomType:'xy',
			//Zoom button styling with out icon
			resetZoomButton: {
				theme: {
					fill: '#090b0a',
					stroke:'rgba(255,255,255,0.3)',
					strokeWidth:1,
					style: {
						color: 'white',
						fontSize:'8px'
					},
					r: 0,
					states: {
						hover: {
							fill: '#090b0a',
							style: {
								color: '#00aae8'
							}
						}
					}
				},
				position: {
					align: 'left', // right by default
					verticalAlign: 'top',
					x: 30,
					y: 30
				},
				relativeTo: 'chart'
			}
		},

		title: {
			align: 'left',
			widthAdjust:0,
			style: {
				color: '#c1ffff',
				fontWeight: 'bold',
			}
		},
		xAxis: {
			labels: {
				y: 8,
				style: {
					color: '#fffeff',
					fontSize:'9px'
				}
			},
			minorTickLength: 0,
			tickLength: 0,
			gridLineWidth: 0,
			minorGridLineWidth: 0,
			lineColor: '#ccd6eb',
			lineWidth: 2
		},
		yAxis: {
			labels: {
				x: -3,
				allowDecimals: false,
				style: {
					color: '#fffeff',
					fontSize:'9px'
				}
			},
			lineColor: '#ccd6eb',
			lineWidth: 2,
			gridLineWidth: 0,
			minorGridLineWidth: 0,
			title: {
				text: ""
			},
		},
		tooltip:{
			hideDelay:10,
			delayForDisplay: 1000
		},
		lang: {
			numericSymbols: ["K", "M", "B", "T", "P", "E"],
			decimalPoint: '.',
			thousandsSep: ',',
			resetZoom:"Reset",
			resetZoomTitle:"Reset zoom level"
		},
		legend: {
			enabled:false
		}
	});

	///////////////////////////////////////////////////////////////////////////
	$rootScope.pieChart=function(chartid,title,seriesData,seriesname,type){
		var isCurrency=true;
		if(type===('Num_Orders')){
			isCurrency=false;
		}
		var pieColors = (function () {
			var colors = [],
			    base = Highcharts.getOptions().colors[0],
			    i;
	
			for (i = 0; i < 10; i += 1) {
				// Start out with a darkened base color (negative brighten), and end
				// up with a much brighter color
				colors.push(Highcharts.Color(base).brighten((i - 3) / 7).get());
			}
			return colors;
		}());

		Highcharts.chart(chartid, {
			chart: {
				type: 'pie'
			},
			title: {
				align: 'center',
				text: title,
				style: {
					color: '#ffffff',
					fontWeight: 'bold',
				}
			},
			tooltip: {
				useHTML: true,
				formatter: function () {
					return '<table><tr><th colspan="2"><h5>'+this.point.name+'</h5></th></tr>' +
					'<tr><th>Amount:</th><td>'+nFormatter(this.point.amount,2,isCurrency)+'</td></tr>' +
					'<tr><th>Percentage:</th><td>'+nFormatter(this.point.y,2,false)+'%</td></tr></table>';
				},
				followPointer: true
			},
			plotOptions: {
				pie: {
					allowPointSelect: true,
					cursor: 'pointer',
					size: '110%',
					colors: pieColors,
					dataLabels: {
						enabled: true,
						padding:0,
						borderRadius: 0,
						connectorPadding: 0,
						distance: -10,
						formatter: function () {
							return '<b>'+this.point.name+' </b>:'+nFormatter(this.point.y,2,false)+' %';
						},
						style: {
							color: '#ddd830'
						}
					}
				}
			},
			series: [{
				name: seriesname,
				colorByPoint: true,
				data: seriesData
			}]
		});
	}

	////////////////////////////////////////////////////////////////////////////////////////////
	// Multiple Series line graph
	$rootScope.timeSeries=function(id,title,xCategories,actualSeries,estSeries,rangeSeries){
		var isCurrency=true;
		if(id.includes('num_orders')){
			isCurrency=false;
		}
		Highcharts.chart(id, {
			chart: {
				height: 180,
				zoomType: 'x',
				resetZoomButton: {
					position: {
						align: 'right',
						verticalAlign: 'top',
						x: -10,
						y: 0
					},
				}
			},
			title: {
				text:'',
			},

			xAxis: {
				categories: xCategories,
				events: {
					afterSetExtremes: function(event){
						if ($rootScope.isPopOpened){
							var date,start,end,d=new Date();
							if($rootScope.dateFilter=='NULL'){
								date=d.getUTCFullYear()+"-"+
									("0" + (d.getUTCMonth()+1)).slice(-2)+"-"+
									("0" + (d.getUTCDate())).slice(-2)
							}else{
								var d1=new Date($rootScope.dateFilter);
								date=d1.getUTCFullYear()+"-"+
									("0" + (d1.getUTCMonth()+1)).slice(-2)+"-"+
									("0" + (d1.getUTCDate())).slice(-2)
							}
							if(Math.round(event.min)>=0 && Math.round(event.max)<xCategories.length-1){
								start=(date+" "+xCategories[Math.round(event.min)]+":00");
								end=(date+" "+xCategories[Math.round(event.max)]+":00");
								$rootScope.updatePieTimes(start,end);
							}else{
								var d1=new Date(d);
								d1.setMinutes ( d.getMinutes() - 30 );
								d.setMinutes ( d.getMinutes() + 30 );
								start=date+" "+
									("0" + (d1.getUTCHours())).slice(-2)+":"+
									("0" + (d1.getUTCMinutes())).slice(-2)+":00";
								end=date+" "+
									("0" + (d.getUTCHours())).slice(-2)+":"+
									("0" + (d.getUTCMinutes())).slice(-2)+":00";
								$rootScope.updatePieTimes(start,end);
							}
						}
					}
				}
			},
			yAxis: {
				labels: {
					formatter: function () {
						return nFormatter(this.value,2,isCurrency);
					}
				}
			},
			plotOptions: {
				series: {
					turboThreshold: 2000,
					connectNulls: true
				}
			},
			tooltip: {
				useHTML: true,
				crosshairs: true,
				shared: true,
				formatter: function () {
					var tooltip='<table><tr>'+this.x+'</tr>' ;
					if(this.points.length==3){
						tooltip=tooltip+
							'<tr><th>Actual: </th><td>'+nFormatter(this.points[0].y,2,isCurrency)+'</td></tr>'+
							'<tr><th>Estimated: </th><td>'+nFormatter(this.points[1].y,2,isCurrency)+'</td></tr>' +
							'<tr><th>Est. Range: </th><td>'+nFormatter(this.points[2].point.low,2,isCurrency)+
							'-'+nFormatter(this.points[2].point.high,2,isCurrency)+'</td></tr>' +
							'</table>';
					}else if(this.points.length==2){
						tooltip=tooltip+
							'<tr><th>Estimated: </th><td>'+nFormatter(this.points[0].y,2,isCurrency)+'</td></tr>' +
							'<tr><th>Est. Range: </th><td>'+nFormatter(this.points[1].point.low,2,isCurrency)+
							'-'+nFormatter(this.points[1].point.high,2,isCurrency)+'</td></tr>' +
								'</table>';
					}else if(this.points.length==1){
						tooltip=tooltip+
							'<tr><th>Actual: </th><td>'+nFormatter(this.points[0].y,2,isCurrency)+'</td></tr>' +
							'</table>';
					}
					return tooltip;
				},
				followPointer: true
			},
			series: [{
				id:"actual",
				data: actualSeries,
				name: 'Actual Series',
				zIndex: 1,
				color: timeBlueActual,
				marker: {
					enabled: false
				}
			},{
				id:"est",
				data: estSeries,
				name: 'Est. Series',
				zIndex: 1,
				color: timeBlueEst,
				marker: {
					enabled: false
				}
			},{
				id:"estRange",
				name: 'Range',
				data: rangeSeries,
				type: 'arearange',
				lineWidth: 0,
				linkedTo: ':previous',
				color: timeGreen,
				fillOpacity: 0.3,
				zIndex: 0,
				marker: {
					enabled: false
				}
			}]
		});
	}

	//3D Scatter plot for anomalies
	$rootScope.scatter3d=function(id,title,seriesData,seriesType,division,issueType){
		var isCurrency=true;
		if(id.includes('NUM_ORDERS')){
			isCurrency=false;
		}
		var chart = new Highcharts.Chart({
			chart: {
				renderTo: id,
				type: 'scatter3d',
				zoomType:false,
				animation: false,
				options3d: {
					enabled: true,
					fitToPlot: true,
					alpha: 10,
					beta: 30,
					depth: 150,
					frame: {
						bottom: { size: 1, color: 'rgba(255,255,255,0.02)' },
						back: { size: 1, color: 'rgba(255,255,255,0.04)' },
						side: { size: 1, color: 'rgba(255,255,255,0.06)' }
					}
				},
				events: {
					selection: function(event) {
						if (!event.xAxis || !(event.yAxis)) {
							chart.update({
								chart: {
									options3d: {
										alpha: 10,
										beta: 30
									}
								}
							}, undefined, undefined, false);
						}
					}
				},
				zoomType: 'xy'
			},
			title: {
				text: ''
			},
			subtitle: {
				text: ''
			},
			yAxis: {
				gridLineWidth: 1
			},
			xAxis: {
				gridLineWidth: 1
			},
			zAxis: {
				gridLineWidth: 1,
				showFirstLabel: false
			},
			tooltip: {
				useHTML: true,
				formatter: function () {
					return '<table><tr><th colspan="2"><h5>'+this.point.name+'</h5></th></tr>' +
					'<tr><th>Actual:</th><td>'+nFormatter(this.x,2,isCurrency)+'</td></tr>' +
					'<tr><th>Actual Vs Predicted:</th><td>'+nFormatter(this.y,2,false)+'</td></tr></table>';
				},
				followPointer: true
			},
			plotOptions: {
				series: {
					marker: {
						radius: 2,
						states: {
							select: {
								fillColor: markerSelect,
								radius:10
							}
						}
					},
					cursor: 'pointer',
					events: {
						click: function (event) {
							$scope.open(event.point.name,seriesType,division,issueType);
						}
					}
				},
				scatter: {
					width: 10,
					height: 10,
					depth: 10
				}
			},
			legend: {
				enabled: false
			},
			series: seriesData
		});
		
		// Add mouse and touch events for rotation
		(function (H) {
			function dragStart(eStart) {
				eStart = chart.pointer.normalize(eStart);

				var posX = eStart.chartX,
					posY = eStart.chartY,
					alpha = chart.options.chart.options3d.alpha,
					beta = chart.options.chart.options3d.beta,
					sensitivity = 5,  // lower is more sensitive
					handlers = [];

				function drag(e) {
					// Get e.chartX and e.chartY
					e = chart.pointer.normalize(e);

					chart.update({
						chart: {
							options3d: {
								alpha: alpha + (e.chartY - posY) / sensitivity,
								beta: beta + (posX - e.chartX) / sensitivity
							}
						}
					}, undefined, undefined, false);
				}

				function unbindAll() {
					handlers.forEach(function (unbind) {
						if (unbind) {
							unbind();
						}
					});
					handlers.length = 0;
				}

				handlers.push(H.addEvent(document, 'mousemove', drag));
				handlers.push(H.addEvent(document, 'touchmove', drag));


				handlers.push(H.addEvent(document, 'mouseup', unbindAll));
				handlers.push(H.addEvent(document, 'touchend', unbindAll));
			}
			H.addEvent(chart.container, 'mousedown', dragStart);
			H.addEvent(chart.container, 'touchstart', dragStart);
		}(Highcharts));
	}
	
	//Scatter plot for anomalies
	$scope.scatterAnamolies=function(id,title,seriesData,seriesType,division,issueType){
		var isCurrency=true;
		if(id.includes('NUM_ORDERS')){
			isCurrency=false;
		}
		Highcharts.chart(id, {
			chart: {
				type: 'scatter',
			},
			title: {
				text:  '',
			},
			xAxis: {
				labels: {
					formatter: function () {
						return nFormatter(this.value,2,isCurrency);
					}
				}
			},
			yAxis: {
				title: {
					text: ''
				}
			},
			plotOptions: {
				series: {
					marker: {
						radius: 2,
						states: {
							select: {
								fillColor: markerSelect,
								radius:10
							}
						}
					},
					cursor: 'pointer',
					events: {
						click: function (event) {
							$scope.open(event.point.name,seriesType,division,issueType);
						}
					}
				}
			},
			tooltip: {
				useHTML: true,
				formatter: function () {
					return '<table><tr><th colspan="2"><h5>'+this.point.name+'</h5></th></tr>' +
					'<tr><th>Actual:</th><td>'+nFormatter(this.x,2,isCurrency)+'</td></tr>' +
					'<tr><th>Actual Vs Predicted:</th><td>'+nFormatter(this.y,2,false)+'</td></tr></table>';
				},
				followPointer: true
			},
			series: seriesData
		});
	}

	//Heat Map
	$scope.generateHeatMap=function(id,title,seriesData,type,division,issueType){
		Highcharts.chart(id, {

			title: {
				text:  ''

			},
			plotOptions: {
				series: {
					cursor: 'pointer',
					dataLabels: {
						style:{
							textTransform: "uppercase"
						}
					},
					events: {
						click: function (event) {
							$scope.open(event.point.name,type,division,issueType);
						}
					}
				}
			},
			tooltip: {
				useHTML: true,
				formatter: function () {
				return '<table><tr><th><b>'+this.point.name+'</b></th></tr>' +
					'<tr><th>Ratio:</th><td>'+nFormatter(this.point.value,2,false)+'</td></tr></table>';
				},
				followPointer: true
			},
			series: [{
				type: 'treemap',
				layoutAlgorithm: 'squarified',
				data: seriesData
			}]

		});
	}

	//Bar Graph
	$scope.generateBarGraph=function(id,title,categoreis,actual,seriesData,type,division,issueType){
		var isCurrency=true;
		if(id.includes('NUM_ORDERS')){
			isCurrency=false;
		}
		Highcharts.chart(id, {
			chart: {
				type: 'bar',
				marginTop:5,
				marginBottom:0,
			},title: {
				text:  ''
			},xAxis:[{
				categories: categoreis,
				labels: {
					align: 'left',
					x: 0,
					y: -16,
					style:{
						textTransform: "uppercase",
						fontSize:'9px'
					}
				},
				tickWidth: 0,
				lineWidth: 0,
				minorGridLineWidth: 0,
				lineColor: 'transparent',
			},{
				linkedTo: 0,
				categories: actual,
				tickWidth: 0,
				lineWidth: 0,
				minorGridLineWidth: 0,
				lineColor: 'transparent',
				opposite: true,
				labels:{
					align: 'right',
					reserveSpace: true,
					style:{
						fontSize:'13px',
						fontWeight: 'bold',
						textShadow: '0 0 0px rgba(255,255,255,1) , 0 0 0px rgba(255,255,255,0.6) , 0 0 0px rgba(255,255,255,1)'
					}
				}
			}],
			yAxis: {
				labels: {
					enabled: false
				},
				lineColor: 'transparent',
			},
			plotOptions: {
				series: {
					pointWidth: 6,
					borderWidth:0,
					dataLabels: {
						enabled: false,
						align:'left',
						overflow:"none",
						padding:20,
						crop :false,
						formatter:function () {
							var label;
							if(this.point.seriesName=='eodpredup95')
								label=nFormatter(this.point.actual,2,isCurrency);
							return label;
						}
					},
					cursor: 'pointer',
					events: {
						click: function (event) {
							$scope.open(event.point.name,type,division,issueType);
						}
					}
				}
			},
			tooltip: {
				formatter: function () {
					var predEod95=this.points[3].y;
					var pred95=this.points[2].y;
					var pred=this.points[1].y;
					var actual=this.points[0].y;
					//var x=this.points[4].x;
					return 	'<b>Actual:'+nFormatter(actual,2,isCurrency)+
						'</b><br/><b>Predicted:'+nFormatter(pred,2,isCurrency)+
						'</b><br/><b>Predicted95:'+nFormatter(pred95,2,isCurrency)+
						'</b><br/><b>EOD Predicted95:'+nFormatter(predEod95,2,isCurrency)+
						'</b>';
				},
				shared: true
			},
			series: seriesData
		});
	}

	//Bubble chart
	$scope.generateBubble=function(id,title,seriesData,division,issueType,categoreis){
		Highcharts.chart(id, {
			chart: {
				type: 'bubble',
				marginTop:15,

			},
			title: {
				text: ''
			},
			tooltip: {
				useHTML: true,
				formatter: function () {
				return '<table><tr><th><b>'+this.point.alerttype+'</b></th></tr>' +
					'<tr><th>Client:</th><td>'+this.point.clientid+'</td></tr>' +
					'<tr><th>Symbol:</th><td>'+this.point.symbol+'</td></tr>' +
					'<tr><th>Predicted:</th><td>'+nFormatter(this.point.predicted,2,true)+'</td></tr>' +
					'<tr><th>Actual:</th><td>'+nFormatter(this.point.y,2,true)+'</td></tr>' +
					'<tr><th>Ratio:</th><td>'+nFormatter(this.point.z,2,false)+'</td></tr></table>';
				},
				followPointer: true
			},
			xAxis: {
				categories:categoreis
				/*labels: {
					formatter: function () {
						return this.label;
					}
				}*/
			},
			yAxis: {
				labels: {
					formatter: function () {
						return nFormatter(this.value,2,true);
					}
				}
			},
			plotOptions: {
				series: {
					shadow: true,
					marker: {
						fillColor: 'transparent',
						lineWidth: 2,
						lineColor: red
					},
					cursor: 'pointer',
					events: {
						click: function (event) {
							$scope.open(event.point.symbol,'Symbol',division,issueType);
						}
					},
					dataLabels: {
						enabled: true,
						format: '{y}%'
					}
				}
			},
			series: [{
				data: seriesData,
			}]

		});
		if(seriesData.length==0){
			var chart = $('#'+id).highcharts();
			chart.yAxis[0].update({
				labels: {
					enabled: false
				},
				lineColor: 'transparent'
			});
			chart.xAxis[0].update({
				labels: {
					enabled: false
				},
				lineColor: 'transparent'
			});
		}
	}
	/////////////////////////////////////////////////////////
	//Generates pie chart data.
	$rootScope.generatePieChartData=function(chartid,title,seriesData,seriesname,type){
		$rootScope.pieChart(chartid,title,seriesData,seriesname,type);
	}

	/////////////////////////////////////////////////////////
	//Generates time series data.
	$rootScope.generateTimesSeriesData=function(id,division,result,type,lastRead){
		if(lastRead==null){
			var actualTs=result['actual_ts'];
			angular.forEach(actualTs,function(actual,index){
				result['actual_ts'][index]=actual.substring(11,17)+"00";
			});
			var xCategories=times;
			var actualSeries=new Array(xCategories.length).fill(null);
			var estSeries=new Array(xCategories.length).fill(null);
			var rangeSeries=new Array(xCategories.length).fill([]);
			var lastIndex=xCategories.findIndex(x=>x === result['actual_ts'][result['actual_ts'].length-1])
			angular.forEach(xCategories,function(xValue,index){
				if(result['actual_ts'].findIndex(x=>x === xValue)!=-1){
					actualSeries[index]=(result['actual'][result['actual_ts'].findIndex(x=>x === xValue)]);
				}else{
					actualSeries[index]=(null);
				}
				if(result['pred_ts'].findIndex(x=>x === xValue)!=-1){
					estSeries[index]=(result['pred'][result['pred_ts'].findIndex(x=>x === xValue)]);
					rangeSeries[index]=([result['conf_lower_95'][result['pred_ts'].findIndex(x=>x === xValue)],
							     result['conf_upper_95'][result['pred_ts'].findIndex(x=>x === xValue)]]);
				}else{
					estSeries[index]=(null);
					rangeSeries[index]=([null,null]);
				}
				if(index==xCategories.length-1){
					var xSeries=[];
					angular.forEach(xCategories,function(x,index){
						xSeries[index]=x.substring(0,5);
						if(actualSeries[index]==null && actualSeries[index-1]!=null && index<=lastIndex){
							actualSeries[index]=actualSeries[index-1];
						}
						if(estSeries[index]==null && estSeries[index-1]!=null){
							estSeries[index]=estSeries[index-1];
						}
						if(rangeSeries[index]!=undefined && rangeSeries[index][0]==null && 
						   rangeSeries[index-1]!=undefined && rangeSeries[index-1][0]!=null){
							rangeSeries[index][0]=rangeSeries[index-1][0];
						}
						if(rangeSeries[index]!=undefined && rangeSeries[index][1]==null && 
						   rangeSeries[index-1]!=undefined && rangeSeries[index-1][1]!=null){
							rangeSeries[index][1]=rangeSeries[index-1][1];
						}
					});
					var actLength=result['actual'].length;
					if(division!='FixedIncome' && division!='Equity'){
						division='Individual';
						if($rootScope[division]==undefined){
							$rootScope[division]={};
						}
					}
					if($scope[division]!=undefined){
						var isCurrency=true;
						if(result['pred_type'].includes('num_orders')){
							isCurrency=false;
						}
						if(division=='Individual'){
							$rootScope[division][result['pred_type']] = 
                                                               nFormatter(result['actual'][actLength-1],2,isCurrency);
						}else{
							$scope[division][result['pred_type']]=
                                                               nFormatter(result['actual'][actLength-1],2,isCurrency);
						}
					}
					$rootScope.timeSeries(result['pred_type'],type,xSeries,actualSeries,estSeries,rangeSeries);
					var chart = $('#'+result['pred_type']).highcharts();
					var low=lastIndex-30;
					var high=lastIndex+30;
					if(low<0){
						low=0;
					}
					if(high>times.length-1){
						high=times.length-1;
					}
					chart.xAxis[0].setExtremes(low,high);
					chart.showResetZoom();
				}
			});
		}else{
			var chart = $('#'+id).highcharts();
			if(chart!=undefined){
				var categoreis=chart.xAxis[0].categories;
				var index=categoreis.findIndex(x=>x === result['ts_et'].substring(11,16));
				if($scope[division]!=undefined){
					$scope.$apply(function () {
						var isCurrency=true;
						if(id.includes('num_orders')){
							isCurrency=false;
						}
						$scope[division][id]=nFormatter(result[type],2,isCurrency);
					});
				}
				chart.series[0].data[index].update({x : index, y: parseFloat(result[type])});
				if(index>30){
					chart.xAxis[0].setExtremes(index-30, index+30);
				}
				chart.showResetZoom();
			}

		}
	}

	//To generate Heat map data
	$scope.generateHeatMapData=function(heatData,type,division,issueType,dataType,lastRead){
		$scope.heatSeries=[];
		var id=division+"_"+type;
		var match="";
		if(division=="FixedIncome"){
			match="fd";
		}else if(division=="Equity"){
			match="eq";
		}
		if(lastRead==null){
			angular.forEach(heatData,function(data,index){
				var heatColor;
				if(data['is_anom']==null || data['is_anom']==false){
					heatColor=heatBlue;
				}else{
					$scope.alertCount++;
					$scope.alerts.push({description:data[dataType],
							    name:data[dataType],
							    time:data['tj_timestamp'],
							    chartId:id,type:'heatMap',
							    x:index,
							    y:parseFloat(data['actual']),
							    issue:issueType,
							    division:division});
					heatColor=red;
				}
				if(data[dataType]!=null && data[dataType].includes(match)){
					$scope.heatSeries.push({name: data[dataType],value: data['actual'],color:heatColor})
				}
				if(index==heatData.length-1){
					$scope.generateHeatMap(id,type+" HeatMap",$scope.heatSeries,type,division,issueType);
				}
			});
		}else{
			var chart = $('#'+id).highcharts();
			if(chart!=undefined){
				var seriesData=chart.series[0].data;
				var heatColor;
				if(heatData[dataType]!=null && heatData[dataType].includes(match)){
					var heatObj = $filter('filter')(seriesData, { name: heatData[dataType] }, true)[0];
					var index=heatObj.index;
					if(heatData['isanom']==null || heatData['isanom']==false){
						heatColor=heatBlue;
					}else{
						heatColor=red;
					}
					chart.series[0].data[index].update({name:heatData[dataType],
									    value:parseFloat(heatData['gross_nv']),
									    color:heatColor});
				}
			}
		}
	}

	//To generate Bar data
	$scope.generateBarData=function(id,barData,type,division,issueType,dataType,lastRead){
		var filter=["GROSS_NOTIONALVALUE","NET_NOTIONALVALUE","NUM_ORDERS"];
		if(lastRead==null){
			angular.forEach(filter,function(f){
				var series= $filter('filter')(barData, { pred_type: f }, true);
				var title=type+" "+f.replace('_'," ");
				var id=division+"_desk_"+f;
				var isCurrency=true;
				if(f=='NUM_ORDERS'){
					isCurrency=false;
				}
				$scope.barSeries=[];
				$scope.actualValues=[];
				$scope.actual=[];
				$scope.pred=[];
				$scope.predup95=[];
				$scope.preduplow95=[];
				$scope.eodpredup95=[];
				$scope.eodpreduplow95=[];
				$scope.desksList=[];
				angular.forEach(series,function(data,index){
					var predType="pred_upper";
					$scope.desksList.push($filter('uppercase')(data['desk'], true));
					$scope.actualValues.push(nFormatter(data['actual'],2,isCurrency));
					if(data['actual']<0){
						predType="pred_lower";
					}
					$scope.actual.push({name:data['desk'],y: data['actual'],color: barDBlue})
					$scope.pred.push({name:data['desk'],y: data['pred'],color: barMBlue})
					if (data['actual']<0){
						$scope.predup95.push({name:data['desk'],y: data['conf_lower_95'],color: barLBlue})
						$scope.eodpredup95.push({name:data['desk'],
									 y: data['eod_conf_lower_95'],
									 color: red,
									 seriesName:'eodpredup95',
									 actual:data['actual']})
					}
					else {
						$scope.predup95.push({
									 name:data['desk'],
									 y: data['conf_upper_95'],
									 color: barLBlue})
						$scope.eodpredup95.push({
									 name:data['desk'],
									 y: data['eod_conf_upper_95'],
									 color: red,
									 seriesName:'eodpredup95',
									 actual:data['actual']})
					}
					if(index==series.length-1){
						$scope.barSeries=[{name:"Actual",data:$scope.actual,id:"actual",shadow: {
								color: 'rgba(0, 90, 196)',
								offsetX: 0,
								offsetY: 0,
								opacity: '0.1',
								width: 2
							}},{name:"Predicted",data:$scope.pred,id:"pred",shadow: {
								color: 'rgba(0, 170, 232)',
								offsetX: 0,
								offsetY: 0,
								opacity: '0.1',
								width: 2
							}},{name:"Predicted 95",data:$scope.predup95,id:"pred95",shadow: {
								color: 'rgba(228,244,255)',
								offsetX: 0,
								offsetY: 0,
								opacity: '0.1',
								width: 2
							}},{name:"EOD Predicted 95",data:$scope.eodpredup95}]

						$scope.generateBarGraph(id,title,$scope.desksList,$scope.actualValues,
									$scope.barSeries,type,division,issueType);
					}
				});
			});
		}else{
			var chart = $('#'+id).highcharts();
			if(chart!=undefined){
				var actual=chart.series[chart.get('actual').index];
				var pred=chart.series[chart.get('pred').index];
				var pred95=chart.series[chart.get('pred95').index];
				var actualValues=chart.xAxis[1].categories;
				var barObj = $filter('filter')(actual.data, { name: barData['desk'] }, true)[0];
				var index=barObj.index;
				var isCurrency=true;
				if(id.includes('NUM_ORDERS')){
					isCurrency=false;
				}
				actualValues[index]=nFormatter(barData[dataType],2,isCurrency);
				chart.xAxis[1].update({categories: actualValues});
				actual.data[index].update({name:barData['desk'],y: parseFloat(barData[dataType]),color: barDBlue});
				pred.data[index].update({name:barData['desk'],y: parseFloat(barData['ypred_'+dataType][1]),color: barMBlue});
				if (barData[dataType]<0){
					pred95.data[index].update({name:barData['desk'],
								   y: parseFloat(barData['ypred_'+dataType][2]),
								   color: barLBlue});
				}else{
					pred95.data[index].update({name:barData['desk'],
								   y: parseFloat(barData['ypred_'+dataType][0]),
								   color: barLBlue});
				}
			}
		}
	}

	//To generate scatter data
	$scope.generateScatterData=function(id,scatterData,type,division,issueType,dataType,divType,lastRead){
		var filter=["GROSS_NOTIONALVALUE","NET_NOTIONALVALUE","NUM_ORDERS"];
		var nameFilter=["gross_nv","net_nv","num_orders"];
		//console.log("ScatterData:");
		//console.log(scatterData);
		if(lastRead==null){
			angular.forEach(filter,function(f,fIndex){
				var title=type+" "+f.replace('_'," ");
				var result= $filter('filter')(scatterData, { pred_type: f }, true);
				var id=division+"_"+type.toLowerCase()+"_pred_vs_actual_"+f;
				var anomalyCount=0;
				var seriesData=[];
				$scope[division][type.toLowerCase()+"_"+f]=[];
				$scope[division][type.toLowerCase()+"_"+nameFilter[fIndex]+"series"]={};
				$scope.anomalies=[];
				angular.forEach(result,function(clientGross,index){
					name=clientGross[dataType];
					var zType;
					if(f.includes("GROSS_NOTIONALVALUE")){
						zType="NET_NOTIONALVALUE";
					}else if(f.includes("NET_NOTIONALVALUE")){
						zType="NUM_ORDERS";
					}else if(f.includes("NUM_ORDERS")){
						zType="GROSS_NOTIONALVALUE";
					}
					var nvData= $filter('filter')(scatterData, { pred_type: zType}, true);
					var nvclientData= $filter('filter')(nvData, { clientid: name}, true);
					var zdata=0;
					if(nvclientData.length>0){
						zdata=nvclientData[0]['actual'];
					}
					$scope[division][type.toLowerCase()+"_"+nameFilter[fIndex]+"series"][name]=index;
					if(name.match("_")){
						$scope[division][type.toLowerCase()+"_"+f].push(parseInt(name.split('_')[1]));
					}else{
						$scope[division][type.toLowerCase()+"_"+f].push(name);
					}
					var yval = 0; //clientGross['actual']/clientGross['conf_upper_95'];
					if (clientGross['actual']<0)
						yval = -1*clientGross['actual']/clientGross['conf_lower_95'];
					else
						yval = clientGross['actual']/clientGross['conf_upper_95'];

					if(clientGross['is_anom']==null||clientGross['is_anom']==false){
						var actualVspred = Math.round(yval * 100) / 100;
						var scatterColor;							
						var scatterRadius;							
						if (actualVspred <2.0){
							scatterColor = scatterGreen;
							scatterRadius = 1.5;
						}else if (actualVspred<3.0){
							scatterColor = scatterOrange;
							scatterRadius = 2;
						}
						else {
							scatterColor = scatterRed;
							scatterRadius = 3;
						}
						$scope.anomalies.push({x:clientGross['actual'],
						y:actualVspred,z:zdata,
name:name,color:scatterColor, marker:{radius: scatterRadius}});
					}else{
						$scope.anomalies.push({x:clientGross['actual'],
									y:Math.round(yval * 100) / 100,z:zdata,
									name:name,color: scatterRed,
									marker: {radius: 3}});
						anomalyCount++;
						$scope.alertCount++;
						$scope.alerts.push({description:name,
									name:name,
									time:clientGross['tj_timestamp'],
									chartId:id,
									type:'scatter',
									x:clientGross['actual'],
									y:Math.round(yval * 100) / 100,
									issue:issueType,
									division:division});
					}
					if(index==result.length-1){
						seriesData.push({data:$scope.anomalies,marker: {symbol: 'circle'}});
						$scope[division][type.toLowerCase()+"_"+f]
							=$filter('orderBy')($scope[division][type.toLowerCase()+"_"+f], '', false)
						$scope[division][type+'AnomalyCount']=anomalyCount;
						//$scope.scatterAnamolies(id,title,seriesData,type,division,issueType);
						$rootScope.scatter3d(id,title,seriesData,type,division,issueType);
						setInterval(function(){
							var chart = $('#'+id).highcharts();
							chart.redraw();
						}, 2000);
					}
				});
			});
		}else{
			var chart = $('#'+id).highcharts();
			if(chart!=undefined){
				var series=chart.series[0].data;
				var data=[];
				var color;
				var radius=3;
				var divIndex=divTypes.indexOf(divType);
				if(scatterData['isanom'+"_"+divType]==null ||scatterData['isanom'+"_"+divType]==false){
					color=scatterBlue;
				}else{
					color=red;
					radius=5;
				}
				var name=scatterData[dataType];
				var index=$scope[division][type.toLowerCase()+"_"+divType+"series"][name];
				//series[index].x=scatterData[divType];
				//series[index].y=Math.round((scatterData[divType]/scatterData['ypred_'+divType][0]) * 100) / 100;
				//series[index].color=color;
				//chart.series[0].setData(series);
				if(chart.series[0].data[index]!=undefined){
					chart.series[0].data[index].update({x:scatterData[divType], 
									    y:Math.round(scatterData['pred_factors'][divIndex]*100)/100, 
									    color:color,
									    marker: {radius: radius}}, false);
				}
			}
		}
	}

	//To generate Bubble data
	$scope.generateBubbleData=function(bubbleData,division,issueType,lastRead){
		var id=division+"_outliers";
		//console.log("Alert Received", bubbleData,division,issueType,lastRead);
		if(lastRead==null){
			var seriesData=[];
			var categoreis=[];
			if(bubbleData.length>0){
				angular.forEach(bubbleData,function(bubble,index){
					var xval=new Date(bubble['transacttime']).toLocaleTimeString(navigator.language, 
											{hour: '2-digit', minute:'2-digit'});
					var arrIndex = categoreis.findIndex((e) => e === xval);
					if (arrIndex === -1) {
						categoreis.push(xval);
						arrIndex = categoreis.length-1;
					}
					var alerttype = bubble['alerttype'];
					//////////////////////////////////////////
					if ((alerttype.indexOf('priceaway')>=0) || (alerttype.indexOf('notionalvalue')>=0)){
						var numerval = 0;
						if (alerttype.indexOf('priceaway')>=0) {numerval = bubble['price'];}
						if (alerttype.indexOf('notionalvalue')>=0) {numerval = bubble['notionalvalue'];}
						seriesData.push({ x: arrIndex, 
								  y: bubble['notionalvalue'], 
								  z: (numerval/bubble['conf_upper_95']), 
								  predicted: (bubble['conf_upper_95']+bubble['conf_lower_95'])/2, 
								  clientid: bubble['clientid'], 
								  symbol: bubble['symbol'],
								  alerttype:bubble['alerttype'],
								  color:'red'});
					}
					else if ((alerttype.indexOf('locateid')>=0)||
						 (alerttype.indexOf('issuetype')>=0)||
						 (alerttype.indexOf('spoofing')>=0)){
						var predval = bubble['alerttype'].split('_')[0];
						seriesData.push({ x: arrIndex, y: bubble['notionalvalue'], z: 70,
								  predicted: predval,
 								  clientid: bubble['clientid'], 
								  symbol: bubble['symbol'],
								  alerttype:bubble['alerttype'],
								  color:'red'});
					}
					
					//////////////////////////////////////////
					if(index==bubbleData.length-1){
						$scope.generateBubble(id,"Single order Outliers",seriesData,division,issueType,categoreis);
					}
				});
			}else{
				$scope.generateBubble(id,"Single order Outliers",[],division,issueType,[]);
			}
		}else{
			var chart = $('#'+id).highcharts();
			if(chart!=undefined){
				//console.log(bubbleData)
				var series=chart.series[0];
				var length=series.data.length;
				var categoreis=chart.xAxis[0].categories;
				var xval=new Date(bubbleData['transacttime']).toLocaleTimeString(navigator.language, 
											{hour: '2-digit', minute:'2-digit'});
				var arrIndex = categoreis.findIndex((e) => e === xval);
				if (arrIndex === -1) {
					categoreis.push(xval);
					arrIndex = categoreis.length-1;
				}
				var alerttype = bubbleData['alerttype'];
				chart.xAxis[0].setCategories(categoreis);
				var seriesData = $filter('filter')(series.data, { clientid: bubbleData['clientid'] }, true)[0];
				if ((alerttype.indexOf('priceaway')>=0) || (alerttype.indexOf('notionalvalue')>=0)){
					var numerval = 0;
					if (alerttype.indexOf('priceaway')>=0){numerval = bubbleData['price'];}
					if (alerttype.indexOf('notionalvalue')>=0){numerval = bubbleData['notionalvalue'];}
					chart.series[0].addPoint({ x: length, 
								   y: bubbleData['notionalvalue'], 
								   z: (numerval/bubbleData['conf_upper_95']),
					predicted: (bubbleData['conf_upper_95']+ bubbleData['conf_lower_95'])/2, 
								   clientid: bubbleData['clientid'], 
								   symbol: bubbleData['symbol'],
								   alerttype:bubbleData['alerttype'],
								   color:'red' });
				}
				else if ((alerttype.indexOf('locateid')>=0)||
					 (alerttype.indexOf('issuetype')>=0)||(alerttype.indexOf('spoofing')>=0)){
					var predval = bubbleData['alerttype'].split('_')[0];
					chart.series[0].addPoint({ x: length, 
								   y: bubbleData['notionalvalue'], 
								   z: 70, 
								   predicted: predval, 
								   clientid: bubbleData['clientid'], 
								   symbol: bubbleData['symbol'],
								   alerttype:bubbleData['alerttype'],
								   color:'red'});
				}
			}
		}
	}

	$scope.getrms=function(lastRead,division,alertData){
		var issueType=$scope[division].issue;
		$http.get(restAPIServerName+"/getRMS/"+division+"/"+issueType+"/"+lastRead+"/"+$rootScope.dateFilter).then(function(response){
			//Generate Last Read
			var d=new Date();
			$rootScope.lastRead="'"+d.getUTCFullYear()+"-"+
						("0" + (d.getUTCMonth()+1)).slice(-2)+"-"+
						("0" + (d.getUTCDate())).slice(-2)+" "+
						("0" + (d.getUTCHours())).slice(-2)+":"+
						("0" + (d.getUTCMinutes())).slice(-2)+"'";
			$scope.lastTime = new Date().toLocaleTimeString(navigator.language, {hour: '2-digit', minute:'2-digit'});
			//End of Last Read

			angular.forEach(response.data.tsData,function(divTime){
				var title=division+" "+divTime['pred_type'].replace('_'," ");
				if(divTime['pred_type'].includes("GROSS_NOTIONALVALUE")){
					divTime['pred_type']=division+"_gross_nv";
				}else if(divTime['pred_type'].includes("NET_NOTIONALVALUE")){
					divTime['pred_type']=division+"_net_nv";
				}else if(divTime['pred_type'].includes("NUM_ORDERS")){
					divTime['pred_type']=division+"_num_orders";
				}
				$rootScope.generateTimesSeriesData(divTime['pred_type'],division,divTime,title,lastRead);
			});
			$scope.generateBarData(null,response.data.Bar,'DESK',division,issueType,null,lastRead);
			$scope.generateScatterData('Client',response.data.ClientData,'Client',division,issueType,'clientid',null,lastRead);
			$scope.generateScatterData('Symbol',response.data.SymbolData,'Symbol',division,issueType,'symbol',null,lastRead);
			$scope.generateHeatMapData(response.data.OMPROCESS,'OMPROCESS',division,issueType,'omprocessid',lastRead);
			$scope.generateHeatMapData(response.data.TRADER,'Trader',division,issueType,'traderid',lastRead);
			$scope.generateBubbleData(response.data.Outlier,division,issueType,lastRead);
			if(alertData!=null){
				$scope.updateChartAlert(alertData);
			}
		});
	}

	//Initial Call
	//Get All divisions
	$http.get(restAPIServerName+"/").then(function(response){
		angular.forEach(response.data,function(response){
			var division=response.get_divisions;
			$rootScope.divisions.push(division);
			$scope[division]={anomaly:false,
					  issueTypes:[],
					  issue:'null',
					  cgvActive:false,
					  cnvActive:false,
					  cnoActive:false,
					  sgvActive:false,
					  snvActive:false,
					  snoActive:false};
			if($scope[division]!=undefined && $scope[division].issueTypes.length==0){
				$http.get(restAPIServerName+"/getIssues/"+division).then(function(response){
					$scope[division].issueTypes=response.data;
				});
			}
			$scope.getrms(null,division,null);
		})
	});

	/*
	* Web socket Update calls START.
	*/
	//Division update call
	divisionSocket.on('client_update',function (response) {
		var data=JSON.parse(response);
		if($scope[data['division']].issue=="null"){
			$rootScope.generateTimesSeriesData(data['division']+'_gross_nv',data['division'],data,'gross_nv',data['ts_et']);
			$rootScope.generateTimesSeriesData(data['division']+'_net_nv',data['division'],data,'net_nv',data['ts_et']);
			$rootScope.generateTimesSeriesData(data['division']+'_num_orders',data['division'],data,'num_orders',data['ts_et']);
			$scope.lastTime = new Date(data['ts_et']).toLocaleTimeString(navigator.language, {hour: '2-digit', minute:'2-digit'});
		}
	});

	//Desk update call
	deskSocket.on('client_update',function (response) {
		var data=JSON.parse(response);
		if($scope[data['division']].issue=="null"){
			$scope.generateBarData(data['division']+"_desk_GROSS_NOTIONALVALUE",data,
						   'DESK',data['division'],$scope[data['division']].issue,
						   'gross_nv',data['ts_et']);
			$scope.generateBarData(data['division']+"_desk_NET_NOTIONALVALUE",data,
						   'DESK',data['division'],$scope[data['division']].issue,
						   'net_nv',data['ts_et']);
			$scope.generateBarData(data['division']+"_desk_NUM_ORDERS",data,
						   'DESK',data['division'],$scope[data['division']].issue,
						   'num_orders',data['ts_et']);
		}
	});

	//Client update call
	clientSocket.on('client_update',function (response) {
		var data=JSON.parse(response);
		if(data['isanom_gross_nv']==true){
			$scope.alertCount++;
			$scope.alerts.push({description:data['clientid'],
					    name:data['clientid'],
					    time:data['ts_et'],
					    chartId:data['division']+'_client_pred_vs_actual_GROSS_NOTIONALVALUE',
					    type:'scatter',
					    x:data['gross_nv'], 
					    y:Math.round(data['pred_factors'][0]*100)/100,
					    issue:'null',
					    division:data['division']});
		}
		if(data['isanom_net_nv']==true){
			$scope.alertCount++;
			$scope.alerts.push({description:data['clientid'],
					    name:data['clientid'],
					    time:data['ts_et'],
					    chartId:data['division']+'_client_pred_vs_actual_NET_NOTIONALVALUE',
					    type:'scatter',
					    x:data['net_nv'], 
					    y:Math.round(data['pred_factors'][1]*100)/100,
					    issue:'null',
					    division:data['division']});
		}
		if(data['isanom_num_orders']==true){
			$scope.alertCount++;
			$scope.alerts.push({description:data['clientid'],
					    name:data['clientid'],
					    time:data['ts_et'],
					    chartId:data['division']+'_client_pred_vs_actual_NUM_ORDERS',
					    type:'scatter',
					    x:data['num_orders'], 
					    y:Math.round(data['pred_factors'][2]*100)/100,
					    issue:'null',
					    division:data['division']});
		}
		if($scope[data['division']].issue=="null"){
			$scope.generateScatterData(data['division']+'_client_pred_vs_actual_GROSS_NOTIONALVALUE',data,
						   'Client',data['division'],$scope[data['division']].issue,
						   'clientid','gross_nv',data['ts_et']);
			$scope.generateScatterData(data['division']+'_client_pred_vs_actual_NET_NOTIONALVALUE',data,
						   'Client',data['division'],$scope[data['division']].issue,
						   'clientid','net_nv',data['ts_et']);
			$scope.generateScatterData(data['division']+'_client_pred_vs_actual_NUM_ORDERS',data,
						   'Client',data['division'],$scope[data['division']].issue,
						   'clientid','num_orders',data['ts_et']);
		}
	});

	//Symbol update call
	symbolSocket.on('client_update',function (response) {
		var data=JSON.parse(response);
		if(data['isanom_gross_nv']==true){
			$scope.alertCount++;
			$scope.alerts.push({description:data['symbol'],
					    name:data['symbol'],
					    time:data['ts_et'],
					    chartId:data['division']+'_symbol_pred_vs_actual_GROSS_NOTIONALVALUE',
					    type:'scatter',
					    x:data['gross_nv'], 
					    y:Math.round(data['pred_factors'][0]*100)/100,
					    issue:'null',
					    division:data['division']});
		}
		if(data['isanom_net_nv']==true){
			$scope.alertCount++;
			$scope.alerts.push({description:data['symbol'],
					    name:data['symbol'],
					    time:data['ts_et'],
					    chartId:data['division']+'_symbol_pred_vs_actual_NET_NOTIONALVALUE',
					    type:'scatter',
					    x:data['net_nv'], 
					    y:Math.round(data['pred_factors'][1]*100)/100,
					    issue:'null',
					    division:data['division']});
		}
		if(data['isanom_num_orders']==true){
			$scope.alertCount++;
			$scope.alerts.push({description:data['symbol'],
					    name:data['symbol'],
					    time:data['ts_et'],
					    chartId:data['division']+'_symbol_pred_vs_actual_NUM_ORDERS',
					    type:'scatter',
					    x:data['num_orders'], 
					    y:Math.round(data['pred_factors'][2]*100)/100,
					    issue:'null',
					    division:data['division']});
		}
		if($scope[data['division']].issue=="null"){
			$scope.generateScatterData(data['division']+'_symbol_pred_vs_actual_GROSS_NOTIONALVALUE',data,
						   'Symbol',data['division'],$scope[data['division']].issue,
						   'symbol','gross_nv',data['ts_et']);
			$scope.generateScatterData(data['division']+'_symbol_pred_vs_actual_NET_NOTIONALVALUE',data,
						   'Symbol',data['division'],$scope[data['division']].issue,
						   'symbol','net_nv',data['ts_et']);
			$scope.generateScatterData(data['division']+'_symbol_pred_vs_actual_NUM_ORDERS',data,
						   'Symbol',data['division'],$scope[data['division']].issue,
						   'symbol','num_orders',data['ts_et']);
		}
	});

	//Traader update call
	traderSocket.on('client_update',function (response) {
		var data=JSON.parse(response);
		if(data['isanom']==true){
			$scope.alertCount++;
			$scope.alerts.push({description:data['traderid'],
					    name:data['traderid'],
					    time:data['ts_et'],
					    chartId:data['division']+"_Trader",
					    type:'heatMap',
					    issue:'null',
					    division:data['division']});
		}
		if($scope[data['division']].issue=="null"){
			$scope.generateHeatMapData(data,'Trader',data['division'],$scope[data['division']].issue,'traderid',data['ts_et']);
		}
	});

	//OMPROCESS update call
	omprocessSocket.on('client_update',function (response) {
		var data=JSON.parse(response);
		if(data['isanom']==true){
			$scope.alertCount++;
			$scope.alerts.push({description:data['omprocessid'],
					    name:data['omprocessid'],
					    time:data['ts_et'],
					    chartId:data['division']+"_OMPROCESS",
					    type:'heatMap',
					    issue:'null',
					    division:data['division']});
		}
		if($scope[data['division']].issue=="null"){
			$scope.generateHeatMapData(data,'OMPROCESS',data['division'],$scope[data['division']].issue,'omprocessid',data['ts_et']);
		}
	});

	//Outlier update call
	outlierSocket.on('single_event_update',function (response) {
		var data=JSON.parse(response);
		$scope.generateBubbleData(data,data['division'],$scope[data['division']].issue,data['transacttime']);
	});

	//Division Issue Type update call
	divisionIssueSocket.on('client_update',function (response) {
		var data=JSON.parse(response);
		if($scope[data['division']].issue==data['issuetype']){
			$rootScope.generateTimesSeriesData(data['division']+'_gross_nv',data['division'],data,'gross_nv',data['ts_et']);
			$rootScope.generateTimesSeriesData(data['division']+'_net_nv',data['division'],data,'net_nv',data['ts_et']);
			$rootScope.generateTimesSeriesData(data['division']+'_num_orders',data['division'],data,'num_orders',data['ts_et']);
			$scope.lastTime = new Date(data['ts_et']).toLocaleTimeString(navigator.language, {hour: '2-digit', minute:'2-digit'});
		}
	});

	//Desk  Issue Type update call
	deskIssueSocket.on('client_update',function (response) {
		var data=JSON.parse(response);
		if($scope[data['division']].issue==data['issuetype']){
			$scope.generateBarData(data['division']+"_desk_GROSS_NOTIONALVALUE",data,
						   'DESK',data['division'],$scope[data['division']].issue,
						   'gross_nv',data['ts_et']);
			$scope.generateBarData(data['division']+"_desk_NET_NOTIONALVALUE",data,
						   'DESK',data['division'],$scope[data['division']].issue,
						   'net_nv',data['ts_et']);
			$scope.generateBarData(data['division']+"_desk_NUM_ORDERS",data,
						   'DESK',data['division'],$scope[data['division']].issue,
						   'num_orders',data['ts_et']);
		}
	});

	//Client Issue Type update call
	clientIssueSocket.on('client_update',function (response) {
		var data=JSON.parse(response);
		if(data['isanom_gross_nv']==true){
			$scope.alertCount++;
			$scope.alerts.push({description:data['clientid']+" in "+data['issuetype'],
					    name:data['clientid'],
					    time:data['ts_et'],
					    chartId:data['division']+'_client_pred_vs_actual_GROSS_NOTIONALVALUE',
					    type:'scatter',
					    x:data['gross_nv'], 
					    y:Math.round(data['pred_factors'][0]*100)/100,
					    issue:data['issuetype'],
					    division:data['division']});
		}
		if(data['isanom_net_nv']==true){
			$scope.alertCount++;
			$scope.alerts.push({description:data['clientid']+" in "+data['issuetype'],
					    name:data['clientid'],
					    time:data['ts_et'],
					    chartId:data['division']+'_client_pred_vs_actual_NET_NOTIONALVALUE',
					    type:'scatter',
					    x:data['net_nv'], 
					    y:Math.round(data['pred_factors'][1]*100)/100,
					    issue:data['issuetype'],
					    division:data['division']});
		}
		if(data['isanom_num_orders']==true){
			$scope.alertCount++;
			$scope.alerts.push({description:data['clientid']+" in "+data['issuetype'],
					    name:data['clientid'],
					    time:data['ts_et'],
					    chartId:data['division']+'_client_pred_vs_actual_NUM_ORDERS',
					    type:'scatter',
					    x:data['num_orders'], 
					    y:Math.round(data['pred_factors'][2]*100)/100,
					    issue:data['issuetype'],
					    division:data['division']});
		}
		if($scope[data['division']].issue==data['issuetype']){
			$scope.generateScatterData(data['division']+'_client_pred_vs_actual_GROSS_NOTIONALVALUE',data,
						   'Client',data['division'],$scope[data['division']].issue,
						   'clientid','gross_nv',data['ts_et']);
			$scope.generateScatterData(data['division']+'_client_pred_vs_actual_NET_NOTIONALVALUE',data,
						   'Client',data['division'],$scope[data['division']].issue,
						   'clientid','net_nv',data['ts_et']);
			$scope.generateScatterData(data['division']+'_client_pred_vs_actual_NUM_ORDERS',data,
						   'Client',data['division'],$scope[data['division']].issue,
						   'clientid','num_orders',data['ts_et']);
		}
	});

	//Symbol Issue Type update call
	symbolIssueSocket.on('client_update',function (response) {
		var data=JSON.parse(response);
		if(data['isanom_gross_nv']==true){
			$scope.alertCount++;
			$scope.alerts.push({description:data['symbol']+" in "+data['issuetype'],
					    name:data['symbol'],
					    time:data['ts_et'],
					    chartId:data['division']+'_symbol_pred_vs_actual_GROSS_NOTIONALVALUE',
					    type:'scatter',
					    x:data['gross_nv'], 
					    y:Math.round(data['pred_factors'][0]*100)/100,
					    issue:data['issuetype'],
					    division:data['division']});
		}
		if(data['isanom_net_nv']==true){
			$scope.alertCount++;
			$scope.alerts.push({description:data['symbol']+" in "+data['issuetype'],
					    name:data['symbol'],
					    time:data['ts_et'],
					    chartId:data['division']+'_symbol_pred_vs_actual_NET_NOTIONALVALUE',
					    type:'scatter',
					    x:data['net_nv'], 
					    y:Math.round(data['pred_factors'][1]*100)/100,
					    issue:data['issuetype'],
					    division:data['division']});
		}
		if(data['isanom_num_orders']==true){
			$scope.alertCount++;
			$scope.alerts.push({description:data['symbol']+" in "+data['issuetype'],
					    name:data['symbol'],
					    time:data['ts_et'],
					    chartId:data['division']+'_symbol_pred_vs_actual_NUM_ORDERS',
					    type:'scatter',
					    x:data['num_orders'], 
					    y:Math.round(data['pred_factors'][2]*100)/100,
					    issue:data['issuetype'],
					    division:data['division']});
		}
		if($scope[data['division']].issue==data['issuetype']){
			$scope.generateScatterData(data['division']+'_symbol_pred_vs_actual_GROSS_NOTIONALVALUE',data,
						   'Symbol',data['division'],$scope[data['division']].issue,
						   'symbol','gross_nv',data['ts_et']);
			$scope.generateScatterData(data['division']+'_symbol_pred_vs_actual_NET_NOTIONALVALUE',data,
						   'Symbol',data['division'],$scope[data['division']].issue,
						   'symbol','net_nv',data['ts_et']);
			$scope.generateScatterData(data['division']+'_symbol_pred_vs_actual_NUM_ORDERS',data,
						   'Symbol',data['division'],$scope[data['division']].issue,
						   'symbol','num_orders',data['ts_et']);
		}
	});

	//Traader Issue Type update call
	traderIssueSocket.on('client_update',function (response) {
		var data=JSON.parse(response);
		if(data['isanom']==true){
			$scope.alertCount++;
			$scope.alerts.push({description:data['traderid']+" in "+data['issuetype'],
					    name:data['traderid'],
					    time:data['ts_et'],
					    chartId:data['division']+"_Trader",
					    type:'heatMap',
					    issue:data['issuetype'],
					    division:data['division']});
		}
		if($scope[data['division']].issue==data['issuetype']){
			$scope.generateHeatMapData(data,'Trader',data['division'],
					    $scope[data['division']].issue,
					    'traderid',data['ts_et']);
		}
	});

	//OMPROCESS Issue Type update call
	omprocessIssueSocket.on('client_update',function (response) {
		var data=JSON.parse(response);
		if(data['isanom']==true){
			$scope.alertCount++;
			$scope.alerts.push({description:data['omprocessid']+" in "+data['issuetype'],
					    name:data['omprocessid'],
					    time:data['ts_et'],
					    chartId:data['division']+"_OMPROCESS",
					    type:'heatMap',
					    issue:data['issuetype'],
					    division:data['division']});
		}
		if($scope[data['division']].issue==data['issuetype']){
			$scope.generateHeatMapData(data,'OMPROCESS',data['division'],
					    $scope[data['division']].issue,
					    'omprocessid',data['ts_et']);
		}
	});
	/*
	* Web socket Update calls END
	*/

	//Update Request on issueType
	$scope.updateChart=function(issue,division){
		$scope.getrms(null,division,null);
	}

	//Update Scatter color
	$scope.updateScatter=function(division,model,id){
		var chart= $('#'+id).highcharts();
		var series=chart.series;
		var scatterObj;
		if(model!='null'){
			var scatterObj= $filter('filter')(series[0].data, { name: model }, true);
			chart.series[0].points[scatterObj[0].index].select();
			chart.series[0].points[scatterObj[0].index].graphic.toFront();
		}else{
			chart.yAxis[0].options.tickInterval =null;
			selectedPoints = chart.getSelectedPoints()[0];
			// Ensure there is any selectedPoints to unselect
			if (selectedPoints != null)
			{
				selectedPoints.select(false);
			}
		}
	}

	$scope.updateRange=function(division,model,id){
		var chart= $('#'+id).highcharts();
		var series=chart.series;
		var scatterObj;
		var min=null,max=null;
		if(model<0.3){
			min=0;
			max=model;
		}else{
			min=model;
			max=null;
		}
		if(model!='null'){
			chart.yAxis[0].options.tickInterval =min;
			chart.yAxis[0].setExtremes(min,max);
		}else{
			chart.yAxis[0].options.tickInterval =null;
			chart.yAxis[0].setExtremes(null,null);
		}
	}

	//(event.point.name,seriesType,division,issueType);
	$scope.open = function(name,seriesType,division,issueType) {
		var modalInstance =  $uibModal.open({
		  templateUrl: "views/client_indiv.html",
		  controller: "indivContentCtrl",
		  resolve: {
			   client: function(){
				   return name;
			   },
			   seriesType: function(){
				   return seriesType;
			   },
			   division: function(){
				   return division;
			   },
			   issueType: function(){
				   return issueType;
			   }
			}
		});

		modalInstance.result.then(function(response){});
	};


	$scope.updateData=function(date){
		var current=new Date();
		current.setHours(0, 0, 0, 0);
		date.setHours(0, 0, 0, 0);
		if(date.getTime()!=current.getTime()){
			$rootScope.dateFilter=($filter('date')(date, "yyyy-MM-ddThh:mm:ssZ"));
			divisionSocket.disconnect();
			deskSocket.disconnect();
			clientSocket.disconnect();
			symbolSocket.disconnect();
			traderSocket.disconnect();
			omprocessSocket.disconnect();
			outlierSocket.disconnect();
			divisionIssueSocket.disconnect();
			deskIssueSocket.disconnect();
			clientIssueSocket.disconnect();
			symbolIssueSocket.disconnect();
			traderIssueSocket.disconnect();
			omprocessIssueSocket.disconnect();
		}else{
			$rootScope.dateFilter='NULL';
			divisionSocket.connect();
			deskSocket.connect();
			clientSocket.connect();
			symbolSocket.connect();
			traderSocket.connect();
			omprocessSocket.connect();
			outlierSocket.connect();
			divisionIssueSocket.connect();
			deskIssueSocket.connect();
			clientIssueSocket.connect();
			symbolIssueSocket.connect();
			traderIssueSocket.connect();
			omprocessIssueSocket.connect();
		}
		angular.forEach($rootScope.divisions,function(division){
			$scope.getrms(null,division,null);
		})
	}

	$scope.updateChartAlert=function(alertData){
		var chart=$('#'+alertData.chartId).highcharts()
		var series=chart.series;
		var obj= $filter('filter')(series[0].data, { name: alertData.name }, true);
		chart.xAxis[0].setExtremes(obj[0].x,obj[0].x);
		chart.yAxis[0].setExtremes(obj[0].y,obj[0].y);
		chart.showResetZoom();
	}
	
	$scope.getInfo=function(alertData){
		if(alertData.type!='heatMap'){
			if(alertData.issue!=undefined){
				if($scope[alertData.division].issue!=alertData.issue){
					$scope[alertData.division].issue=alertData.issue;
					$scope.getrms(null,alertData.division,alertData);					
				}else{
					$scope.updateChartAlert(alertData);
				}
			}
		}
	}
	
	//On compliance tab click
	$scope.complianceAnom=function(){
		var seriesType="division";
		var division="Equity";
		var issueType=$scope[division].issue;
		var lastRead=null;
		var chart=$('#Equity_gross_nv_compliance').highcharts();						
		if(chart==undefined){
			$http.get(restAPIServerName+"/getTs/"+seriesType.toUpperCase()+"/'"+division+"'/"+issueType+"/"+lastRead+"/"+$rootScope.dateFilter).then(function(response){
				$scope.divTimeSeries=response.data;
				angular.forEach($scope.divTimeSeries,function(divTime){
					if(divTime['division']==division){
						var title=seriesType+" "+divTime['pred_type'].replace('_'," ");
						if(divTime['pred_type'].includes("GROSS_NOTIONALVALUE")){
							divTime['pred_type']=division+"_gross_nv_compliance";	
							$rootScope.generateTimesSeriesData(divTime['pred_type'],division,divTime,title,lastRead);
						}else if(divTime['pred_type'].includes("NUM_ORDERS")){
							divTime['pred_type']=division+"_num_orders_compliance";
							$rootScope.generateTimesSeriesData(divTime['pred_type'],division,divTime,title,lastRead);
						}
					}
				})
				$scope.indivLastTime = new Date().toLocaleTimeString(navigator.language, {hour: '2-digit', minute:'2-digit'});
			});
		}
		
	}
	
	//On fraud detection tab click
	$scope.fraudDetection=function(){
		var seriesType="division";
		var division="Equity";
		var issueType=$scope[division].issue;
		var lastRead=null;
		var chart=$('#Equity_gross_nv_fraud').highcharts();						
		if(chart==undefined){
			$http.get(restAPIServerName+"/getTs/"+seriesType.toUpperCase()+"/'"+division+"'/"+issueType+"/"+lastRead+"/"+$rootScope.dateFilter).then(function(response){
				$scope.divTimeSeries=response.data;
				angular.forEach($scope.divTimeSeries,function(divTime){
					if(divTime['division']==division){
						var title=seriesType+" "+divTime['pred_type'].replace('_'," ");
						if(divTime['pred_type'].includes("GROSS_NOTIONALVALUE")){
							divTime['pred_type']=division+"_gross_nv_fraud";
							$rootScope.generateTimesSeriesData(divTime['pred_type'],division,divTime,title,lastRead);
						}else if(divTime['pred_type'].includes("NUM_ORDERS")){
							divTime['pred_type']=division+"_num_orders_fraud";
							$rootScope.generateTimesSeriesData(divTime['pred_type'],division,divTime,title,lastRead);
						}
					}
				})
				$scope.indivLastTime = new Date().toLocaleTimeString(navigator.language, {hour: '2-digit', minute:'2-digit'});
			});
		}
		
	}
	
	//On 2nd line of defnce Tab click calls below function
	$scope.backTest=function(){
		$('.que').show();
		$('.email').hide();
		$('.report').hide();
		$('.rangepicker').hide();
		$scope.showNotify=false;
		$scope.today = moment();
		$scope.highlightDays = [
			{date: moment().subtract(10, "days").startOf('day'), css: 'holiday', selectable: true},
			{date: moment().subtract(8, "days").startOf('day'), css: 'holiday', selectable: true},
			{date: moment().subtract(6, "days").startOf('day'), css: 'holiday', selectable: true},
			{date: moment().subtract(2, "days").startOf('day'), css: 'holiday', selectable: true}
		];
		
		//Backtest available or not checking
		$scope.checkBackTest=function(){
			var countOfSame=0;
			$rootScope.existed=[];
			$rootScope.notExisted=[];
			angular.forEach($scope.backtest.datesArray,function(dates,index){
				var date=moment(dates);
				if ($scope.highlightDays.filter(e => moment(e.date).isSame(date)).length > 0) {
					countOfSame++;
					$rootScope.existed.push(date);
				}else{
					$rootScope.notExisted.push(date);
				}
				if(index==$scope.backtest.datesArray.length-1){
					$('.rangepicker').hide();
					if(countOfSame>0){
						//Available back test calls this function
						$('.report').show();
						$scope.getBackTest();
					}else{
						$('.email').show();
					}
				}
			});
		}
		
		//Shows date range picker
		$( document ).ready(function() {
			$("#submit-btn").click(function() {
				if($scope.backtest.appName!=undefined && $scope.backtest.appName!=''){
					$('.que').hide();
					$('.rangepicker').show();
				}
			})
		});
	}
	
	//TO get existing back test call this function
	$scope.getBackTest=function(){		 
		var count=0;
		
		function nFormatter(num, digits,isCurrency) {
			if (isNaN(num)) return num;
			var negative="";
			if(num<0){
				negative="-";
				num=Math.abs(num);
			}
			if(isCurrency){
				negative=negative+'$';
			}
			var si = [
				{ value: 1, symbol: "" },
				{ value: 1E3, symbol: "K" },
				{ value: 1E6, symbol: "M" },
				{ value: 1E9, symbol: "B" },
				{ value: 1E12, symbol: "T" },
				{ value: 1E15, symbol: "P" },
				{ value: 1E18, symbol: "E" }
			];
			var rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
			var i;
			for (i = si.length - 1; i > 0; i--) {
			if (num >= si[i].value) {
			  break;
			}
			}
			return negative+(num / si[i].value).toFixed(digits).replace(rx, "$1") + si[i].symbol;
		}
			
		$scope.multlevelPie=function(chartid,title,seriesData){
			Highcharts.chart(chartid, {
				chart: {
					width:512,
					height:512,
					backgroundColor:'transparent',
					style: {
						fontFamily:'Montserrat'
					},
					plotBackgroundColor: null,
					plotBorderWidth: null,
					events: {
					  redraw: function() {
						if (this.series[0].drillUpButton) {
						  this.series[0].drillUpButton.hide();
						}
					  }
					}
				},
				title: {
					align: 'center',
					style: {
						color: '#c1ffff',
						fontWeight: 'bold',
					},
					text: title
				}, plotOptions: {
					sunburst: {
						colors: ['#004ba6','#b01815','#f4b600','#3b8d3b','#1774d3','#cb6a1d','#a40c5f'],
					}
				},
				series: [{
					type: "sunburst",
					data: seriesData,
					allowDrillToNode: true,
					cursor: 'pointer',
					dataLabels: {
						format: '{point.value}',
						filter: {
							property: 'innerArcLength',
							operator: '>',
							value: 16
						}
					},
					levels: [{
						level: 1,
						levelIsConstant: false,
						dataLabels: {
							filter: {
								property: 'outerArcLength',
								operator: '>',
								value: 64
							}
						}
					}, {
						level: 2,
						colorByPoint: true
					},
					{
						level: 3,
						colorVariation: {
							key: 'brightness',
							to: -0.5
						}
					}, {
						level: 4,
						colorVariation: {
							key: 'brightness',
							to: 0.5
						}
					}]

				}],
				tooltip: {
					headerFormat: "",
					pointFormat: '{point.value}'
				}
			});
		}
		
		
		//Outliers
		$scope.multlevelPie("single_order","Single Order Anomalies",[{
				'id': '0.0',
				'parent': '',
				'name': 'Single Order Anomalies'
			},{
				'id': '1.1',
				'parent': '0.0',
				'name': 'Price Away'
			}, {
				'id': '1.2',
				'parent': '0.0',
				'name': 'Spoofing'
			},{
				'id': '1.3',
				'parent': '0.0',
				'name': 'Low Volatility'
			},{
				'id': '2.1',
				'parent': '1.1',
				'name': 'Primary',
				'value': 104957438
			},{
				'id': '2.2',
				'parent': '1.1',
				'name': 'Secondary',
				'value': 57310019
			},{
				'id': '3.1',
				'parent': '1.2',
				'name': 'Primary',
				'value': 78798889
			},{
				'id': '3.2',
				'parent': '1.2',
				'name': 'Secondary',
				'value': 78755522
			},{
				'id': '4.1',
				'parent': '1.3',
				'name': 'Primary',
				'value': 78978945
			},{
				'id': '4.2',
				'parent': '1.3',
				'name': 'Secondary',
				'value': 78978985
			}]
		);

		$scope.multlevelPie("aggregate","Aggregate Anomalies",[{
				'id': '0.0',
				'parent': '',
				'name': 'Aggregate Anomalies'
			},{
				'id': '1.1',
				'parent': '0.0',
				'name': 'Price Away'
			}, {
				'id': '1.2',
				'parent': '0.0',
				'name': 'Spoofing'
			},{
				'id': '1.3',
				'parent': '0.0',
				'name': 'Low Volatility'
			},{
				'id': '2.1',
				'parent': '1.1',
				'name': 'Primary',
				'value': 104957438
			},{
				'id': '2.2',
				'parent': '1.1',
				'name': 'Secondary',
				'value': 57310019
			},{
				'id': '3.1',
				'parent': '1.2',
				'name': 'Primary',
				'value': 78798889
			},{
				'id': '3.2',
				'parent': '1.2',
				'name': 'Secondary',
				'value': 78755522
			},{
				'id': '4.1',
				'parent': '1.3',
				'name': 'Primary',
				'value': 78978945
			},{
				'id': '4.2',
				'parent': '1.3',
				'name': 'Secondary',
				'value': 78978985
			}]
		);

		$scope.multlevelPie("compliance","Compliance Issue Anomalies",[{
				'id': '0.0',
				'parent': '',
				'name': 'Aggregate Anomalies'
			},{
				'id': '1.1',
				'parent': '0.0',
				'name': 'Price Away'
			}, {
				'id': '1.2',
				'parent': '0.0',
				'name': 'Spoofing'
			},{
				'id': '1.3',
				'parent': '0.0',
				'name': 'Low Volatility'
			},{
				'id': '2.1',
				'parent': '1.1',
				'name': 'Primary',
				'value': 104957438
			},{
				'id': '2.2',
				'parent': '1.1',
				'name': 'Secondary',
				'value': 57310019
			},{
				'id': '3.1',
				'parent': '1.2',
				'name': 'Primary',
				'value': 78798889
			},{
				'id': '3.2',
				'parent': '1.2',
				'name': 'Secondary',
				'value': 78755522
			},{
				'id': '4.1',
				'parent': '1.3',
				'name': 'Primary',
				'value': 78978945
			},{
				'id': '4.2',
				'parent': '1.3',
				'name': 'Secondary',
				'value': 78978985
			}]
		);
	
	}
	
	//Anomalies Tabs Bubble graphs
	$scope.generateBubbleAnomalies=function(id,title,seriesData){
		Highcharts.chart(id, {
			chart: {
				type: 'bubble',
				zoomType: 'xy'
			},

			legend: {
				enabled: false
			},
			title: {
				align: 'center',
				text: title,
				style: {
					color: '#ffffff',
					fontWeight: 'bold',
				}
			},
			tooltip: {
				useHTML: true,
				formatter: function () {
					var tooltip='<tr><th colspan="2"><h5>'+this.point.name+'</h5></th></tr>' +
					'<tr><th>Gross NV:</th><td>'+nFormatter(this.x,2,true)+'</td></tr>' +
					'<tr><th>Actual Vs Predicted:</th><td>'+nFormatter(this.y,2,false)+'</td></tr>';
					if(this.point.symbol!=undefined){
						tooltip=tooltip+'<tr><th>Symbol:</th><td>'+this.point.symbol+'</td></tr>';
					}
					if(this.point.locateid!=undefined){
						tooltip=tooltip+'<tr><th>Locate Id:</th><td>'+this.point.locateid+'</td></tr>';
					}
					
					return '<table>'+tooltip+'</table>';
				},
				followPointer: true
			},
			series: [{
				data: seriesData
			}]

		});
	}
	
	//Anomalies Tabs scatter Plots
	$scope.generateScatterAnomalies=function(id,title,seriesData){
		Highcharts.chart(id, {
			chart: {
				type: 'scatter',
				zoomType: 'xy'
			},
			title: {
				align: 'center',
				text: title,
				style: {
					color: '#ffffff',
					fontWeight: 'bold',
				}
			},
			tooltip: {
				useHTML: true,
				formatter: function () {
					return '<table><tr><th colspan="2"><h5>'+this.point.name+'</h5></th></tr>' +
					'<tr><th>Gross NV:</th><td>'+nFormatter(this.x,2,true)+'</td></tr>' +
					'<tr><th>Actual Vs Predicted:</th><td>'+nFormatter(this.y,2,false)+'</td></tr></table>';
				},
				followPointer: true
			},
			series: [{
				data: seriesData
			}]
		});
	}
	
	//Anomaly Tabs bars
	$scope.spoofingBar=function(id,title,barData,price1Data,price2Data){
		Highcharts.chart(id, {
			chart: {
				zoomType: 'xy',
				marginTop:50,
				resetZoomButton: {
					position: {
						align: 'right',
						verticalAlign: 'top',
						x: -300,
						y: 0
					},
				},
			},
			plotOptions: {
				line: {
                                    marker: {
                                        enabled: true,
					radius: 2
                                      },
                                },
                        },
			title: {
				align: 'center',
				text: title,
				style: {
					color: '#ffffff',
					fontWeight: 'bold',
				}
			},
			xAxis: {
				labels: {
					formatter: function () {
						return msToTime(this.value);
					}
				}
			},
			yAxis: [{ // Primary yAxis
				title: {
				  text: 'Volume',
				},
				opposite: true
			  }, { // Secondary yAxis
				gridLineWidth: 1,
				title: {
				  text: 'Price',
				}
			}],
			tooltip: {
				shared: true
			},
			series: [{
				type: 'column',
				data: barData

			}, {
				name: 'Order Price',
				type: 'line', //'spline',
				yAxis: 1,
				data: price1Data
				//dashStyle: 'shortdot',
			  }, {
				name: 'Arrival Price',
				type: 'line', //'spline',
				yAxis: 1,
				color: '#ffffff',
				data: price2Data
			  }]
		});
	}
	
	//Order Capacity Pie
	$scope.pieAnomChart=function(chartid,title,seriesData,seriesname,type){
		var pieColors = (function () {
			var colors = [],
			    base = Highcharts.getOptions().colors[0],
			    i;
	
			for (i = 0; i < 10; i += 1) {
				// Start out with a darkened base color (negative brighten), and end
				// up with a much brighter color
				colors.push(Highcharts.Color(base).brighten((i - 3) / 7).get());
			}
			return colors;
		}());

		Highcharts.chart(chartid, {
			chart: {
				type: 'pie'
			},
			title: {
				align: 'center',
				text: title,
				style: {
					color: '#ffffff',
					fontWeight: 'bold',
				}
			},
			tooltip: {
				useHTML: true,
				formatter: function () {
					return '<table><tr><th colspan="2"><h5>'+this.point.name+'</h5></th></tr>' +
					'<tr><th>Num Orders:</th><td>'+nFormatter(this.point.amount,2,false)+'</td></tr></table>';
				},
				followPointer: true
			},
			plotOptions: {
				pie: {
					allowPointSelect: true,
					cursor: 'pointer',
					size: '110%',
					colors: pieColors,
					dataLabels: {
						enabled: true,
						padding:0,
						borderRadius: 0,
						connectorPadding: 0,
						distance: -10,
						formatter: function () {
							return '<b>'+this.point.name+'</b>';
						},
						style: {
							color: '#ddd830'
						}
					}
				}
			},
			series: [{
				name: seriesname,
				colorByPoint: true,
				data: seriesData
			}]
		});
	}

	//Rule 611 REGNMS
	$scope.getregnms=function(){
		$http.get(restAPIServerName+"/getRegNms").then(function(response){
			var participationData=[];
			var fillData=[];
			angular.forEach(response.data,function(data,index){
				var color=scatterBlue;
				if(data['is_anom_participationrate']==true){
					participationrate_color=red;
				}
                                else {
					participationrate_color=scatterBlue;
                                }

				if(data['is_anom_fillrate']==true){
					fillrate_color=red;
                                }
                                else {
					fillrate_color=scatterBlue;
                                }

				participationData.push({ 
					x: data['gross_notionalvalue'], 
					y: data['participationrate'], 
					z: data['num_orders'], 
					name: data['execbroker'],
					color:participationrate_color
					});
								  
				fillData.push({ 
					x: data['gross_notionalvalue'], 
					y: data['fillrate'], 
					z: data['num_orders'], 
					name: data['execbroker'],
					color:fillrate_color
					});
								  
				if(index==response.data.length-1){
					$scope.generateBubbleAnomalies("Equity_participation_anom","RegNMS ISO ORDER RATE",participationData);
					$scope.generateBubbleAnomalies("Equity_fill_anom","RegNMS ISO ORDER FILLRate",fillData);
				}
			})
		});
	}
	//Rule 15c3-5 MAR Anomalie
	$scope.getMar=function(){
		$http.get(restAPIServerName+"/getMar").then(function(response){
			var marData=[];
			angular.forEach(response.data,function(data,index){
				var color=scatterBlue;
				if(data['is_anom']==true){
					color=red;
				}
				marData.push({ x: data['gross_notionalvalue'], 
								  y: data['participationrate'], 
								  z: data['num_orders'], 
								  name: data['execbroker'],
								  color:color});
								  
				if(index==response.data.length-1){
					$scope.generateBubbleAnomalies("Equity_mar_anom","MARKET ACCESS RULE - ORDER HELD RATE",marData);
				}
			})
		});
	}
	
	//Rule 200 - ShortSell Anomalie
	$scope.getShortSell=function(){
		$http.get(restAPIServerName+"/getShortSellClient").then(function(response){
			var clientData=[];
			angular.forEach(response.data,function(data,index){
				var color=scatterBlue;
				if(data['is_anom']==true){
					color=red;
				}
				clientData.push({ x: data['gross_notionalvalue'], 
								  y: data['actual_vs_pred_ratio'], 
								  name: data['clientid'],
								  color:color});
								  
				if(index==response.data.length-1){
					$scope.generateScatterAnomalies("Equity_short_sell_client_anom","Client Long vs Short Prediction",clientData);
				}
			})
		});
		
		$http.get(restAPIServerName+"/getShortSellSymbol").then(function(response){
			var symbolData=[];
			angular.forEach(response.data,function(data,index){
				var color=scatterBlue;
				if(data['is_anom']==true){
					color=red;
				}
				symbolData.push({ x: data['gross_notionalvalue'], 
								  y: data['actual_vs_pred_ratio'], 
								  name: data['symbol'],
								  color:color});
								  
				if(index==response.data.length-1){
					$scope.generateScatterAnomalies("Equity_short_sell_symbol_anom","Symbol Long vs Short Prediction",symbolData);
				}
			})
		});
	}
	
	//Locate Anomalies
	$scope.getLocateAnoms=function(){
		$http.get(restAPIServerName+"/getLocateAnoms").then(function(response){
			var locateData=[];
			angular.forEach(response.data,function(data,index){
				var color=scatterBlue;
				if(data['is_anom']==true){
					color=red;
				}
				locateData.push({ x: data['gross_notionalvalue'], 
								  y: data['num_orders_with_locates'], 
								  z: data['num_orders'], 
								  name: data['clientid'],
								  symbol: data['symbol'],
								  locateid:data['locateid'],
								  color:color});
								  
				if(index==response.data.length-1){
					$scope.generateBubbleAnomalies("Equity_locate_anom","LOCATE ANOMALIES",locateData);
				}
			})
		});
	}
	
	//Locate Anomalies
	$scope.getOrderCapacityAnoms=function(){
		$http.get(restAPIServerName+"/getOrderCapacityAnoms").then(function(response){
			angular.forEach(response.data,function(data,index){
				console.log(data);
				var oCapacityData=[];
				var color=scatterBlue;
				angular.forEach(data['capacities'],function(capacity,key){
					if(data['is_anom'][key]==true){
						color=red;
					}
					else{
						color=scatterBlue;
					}
					var numOrder=data['num_orders'][key];
					oCapacityData.push({name: capacity,
								  y: numOrder,
								  amount:numOrder,
								  color:color});
					if(key==data['capacities'].length-1){
						console.log(oCapacityData);
						$scope.pieAnomChart("ocapacity"+index,data['clientid'],oCapacityData,"Order Capacity","Num_Orders");
					}
				})
			})
		});
	}
	
	//Spoofing Anomalies
	$scope.spoofingAnoms=function(){
		$http.get(restAPIServerName+"/getSpoofing").then(function(response){
			angular.forEach(response.data,function(data,key){
				var categories=[];
				var orderprice=[];
				var arrivalprice=[];
				angular.forEach(data['ordertimes'],function(times,index){
					var orderColor="#1f77b4";
					var cancelColor="#00bfbf"
					if(index==data['ordertimes'].length-1){
						orderColor=red;
						cancelColor=red;
					}
					if(categories.indexOf(new Date(times).getTime()) == -1){
						categories.push({x:new Date(times).getTime(),y:data['ordervolume'][index],color:orderColor});
						orderprice.push({x:new Date(times).getTime(),y:data['orderprice'][index],color:'#ff8215'});
						arrivalprice.push({x:new Date(times).getTime(),y:data['arrivalprice'][index],color:'#287cb7'});
					}
					if(categories.indexOf(new Date(data['ordercanceltimes'][index]).getTime()) == -1){
						categories.push({x:new Date(data['ordercanceltimes'][index]).getTime(),y:data['ordercancelvolume'][index],color:cancelColor});
					}
					if(index==data['ordertimes'].length-1){
						var title=data['clientid'][data['clientid'].length-1];
						categories.sort(function(a,b){
							return a.x - b.x;
						});
						$scope.spoofingBar("spoofing"+key,title,categories,orderprice,arrivalprice);
					}
				});
			});
		});
	}
		
	//Front running anomalies
	$scope.frontrunningAnoms=function(){
		$http.get(restAPIServerName+"/getfrontrunning").then(function(response){
			angular.forEach(response.data,function(data,key){
				var categories=[];
				var tradeprice=[];
				var arrivalprice=[];
				angular.forEach(data['client_ordertimes'],function(times,index){
					var clientColor="#1f77b4";
					var traderColor=red;
					if(index==0){
						clientColor="#ffffff";
						traderColor="#ff8c00";
					}
					if(categories.indexOf(new Date(times).getTime()) == -1){
						categories.push({x:new Date(times).getTime(),y:data['client_ordervolumes'][index],color:clientColor});
						tradeprice.push({x:new Date(times).getTime(),y:data['tradeprice'][index],color:'#ff8215'});
					}
					if(data['trader_ordertimes'][index]!=undefined && categories.indexOf(new Date(data['trader_ordertimes'][index]).getTime()) == -1){
						categories.push({x:new Date(data['trader_ordertimes'][index]).getTime(),y:data['trader_ordervolumes'][index],color:traderColor});
					}
					if(index==data['client_ordertimes'].length-1){
						var title="";//data['clientid'][data['clientid'].length-1];
						categories.sort(function(a,b){
							return a.x - b.x;
						});
						$scope.spoofingBar("frontrunning"+key,title,categories,tradeprice,arrivalprice);
					}
				});
			});
		});
	}
}

//Individual Dialog Controller
app.controller('indivContentCtrl', function($scope,client,seriesType,division,issueType,$uibModalInstance,$http,$rootScope) {
	$scope.name=client.replace('_'," ");
	$rootScope.isPopOpened=true;
	$scope.radioModel = 'Gross Notionalvalue';
	const restAPIServerName = $rootScope.restAPIServerName;
	$scope.indivLastTime = new Date().toLocaleTimeString(navigator.language, {hour: '2-digit', minute:'2-digit'});
	$scope.getTimeSeries=function(seriesType,filter,issueType,lastRead){
		$http.get(restAPIServerName+"/getTs/"+seriesType.toUpperCase()+"/'"+filter+"'/"+issueType+"/"+lastRead+"/"+$rootScope.dateFilter).then(function(response){
			$scope.divTimeSeries=response.data;
			angular.forEach($scope.divTimeSeries,function(divTime){
				if(divTime['division']==division){
					var title=seriesType+" "+divTime['pred_type'].replace('_'," ");
					if(divTime['pred_type'].includes("GROSS_NOTIONALVALUE")){
						divTime['pred_type']="gross_nv";
					}else if(divTime['pred_type'].includes("NET_NOTIONALVALUE")){
						divTime['pred_type']="net_nv";
					}else if(divTime['pred_type'].includes("NUM_ORDERS")){
						divTime['pred_type']="num_orders";
					}
					$rootScope.generateTimesSeriesData(divTime['pred_type'],filter,divTime,title,lastRead);
					//console.log(divTime['pred_type'],filter,divTime,title,lastRead);
				}
			})
			$scope.indivLastTime = new Date().toLocaleTimeString(navigator.language, {hour: '2-digit', minute:'2-digit'});
		});
	}

	$scope.getTopOrders=function(division,seriesType,client,issueType,start,end){
		$http.get(restAPIServerName+"/getOrders/"+division+"/"+seriesType.toUpperCase()+"/"+client+"/"+issueType+"/"+start+"/"+end).then(function(response){
			$scope.topOrders=response.data;
		});
	}

	$rootScope.getParticipation=function(division,seriesType,client,issueType,aggType,start,end){
		$http.get(restAPIServerName+"/getParticipation/"+division+"/"+seriesType.toUpperCase()+"/"+client+"/"+aggType+"/"+issueType+"/"+start+"/"+end).then(function(response){
			$scope.participation=response.data;
			var names = [...new Set($scope.participation.map(a => a['participant_type']))];
			angular.forEach(names,function(name){
				$scope[name]=[];
			})
			angular.forEach($scope.participation,function(value,index){
				if($scope[value['participant_type']]!=undefined){
					var key=value['participant_type'];
					if(value['participant_filter'].includes("OTHERS")){
						value['participant_filter']="Others";
					}
					if(value['is_anom']==true){
						$scope[key].push({name: value['participant_filter'],
								  y: value['participation_percent'],
								  amount:value['participation_amount'],
								  color:"#ae0001"});
					}else{
						$scope[key].push({name: value['participant_filter'],
								  y: value['participation_percent'],
								  amount:value['participation_amount']});
					}

					if(index==$scope.participation.length-1){
						angular.forEach(names,function(name,index){
							$rootScope.generatePieChartData('pie'+(index+1),
											name+" "+$scope.radioModel,
											$scope[name],name,aggType);
						})

					}
				}
			});
		});
	}
	$scope.updatePie=function(key){
		$scope.radioModel=key;
		key=key.replace(/ /g,"_");
		$scope.getParticipation(division,seriesType,client,issueType,key,$scope.start,$scope.end);
	}

	$scope.getTimeSeries(seriesType,client,issueType,null);
	
	$rootScope.updatePieTimes=function(start,end){
		$scope.start=start;
		$scope.end=end;
		var aggType=$scope.radioModel.replace(/ /g,"_");
		$scope.getTopOrders(division,seriesType,client,issueType,$scope.start,$scope.end);
		$scope.getParticipation(division,seriesType,client,issueType,aggType,$scope.start,$scope.end);
	}

	if($rootScope.dateFilter!='NULL'){
		var timer = setInterval(function() {
			$scope.getTimeSeries(seriesType,client,issueType,$rootScope.lastRead);
		}, 60 * 1000);
	}

	$scope.ok = function(){
		$rootScope.isPopOpened=false;
		$uibModalInstance.close("Ok");
	}

	$scope.cancel = function(){
		$rootScope.isPopOpened=false;
		$uibModalInstance.dismiss();
	}

	$scope.$on('modal.closing', function(event, reason, closed) {
		if (reason == "backdrop click" || reason == "escape key press"){
			event.preventDefault();
			$rootScope.isPopOpened=false;
			$uibModalInstance.close();
		} 
	});
});
