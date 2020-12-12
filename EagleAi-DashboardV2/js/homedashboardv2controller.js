
app.controller('HomeDashBoardV2Controller',HomewsController);

HomewsController.$inject = ['$scope','$q','$http','$cookieStore','$location','$window','UserService','$filter','$interval','$routeParams','$uibModal','$rootScope','$interval'];


function HomewsController($scope,$q,$http,$cookieStore,$location,$window,UserService,$filter,$interval,$routeParams,$uibModal,$rootScope,$interval) {
$scope.blinkanamoly='blinkanamolystop';
$scope.heightsize=100;
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
	var scatterTradeColor='rgba(202,241,135,1.5)'; 
	var scatterSystemColor='rgba(100,181,246,1.5)'; 
	$scope.scatterColors= {"DIVISION":"rgba(33,253,60,1.5)" ,"DESK":"rgba(210,74,255,1.5)", "CLIENT":"rgba(245,254,255,1.5)" ,
            "SYMBOL":"rgba(241,241,41,1.5)"   ,
            "TRADER":"rgba(202,241,135,1.5)"  ,
            "OMPROCESS":"rgba(100,181,246,1.5)"  };
	var scatter_Division_data=[];
	var scatter_Update_data=[];
	$scope.isanom_gross_nv=false;
	$scope.isanom_net_nv=false;
	$scope.isanom_num_orders=false;
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
        $rootScope.restAPIServerName = 'http://eai-node:3000';
	const restAPIServerName = $rootScope.restAPIServerName;
	$rootScope.isPopOpened=false;
	$scope.scatterVisible=true;
	$scope.rangeVisible=false;
	$scope.detailsAnalysis=true;
	$scope.equityOutliers=false;
	$scope.fixedOutliers=false;
	
	$scope.anomDivision="FIXED INCOME";
	$scope.anomGnv="$525.00";
    $scope.anomNnv="$1724.00";
    $scope.anomNoo="1142.00";
    $scope.abnormaldata="Abnormal Gross NV";
	$scope.abnormalObj={};
    	
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
		times[i] = ("0" + (hh)).slice(-2) + ':' + ("0" + mm).slice(-2)+':00'; 
		// pushing data in array in[00:00:00  - 24:00:00 format]
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
		$('#showScatterData').hide();
	// Get Model Data
		$scope.getScatterdata=function(model,id,issueType){
			$('#showScatterData').hide();
			$scope.heightsize=90;
			$scope.scatterVisible=true;
			$scope.rangeVisible=false;
			$scope.detailsAnalysis=true;
			$scope.trendAnalysisPie=false;
			$scope.trendAnalysisTime=false;
			$scope.scatterdata=[];
			  var seriesData2=[];
			   //  $('#dibtn'+id).toggleClass("btn"+id+"active");
			scatter_Update_data=[];
			if(scatter_Update_data[model+"_GROSS_NOTIONALVALUE"]!=undefined && scatter_Update_data[model+"_NET_NOTIONALVALUE"]!=undefined )
			{ 
			document.getElementById('initialload').style.visibility="visible";
				delete  scatter_Update_data[model+"_GROSS_NOTIONALVALUE"];
				delete scatter_Update_data[model+"_NET_NOTIONALVALUE"];
				delete scatter_Update_data[model+"_NUM_ORDERS"];
				 var filter=["GROSS_NOTIONALVALUE","NET_NOTIONALVALUE","NUM_ORDERS"];
			angular.forEach(filter,function(f,fIndex){
				var test=[];
				
			var id="FixedIncome_division_pred_vs_actual_"+f;
			$scope.getAllScatterData(model,f,test);
			/* $rootScope.scatter3d(id,model,test,model,model,f); */
			$scope.scatterAnamolies(id,model,test,model,model,f);
			 	
			});
			document.getElementById('initialload').style.visibility="hidden";
			}else
			  {		
				document.getElementById('initialload').style.visibility="visible";
				$http.get(restAPIServerName+"/getScatterData/"+model+"/"+issueType).then(function(response){
				$scope.scatterdata=response.data; 
				$scope.generateScatterData(model,$scope.scatterdata,model);
				$('#showScatterData').show();
			});
			  }
		}
			 			
		 
		$scope.dropdowndata=[];
      // Get Division List
		$http.get(restAPIServerName+"/getDivisionsList").then(function(response){
			$scope.divisionsList=response.data;
			angular.forEach($scope.modelfeatures,function(model,fIndex){
				if(fIndex!=0){
				$scope.selectedDivision(model.descr,'');}
			});
			$scope.getDivisionIssues('NULL');
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
			   angular.forEach($scope.modelfeatures,function(model,fIndex){
					if(fIndex!=0){
					$scope.selectedDivision(model.descr,divisiondata);}
				});
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
		var risk = title.substr(title.indexOf(" ") + 1);
		var isCurrency=true;
		var heightsize='250';
		var xtype='';
		if(id.includes('num_orders')|| id.includes('Num_Orders')){
			isCurrency=false;
		}
			if(id=='net_nv' || id=='num_orders'|| id=='gross_nv')
			{
			heightsize='150';
			} else if(id.includes('Trend')){
				xtype=''; //datetime
				heightsize='250';
			}
			
		Highcharts.chart(id, {
			chart: { 
				zoomType: 'x',
				height:heightsize,
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
				type: xtype,
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
								if(start!=$scope.start || end!=$scope.end){
									$scope.updatePieTimes(division,seriesType,client,issueType,start,end);
								}else
									document.getElementById('load').style.visibility="hidden";
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
								if(start!=$scope.start || end!=$scope.end){
									$scope.updatePieTimes(division,seriesType,client,issueType,start,end);
								}else
									document.getElementById('load').style.visibility="hidden";
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
					connectNulls: true,
					showInLegend: true
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
					/*
					 * setData(seriesType, division, issueType, risk,
					 * nFormatter(this.points[1].point.low,2,isCurrency),
					 * nFormatter(this.points[1].point.high,2,isCurrency),
					 * nFormatter(this.points[0].y,2,isCurrency), null);
					 */
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
				width:470,
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
							$scope.detailsAnalysis=false;
							// $scope.getTimeSeries(event.point.type,event.point.name,event.point.issuetype,null,division);
							$scope.getTimeSeries(event.point.type,event.point.name,null,null,event.point.division);
							$scope.getTrend(event.point.type,event.point.name,event.point.issuetype,null,event.point.division);
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
               /*
				 * mouseOver: function() { console.log("x=", this.x + ", y=",
				 * this.y); }
				 */
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
						radius: 2,
						states: {
							select: {
								fillColor: markerSelect,
								radius:8
							}
						}
					},
					cursor: 'pointer',
					events: {
					/*
					 * click: function (event) {
					 * $scope.open(event.point.name,seriesType,division,issueType); }
					 */
					click: function (event) {
						// $scope.open(event.point.name,seriesType,division,issueType);
						$scope.scatterVisible=false;
						$scope.rangeVisible=true;
						$scope.detailsAnalysis=false;
						// $scope.getTimeSeries(event.point.type,event.point.name,event.point.issuetype,null,division);
							if(event.point.issuetype==null){
						$scope.getTimeSeries(event.point.type,event.point.name,null,null,event.point.division);
						$scope.getTrend(event.point.type,event.point.name,null,null,event.point.division);
						}else{
							$scope.getTimeSeries(event.point.type,event.point.name,event.point.issuetype,null,event.point.division);	
							$scope.getTrend(event.point.type,event.point.name,event.point.issuetype,null,event.point.division);
						}
					}
					},
					
					turboThreshold: 20000
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
	$scope.generateScatterData=function(id,scatterData,type,division,issueType,dataType,divType,lastRead){
		var filter=["GROSS_NOTIONALVALUE","NET_NOTIONALVALUE","NUM_ORDERS"];
		var nameFilter=["gross_nv","net_nv","num_orders"];
		var dataType; 
		if(scatterData.length==undefined)
			{ 
			var setArray=[];
			setArray.push(scatterData);
			scatterData=setArray;
			}
		  
		// Get Z Axis Values
		var nvData= $filter('filter')(scatterData, { pred_type: "NUM_ORDERS"}, true);
		type=type.toUpperCase();
		var scatterTypeColor=scatterGreen;
		/*Scatter Type Colors and dataType*/
		angular.forEach($scope.modelfeatures,function(model,fIndex){
			if(type==model.descr){
				scatterTypeColor=$scope.scatterColors[ model.descr];
				dataType =model.modelfeature; 
			}
		});
		if(lastRead==null){
			var anomalyCount=0;
			angular.forEach(filter,function(f,fIndex){
				if(division==null){
					division="FixedIncome"
				}
				var title=type+" "+f.replace('_'," ");
				var result=$filter('filter')(scatterData, { pred_type: f }, true);
				var id=division+"_division_pred_vs_actual_"+f;
				var seriesData=[];
				$scope[division][type.toLowerCase()+"_"+f]=[];
				$scope[division][type.toLowerCase()+"_"+nameFilter[fIndex]+"series"]={};
				$scope.anomalies=[];
				angular.forEach(result,function(clientGross,index){
					name=clientGross[dataType];
 
					$scope[division][type.toLowerCase()+"_"+nameFilter[fIndex]+"series"][name]=index;
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
                    var zval=0;
                	if(nvData.length<index+1 && nvData[index]==undefined)
                	zval=0;
                	else 
                	zval=nvData[index]['actual'];
                						
					if(clientGross['is_anom']==null||clientGross['is_anom']==false){
						var actualVspred = Math.round(yval * 100) / 100;
						var scatterColor=scatterTypeColor;							
						var scatterRadius=3;							
						 if (actualVspred>3.0){
							 scatterColor = scatterRed;
							scatterRadius = 4;
							
							anomalyCount++;
							$scope.alertCount++;
							$scope.alerts.push({description:name,
										name:name,
										time:clientGross['tj_timestamp'],
										chartId:id,
										type:'scatter',
										x:clientGross['actual'],
										y:Math.round(yval * 100) / 100,
										issue:issuetype,
										division:clientGross['division'],
										divType:type
										});
							
						}
						 
						$scope.anomalies.push({x:clientGross['actual'],
						y:actualVspred,
						z:zval,
						type:type,
						name:name,
						division:clientGross['division'],
						issuetype:issuetype,
						risk:f,	
						range1:range1, 	
						range2:range2, 	
						color:scatterColor, 	
						marker:{radius: scatterRadius}});
					}else{
						$scope.anomalies.push({x:clientGross['actual'],
						y:Math.round(yval * 100) / 100,
						z:zval,
						type:type,	
						name:name,
						division:clientGross['division'],
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
									issue:issuetype,
									division:clientGross['division'],
									divType:type
									});
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
						/* $rootScope.scatter3d(id,title,seriesData,type,division,f); */
						$scope.scatterAnamolies(id,title,seriesData,type,division,f);
						setInterval(function(){
							var chart = $('#'+id).highcharts();
							chart.redraw();
						}, 2000);
					}
				});
			});
			if($scope.anomalyGetCount!=undefined && $scope.anomalyGetCount!=anomalyCount && anomalyCount>0)
				{
				$scope.blinkanamoly='blinkanamoly';
				}else if(anomalyCount>0)
					{
					$scope.blinkanamoly='blinkanamoly';
					}
			$scope.anomalyGetCount=anomalyCount;
			if($scope.issueType1!='ALL'){
				 $scope.updateScatter('Issue Type',$scope.issueType1,'FixedIncome_division_pred_vs_actual_GROSS_NOTIONALVALUE');
			 }
		}else{
			var chart = $('#'+id).highcharts();
			if(chart!=undefined){
				var series=chart.series[0].data;
				var data=[];
				var color;
				var radius=3;
				var divIndex=divTypes.indexOf(divType);
				if(scatterData[0]['isanom'+"_"+divType]==null ||scatterData[0]['isanom'+"_"+divType]==false){
					color=scatterTypeColor;
				}else{
					color=red;
					radius=5;
				}
				var name=scatterData[0][dataType];
				if($scope['FixedIncome'][type.toLowerCase()+"_"+divType+"series"]!=undefined && $scope['FixedIncome'][type.toLowerCase()+"_"+divType+"series"][name]!=undefined)
					{
				var index=$scope['FixedIncome'][type.toLowerCase()+"_"+divType+"series"][name];
				if(chart.series[0].data[index]!=undefined){
					chart.series[0].data[index].update({x:scatterData[0][divType], 
									    y:Math.round(scatterData[0]['pred_factors'][divIndex]*100)/100, 
									    color:color,
									    marker: {radius: radius}}, false);
					}
					}
			}
		}
		document.getElementById('initialload').style.visibility="hidden";
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
			 var filter=["GROSS_NOTIONALVALUE","NET_NOTIONALVALUE","NUM_ORDERS"];
			angular.forEach(filter,function(f,fIndex){
			if(scatter_Update_data[$scope.modelfeatures[ij].descr+"_"+f]!=undefined && scatterType!= $scope.modelfeatures[ij].descr && f==title){
    				seriesData2.push(scatter_Update_data[$scope.modelfeatures[ij].descr+"_"+f][0]);
			}

			});
		} 
	}

        /* Pie chart */
	$rootScope.pieChart=function(chartid,title,seriesData,seriesname,type){
		var isCurrency=true;
		var heightsize=150;
		
		if(type===('Num_Orders') || type.includes('Num Orders')){
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
		if(chartid.includes('Trend')){
			heightsize='175';
		}
		Highcharts.chart(chartid, {
			chart: {
				type: 'pie',
				height:heightsize,
				renderTo: chartid
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
						distance: '5%',
						// padding:0,
						// borderRadius: 0,
						// connectorPadding: 0,
						// distance: -10,
						formatter: function () {
							return '<b style="font-size:9px">'+this.point.name+'</b>';
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
		}, function(chart) { // on complete
			if(chart.series[0].data.length<1)
				{
		    chart.renderer.text('No Data Available', 85, 100)
		        .css({
		            color: '#4572A7',
		            fontSize: '16px'
		        })
		        .add();}
		});
	}
	
	
	
	// ///////////////////////////////////////////////////////
	// Generates time series data.
	$scope.gnvAnomaly="timeseries";
	$scope.nnvAnomaly="timeseries";
	$scope.nooAnomaly="timeseries";
	$rootScope.generateTimesSeriesData=function(id,division,result,type,lastRead,seriesType,issueType,typeDivi,client){
		document.getElementById('load').style.visibility="visible";
		if(lastRead==null){
			var actualTs=result['actual_ts'];
			angular.forEach(actualTs,function(actual,index){
				result['actual_ts'][index]=actual.substring(11,17)+"00";
			});
			//var timeSeriesAnomaly= $filter('filter')(result['is_anom'], false, true);
			var timeSeriesAnomaly= $filter('filter')(result['is_anom'], true, true);
			if(timeSeriesAnomaly.length>0){
				if(id.includes("gross_nv")){
					$scope.gnvAnomaly="gnvborder";
				}else if(id.includes("net_nv")){
					$scope.nnvAnomaly="nnvborder";
				}else if(id.includes("num_orders")){
					$scope.nooAnomaly="nooborder";
				}
			}
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
					
					if(typeDivi==undefined){
						typeDivi=division;
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
		document.getElementById('load').style.visibility="visible";
		$scope.name=filter;
		$scope.stype=seriesType;
		$scope.issuedTypes=issueType;
		if(issueType=='null' || issueType==null)
		 	$scope.issuedTypes='';
		$scope.timedivision=division;
		$scope.gnvAnomaly="timeseries";
		$scope.nnvAnomaly="timeseries";
		$scope.nooAnomaly="timeseries";
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
					if(seriesType=='DIVISION'){
						$rootScope.generateTimesSeriesData(divTime['pred_type'],"",divTime,title,lastRead,seriesType,issueType,division,filter);
					}else{
					$rootScope.generateTimesSeriesData(divTime['pred_type'],filter,divTime,title,lastRead,seriesType,issueType,division,filter);}
				}
			})
			$scope.indivLastTime = new Date().toLocaleTimeString(navigator.language, {hour: '2-digit', minute:'2-digit'});
		});
	}


	$rootScope.getParticipation=function(division,seriesType,filter,issueType,aggType,start,end){
		$http.get(restAPIServerName+"/getParticipation/"+division+"/"+seriesType.toUpperCase()+"/"+filter+"/"+aggType+"/"+issueType+"/"+start+"/"+end).then(function(response){
			$scope.participation=response.data;
			if($scope.participation.length==0){
				for(var i=1;i<=5;i++){
					document.getElementById('pie'+i).innerHTML=null;
				}
			}
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
	$scope.getTopOrders=function(division,seriesType,filter,issueType,start,end){
		$http.get(restAPIServerName+"/getOrders/"+division+"/"+seriesType.toUpperCase()+"/"+filter+"/"+issueType+"/"+start+"/"+end).then(function(response){
			$scope.topOrders=response.data;
		});
	}
	$rootScope.updatePieTimes=function(division,seriesType,filter,issueType,start,end){
		$scope.start=start;
		$scope.end=end;
		var aggType=$scope.radioModel.replace(/ /g,"_");
		//$scope.getTopOrders(division,seriesType,filter,issueType,$scope.start,$scope.end);
		document.getElementById('load').style.visibility="hidden";
		$scope.getParticipation(division,seriesType,filter,issueType,aggType,$scope.start,$scope.end);
		
		$scope.updatePie=function(key){
			$scope.radioModel=key;
			key=key.replace(/ /g,"_");
			$scope.getParticipation(division,seriesType,filter,issueType,key,$scope.start,$scope.end);
			//$scope.getTopOrders(division,seriesType,filter,issueType,$scope.start,$scope.end);
		}
		$scope.topOrdersTimes=function(){
			$scope.getTopOrders(division,seriesType,filter,issueType,$scope.start,$scope.end);
		}
	}
	

	$scope.back = function(){
		$scope.scatterVisible=true;
		$scope.rangeVisible=false;
		$scope.detailsAnalysis=true;
		$scope.trendAnalysisPie=false;
		$scope.trendAnalysisTime=false;
	}
	
	
	// Update Scatter color
	$scope.updateScatter=function(division,model,id){ 
	$scope.updateScatterExtra(division,model,id);
	$scope.updateScatterExtra(division,model,'FixedIncome_division_pred_vs_actual_NET_NOTIONALVALUE');
	$scope.updateScatterExtra(division,model,'FixedIncome_division_pred_vs_actual_NUM_ORDERS');
	}
	
	$scope.updateScatterExtra=function(division,model,id){
		var chart= $('#'+id).highcharts();
		if(chart!=undefined){
		var series=chart.series;
		var scatterObj;
			chart.series[0].points[0].select(false);
			   // chart.series[0].points[0].remove(true);
		if(model!='null'){
			angular.forEach(series,function(seriess,fIndex){
				if($scope.issueType1=='ALL' || $scope.issueType1=='null'){
					  scatterObj= $filter('filter')(series[fIndex].data, { name: model  }, true);
				   }else  if($scope.issueType1== model) {	
					   scatterObj= $filter('filter')(series[fIndex].data, {   issuetype: $scope.issueType1 }, true);
					}else  {	
					   scatterObj= $filter('filter')(series[fIndex].data, { name: model , issuetype: $scope.issueType1 }, true);
					}
			if(scatterObj.length>0)
			{
				angular.forEach(scatterObj,function(scatterObj1,fIndex1){  
					 if($scope.get_divisions!='' && 
							 chart.series[fIndex].points[scatterObj[fIndex1].index]['division']==$scope.get_divisions)
					 {
			chart.series[fIndex].points[scatterObj[fIndex1].index].select(true,true);
			chart.series[fIndex].points[scatterObj[fIndex1].index].graphic.toFront();
					 }else  if(($scope.get_divisions== undefined || $scope.get_divisions==''))
					 {
			chart.series[fIndex].points[scatterObj[fIndex1].index].select(true,true);
			chart.series[fIndex].points[scatterObj[fIndex1].index].graphic.toFront();					 			 
					 }
				});
			}else 
				{
				// chart.series[0].points[0].select();
				// chart.series[0].points[0].remove(true);
				}
			});
		} 
		
		}
	}

	function setData(type, name, issuetype, risk, range1, range2, actual, zFactor)
	{
		document.getElementById('type').innerHTML=type;
		document.getElementById('name').innerHTML=name;
		if (issuetype==""){
			issuetype="ACROSS ALL ISSUETYPES";
		}else if(issuetype=="null"){
			issuetype="ISSUETYPES";
		}
		document.getElementById('issuetype').innerHTML=issuetype;
		if(risk=="GROSS_NOTIONALVALUE" || risk=="GROSS NOTIONALVALUE"){
			risk="Gross NV";
                }
		else if(risk=="NET_NOTIONALVALUE" || risk=="NET NOTIONALVALUE"){
			risk="Net NV";
		}else if(risk=="NUM_ORDERS"){
			risk="NUM ORDERS";
		}
		if(risk!=null){
		document.getElementById('risk').innerHTML=risk;
		}else{
			document.getElementById('risk').innerHTML="RiskCalc";	
		}
		if(range1!=null && range2!=null){
		document.getElementById('range').innerHTML=range2+" - "+range1;
		}else{
			document.getElementById('range').innerHTML=	"$1142.00";
		}
		if(actual!=null && actual!=undefined){
		document.getElementById('actual').innerHTML=actual;
		}else{
			document.getElementById('actual').innerHTML="";	
		}
		if(zFactor!=null && zFactor!=undefined){
		document.getElementById('zval').innerHTML=zFactor;
		}else{
			document.getElementById('zval').innerHTML="";	
		}
	}
	


	// Get Issue type
	$scope.getDivisionIssues=function(division){
		if(division!=undefined){
			$http.get(restAPIServerName+"/getIssues/"+division).then(function(response){
				$scope.dropdowndata.issueTypes=response.data;
			});
		 }
	}
	
	// Update Request on issueType
	$scope.updateChart=function(issue,division){
		$scope.issueType1=issue;
	    $scope.issueTypeData=$filter('filter')($scope.dropdowndata.issueTypes, { issuetypes: issue }, true); 
		if($scope.issueTypeData.length>0){
			$scope[$scope.issueTypeData[0].division].issue=issue;
			$scope.getrms(null,$scope.issueTypeData[0].division,null);
		}else 
		{
			$scope.getrms(null,division,null);
		}
 		$scope.get_divisions='';
		$scope.fdcrange='';
		$scope.fdcselect='';
		$scope.fdsymbolselect='';
		$scope.fdtraderselect='';
		$scope.fdopselect='';
		  $scope.intial=[];
	}






	$scope.getDivisionDesks=function(division){
		if($scope[division]!=undefined && $scope[division].desks.length==0){
			$http.get(restAPIServerName+"/getDesks/"+division).then(function(response){
				$scope[division].desks=response.data;
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


	// Heat Map
	$scope.generateHeatMap=function(id,title,seriesData,type,division,issueType){
		Highcharts.chart(id, {
			chart: {
				width:296,
			},
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
							// $scope.open(event.point.name,type,division,issueType);
							$scope.scatterVisible=false;
							$scope.rangeVisible=true;
							$scope.detailsAnalysis=false;							
							$scope.getTimeSeries(type,event.point.name,issueType,null,division);
							$scope.getTrend(type,event.point.name,issueType,null,division);
						}
					}
				}
			},
			tooltip: {
				useHTML: true,
				formatter: function () {
					/*
					 * setData(this.point.name, division, issueType, null, null,
					 * null, nFormatter(this.point.x,2,false),
					 * nFormatter(this.point.value,2,false));
					 */
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
	 
	 
	  
	 $scope.getrms=function(lastRead,division,alertData){
		//var issueType=$scope[division].issue;
		 document.getElementById('initialload').style.visibility="visible";
		if($scope.issueType1=='ALL'){
			var issueType=null;
		}else{
			var issueType=$scope.issueType1;
		}
		$http.get(restAPIServerName+"/getRMS/"+division+"/"+issueType+"/"+lastRead+"/"+$rootScope.dateFilter).then(function(response){
			// Generate Last Read
			var d=new Date();
			$rootScope.lastRead="'"+d.getUTCFullYear()+"-"+
						("0" + (d.getUTCMonth()+1)).slice(-2)+"-"+
						("0" + (d.getUTCDate())).slice(-2)+" "+
						("0" + (d.getUTCHours())).slice(-2)+":"+
						("0" + (d.getUTCMinutes())).slice(-2)+"'";
			$scope.lastTime = new Date().toLocaleTimeString(navigator.language, {hour: '2-digit', minute:'2-digit'});
			// End of Last Read
			$scope.gnvAnomaly="timeseries";
			$scope.nnvAnomaly="timeseries";
			$scope.nooAnomaly="timeseries";
 			angular.forEach(response.data.tsData,function(divTime){
				var title=division+" "+divTime['pred_type'].replace('_'," ");
				if(divTime['pred_type'].includes("GROSS_NOTIONALVALUE")){
					divTime['pred_type']=division+"_gross_nv";
				}else if(divTime['pred_type'].includes("NET_NOTIONALVALUE")){
					divTime['pred_type']=division+"_net_nv";
				}else if(divTime['pred_type'].includes("NUM_ORDERS")){
					divTime['pred_type']=division+"_num_orders";
				}
				$rootScope.generateTimesSeriesData(divTime['pred_type'],division,divTime,title,lastRead,"Division",issueType);
			});
			$scope.generateBarData(null,response.data.Bar,'DESK',division,issueType,null,lastRead);
		// $scope.generateScatterData('Client',response.data.ClientData,'Client',division,issueType,'clientid',null,lastRead);
		// $scope.generateScatterData('Symbol',response.data.SymbolData,'Symbol',division,issueType,'symbol',null,lastRead);
			$scope.generateHeatMapData(response.data.OMPROCESS,'OMPROCESS',division,issueType,'omprocessid',lastRead);
			$scope.generateHeatMapData(response.data.TRADER,'Trader',division,issueType,'traderid',lastRead);
		    $scope.generateBubbleData(response.data.Outlier,division,issueType,lastRead);
			if(alertData!=null){
				$scope.updateChartAlert(alertData);
			}
			document.getElementById('initialload').style.visibility="hidden";	
		});
	}
	  /*$scope.intial=[];
	 $scope.getSliderData=function(lastRead,type,division,alertData){
        if($scope.issueType1=='ALL'){
        	var issueType=null;
        }else {
        	issueType=$scope.issueType1;
        }
        if($scope.intial.indexOf(type+" "+division)==-1){
        	document.getElementById('initialload').style.visibility="visible";
		 //var issueType=$scope[division].issue;
			$http.get(restAPIServerName+"/getData/"+type+"/"+division+"/"+issueType+"/"+lastRead+"/"+$rootScope.dateFilter).then(function(response){
				// Generate Last Read
				var d=new Date();
				$rootScope.lastRead="'"+d.getUTCFullYear()+"-"+
							("0" + (d.getUTCMonth()+1)).slice(-2)+"-"+
							("0" + (d.getUTCDate())).slice(-2)+" "+
							("0" + (d.getUTCHours())).slice(-2)+":"+
							("0" + (d.getUTCMinutes())).slice(-2)+"'";
				$scope.lastTime = new Date().toLocaleTimeString(navigator.language, {hour: '2-digit', minute:'2-digit'});
				// End of Last Read
				if(type=='DIVISION'){
	 			angular.forEach(response.data,function(divTime){
					var title=division+" "+divTime['pred_type'].replace('_'," ");
					if(divTime['pred_type'].includes("GROSS_NOTIONALVALUE")){
						divTime['pred_type']=division+"_gross_nv";
					}else if(divTime['pred_type'].includes("NET_NOTIONALVALUE")){
						divTime['pred_type']=division+"_net_nv";
					}else if(divTime['pred_type'].includes("NUM_ORDERS")){
						divTime['pred_type']=division+"_num_orders";
					}
					$rootScope.generateTimesSeriesData(divTime['pred_type'],division,divTime,title,lastRead,"Division",issueType);
				});
				}
				
				if(type=='DESK'){
				$scope.generateBarData(null,response.data,'DESK',division,issueType,null,lastRead);
				}
				if(type=='OMPROCESS'){
				$scope.generateHeatMapData(response.data,'OMPROCESS',division,issueType,'omprocessid',lastRead);
				}
				if(type=='TRADER'){
				$scope.generateHeatMapData(response.data,'Trader',division,issueType,'traderid',lastRead);
				}
				if(type=='Outlier'){
				$scope.generateBubbleData(response.data,division,issueType,lastRead);
				}
				if(alertData!=null){
					$scope.updateChartAlert(alertData);
				}
				
				$scope.intial.push(type+" "+division);
				document.getElementById('initialload').style.visibility="hidden";
			});
        }
        
	 }
	 
	 $scope.getSliderData(null,'DIVISION','Equity',null);*/
	 
		// To generate Bar data
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
					var range1 = data['conf_upper_95'];
                    var range2 = data['conf_lower_95'];
					if (data['actual']<0){
						$scope.predup95.push({name:data['desk'],y: data['conf_lower_95'],color: barLBlue})
						$scope.eodpredup95.push({name:data['desk'],
									 y: data['eod_conf_lower_95'],
									 issuetype:issuetype,
									 color: red,
									 range1:range1, 	
									 range2:range2, 
									 seriesName:'eodpredup95',
									 actual:data['actual']})
					}
					else {
						$scope.predup95.push({
									 name:data['desk'],
									 y: data['conf_upper_95'],
									 issuetype:issuetype,
									 range1:range1, 	
									 range2:range2, 
									 color: barLBlue})
						$scope.eodpredup95.push({
									 name:data['desk'],
									 y: data['eod_conf_upper_95'],
									 issuetype:issuetype,
									 color: red,
									 range1:range1, 	
									 range2:range2, 
									 seriesName:'eodpredup95',
									 actual:data['actual']})
					}
					if(index==series.length-1){
						$scope.barSeries=[{name:"Actual",data:$scope.actual,id:"actual",range1:range1,range2:range2, shadow: {
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
									$scope.barSeries,type,division,issueType,f);
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

// To generate Heat map data
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
							    division:division,
							    divType:type});
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

	// Bar Graph
	$scope.generateBarGraph=function(id,title,categoreis,actual,seriesData,type,division,issueType,risk){
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
							// $scope.open(event.point.name,type,division,issueType);
							$scope.scatterVisible=false;
							$scope.rangeVisible=true;
							$scope.detailsAnalysis=false;
							$scope.getTimeSeries(type,event.point.name,issueType,null,division);
							$scope.getTrend(type,event.point.name,issueType,null,division);
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
					// var x=this.points[4].x;
					/*
					 * setData(type, division, issueType, risk, null, null,
					 * nFormatter(actual,2,isCurrency), this.y);
					 */
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
	
	// To generate Bubble data
	$scope.generateBubbleData=function(bubbleData,division,issueType,lastRead){
		var id=division+"_outliers";
		// console.log("Alert Received",
		// bubbleData,division,issueType,lastRead);
		if(lastRead==null){
			if(division=='FixedIncome'){
				$scope.fixedOutliers=true;
			}else if(division=='Equity'){
				$scope.equityOutliers=true;
			}
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
					// ////////////////////////////////////////
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
					
					// ////////////////////////////////////////
					if(index==bubbleData.length-1){
						$scope.generateBubble(id,"Single order Outliers",seriesData,division,issueType,categoreis);
					}
				});
			}else{
				// $scope.generateBubble(id,"Single order
				// Outliers",[],division,issueType,[]);
				if(division=='FixedIncome'){
					$scope.fixedOutliers=false;
				}else if(division=='Equity'){
					$scope.equityOutliers=false;
				}
			}
		}else{
			var chart = $('#'+id).highcharts();
			if(chart!=undefined){
				// console.log(bubbleData)
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
	// Bubble chart
	$scope.generateBubble=function(id,title,seriesData,division,issueType,categoreis){
		Highcharts.chart(id, {
			chart: {
				width:296,
				type: 'bubble',
				marginTop:15,

			},
			title: {
				text: ''
			},
			tooltip: {
				useHTML: true,
				formatter: function () {
					/*
					 * setData("Single Order", division, issueType, null, null,
					 * null, nFormatter(this.point.y,2,true),
					 * nFormatter(this.point.z,2,false));
					 */
					
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
				/*
				 * labels: { formatter: function () { return this.label; } }
				 */
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
							// $scope.open(event.point.symbol,'Symbol',division,issueType);
							$scope.scatterVisible=false;
							$scope.rangeVisible=true;
							$scope.detailsAnalysis=false;
							$scope.getTimeSeries('Symbol',event.point.symbol,event.point.issueType,null,event.point.division);
							$scope.getTrend('Symbol',event.point.symbol,event.point.issueType,null,event.point.division);
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
  $scope.getrms(null,'Equity',null);
  $scope.getrms(null,'FixedIncome',null);
	/*
	 * Web socket Update calls START.
	 */
	// Division update call
	divisionSocket.on('client_update',function (response) {
		var data=JSON.parse(response); 
        $scope.setWebscoketdata(data,"DIVISION"); 
		if($scope[data['division']].issue=="null"){
			$rootScope.generateTimesSeriesData(data['division']+'_gross_nv',data['division'],data,'gross_nv',data['ts_et']);
			$rootScope.generateTimesSeriesData(data['division']+'_net_nv',data['division'],data,'net_nv',data['ts_et']);
			$rootScope.generateTimesSeriesData(data['division']+'_num_orders',data['division'],data,'num_orders',data['ts_et']);
			$scope.lastTime = new Date(data['ts_et']).toLocaleTimeString(navigator.language, {hour: '2-digit', minute:'2-digit'});
		}
	});

	// Desk update call
	deskSocket.on('client_update',function (response) {
		var data=JSON.parse(response);
        if(data['isanom_gross_nv']==true){
			$scope.abnormalObj={};
			$scope.abnormalObj={description:data['desk'],
					    name:data['desk'],
					    time:data['ts_et'],
					    chartId:'FixedIncome_division_pred_vs_actual_GROSS_NOTIONALVALUE',
					    type:'scatter',
					    x:data['gross_nv'], 
					    y:Math.round(data['pred_factors'][0]*100)/100,
					    issue:'null',
					    division:data['division'],
					    divType:"DESK"
					    }
        	$scope.abnormaldata="Abnormal Gross NV for Desk: "+data['desk'];
        }
		$scope.setWebscoketdata(data,"DESK");
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

	// Client update call
	clientSocket.on('client_update',function (response) {
		var data=JSON.parse(response);
	//	$scope.setWebscoketdata(data,"CLIENT");
		if(data['isanom_gross_nv']==true){
			$scope.alertCount++;
			$scope.abnormalObj={};
			$scope.abnormalObj={description:data['clientid'],
					    name:data['clientid'],
					    time:data['ts_et'],
					    chartId:'FixedIncome_division_pred_vs_actual_GROSS_NOTIONALVALUE',
					    type:'scatter',
					    x:data['gross_nv'], 
					    y:Math.round(data['pred_factors'][0]*100)/100,
					    issue:'null',
					    division:data['division'],
					    divType:"CLIENT"
					    }
			$scope.alerts.push($scope.abnormalObj);
			$scope.abnormaldata="Abnormal Gross NV for Client: "+data['clientid'];
		}
		if(data['isanom_net_nv']==true){
			$scope.alertCount++;
			$scope.alerts.push({description:data['clientid'],
					    name:data['clientid'],
					    time:data['ts_et'],
					    chartId:'FixedIncome_division_pred_vs_actual_NET_NOTIONALVALUE',
					    type:'scatter',
					    x:data['net_nv'], 
					    y:Math.round(data['pred_factors'][1]*100)/100,
					    issue:'null',
					    division:data['division'],
					    divType:"CLIENT"});
		}
		if(data['isanom_num_orders']==true){
			$scope.alertCount++;
			$scope.alerts.push({description:data['clientid'],
					    name:data['clientid'],
					    time:data['ts_et'],
					    chartId:'FixedIncome_division_pred_vs_actual_NUM_ORDERS',
					    type:'scatter',
					    x:data['num_orders'], 
					    y:Math.round(data['pred_factors'][2]*100)/100,
					    issue:'null',
					    division:data['division'],
					    divType:"CLIENT"});
		}
		if($scope[data['division']].issue=="null"){
		
		  $scope.generateScatterData('FixedIncome_division_pred_vs_actual_GROSS_NOTIONALVALUE',data,
		  'Client',data['division'],$scope[data['division']].issue,
		  'clientid','gross_nv',data['ts_et']);
		  $scope.generateScatterData('FixedIncome_division_pred_vs_actual_NET_NOTIONALVALUE',data,
		  'Client',data['division'],$scope[data['division']].issue,
		  'clientid','net_nv',data['ts_et']);
		  $scope.generateScatterData('FixedIncome_division_pred_vs_actual_NUM_ORDERS',data,
		  'Client',data['division'],$scope[data['division']].issue,
		  'clientid','num_orders',data['ts_et']);
		 
		}
	});

	// Symbol update call
	symbolSocket.on('client_update',function (response) {
		var data=JSON.parse(response);
//		$scope.setWebscoketdata(data,"SYMBOL");
        
 		if(data['isanom_gross_nv']==true){
			$scope.alertCount++;
			$scope.abnormalObj={};
			$scope.abnormalObj=({description:data['symbol'],
					    name:data['symbol'],
					    time:data['ts_et'],
					    chartId:'FixedIncome_division_pred_vs_actual_GROSS_NOTIONALVALUE',
					    type:'scatter',
					    x:data['gross_nv'], 
					    y:Math.round(data['pred_factors'][0]*100)/100,
					    issue:'null',
					    division:data['division'],
					    divType:"SYMBOL"});
			$scope.alerts.push($scope.abnormalObj);
			$scope.abnormaldata="Abnormal Gross NV for Symbol: "+data['symbol'];
		}
		if(data['isanom_net_nv']==true){
			$scope.alertCount++;
			$scope.alerts.push({description:data['symbol'],
					    name:data['symbol'],
					    time:data['ts_et'],
					    chartId:'FixedIncome_division_pred_vs_actual_NET_NOTIONALVALUE',
					    type:'scatter',
					    x:data['net_nv'], 
					    y:Math.round(data['pred_factors'][1]*100)/100,
					    issue:'null',
					    division:data['division'],
					    divType:"SYMBOL"});
		}
		if(data['isanom_num_orders']==true){
			$scope.alertCount++;
			$scope.alerts.push({description:data['symbol'],
					    name:data['symbol'],
					    time:data['ts_et'],
					    chartId:'FixedIncome_division_pred_vs_actual_NUM_ORDERS',
					    type:'scatter',
					    x:data['num_orders'], 
					    y:Math.round(data['pred_factors'][2]*100)/100,
					    issue:'null',
					    division:data['division'],
					    divType:"SYMBOL"});
		}
		if($scope[data['division']].issue=="null"){
	
	  $scope.generateScatterData('FixedIncome_division_pred_vs_actual_GROSS_NOTIONALVALUE',data,
	  'Symbol',data['division'],$scope[data['division']].issue,
	  'symbol','gross_nv',data['ts_et']);
	  $scope.generateScatterData('FixedIncome_division_pred_vs_actual_NET_NOTIONALVALUE',data,
	  'Symbol',data['division'],$scope[data['division']].issue,
	  'symbol','net_nv',data['ts_et']);
	  $scope.generateScatterData('FixedIncome_division_pred_vs_actual_NUM_ORDERS',data,
	  'Symbol',data['division'],$scope[data['division']].issue,
	  'symbol','num_orders',data['ts_et']);
	
		}
	});

	// Traader update call
	traderSocket.on('client_update',function (response) {
		var data=JSON.parse(response);
	//	$scope.setWebscoketdata(data,"TRADER");
		if(data['isanom']==true){
			$scope.alertCount++;
			$scope.abnormalObj={};
			$scope.abnormalObj=({description:data['traderid'],
					    name:data['traderid'],
					    time:data['ts_et'],
					    chartId:data['division']+"_Trader",
					    type:'heatMap',
					    issue:'null',
					    division:data['division'],
					    divType:"TRADER"});
			$scope.alerts.push($scope.abnormalObj);
			$scope.abnormaldata="Abnormal Gross NV for Trader: "+data['traderid'];
		}
		if($scope[data['division']].issue=="null"){
			$scope.generateHeatMapData(data,'Trader',data['division'],$scope[data['division']].issue,'traderid',data['ts_et']);
		}
	});

	// OMPROCESS update call
	omprocessSocket.on('client_update',function (response) {
		var data=JSON.parse(response);

	//	$scope.setWebscoketdata(data,"OMPROCESS");
		if(data['isanom']==true){
			$scope.alertCount++;
			$scope.abnormalObj={};
			$scope.abnormalObj=({description:data['omprocessid'],
					    name:data['omprocessid'],
					    time:data['ts_et'],
					    chartId:data['division']+"_OMPROCESS",
					    type:'heatMap',
					    issue:'null',
					    division:data['division'],
					    divType:"OMPROCESS"});
			$scope.alerts.push($scope.abnormalObj);
			$scope.abnormaldata="Abnormal Gross NV for Omprocess: "+data['omprocessid'];
		}
		if($scope[data['division']].issue=="null"){
			$scope.generateHeatMapData(data,'OMPROCESS',data['division'],$scope[data['division']].issue,'omprocessid',data['ts_et']);
		}
	});

	// Outlier update call
	outlierSocket.on('single_event_update',function (response) {
		var data=JSON.parse(response);
		if(data['isanom_gross_nv']==true){
        	// $scope.abnormaldata="Abnormal Gross NV for OmProcess:
			// "+data['omprocess'];
        }
		//$scope.setWebscoketdata(data,"OUTLIER");
		$scope.generateBubbleData(data,data['division'],$scope[data['division']].issue,data['transacttime']);
	});

	// Division Issue Type update call
	divisionIssueSocket.on('client_update',function (response) {
		var data=JSON.parse(response);
		$scope.setWebscoketdata(data,"DIVISIONISSUE");
		// setWebscoketdata(data['division'],nFormatter(data['gross_nv'],2,isCurrency),nFormatter(data['net_nv'],2,isCurrency),data['num_orders']);
		if($scope[data['division']].issue==data['issuetype']){
			$rootScope.generateTimesSeriesData(data['division']+'_gross_nv',data['division'],data,'gross_nv',data['ts_et']);
			$rootScope.generateTimesSeriesData(data['division']+'_net_nv',data['division'],data,'net_nv',data['ts_et']);
			$rootScope.generateTimesSeriesData(data['division']+'_num_orders',data['division'],data,'num_orders',data['ts_et']);
			$scope.lastTime = new Date(data['ts_et']).toLocaleTimeString(navigator.language, {hour: '2-digit', minute:'2-digit'});
		}
	});

	// Desk Issue Type update call
	deskIssueSocket.on('client_update',function (response) {
		var data=JSON.parse(response);
		if(data['isanom_gross_nv']==true){
			$scope.abnormalObj={};
			$scope.abnormalObj={description:data['desk'],
					    name:data['desk'],
					    time:data['ts_et'],
					    chartId:'FixedIncome_division_pred_vs_actual_GROSS_NOTIONALVALUE',
					    type:'scatter',
					    x:data['gross_nv'], 
					    y:Math.round(data['pred_factors'][0]*100)/100,
					    issue:data['issuetype'],
					    division:data['division'],
					    divType:"DESK"
					    }
        	$scope.abnormaldata="Abnormal Gross NV for Desk Issue: "+data['desk'];
        }
		$scope.setWebscoketdata(data,"DESKISSUE");
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

	// Client Issue Type update call
	clientIssueSocket.on('client_update',function (response) {
		var data=JSON.parse(response);
	//	$scope.setWebscoketdata(data,"CLIENTISSUE");
		if(data['isanom_gross_nv']==true){
			$scope.alertCount++;
			$scope.abnormalObj={};
			$scope.abnormalObj={description:data['clientid']+" in "+data['issuetype'],
					    name:data['clientid'],
					    time:data['ts_et'],
					    chartId:'FixedIncome_division_pred_vs_actual_GROSS_NOTIONALVALUE',
					    type:'scatter',
					    x:data['gross_nv'], 
					    y:Math.round(data['pred_factors'][0]*100)/100,
					    issue:data['issuetype'],
					    division:data['division'],
					    divType:"CLIENT"}
			$scope.alerts.push($scope.abnormalObj);
			$scope.abnormaldata="Abnormal Gross NV for Client Issue: "+data['clientid'];
		}
		if(data['isanom_net_nv']==true){
			$scope.alertCount++;
			$scope.alerts.push({description:data['clientid']+" in "+data['issuetype'],
					    name:data['clientid'],
					    time:data['ts_et'],
					    chartId:'FixedIncome_division_pred_vs_actual_NET_NOTIONALVALUE',
					    type:'scatter',
					    x:data['net_nv'], 
					    y:Math.round(data['pred_factors'][1]*100)/100,
					    issue:data['issuetype'],
					    division:data['division'],
					    divType:"CLIENT"});
		}
		if(data['isanom_num_orders']==true){
			$scope.alertCount++;
			$scope.alerts.push({description:data['clientid']+" in "+data['issuetype'],
					    name:data['clientid'],
					    time:data['ts_et'],
					    chartId:'FixedIncome_division_pred_vs_actual_NUM_ORDERS',
					    type:'scatter',
					    x:data['num_orders'], 
					    y:Math.round(data['pred_factors'][2]*100)/100,
					    issue:data['issuetype'],
					    division:data['division'],
					    divType:"CLIENT"});
		}
		if($scope[data['division']].issue==data['issuetype']){
			$scope.generateScatterData('FixedIncome_division_pred_vs_actual_GROSS_NOTIONALVALUE',data,
						   'Client',data['division'],$scope[data['division']].issue,
						   'clientid','gross_nv',data['ts_et']);
			$scope.generateScatterData('FixedIncome_division_pred_vs_actual_NET_NOTIONALVALUE',data,
						   'Client',data['division'],$scope[data['division']].issue,
						   'clientid','net_nv',data['ts_et']);
			$scope.generateScatterData('FixedIncome_division_pred_vs_actual_NUM_ORDERS',data,
						   'Client',data['division'],$scope[data['division']].issue,
						   'clientid','num_orders',data['ts_et']);
		}
	});

	// Symbol Issue Type update call
	symbolIssueSocket.on('client_update',function (response) {
		var data=JSON.parse(response);
		//$scope.setWebscoketdata(data,"SYMBOLISSUE");
        
		if(data['isanom_gross_nv']==true){
			$scope.alertCount++;
			$scope.abnormalObj={};
			$scope.abnormalObj={description:data['symbol']+" in "+data['issuetype'],
					    name:data['symbol'],
					    time:data['ts_et'],
					    chartId:'FixedIncome_division_pred_vs_actual_GROSS_NOTIONALVALUE',
					    type:'scatter',
					    x:data['gross_nv'], 
					    y:Math.round(data['pred_factors'][0]*100)/100,
					    issue:data['issuetype'],
					    division:data['division'],
					    divType:"SYMBOL"}
			$scope.alerts.push($scope.abnormalObj);
			$scope.abnormaldata="Abnormal Gross NV for Symbol Issue: "+data['symbol'];
		}
		if(data['isanom_net_nv']==true){
			$scope.alertCount++;
			$scope.alerts.push({description:data['symbol']+" in "+data['issuetype'],
					    name:data['symbol'],
					    time:data['ts_et'],
					    chartId:'FixedIncome_division_pred_vs_actual_NET_NOTIONALVALUE',
					    type:'scatter',
					    x:data['net_nv'], 
					    y:Math.round(data['pred_factors'][1]*100)/100,
					    issue:data['issuetype'],
					    division:data['division'],
					    divType:"SYMBOL"});
		}
		if(data['isanom_num_orders']==true){
			$scope.alertCount++;
			$scope.alerts.push({description:data['symbol']+" in "+data['issuetype'],
					    name:data['symbol'],
					    time:data['ts_et'],
					    chartId:'FixedIncome_division_pred_vs_actual_NUM_ORDERS',
					    type:'scatter',
					    x:data['num_orders'], 
					    y:Math.round(data['pred_factors'][2]*100)/100,
					    issue:data['issuetype'],
					    division:data['division'],
					    divType:"SYMBOL"});
		}
		if($scope[data['division']].issue==data['issuetype']){
			$scope.generateScatterData('FixedIncome_division_pred_vs_actual_GROSS_NOTIONALVALUE',data,
						   'Symbol',data['division'],$scope[data['division']].issue,
						   'symbol','gross_nv',data['ts_et']);
			$scope.generateScatterData('FixedIncome_division_pred_vs_actual_NET_NOTIONALVALUE',data,
						   'Symbol',data['division'],$scope[data['division']].issue,
						   'symbol','net_nv',data['ts_et']);
			$scope.generateScatterData('FixedIncome_division_pred_vs_actual_NUM_ORDERS',data,
						   'Symbol',data['division'],$scope[data['division']].issue,
						   'symbol','num_orders',data['ts_et']);
		}
	});

	// Traader Issue Type update call
	traderIssueSocket.on('client_update',function (response) {
		var data=JSON.parse(response);
	//	$scope.setWebscoketdata(data,"TRADERISSUE");
		if(data['isanom']==true){
			$scope.alertCount++;
			$scope.abnormalObj={};
			$scope.abnormalObj={description:data['traderid']+" in "+data['issuetype'],
					    name:data['traderid'],
					    time:data['ts_et'],
					    chartId:data['division']+"_Trader",
					    type:'heatMap',
					    issue:data['issuetype'],
					    division:data['division'],
					    divType:"TRADER"};
			$scope.alerts.push($scope.abnormalObj);
			$scope.abnormaldata="Abnormal Gross NV for Trader Issue: "+data['traderid'];
		}
		if($scope[data['division']].issue==data['issuetype']){
			$scope.generateHeatMapData(data,'Trader',data['division'],
					    $scope[data['division']].issue,
					    'traderid',data['ts_et']);
		}
	});

	// OMPROCESS Issue Type update call
	omprocessIssueSocket.on('client_update',function (response) {
		var data=JSON.parse(response);
	//	$scope.setWebscoketdata(data,"OMPROCESSISSUE");
		if(data['isanom']==true){
			$scope.alertCount++;
			$scope.abnormalObj={};
			$scope.abnormalObj={description:data['omprocessid']+" in "+data['issuetype'],
					    name:data['omprocessid'],
					    time:data['ts_et'],
					    chartId:data['division']+"_OMPROCESS",
					    type:'heatMap',
					    issue:data['issuetype'],
					    division:data['division'],
					    divType:"OMPROCESS"};
			$scope.alerts.push($scope.abnormalObj);
			$scope.abnormaldata="Abnormal Gross NV for Omprocess Issue: "+data['omprocessid'];
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
	
	$scope.setWebscoketdata=function(data,type){
		var isCurrency=true;
		$scope.isanom_gross_nv=data['isanom_gross_nv'];
		$scope.isanom_net_nv=data['isanom_gross_nv'];;
		$scope.isanom_num_orders=data['isanom_num_orders'];; 
		if(type=="DIVISION"){
			$scope.anomDivision=type+" "+data['division'].toUpperCase();
			}else if(type=="DIVISIONISSUE"){
			$scope.anomDivision="DIVISION "+data['division'].toUpperCase()+" "+data['issuetype'].toUpperCase(); 
			}else if(type=="DESK"){
			$scope.anomDivision=type+" "+data['desk'].toUpperCase();
			}else if(type=="DESKISSUE"){
			$scope.anomDivision="DESK "+data['desk'].toUpperCase()+" "+data['issuetype'].toUpperCase();
			}
		$scope.anomGnv=nFormatter(data['gross_nv'],2,isCurrency);
		$scope.anomNnv=nFormatter(data['net_nv'],2,isCurrency);
        $scope.anomNoo=data['num_orders'];
	}

	// $scope.showScatterDataDetails=function(show_hide)
	// { 
		// if(show_hide=='hide')
			// {
		// $('#showScatterData').hide();
		// $scope.heightsize=100;
			// }else if(show_hide=='show')
				// {
				// $('#showScatterData').show();
				// $scope.heightsize=90;
				// }
	// }
	
	//When mouse click on blink disable 

	window.onclick = function() {
		$scope.blinkanamoly='blinkanamolystop';
		$scope.$apply();
	};
	
	
	$scope.getTrendAnalysisTimeSeries=function(type,filter,issuetype,tdate,division){
		$http.get(restAPIServerName+"/getAggTotalsEod/"+type.toUpperCase()+"/"+filter+"/"+issuetype+"/"+tdate+"/"+division).then(function(response){
			var timeSeries=response.data;
			
			var actualTs=response.data;
			var xSeries=[];
			var actualSeries=[];
	        var netSeries=[];
	        var numSeries=[];	
	       
			angular.forEach(timeSeries,function(actual,index){
				var tsTime=actual['ts_et'].substring(0,10)+" "+actual['ts_et'].substring(11,19); 
				xSeries[index]= actual['tradedate'];//(new Date(tsTime)).getTime() / 1000;
				actualSeries[index]=parseInt(timeSeries[index]['gross_notionalvalue']);
            	netSeries[index]=parseInt(timeSeries[index]['net_notionalvalue']);
            	numSeries[index]=parseInt(timeSeries[index]['num_orders']);
			});
			 var lastIndex=timeSeries.length-1;
			if(xSeries.length>0 && actualSeries.length>0 && netSeries.length>0 && numSeries.length>0){
				var estSeries=[];
				var rangeSeries=[];
				$rootScope.timeSeries("Trend_Gross_Notionalvalue","Equity_Gnv",xSeries,actualSeries,estSeries,rangeSeries,"Equity","CLIENT",null,"Client_101");
				$rootScope.timeSeries("Trend_Net_Notionalvalue","Equity_Nnv",xSeries,netSeries,estSeries,rangeSeries,"Equity","CLIENT",null,"Client_101");
				$rootScope.timeSeries("Trend_Num_Orders","Equity_Num_order",xSeries,numSeries,estSeries,rangeSeries,"Equity","CLIENT",null,"Client_101");
				$scope.gnv_min =nFormatter(Math.min.apply(Math,actualSeries),2,true);
				$scope.gnv_max = nFormatter(Math.max.apply(Math,actualSeries),2,true);
				
				$scope.nnv_min =nFormatter(Math.min.apply(Math,netSeries),2,true);
				$scope.nnv_max = nFormatter(Math.max.apply(Math,netSeries),2,true);
				
				$scope.noo_min =nFormatter(Math.min.apply(Math,numSeries),2,false);
				$scope.noo_max = nFormatter(Math.max.apply(Math,numSeries),2,false);
				
				var low=lastIndex-30;
				var high=lastIndex+30;
				if(low<0){
					low=0;
				}
				if(high>xSeries.length-1){
					high=xSeries.length-1;
				}
				var gnv_chart = $('#Trend_Gross_Notionalvalue').highcharts();
				gnv_chart.xAxis[0].setExtremes(low,high);
				gnv_chart.showResetZoom();
				
				var nnv_chart = $('#Trend_Net_Notionalvalue').highcharts();
				nnv_chart.xAxis[0].setExtremes(low,high);
				nnv_chart.showResetZoom();
				
				var noo_chart = $('#Trend_Num_Orders').highcharts();
				noo_chart.xAxis[0].setExtremes(low,high);
				noo_chart.showResetZoom();

			}
		});
	}
	
	$scope.groupBy="Issue Type";
	
	$scope.getTrend=function(type,filter,issuetype,tdate,division){
		$scope.trendName=filter;
		$scope.trendType=type;
		$scope.trendIssuedTypes=issuetype;
		if(issuetype=='null' || issuetype==null)
		 	$scope.trendIssuedTypes='';
		$scope.trenTimedivision=division;
		$scope.trendAnalysis=function(){
			//$('#showScatterData').hide();
			$scope.trendAnalysisPie=false;
			$scope.trendAnalysisTime=true;
			$scope.detailsAnalysis=true;
			$scope.getTrendAnalysisTimeSeries(type,filter,issuetype,'NULL',division);
			//$scope.rangeVisible=false;
		}
		$scope.trendPieData=function(){
			$scope.groupBy="Issue Type";
			//$('#showScatterData').hide();
			$scope.trendAnalysisPie=true;
			$scope.trendAnalysisTime=false;
			$scope.detailsAnalysis=true;
			$scope.getAggtotalsPiedataData(type,filter,'NULL',division);
		}
	}
	$scope.trendPieBack=function(){
		$scope.trendAnalysisPie=false;
		$scope.trendAnalysisTime=true;
		$scope.detailsAnalysis=true;
	}
	
	
	 $scope.getAggtotalsPiedataData=function(type,filter,tdate,division){
		 $http.get(restAPIServerName+"/getAggtotalsPiedata/"+type.toUpperCase()+"/"+filter+"/"+tdate+"/"+division).then(function(response){
			 $scope.pieData=response.data; 
	         if($scope.pieData.length!=0){
	        	 $scope.generateAggtotalsPiedataData();
	         }
	     });
	 }
	 
	 $scope.generateAggtotalsPiedataData=function(){
		 $scope.pieGnvData=[];
		 $scope.pieNnvData=[];
		 $scope.pieNuvData=[]; 
		 $scope.pieGnvData30=[];
		 $scope.pieNnvData30=[];
		 $scope.pieNuvData30=[];
		 
		 angular.forEach($scope.pieData,function(f,fIndex){ 
			 var name='';
				 if($scope.groupBy=='Issue Type'){	 
					name=f.issuetype;
				  }else if($scope.groupBy=='Sector'){
					name=f.sector;
				 }
				 if(name!=null)
				 {
					 $scope.pieGnvData.push({'name' :name,'y' :f.pct_total_gnv,'amount' :f.gross_notionalvalue,'issuetype':f.issuetype,'sector':f.sector ,'total':f.total_gnv });
					 $scope.pieGnvData30.push({'name' :name  ,'y' :f.pct_total_gnv_30d_sma  ,'amount' :f.gnv_30d_sma,'issuetype':f.issuetype,'sector':f.sector,'total':f.total_gnv_30d_sma   });
					 
					 $scope.pieNnvData.push({'name' :name,'y' :f.pct_total_nnv,'amount' :f.net_notionalvalue,'issuetype':f.issuetype,'sector':f.sector,'total':f.total_nnv   });
					 $scope.pieNnvData30.push({'name' :name  ,'y' :f.pct_total_nnv_30d_sma  ,'amount' :f.nnv_30d_sma,'issuetype':f.issuetype,'sector':f.sector,'total':f.total_nnv_30d_sma    });
					 
					 $scope.pieNuvData.push({'name' :name,'y' :f.pct_total_noo,'amount' :f.num_orders,'issuetype':f.issuetype,'sector':f.sector,'total':f.total_noo   });
					 $scope.pieNuvData30.push({'name' :name ,'y' :f.pct_total_noo_30d_sma,'amount' :f.noo_30d_sma,'issuetype':f.issuetype,'sector':f.sector,'total':f.total_noo_30d_sma });
				 }
			 }); 	 
		 $rootScope.generatePieChartData('Trend_Pie_Gross_Notionalvalue','Gross NV  Current',$scope.getTopList( $scope.pieGnvData),'Gross NV Current','Gross NV Current');
		 $rootScope.generatePieChartData('Trend_Pie_Gross_Notionalvalue_30','Gross NV  30 Days', $scope.getTopList( $scope.pieGnvData30),'Gross NV 30 Days','Gross NV 30 Days');
		 $rootScope.generatePieChartData('Trend_Pie_Net_Notionalvalue','Net NV  Current',$scope.getTopList( $scope.pieNnvData),'Net NV Current','Net NV Current');
		 $rootScope.generatePieChartData('Trend_Pie_Net_Notionalvalue_30','Net NV  30 Days', $scope.getTopList( $scope.pieNnvData30),'Net NV 30 Days','Net NV 3030 Days');	 
		 $rootScope.generatePieChartData('Trend_Pie_Num_Orders','Num Orders  Current',$scope.getTopList( $scope.pieNuvData),'Num Orders Current','Num Orders Current');
		 $rootScope.generatePieChartData('Trend_Pie_Num_Orders_30','Num Orders  30 Days', $scope.getTopList( $scope.pieNuvData30),'Num Orders 30 Days','Num Orders 30 Days');
	 }
	 
	 /* get top 5 pie data list */
	  $scope.getTopList=function(sortData){
		  sortData  = $filter('orderBy')(sortData, '-amount');
		 if(sortData.length>5){
			 var topList=[];
			 var total_amount=0;
			 angular.forEach(sortData,function(data,fIndex){
				 if(fIndex<=4){
					 topList.push(data); 
				 }else{
					 total_amount=data.amount+total_amount;
				 }
				 if(fIndex==sortData.length-1){
					 topList.push({'name' :'Utilities','y' :(total_amount/data.total),'amount' :total_amount,'issuetype':data.issuetype,'sector':data.sector,'total':data.total });
				 }
			 });
			 return topList;
			 }else{
				 return sortData;
			 }
	 }
  
		$scope.realTimeData=function()
		{
			//Gainers
			$http.get("https://cloud.iexapis.com/v1/stock/market/list/gainers?token=pk_a79c03794c0340bc85f4bc26c24eb567&chartCloseOnly=true").then(function(info){
				$scope.gainers=$filter('orderBy')(info.data, 'changePercent');;
				$scope.gainInfo= [];
				if($scope.gainers.length>0){
					$scope.lengthCount = $scope.gainers.length;
					angular.forEach($scope.gainers,function(gain){
			 
						$scope.gainInfo.push({"companyName":gain.companyName,"name":gain.symbol,"changePercent":(parseFloat(parseFloat(gain.changePercent*100).toFixed(2))),"close":gain.close,'change':gain.change});
					})
					 
				}
			});
			
			//Most Active
			$http.get("https://cloud.iexapis.com/v1/stock/market/list/mostactive?token=pk_a79c03794c0340bc85f4bc26c24eb567&chartCloseOnly=true").then(function(info){
				$scope.active=$filter('orderBy')(info.data, 'changePercent');
				$scope.activeInfo=[];
				if($scope.active.length>0){
					angular.forEach($scope.active,function(active){
						$scope.activeInfo.push({"companyName":active.companyName,"name":active.symbol,"changePercent":(parseFloat(parseFloat(active.changePercent*100).toFixed(2))),"close":active.close,'change':active.change});
					});
					$scope.lengthCount2 = $scope.active.length;
				}
			});
			
			//Losers
			$http.get("https://cloud.iexapis.com/v1/stock/market/list/losers?token=pk_a79c03794c0340bc85f4bc26c24eb567&chartCloseOnly=true").then(function(info){
				$scope.losers=$filter('orderBy')(info.data, 'changePercent');
				$scope.lossInfo=[]; 
				if($scope.losers.length>0){
					angular.forEach($scope.losers,function(loss){
						$scope.lossInfo.push({"companyName":loss.companyName,"name":loss.symbol,"changePercent":(parseFloat(parseFloat(loss.changePercent*100).toFixed(2))),"close":loss.close,'change':loss.change});
					})
					$scope.lengthCount1 = $scope.losers.length;
				}
				//console.log(new Date());
			}); 
		}
		$scope.realTimeData();
		 setInterval(function(){
			 $scope.realTimeData();
			}, 100000); 
		 
		 $int=0;
		 $scope.realTimeData();
		  var increaseCounter = function () { 
		 $scope.lossInfo2=[];
		 $scope.gainInfo2=[];
		 $scope.activeInfo2=[];
		 if($scope.lossInfo!=undefined)
		 if($int+1<$scope.lossInfo.length)
		 {
		 $scope.lossInfo2=$scope.getInterValue($scope.lossInfo,$int); 
		 $scope.gainInfo2=$scope.getInterValue($scope.gainInfo,$int);
		 $scope.activeInfo2=$scope.getInterValue($scope.activeInfo,$int); 
		 $int=$int+2;
		 }else 
		 {
		 $int=0;
		 $scope.lossInfo2=$scope.getInterValue($scope.lossInfo,$int); 
		 $scope.gainInfo2=$scope.getInterValue($scope.gainInfo,$int);
		 $scope.activeInfo2=$scope.getInterValue($scope.activeInfo,$int); 
		 } 
		  }
		  $scope.getInterValue=function(array,index)
		  {
		  $scope.lossI=[];
		   $scope.lossI.push(array[index]);
		 $scope.lossI.push(array[index+1]);
		  return $scope.lossI;
		  }
		 $interval(increaseCounter, 5000);
	 
		 
		 
		 
         /*alert bell click*/
		 $scope.getInfo=function(alert,type){
			 if(!angular.equals({}, alert)){
				 $scope.scatterVisible=false;
				 $scope.rangeVisible=true;
				 $scope.detailsAnalysis=false;
				 $scope.getTimeSeries(alert.divType,alert.name,alert.issue,null,alert.division);
				 $scope.getTrend(alert.divType,alert.name,alert.issue,null,alert.division);
				if(type==='alert'){
					var index = $scope.alerts.indexOf(alert);
					$scope.alerts.splice(index, 1);   
				}
			}
		 }
}



