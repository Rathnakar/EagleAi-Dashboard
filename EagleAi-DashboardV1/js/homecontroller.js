app.controller('HomeController',HomeController);

HomeController.$inject = ['$scope','$q','$http','$cookieStore','$location','$window','UserService','$filter','$interval','$routeParams','$uibModal','$rootScope'];

function HomeController($scope,$q,$http,$cookieStore,$location,$window,UserService,$filter,$interval,$routeParams,$uibModal,$rootScope) {
    var red="#ae0001";
    var green="#03c72d";
    const restAPIServerName = 'http://159.203.112.185:8222'; //'http://ec2-54-191-51-162.us-west-2.compute.amazonaws.com:8222'
    $scope.user=$cookieStore.get("user");
    $scope.divisions=[];
    $scope.FixedIncome={anomaly:false,issueTypes:[],issue:'null'};
    $scope.Equity={anomaly:false,issueTypes:[],issue:'null'};
	var date=new Date();
	var offset = -5.0;
	var utc = date.getTime() + (date.getTimezoneOffset() * 60000);
	$scope.lastTime = new Date(utc + (3600000*offset)).toLocaleTimeString(navigator.language, {hour: '2-digit', minute:'2-digit'});
    
    function numFormat (value) 
    {
		var negative="";
		if(value<0){
			negative="-";
			value=Math.abs(value);
		}
		var thousand = 1000;
		var million = 1000000;
		var billion = 1000000000;
		var trillion = 1000000000000;
		if (value < thousand) {
			return negative+'$'+String(Math.round(value * 100) / 100);   
		}
		
		if (value >= thousand && value <= 1000000) {
			 return  negative+'$'+Math.round(value/thousand) + 'k';   
		}
		
		if (value >= million && value <= billion) {
			return negative+'$'+Math.round(value/million) + 'M';   
		}
		
		if (value >= billion && value <= trillion) {
			return negative+'$'+Math.round(value/billion) + 'B';   
		}
		
		else {
			return negative+'$'+Math.round(value/trillion) + 'T';   
		}
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
    Highcharts.setOptions({
        chart: {
            borderColor:"#3c3c48",
            borderWidth: 1,
            className:'chart-width',
            height:216,
            backgroundColor:'#03080b',
            marginTop:50,
            style: {
                fontFamily:'Roboto, sans-serif'
            },
            zoomType:'xy',
            //Zoom button styling with out icon
            resetZoomButton: {
                theme: {
                    fill: '#00aae8',
                    stroke: "transparent",
                    style: {
                        color: 'white',
                    },
                    r: 0,
                    states: {
                        hover: {
                            fill: 'white',
                            style: {
                                color: 'black'
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
            widthAdjust: 20,
            style: {
                color: '#c1ffff',
                fontWeight: 'bold',
                fontSize:1
            }
        },
        xAxis: {
            labels: {
                style: {
                    color: '#fffeff',
                    fontSize:'10px'
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
                allowDecimals: false,
                style: {
                    color: '#fffeff',
                    fontSize:'10px'
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
    $rootScope.timeSeries=function(id,title,xCategories,actualSeries,estSeries,rangeLow,rangeHigh){
        Highcharts.chart(id, {
            chart: {
                type: 'line',
            },
            title: {
                text: $filter('uppercase')(title),
            },

            xAxis: {
                categories: xCategories
            },
            yAxis: {
				labels: {
					formatter: function () {
						return numFormat(this.value);
					}            
				}
            },
            tooltip: {
                useHTML: true,
                crosshairs: true,
                shared: true,
                formatter: function () {
                    var tooltip='<table><tr>'+this.x+'</tr>' ;
                    if(this.points.length==4){
                        tooltip=tooltip+'<tr><th>Actual: </th><td>'+numFormat(this.points[0].y)+'</td></tr>'+
                                        '<tr><th>Estimated: </th><td>'+numFormat(this.points[3].y)+'</td></tr>' +
                                        '<tr><th>Est. Lower: </th><td>'+numFormat(this.points[1].y)+'</td></tr>' +
                                        '<tr><th>Est. Higher: </th><td>'+numFormat(this.points[2].y)+'</td></tr>' +
                                '</table>';
                    }else{
                        tooltip=tooltip+'<tr><th>Estimated: </th><td>'+numFormat(this.points[2].y)+'</td></tr>' +
                                        '<tr><th>Est. Lower: </th><td>'+numFormat(this.points[0].y)+'</td></tr>' +
                                        '<tr><th>Est. Higher: </th><td>'+numFormat(this.points[1].y)+'</td></tr>' +
                                '</table>';
                    }
                    return tooltip;
                },
                followPointer: true
            },
            series: [{
                    id:"actual",
                    name: 'Actual Series',
                    data: actualSeries,
                    color:"#046a0b"
                }, {
                    id:"estLower",
                    name: 'Est. Lower',
                    data: rangeLow,
                    color:"#626470",
                },{
                    id:"estHigher",
                    name: 'Est. High',
                    data: rangeHigh,
                    color:"#626470",
                },{
                    id:"est",
                    name: 'Est. Series',
                    color: "#a8f5fe",
                    data: estSeries
                }]
        });
    }
        
    //Scatter plot for anomalies
    $scope.scatterAnamolies=function(id,title,seriesData,seriesType,division,issueType){
        Highcharts.chart(id, {
            chart: {
                type: 'scatter',
            },
            title: {
                text:  $filter('uppercase')(title),
            },
            yAxis: {
                title: {
                    text: null
                }
            },
            plotOptions: {
                series: {
                    marker: {
                        radius: 3
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
                    '<tr><th>Actual:</th><td>'+numFormat(this.x)+'</td></tr>' +
                    '<tr><th>Actual Vs Predicted:</th><td>'+numFormat(this.y)+'</td></tr></table>';
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
                text:  $filter('uppercase')(title)
            },
            plotOptions: {
                series: {
                    cursor: 'pointer',
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
                    '<tr><th>Ratio:</th><td>'+numFormat(this.point.value)+'</td></tr></table>';
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
    
    //Bar Grap
    $scope.generateBarGraph=function(id,title,categoreis,actual,seriesData){
        Highcharts.chart(id, {
            chart: {
                type: 'bar',
				marginTop:35,
				marginBottom:0
            },title: {
                text:  $filter('uppercase')(title)
            },xAxis:[{
                categories: categoreis,
                labels: {
                    align: 'left',
                    x: 0,
                    y: -14,
					style:{
						fontSize:'11px'
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
					style:{
						fontSize:'12px'
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
                    pointWidth: 18,
                    stacking: 'normal',
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
                                label=numFormat(this.point.actual);
                            return label;
                        }                        
                    },
                }
            },    
            tooltip: {
                formatter: function () {
                    var predEod95=this.points[0].y+this.points[1].y;
                    var pred95=this.points[2].y+this.points[3].y;
                    var pred=this.points[4].y;
                    var actual=this.points[5].y;
                    var x=this.points[5].x;
                    return '<b>'+x+'</b><br/><b>Actual:'+numFormat(actual)+'</b><br/><b>Predicted:'+numFormat(pred)+'</b><br/><b>Predicted95:'+numFormat(pred95)+'</b><br/><b>EOD Predicted95:'+numFormat(predEod95)+'</b>';
                },
                shared: true
            },
            series: seriesData
        });
    }
    
    //Bubble chart
    $scope.generateBubble=function(id,title,seriesData,division,issueType){
        Highcharts.chart(id, {
            chart: {
                type: 'bubble'
            },
            title: {
                text: title
            },
            tooltip: {
                useHTML: true,
                formatter: function () { 
                return '<table><tr><th><b>'+this.point.alerttype+'</b></th></tr>' +
                    '<tr><th>Client:</th><td>'+this.point.clientid+'</td></tr>' +
                    '<tr><th>Symbol:</th><td>'+this.point.symbol+'</td></tr>' +
                    '<tr><th>Predicted:</th><td>'+numFormat(this.point.x)+'</td></tr>' +
                    '<tr><th>Actual:</th><td>'+numFormat(this.point.y)+'</td></tr>' +
                    '<tr><th>Ratio:</th><td>'+numFormat(this.point.z)+'</td></tr></table>';
                },
                followPointer: true
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
                        format: '{point.symbol}'
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
    
    //Generates time series data.
    $rootScope.generateTimesSeriesData=function(division,result,title,lastRead){
        var actualTs=result['actual_ts'];
        if(lastRead==null){
			angular.forEach(actualTs,function(actual,index){
				result['actual_ts'][index]=actual.substring(11,17)+"00";
			});
            var xCategories=times;
            var actualSeries=new Array(xCategories.length).fill(null);
            var estSeries=new Array(xCategories.length).fill(null);
            var rangeLow=new Array(xCategories.length).fill(null);
            var rangeHigh=new Array(xCategories.length).fill(null);
            angular.forEach(xCategories,function(xValue,index){
                if(result['actual_ts'].findIndex(x=>x === xValue)!=-1){
                    actualSeries[index]=(result['actual'][result['actual_ts'].findIndex(x=>x === xValue)]);
                }
                if(result['pred_ts'].findIndex(x=>x === xValue)!=-1){
                    estSeries[index]=(result['pred'][result['pred_ts'].findIndex(x=>x === xValue)]);
                    rangeLow[index]=(result['conf_lower_95'][result['pred_ts'].findIndex(x=>x === xValue)]);
                    rangeHigh[index]=(result['conf_upper_95'][result['pred_ts'].findIndex(x=>x === xValue)]);
                }
                if(index==xCategories.length-1){
					var xSeries=[];
                    angular.forEach(xCategories,function(x,index){
						xSeries[index]=x.substring(0,5);
                        if(estSeries[index]==null && estSeries[index-1]!=null){
                            estSeries[index]=estSeries[index-1];
                        }
                        if(rangeLow[index]==null && rangeLow[index-1]!=null){
                            rangeLow[index]=rangeLow[index-1];
                        }
                        if(rangeHigh[index]==null && rangeHigh[index-1]!=null){
                            rangeHigh[index]=rangeHigh[index-1];
                        }
                    });
					var actLength=result['actual'].length;
					if($scope[division]!=undefined){
						$scope[division][result['pred_type']]=numFormat(result['actual'][actLength-1]);
					}
                    $rootScope.timeSeries(result['pred_type'],title,xSeries,actualSeries,estSeries,rangeLow,rangeHigh);                
                }
            });
        }else{
			angular.forEach(actualTs,function(actual,index){
				result['actual_ts'][index]=actual.substring(11,16);
			});
            var chart = $('#'+result['pred_type']).highcharts();
            if(chart!=undefined){
                var categoreis=chart.xAxis[0].categories;
                var actualSeries=new Array(categoreis.length).fill(null);
                var actual=chart.series[chart.get('actual').index];
                var actualData=actual.data;
                angular.forEach(result['actual_ts'],function(xValue,index){
                    if(categoreis.findIndex(x=>x === xValue)!=-1){
                        actualData[categoreis.findIndex(x=>x === xValue)].y=result['actual'][index];
                    }
                });
                angular.forEach(actualData,function(data,index){
                        actualSeries[index]=data.y;
                });
				var actLength=result['actual'].length;
				
				$scope[division][result['pred_type']]=numFormat(result['actual'][actLength-1]);
                actual.setData(actualSeries, true);
            }
        }
    }
    
    //To generate Heat map data
    $scope.generateHeatMapData=function(heatData,type,division,issueType,lastRead){
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
                    heatColor=green;
                }else{
                    heatColor=red;
                }
                if(data['traderid']!=null && data['traderid'].includes(match)){
                    $scope.heatSeries.push({name: data['traderid'],value: data['actual'],color:heatColor})
                }else if(data['omprocessid']!=null && data['omprocessid'].includes(match)){
                    $scope.heatSeries.push({name: data['omprocessid'],value: data['actual'],color:heatColor})
                }
                if(index==heatData.length-1){
                    $scope.generateHeatMap(id,type+" HeatMap",$scope.heatSeries,type,division,issueType);
                }
            });
        }else{
            var chart = $('#'+division+"_"+type).highcharts();
            if(chart!=undefined){
                var series=chart.series[0];    
                var seriesData=series.data;
                var actualSeries=new Array(seriesData.length);
                angular.forEach(heatData,function(data,index){
                    var name;
                    var heatObj;
                    var heatColor;
                    if(data['is_anom']==null || data['is_anom']==false){
                        heatColor=green;
                    }else{
                        heatColor=red;
                    }
                    if(data['traderid']!=null && data['traderid'].includes(match)){
                        heatObj = $filter('filter')(seriesData, { name: data['traderid'] }, true)[0];
                        var index=heatObj.index;
                        seriesData[index].value=data['actual'];
                        seriesData[index].color=heatColor;
                    }else if(data['omprocessid']!=null && data['omprocessid'].includes(match)){
                        heatObj = $filter('filter')(series.data, { name: data['omprocessid'] }, true)[0];
                        var index=heatObj.index;
                        seriesData[index].value=data['actual'];
                        seriesData[index].color=heatColor;
                    }
                });
                angular.forEach(seriesData,function(sData,index){
                    actualSeries[index]={name: sData.name,value: sData.value,color:sData.color};
                });
                series.setData(actualSeries, true);
            }
        }
    }
    
    //To generate Bar data
    $scope.generateBarData=function(barData,type,division,issueType,lastRead){
        var filter=["GROSS_NOTIONALVALUE","NET_NOTIONALVALUE","NUM_ORDERS"];
        angular.forEach(filter,function(f){
            var series= $filter('filter')(barData, { pred_type: f }, true);
            var title=type+" "+f.replace('_'," ");
            var id=division+"_desk_"+f;
            if(lastRead==null){
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
                    $scope.desksList.push($filter('uppercase')(data['desk'], true));
					$scope.actualValues.push(numFormat(data['actual']));
                    $scope.actual.push({name:data['desk'],y: data['actual'],color: '#0066dc'})
                    $scope.pred.push({name:data['desk'],y: data['pred'],color: '#23c0f5'})
                    $scope.preduplow95.push({name:data['desk'],y: data['pred_upper_95']-(data['pred_upper_95']/10),color: 'transparent'})
                    $scope.predup95.push({name:data['desk'],y: data['pred_upper_95']/10,color: '#f6b406'})
                    $scope.eodpreduplow95.push({name:data['desk'],y: data['eod_pred_upper_95']-(data['eod_pred_upper_95']/10),color: 'transparent'})
                    $scope.eodpredup95.push({name:data['desk'],y: data['eod_pred_upper_95']/10,color: red,seriesName:'eodpredup95',actual:data['actual']})
                    if(index==series.length-1){
                        $scope.barSeries=[{name:"EOD Predicted 95",data:$scope.eodpredup95},{name:"EOD Predicted 95",data:$scope.eodpreduplow95},{name:"Predicted 95",data:$scope.predup95},{name:"Predicted 95",data:$scope.preduplow95},{name:"Predicted",data:$scope.pred,shadow: {
                        color: 'rgba(0, 170, 232)',
                        offsetX: 0,
                        offsetY: 0,
                        opacity: '0.1',
                        width: 5
                    }},{name:"Actual",data:$scope.actual,id:"actual",shadow: {
                        color: 'rgba(0, 90, 196)',
                        offsetX: 0,
                        offsetY: 0,
                        opacity: '0.1',
                        width: 5
                    }}]
                        $scope.generateBarGraph(id,title,$scope.desksList,$scope.actualValues,$scope.barSeries);
                    }
                });
            }else{
                var chart = $('#'+id).highcharts();
                if(chart!=undefined){
                    var actual=chart.series[chart.get('actual').index];
                    var actualSeries=new Array(actual.data.length);
                    angular.forEach(series,function(data,index){
                        var barObj = $filter('filter')(actual.data, { name: data['desk'] }, true)[0];    
                        var index=barObj.index;
                        actual.data[index].y=data['actual']
                    });
                    angular.forEach(actual.data,function(sData,index){
                        actualSeries[index]={name:sData['name'],y: sData['y'],color: '#005ac4'}
                    });
                    actual.setData(actualSeries, true);
                }
            }
        });
    }
        
    //To generate scatter data
    $scope.generateScatterData=function(scatterData,type,division,issueType,lastRead){
        var filter=["GROSS_NOTIONALVALUE","NET_NOTIONALVALUE","NUM_ORDERS"];
        angular.forEach(filter,function(f){
            var title=type+" "+f.replace('_'," ");
            var result= $filter('filter')(scatterData, { pred_type: f }, true);
            var id=division+"_"+type.toLowerCase()+"_pred_vs_actual_"+f;
            if(lastRead==null){
				var anomalyCount=0;
                var seriesData=[];
                $scope[division][type.toLowerCase()+"_"+f]=[];
                $scope.anomalies=[];
                $scope.nonanomalies=[];
                angular.forEach(result,function(clientGross,index){
                    if(angular.equals(type,"Client")){
                        name=clientGross["clientid"];
                    }else if(angular.equals(type,"Symbol")){
                        name=clientGross["symbol"];
                    }
                    if(name.match("_")){
                        $scope[division][type.toLowerCase()+"_"+f].push(parseInt(name.split('_')[1]));
                    }else{
                        $scope[division][type.toLowerCase()+"_"+f].push(name);
                    }
                    if(clientGross['is_anom']==null||clientGross['is_anom']==false){
                        $scope.nonanomalies.push({x:clientGross['actual'],y:Math.round(clientGross['ratio'] * 100) / 100,name:name});
                    }else{
                        $scope.anomalies.push({x:clientGross['actual'],y:Math.round(clientGross['ratio'] * 100) / 100,name:name});
						anomalyCount++;
                    }
                    if(index==result.length-1){
                        seriesData.push({data:$scope.anomalies,color: red,marker: {symbol: 'circle'}},{data:$scope.nonanomalies,color: green,marker: {symbol: 'circle'}});
                        $scope[division][type.toLowerCase()+"_"+f]=$filter('orderBy')($scope[division][type.toLowerCase()+"_"+f], '', false)
						$scope[division][type+'AnomalyCount']=anomalyCount;
                        $scope.scatterAnamolies(id,title,seriesData,type,division,issueType);
                    }
                });
            }else{
                var chart = $('#'+id).highcharts();
                if(chart!=undefined){
                    var series=chart.series;
                    var scatterObj=null;
                    var seriesIndex=0;
                    angular.forEach(result,function(data){
                        var color;
                        if(angular.equals(type,"Client")){
                            name=data["clientid"];
                        }else if(angular.equals(type,"Symbol")){
                            name=data["symbol"];
                        }
                        while(seriesIndex<series.length){
                            scatterObj = $filter('filter')(series[seriesIndex].data, { name: name }, true);
                            if(scatterObj.length>0){
                                break;
                            }else{
                                seriesIndex++;
                            }
                        }                        
                        if(scatterObj.length>0){
                            if(data['is_anom']==null ||data['is_anom']==false){
                                color=green;
                            }else{
                                color=red;
                            }
                            var index=scatterObj[0].index;
                            var name=scatterObj[0].name;
                            chart.series[seriesIndex].data[index].update({xData:[data['actual']],yData:[Math.round(data['ratio'] * 100) / 100],name: name,color:color},true);
                        }
                    });
                }
            }
        });
    }
    
    //To generate Bubble data
    $scope.generateBubbleData=function(bubbleData,division,issueType,lastRead){
        var id=division+"_outliers";
        if(lastRead==null){
            var seriesData=[];
			if(bubbleData.length>0){
				angular.forEach(bubbleData,function(bubble,index){
					seriesData.push({ x: bubble['conf_upper_95'], y: bubble['notionalvalue'], z: (bubble['notionalvalue']/bubble['conf_upper_95']), clientid: bubble['clientid'], symbol: bubble['symbol'],alerttype:bubble['alerttype'],color:'red' });
					if(index==bubbleData.length-1){
						$scope.generateBubble(id,"Single order Outliers",seriesData,division,issueType);
					}
				});
			}else{
				$scope.generateBubble(id,"Single order Outliers",[],division,issueType);
			}
        }else{
            var chart = $('#'+id).highcharts();
            if(chart!=undefined){
                angular.forEach(bubbleData,function(bubble,index){
                    var series=chart.series[0];
                    var seriesData = $filter('filter')(series.data, { clientid: bubble['clientid'] }, true)[0];
                    chart.series[0].data[seriesData.index].update({ x: bubble['conf_upper_95'], y: bubble['notionalvalue'], z: (bubble['notionalvalue']/bubble['conf_upper_95']), clientid: bubble['clientid'], symbol: bubble['symbol'],alerttype:bubble['alerttype'],color:'red' });
                });
            }
        }
    }
    
    //Get Issue type
    $scope.getDivisionIssues=function(division){
        if($scope[division]!=undefined && $scope[division].issueTypes.length==0){
            $http.get(restAPIServerName+"/getIssues/"+division).then(function(response){            
                $scope[division].issueTypes=response.data;
            });
        }
    }
    
    $scope.getrms=function(lastRead,division){
		var issueType=$scope[division].issue;
		$http.get(restAPIServerName+"/getRMS/"+division+"/"+issueType+"/"+lastRead).then(function(response){
			//Generate Last Read
			var d=new Date();
			$scope.lastRead="'"+d.getUTCFullYear()+"-"+("0" + (d.getUTCMonth()+1)).slice(-2)+"-"+("0" + (d.getUTCDate())).slice(-2)+" "+("0" + (d.getUTCHours())).slice(-2)+":"+("0" + (d.getUTCMinutes())).slice(-2)+"'";
			var utc = d.getTime() + (d.getTimezoneOffset() * 60000);
			$scope.lastTime = new Date(utc + (3600000*offset)).toLocaleTimeString(navigator.language, {hour: '2-digit', minute:'2-digit'});
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
                $rootScope.generateTimesSeriesData(division,divTime,title,lastRead);
            });
			$scope.generateBarData(response.data.Bar,'DESK',division,issueType,lastRead);
			$scope.generateScatterData(response.data.ClientData,'Client',division,issueType,lastRead);
			$scope.generateScatterData(response.data.SymbolData,'Symbol',division,issueType,lastRead);
			$scope.generateHeatMapData(response.data.OMPROCESS,'OMPROCESS',division,issueType,lastRead);
			$scope.generateHeatMapData(response.data.TRADER,'Trader',division,issueType,lastRead);
			$scope.generateBubbleData(response.data.Outlier,division,issueType,lastRead);
        });
    }
    
    //Initial Call and repeat calls for every 1 min.
    //Get All divisions
    $http.get(restAPIServerName+"/").then(function(response){            
        angular.forEach(response.data,function(division){
            $scope.divisions.push(division.get_divisions);
            $scope[division.get_divisions]={anomaly:false,issueTypes:[],issue:'null'};
            $scope.getrms(null,division.get_divisions);
        })
    });

    var timerID = setInterval(function() {
        angular.forEach($scope.divisions,function(division){
            $scope.getrms($scope.lastRead,division);
        });
    }, 60 * 1000); 

    //Update Request on issueType
    $scope.updateChart=function(issue,division){
        $scope.getrms(null,division);
    }
    
    //Update Scatter color
    $scope.updateScatter=function(division,model,id){
        var chart= $('#'+id).highcharts();
        var series=chart.series;
        var seriesIndex=0;
        var scatterObj;
        if(model!='null'){
            while(seriesIndex<series.length){
                scatterObj = $filter('filter')(series[seriesIndex].data, { name: model }, true);
                if(scatterObj.length>0){
                    break;
                }else{
                    seriesIndex++;
                }
            }
            chart.xAxis[0].setExtremes(scatterObj[0].x,scatterObj[0].x);
            chart.yAxis[0].setExtremes(scatterObj[0].y,scatterObj[0].y);
            //chart.series[series.index].data[0].update({x:data.x,y:data.y,color:data.color});
        }else{
            chart.xAxis[0].setExtremes(null,null);
            chart.yAxis[0].setExtremes(null,null);
        }
    }
    
    
    $scope.open = function(name,seriesType,division,issueType) {
    var modalInstance =  $uibModal.open({
      templateUrl: "views/client_indiv.html",
      controller: "ModalContentCtrl",
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
}

app.controller('ModalContentCtrl', function($scope,client,seriesType,division,issueType,$uibModalInstance,$http,$rootScope) {
    $scope.name=client.replace('_'," ");

    $scope.getTimeSeries=function(seriesType,filter,issueType,lastRead){
        $http.get(restAPIServerName+"/getTs/"+seriesType.toUpperCase()+"/'"+filter+"'/"+issueType+"/"+lastRead).then(function(response){
            $scope.divTimeSeries=response.data;
            angular.forEach($scope.divTimeSeries,function(divTime){
                var title=seriesType+" "+divTime['pred_type'].replace('_'," ");
                if(divTime['pred_type'].includes("GROSS_NOTIONALVALUE")){
                    divTime['pred_type']="gross_nv";
                }else if(divTime['pred_type'].includes("NET_NOTIONALVALUE")){
                    divTime['pred_type']="net_nv";
                }else if(divTime['pred_type'].includes("NUM_ORDERS")){
                    divTime['pred_type']="num_orders";
                }
                $rootScope.generateTimesSeriesData(filter,divTime,title);
            })
        });
    }
    $scope.getTimeSeries(seriesType,client,issueType,null);
    //Sets Dialog box graph width
    Highcharts.setOptions({
    chart: {
        width:216
    }
    });
    
  $scope.ok = function(){
    $uibModalInstance.close("Ok");
  }
   
  $scope.cancel = function(){
    $uibModalInstance.dismiss();
  } 
  
});
