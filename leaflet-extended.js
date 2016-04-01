/*
* EXTENDING JAVASCRIPT
*/
function sortJSON(data, key) {
    return data.sort(function(a, b) {
        var x = a[key]; var y = b[key];
        return ((x < y) ? -1 : ((x > y) ? 1 : 0));
    });
}
if (!String.prototype.format) {
				/*
				 *  http://tinyurl.com/3sxfsgd
				 * Example:
				 * "{0} is dead, but {1} is alive! {0} {2}".format("ASP", "ASP.NET")
				 */
				String.prototype.format = function() {
					var args = arguments;
					return this.replace(/{(\d+)}/g, function(match, number) {
						return typeof args[number] != 'undefined' ? args[number] : match;
					});
				};
				//end String.prototype
}//end !String prototype


//get the url being called
function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}


/*
* EXTENDING LEAFLETJS 
*/

/* 
 * @class: Extended the leaflet map class so that any selected Tile for download is added to the selectedFeature Array. The map class will contain the necessary methods
 * @methods: addSelectedFeature,removeSelectedFeature,cleanFeatures
 * @attributes: selectedFeature
 * */
var ISRICMap = L.Map.extend({
		originalBound : null,
		selectedFeatures : [],
		addSelectedFeature : function(featureID) {
			this.selectedFeatures.push(featureID);
		},

		removeSelectedFeature : function(featureID) {
			this.selectedFeatures.splice($.inArray(featureID,
					map.selectedFeatures), 1);
		},
		cleanFeatures : function() {
			this.selectedFeatures.splice(0, this.selectedFeatures.length);
		}
	}); //end of extend

/*
 * @class: Extends the WMS layer with specifc options, mainly the best tile size for de tilemill service
 */

var ISRICWMS = L.TileLayer.WMS.extend({
	options : {
		legend : null,
		tileSize : 512,
	}
}); //end of WMS extend

var popupISIRC = L.Popup.extend({

	
	_closePopup: function() {
		this._map.closePopup()
	},
	_sortTaxonomy:function(data,taxName){
			sortArr=new Array()
			$.each(data["properties"][taxName], function(index, value) {
				sortArr.push({soil:index,val:value})
			   // values[index] = value;
			}); 
			sortArr.sort(function(a,b) {
			    return  b.val - a.val ;
			});
			return sortArr
		},
		_getCurrentWMS:function(){
			/*returnValue=null
			$.each(this._map._layers, function(key,value){
				if (value.constructor === ISRICWMS) 
				{
					console.log("dumping value")
					console.log(value._url)
					
					returnValue=value
					}
				})
			*/
			//this is better there is only 1 letter on the wms group therefore any other special layer
			//will be ignored
			returnValue=layersWMSGroup.getLayers()[0]

			return returnValue
		},
		querySoilGrids: function(){
			
			$.ajaxSetup({ scriptCharset: "utf-8" , contentType: "application/json"})
			__this = this
			wmsLayer = this._getCurrentWMS()
			
			$('div.leaflet-popup-content-wrapper').on('click contextmenu',function(e){e.preventDefault(); __this._closePopup()})
			if (wmsLayer === null){
				this.setContent('<span id="popupContent">First you should select a layer, using the layer controler</span>')
				return 
			}
			
			layerID=wmsLayer.wmsParams.layers
			
			if (layerID.indexOf('TAXGWRB') != -1 ||  layerID.indexOf('TAXOUSDA') != -1){
				//test ? expression1 : expression2
			    
				taxName = layerID.indexOf('TAXGWRB') != -1 ? 'TAXGWRB':'TAXOUSDA' 
				
		
				//soilgrids1km:TAXGWRB_Acrisols_04_dec_2013	
				if (layerID.match('soilgrids1km:{0}_(.*?)$'.format(taxName))){
					soilClass=layerID.match('soilgrids1km:{0}_(.*?)$'.format(taxName))[1]
					}
				else {
					soilClass=null
				
				}
				//uqery taxgwrb
					//soilGridsApp.config.queryURL --> "http://rest.soilgrids.org/query"
					//"{0} is dead, but {1} is alive! {0} {2}".format("ASP", "ASP.NET")
					
					urlQuery = soilGridsApp.config.queryURL+"?lon={0}&lat={1}&attributes={2}".format(this._latlng.lng.toString(),this._latlng.lat.toString(),taxName)
					
					$.getJSON(urlQuery, function(data) {
						
						//check that is not null
						if (data.properties.TAXGWRB || data.properties.TAXOUSDA){
							tableTitle=data.properties.hasOwnProperty("TAXGWRB") ? "WRB Name" : "USDA Name" 
							
							if (soilClass) {
								per = data.properties.hasOwnProperty("TAXGWRB")? data.properties.TAXGWRB[soilClass]:data.properties.TAXOUSDA[soilClass]
								
							//	if (data.properties.TAXGWRB[soilClass] || data.properties.TAXGWRB[soilClass]===0) {per=data.properties.TAXGWRB[soilClass]}
							//	if (data.properties.TAXOUSDA[soilClass] || data.properties.TAXOUSDA[soilClass]===0) {per=data.properties.TAXOUSDA[soilClass]}	
								innerHTML="<table  class='table'><thead><tr><td>{0}</td><td>Prob.%</td></tr></thead><tbody>".format(tableTitle)+
								"<tr><td class='warning'>{0}</td><td class='warning'>{1}</td></tr>".format(soilClass,per.toString())
							} else {
							
							listTax =__this._sortTaxonomy(data,taxName)
							//tableTitle=data.properties.hasOwnProperty("TAXGWRB") ? "WRB Name" : "USDA Name" 
						
							innerHTML="<table  class='table'><thead><tr><td>{0}</td><td>Prob.%</td></tr></thead><tbody>".format(tableTitle)+
								"<tr><td class='danger'>{0}</td><td class='danger'>{1}</td></tr>".format(listTax[0].soil,listTax[0].val)+
								"<tr><td class='warning'>{0}</td><td class='warning'>{1}</td></tr>".format(listTax[1].soil,listTax[1].val)+
								"<tr><td>{0}</td><td>{1}</td></tr>".format(listTax[2].soil,listTax[2].val)+
								"</tbody></table>"
							}
						} else { innerHTML="The soil mask indicates no data"	}
						 return __this.setContent(innerHTML)					
						}) //end get json
						.error(function() { alert("Could not reach the REST server.."); __this._closePopup()});
					
				}//end of if TAXGWRB
			else {
				//logging for generic Attribute
				
				//soilgrids1km:ORCDRC_sd4_M_04_dec_2013
			
				attribute = layerID.match("soilgrids1km:(.*?)_")[1]
				depth = layerID.match("_(.*?)_")[1]
				conf = layerID.match("{0}_(.*?)$".format(depth))[1]
				
				
				//lon=5.39&lat=51.57&attributes=ORCDRC,CEC&confidence=M&depths=sd1
				urlQuery = soilGridsApp.config.queryURL+"?lon={0}&lat={1}&attributes={2}&confidence={3}&depths={4}".format(this._latlng.lng.toString(),this._latlng.lat.toString(),attribute,conf,depth)
		
				$.getJSON(urlQuery, function(data){
					if (data.properties.hasOwnProperty(attribute)){
					
						innerHTML="<table class='table'><thead><tr><td class='text-center'>Attr.</td>" +
								"<td class='text-center'>Value</td><td class='text-center'>Unit</td></tr></thead><tbody><tr>" +
								"<td class='text-center'>{0}</td><td class='text-center danger'>{1}</td><td class='text-center'>{2}</td></tr></tbody></table>".format(attribute,data.properties[attribute][conf][depth],soilGridsApp.config.units[attribute])
					} else {
						innerHTML="The soil mask indicates no data"
					}
					return __this.setContent(innerHTML)		
				}).error(function() {  alert("No connection to REST server.."); __this._closePopup()});
						
			} //end else for attribute

			
			
			//BUG ON CHROME this seems to work 
			
			//__this._map.addLayer(__this);
			//this._map.off('mouseup')

			
		}
	
});