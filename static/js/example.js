//toggle
var currState = null;
var toggle = "50";
$("button").click(
    function() {
  	$("button").removeClass("active");
	$(this).addClass("active");
	toggle = $(this).attr("data-tax");

	draw(usMap);
	info_panel(currState);

});



//map stuff


var width = 960,
height = 500,
maxValue = .35,
centered;


var projection = d3.geo.albersUsa()
    .scale(1070)
    .translate([width / 2, height / 2]);

var path = d3.geo.path()
    .projection(projection);

var svg = d3.select("#map").append("svg")
    .attr("width", width)
    .attr("height", height);

svg.append("rect")
    .attr("class", "background")
    .attr("width", width)
    .attr("height", height)
    .on("click", clicked);

var g = svg.append("g");


var rateById = d3.map();
var nameById = d3.map();
var taxes = {};

var quantize = d3.scale.quantize()
    .domain([0, maxValue])
    .range(d3.range(9).map(function(i) { return "q" + i + "-9"; }));

//d3.json("./static/json/mbostock-us.json", ready);

function buildMap(file) {
    queue()
	.defer(d3.json, "./static/json/mbostock-us.json")
	.defer(d3.csv, file, function(d) { 
		   //rateById.set(d.id, +d.rate); 
		   if (!taxes[d.fips])
		       taxes[d.fips] = {};
		   taxes[d.fips][d.income] = {
		       "state" : +d.state_tax, 
		       "fed" : +d.fed_tax
		   };
	       })
	.defer(d3.tsv, "./static/json/us-state-names.tsv", function(d) { nameById.set(d.id, d.name); })
	.await(ready);
    
}

buildMap("./static/json/ex_tax.csv");

var usMap = null;
function ready(error, us) {
    usMap = us;
    draw(usMap);
}


function draw(us) {
    g.selectAll("g").remove();
    g.selectAll("path").remove();

    g.append("g")
	.attr("id", "states")
	.selectAll("path")
	.data(topojson.feature(us, us.objects.states).features)
	.enter().append("path")
	.attr("class", function(d) { 
		  try {
		      return quantize( (taxes[d.id][toggle*1000]["state"]+taxes[d.id][toggle*1000]["fed"]) / (toggle*1000) ); 
		      
		  } catch (x) {
		      return null;
		  }
	      })
	.attr("d", path)
	.on("click", clicked)
	.on("mouseover", function (d) {info_panel(d.id);});
    
    g.append("path")
	.datum(topojson.mesh(us, us.objects.states, function(a, b) { return a !== b; }))
	.attr("id", "state-borders")
	.attr("d", path);
}

function info_panel(id) {
    currState = id;
    var eff_rate = (taxes[id][toggle*1000]["state"]+taxes[id][toggle*1000]["fed"]) / (toggle*1000) *100;
    $("#state_info").html("Effective Income tax rate <br/>for a person earning $"+toggle+",000 in "+nameById.get(id)+": <br/>"+eff_rate+"%<br/><br/>State: $"+taxes[id][toggle*1000]["state"]+" Federal: $"+taxes[id][toggle*1000]["fed"]);
    
}

function clicked(d) {
    info_panel(d.id);

    var x, y, k;

    if (d && centered !== d) {
	var centroid = path.centroid(d);
	x = centroid[0];
	y = centroid[1];
	k = 4;
	centered = d;
    } else {
	x = width / 2;
	y = height / 2;
	k = 1;
	centered = null;
    }

//    g.selectAll("path")
//	.classed("active", centered && function(d) { return d === centered; });

    g.transition()
	.duration(750)
	.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
	.style("stroke-width", 1.5 / k + "px");
}
