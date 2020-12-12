
app.controller('HomeDashBoardController',HomewsController);

HomewsController.$inject = ['$scope','$q','$http','$cookieStore','$location','$window','UserService','$filter','$interval','$routeParams','$uibModal','$rootScope'];


function HomewsController($scope,$q,$http,$cookieStore,$location,$window,UserService,$filter,$interval,$routeParams,$uibModal,$rootScope) {
	var red="#ae0001";
	// Heatmap colors
	var heatGreen="#03c72d";
	var heatBlue="#0066dc";
	// Timeseries colors
	var timeGreen="#2E8B57";
	var timeGrey="rgba(98,100,112,0.3)";
	var timeBlueEst="rgba(168,245,254,0.3)";
	var timeBlueActual='#0066dc';
	// Bar graph colors
	var barDBlue='#0066dc';
	var barMBlue='#23c0f5';
	var barLBlue='#e4f4ff';
	// Scatter colors
	/* var scatterGreen='rgba(44,160,69,1.0)'; */
	var scatterGreen='rgba(46,139,87,2.0)';
	var scatterBlue='rgba(26,162,180,1.0)';
	var scatterOrange='rgba(265,165,0,1.2)';
	var scatterRed='rgba(255,0,0,1.5)';
	
	var scatterDivisionColor='rgba(33,253,60,1.5)'; 
	var scatterDESKColor='rgba(210,74,255,1.5)'; 
	var scatterClientColor='rgba(245,254,255,1.5)'; 
	var scatterSymbolColor='rgba(241,241,41,1.5)'; 
	var scatterTradeColor='rgba(254,82,11,1.5)'; 
	var scatterSystemColor='rgba(100,181,246,1.5)'; 
	var scatter_Division_data=[];
	var scatter_Update_data=[];

	// Marker Select color
	var markerSelect='#00ff00';
	
	$scope.radioModel = 'Gross Notionalvalue';
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
  	$rootScope.restAPIServerName =  'http://ec2-54-191-51-162.us-west-2.compute.amazonaws.com:8222';
	$rootScope.restAPIServerName = 'http://159.203.112.185:6222';
	const restAPIServerName = $rootScope.restAPIServerName;
	$rootScope.isPopOpened=false;
	$scope.scatterVisible=true;
	$scope.rangeVisible=false;
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
	var x = 1; // minutes interval
	var times = []; // time array
	var tt = 0; // start time
	var limit=(cDate.getHours())*60+(cDate.getMinutes())

	// loop to increment the time and push results in array
	for (var i=0;tt<24*60; i++) {
		var hh = Math.floor(tt/60); // getting hours of day in 0-24 format
		var mm = (tt%60); // getting minutes of the hour in 0-55 format
		times[i] = ("0" + (hh)).slice(-2) + ':' + ("0" + mm).slice(-2)+':00'; // pushing
																				// data
																				// in
																				// array
																				// in
																				// [00:00:00
																				// -
																				// 24:00:00
																				// format]
		tt = tt + x;
	}
	$scope.lastRead=null;

	// Get Issue type
	
		$scope.modelfeatures=[];
		$scope.issueType1='ALL';
	// if($scope[division]!=undefined && $scope[division].issueTypes.length==0){
			$http.get(restAPIServerName+"/getModelLists").then(function(response){
				$scope.modelfeatures=response.data;
				$scope.issueType1='ALL';
			});
	// }
		
	// Get Model Data
		$scope.getScatterdata=function(model,id,issueType){
			$scope.scatterVisible=true;
			$scope.rangeVisible=false;
			$scope.scatterdata=[];
			  var seriesData2=[];
			     $('#dibtn'+id).toggleClass("btn"+id+"active");
		 
			if(scatter_Update_data[model+"_GROSS_NOTIONALVALUE"]!=undefined && scatter_Update_data[model+"_NET_NOTIONALVALUE"]!=undefined )
			{ 
				delete  scatter_Update_data[model+"_GROSS_NOTIONALVALUE"];
				delete scatter_Update_data[model+"_NET_NOTIONALVALUE"];
				 var filter=["GROSS_NOTIONALVALUE","NET_NOTIONALVALUE"];
			angular.forEach(filter,function(f,fIndex){
				var test=[];
				
			var id="FixedIncome_division_pred_vs_actual_"+f;
			$scope.getAllScatterData(model,f,test);
			$rootScope.scatter3d(id,model,test,model,model,f);
			 	
			});
			 	 	
			}else
			  {

				/*
				 * if((model=="CLIENT" || model=="SYMBOL") && issueType=='ALL' ){
				 * issueType='NULL'; }
				 */
			 // console.log(restAPIServerName+"/getScatterData/"+model+"/"+issueType);
				$http.get(restAPIServerName+"/getScatterData/"+model+"/"+issueType).then(function(response){
				$scope.scatterdata=response.data; 
				$scope.generateScatterData(model,$scope.scatterdata,model);
			});
			  }
		 
				
		}
			 			
		 
		$scope.dropdowndata=[];
      // Get Division List
		$http.get(restAPIServerName+"/getDivisionsList").then(function(response){
			$scope.divisionsList=response.data;
	 
			 	$scope.selectedDivision('DESK','');
		 $scope.selectedDivision('CLIENT','');
			 $scope.selectedDivision('SYMBOL','');
			  $scope.selectedDivision('TRADER','');
			   $scope.selectedDivision('OMPROCESS','');
			 $scope.getDivisionIssues('FixedIncome');
		});
		
	// Get Division Data When Click On Division Type
		$scope.selectedDivision=function(divisiondata,model){
		
			$http.get(restAPIServerName+"/getDivisionData/"+divisiondata+"/'"+model+"'").then(function(response){
				$scope.dropdowndata[divisiondata]=response.data;
			$scope.desklist=response.data;
			});
		}
	
		$scope.selectedDivisionData=function(divisiondata){ 
			$scope.getDivisionIssues(divisiondata);
			 	$scope.selectedDivision('DESK',divisiondata);
		 $scope.selectedDivision('CLIENT',divisiondata);
			 $scope.selectedDivision('SYMBOL',divisiondata);
			  $scope.selectedDivision('TRADER',divisiondata);
			   $scope.selectedDivision('OMPROCESS',divisiondata);
		 
	}

        // global options for highcharts
	Highcharts.setOptions({
		chart: {
			className:'chart-width',
			height:250,
			backgroundColor:'transparent',
			style: {
				fontFamily:'Montserrat'
			},
			zoomType:'xy',
			// Zoom button styling with out icon
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

	// Multiple Series line graph
	$rootScope.timeSeries=function(id,title,xCategories,actualSeries,estSeries,rangeSeries,division,seriesType,issueType,client){
		var isCurrency=true;
		if(id.includes('num_orders')){
			isCurrency=false;
		}
		Highcharts.chart(id, {
			chart: {
				height: 150,
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
						if ($scope.rangeVisible){
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
								$scope.updatePieTimes(division,seriesType,client,issueType,start,end);
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
								$scope.updatePieTimes(division,seriesType,client,issueType,start,end);
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

	// 3D Scatter plot for anomalies
	$rootScope.scatter3d=function(id,title,seriesData,seriesType,division,xAxisType){
		var isCurrency=true;
		if(id.includes('NUM_ORDERS')){
			isCurrency=false;
		}
		
		var chart = new Highcharts.Chart({
			chart: {
				width:500,
				height:350,
				renderTo: id,
				type: 'scatter3d',
				zoomType:false,
				animation: false,
				marginTop:35,
				options3d: {
					enabled: true,
					fitToPlot: true,
					alpha: 10,
					beta: 30,
					depth: 300,
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
				gridLineWidth: 1,
				title: {
					text: 'Ratio(%)',
					style: {
					color: 'white'
					}
					  }
			},
			xAxis: {
				gridLineWidth: 1,
				 title: {
					text: xAxisType,
					 style: {
						color: 'white'
						}
					}
			},
			zAxis: {
				gridLineWidth: 1,
				showFirstLabel: false,
					  title: {
						text: 'Number of Orders',
						style: {
						color: 'white'
							}
						}
			},
			plotOptions: {
				series: {
					point: {
						events: {
							mouseOver: function () {
								setData(this.type,
									this.name,
									this.issuetype,
									this.risk,
									nFormatter(this.range1,2,true),
									nFormatter(this.range2,2,true),
									nFormatter(this.x,2,isCurrency),
									this.y);
							}
						}
					},
					marker: {
						radius: 4,
						states: {
							select: {
								fillColor: markerSelect,
								radius:6
							}
						}
					},
					cursor: 'pointer',
					events: {
						click: function (event) {
							// $scope.open(event.point.name,seriesType,division,issueType);
							$scope.scatterVisible=false;
							$scope.rangeVisible=true;
							$scope.getTimeSeries(event.point.type,event.point.name,null,null,division);
						
						}
					},
					 turboThreshold: 3000
				},
				scatter: {
					width: 20,
					height: 20,
					depth: 200
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
	
	// Scatter plot for anomalies
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
					point: {
						events: {
                                               		mouseOver: function() {
                                              				console.log("x=", this.x + ", y=", this.y);
                                               		}
						}
					},
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


	// To generate scatter data
	$scope.generateScatterData=function(id,scatterData,type,division){
		var filter=["GROSS_NOTIONALVALUE","NET_NOTIONALVALUE"];
		var nameFilter=["gross_nv","net_nv"];
		var dataType;

		// Get Z Axis Values
		var nvData= $filter('filter')(scatterData, { pred_type: "NUM_ORDERS"}, true);

		var scatterTypeColor=scatterGreen;
		if(type=="DIVISION"){
			scatterTypeColor=scatterDivisionColor;
			dataType ="division";
		}else if(type=="DESK"){
			scatterTypeColor=scatterDESKColor;
			dataType ="desk";
		}else if(type=="CLIENT"){
			dataType='clientid';
			scatterTypeColor=scatterClientColor;
		}else if(type=="SYMBOL"){
			scatterTypeColor=scatterSymbolColor;
			dataType ="symbol";
		} else if(type=="TRADER"){
			scatterTypeColor=scatterTradeColor;
			dataType ="traderid";
		} else if(type=="OMPROCESS"){
			scatterTypeColor=scatterTradeColor;
			dataType ="omprocessid";
		}
		var lastRead=null;
		if(lastRead==null){
			angular.forEach(filter,function(f,fIndex){
				if(division==null){
					division="FixedIncome"
				}
				var title=type+" "+f.replace('_'," ");
				var result=$filter('filter')(scatterData, { pred_type: f }, true);
				var id=division+"_division_pred_vs_actual_"+f;
				var anomalyCount=0;
				var seriesData=[];
				$scope[division][type.toLowerCase()+"_"+f]=[];
				$scope[division][type.toLowerCase()+"_"+nameFilter[fIndex]+"series"]={};
				$scope.anomalies=[];
				angular.forEach(result,function(clientGross,index){
					name=clientGross[dataType];


					// Get Y Axis Values
					var yval = 0; 
					if(clientGross.ratio==null){
						yval=0;
					}else{
						yval=clientGross.ratio;
					}


					var issuetype = clientGross['issuetype'];
					var range1 = clientGross['conf_upper_95'];
                                        var range2 = clientGross['conf_lower_95'];
					
					if(clientGross['is_anom']==null||clientGross['is_anom']==false){
						var actualVspred = Math.round(yval * 100) / 100;
						var scatterColor;							
						var scatterRadius;							
						if (actualVspred <2.0){
							scatterColor = scatterGreen;
							scatterRadius = 3.5;
						}else if (actualVspred<3.0){
							scatterColor = scatterOrange;
							scatterRadius = 4;
						}
						else {
							scatterColor = scatterRed;
							scatterRadius = 5;
						}
						 
						var zval=0;
						if(nvData.length<index+1 && nvData[index]==undefined)
							zval=0;
							else 
							zval=nvData[index]['actual'];
						
						$scope.anomalies.push({x:clientGross['actual'],
						y:actualVspred,
						z:zval,
						type:type,
						name:name,
						issuetype:issuetype,
						risk:f,	
						range1:range1, 	
						range2:range2, 	
						color:scatterTypeColor, 	
						marker:{radius: scatterRadius}});
					}else{
						$scope.anomalies.push({x:clientGross['actual'],
						y:Math.round(yval * 100) / 100,
						z:nvData[index]['actual'],
						type:type,	
						name:name,
						issuetype:issuetype,
						risk:f,	
						range1:range1, 	
						range2:range2, 	
						color: scatterRed,
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
						 
						 var scatterBeforeData=[];
						 angular.copy(seriesData, scatterBeforeData);
						$scope.storeScatterData(type,f,scatterBeforeData);
						$scope.getAllScatterData(type,f,seriesData);
						$rootScope.scatter3d(id,title,seriesData,type,division,f);
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
				if(chart.series[0].data[index]!=undefined){
					chart.series[0].data[index].update({x:scatterData[divType], 
									    y:Math.round(scatterData['pred_factors'][divIndex]*100)/100, 
									    color:color,
									    marker: {radius: radius}}, false);
				}
			}
		}
	}


	$scope.storeScatterData=function(scatterType,title,seriesData1){
		if(scatter_Update_data[scatterType+"_"+title]==undefined) {
			scatter_Update_data[scatterType+"_"+title]=seriesData1;
		}else if(scatter_Update_data[scatterType+"_"+title].lenth<0) {
			scatter_Update_data[scatterType+"_"+title]=seriesData1;
		}
					 
	}

	$scope.getAllScatterData=function(scatterType,title,seriesData2) {

		for(var ij=0;ij<$scope.modelfeatures.length;ij++) {
			var filter=["GROSS_NOTIONALVALUE","NET_NOTIONALVALUE"];
			angular.forEach(filter,function(f,fIndex){
			if(scatter_Update_data[$scope.modelfeatures[ij].modelfeature+"_"+f]!=undefined && scatterType!= $scope.modelfeatures[ij].modelfeature && f!=title){
    				seriesData2.push(scatter_Update_data[$scope.modelfeatures[ij].modelfeature+"_"+f][0]);
			}

			});
		} 
	}

        /* Pie chart */
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
				// Start out with a darkened base color (negative brighten), and
				// end
				// up with a much brighter color
				colors.push(Highcharts.Color(base).brighten((i - 3) / 7).get());
			}
			return colors;
		}());

		Highcharts.chart(chartid, {
			chart: {
				type: 'pie',
				height:150
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
					size: '100%',
					// colors: pieColors,
					dataLabels: {
						enabled: true,
						// padding:0,
						// borderRadius: 0,
						// connectorPadding: 0,
						// distance: -10,
						formatter: function () {
							return '<b>'+this.point.name+' </b>:'+nFormatter(this.point.y,2,false)+' %';
						},
						style: {
							color: '#ddd830'
							// color: (Highcharts.theme &&
							// Highcharts.theme.contrastTextColor) || 'black'
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
	
	
	
	// ///////////////////////////////////////////////////////
	// Generates time series data.
	$rootScope.generateTimesSeriesData=function(id,division,result,type,lastRead,seriesType,issueType,typeDivi,client){
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
					$rootScope.timeSeries(result['pred_type'],type,xSeries,actualSeries,estSeries,rangeSeries,typeDivi,seriesType,issueType,client);
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
	
	// Generates pie chart data.
	$rootScope.generatePieChartData=function(chartid,title,seriesData,seriesname,type){
		$rootScope.pieChart(chartid,title,seriesData,seriesname,type);
	}
	
	
	// time series on click scaterplot dots
	$scope.getTimeSeries=function(seriesType,filter,issueType,lastRead,division){
		$scope.name=filter;
		$scope.stype=seriesType;
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
					$rootScope.generateTimesSeriesData(divTime['pred_type'],filter,divTime,title,lastRead,seriesType,issueType,division,filter);
				}
			})
			$scope.indivLastTime = new Date().toLocaleTimeString(navigator.language, {hour: '2-digit', minute:'2-digit'});
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
	$scope.getTopOrders=function(division,seriesType,client,issueType,start,end){
		$http.get(restAPIServerName+"/getOrders/"+division+"/"+seriesType.toUpperCase()+"/"+client+"/"+issueType+"/"+start+"/"+end).then(function(response){
			$scope.topOrders=response.data;
		});
	}
	$rootScope.updatePieTimes=function(division,seriesType,client,issueType,start,end){
		$scope.start=start;
		$scope.end=end;
		var aggType=$scope.radioModel.replace(/ /g,"_");
		$scope.getTopOrders(division,seriesType,client,issueType,$scope.start,$scope.end);
		$scope.getParticipation(division,seriesType,client,issueType,aggType,$scope.start,$scope.end);
		$scope.updatePie=function(key){
			$scope.radioModel=key;
			key=key.replace(/ /g,"_");
			$scope.getParticipation(division,seriesType,client,issueType,key,$scope.start,$scope.end);
			$scope.getTopOrders(division,seriesType,client,issueType,$scope.start,$scope.end);
		}
	}
	

	$scope.back = function(){
		$scope.scatterVisible=true;
		$scope.rangeVisible=false;
	}
	
	
	// Update Scatter color
	$scope.updateScatter=function(division,model,id){ 
	$scope.updateScatterExtra(division,model,id);
	$scope.updateScatterExtra(division,model,'FixedIncome_division_pred_vs_actual_NET_NOTIONALVALUE');
	}
	
	$scope.updateScatterExtra=function(division,model,id){
		var chart= $('#'+id).highcharts();
		var series=chart.series;
		var scatterObj;
			chart.series[0].points[0].select();
		if(model!='null'){
			angular.forEach(series,function(seriess,fIndex){
				chart.series[fIndex].points[0].select();
			var scatterObj= $filter('filter')(series[fIndex].data, { name: model }, true);
			if(scatterObj.length>0)
			{
				angular.forEach(scatterObj,function(scatterObj1,fIndex1){ 
					 if($scope.get_divisions!='' && 
					 chart.series[fIndex].points[scatterObj[fIndex1].index]['division']==$scope.get_divisions)
					 {
			chart.series[fIndex].points[scatterObj[fIndex1].index].select(true,true);
			chart.series[fIndex].points[scatterObj[fIndex1].index].graphic.toFront();
					 }else  if($scope.get_divisions== undefined || $scope.get_divisions=='')
					 {
			chart.series[fIndex].points[scatterObj[fIndex1].index].select(true,true);
			chart.series[fIndex].points[scatterObj[fIndex1].index].graphic.toFront();					 			 
					 }
				});
			}
			});
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

	function setData(type, name, issuetype, risk, range1, range2, actual, zFactor)
	{
		document.getElementById('type').innerHTML=type;
		document.getElementById('name').innerHTML=name;
		if (issuetype==""){
			issuetype="ACROSS ALL ISSUETYPES";
		}
		document.getElementById('issuetype').innerHTML=issuetype;
		if(risk=="GROSS_NOTIONALVALUE"){
			risk="Gross NV";
                }
		else if(risk=="NET_NOTIONALVALUE"){
			risk="Net NV";
		}
		document.getElementById('risk').innerHTML=risk;
		document.getElementById('range').innerHTML=range2+" - "+range1;
		document.getElementById('actual').innerHTML=actual;
		document.getElementById('zval').innerHTML=zFactor;
	}
	


	// Get Issue type
	$scope.getDivisionIssues=function(division){
		if($scope[division]!=undefined && $scope[division].issueTypes.length==0){
			$http.get(restAPIServerName+"/getIssues/"+division).then(function(response){
				$scope[division].issueTypes=response.data;
				$scope.dropdowndata.issueTypes=response.data;
			});
		}
	}
	
	// Update Request on issueType
	$scope.updateChart=function(issue,division){
		// $scope.getrms(null,division,null);
		$scope.issueType1=issue;
	}

}



