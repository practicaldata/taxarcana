//toggle
var toggle = "income";
$("button").click(
    function() {
  	$("button").removeClass("active");
	$(this).addClass("active");
	toggle = $(this).attr("data-tax");

	if (toggle == "income") {
	    buildMap("./static/json/state-ex.tsv");
	}
	else if (toggle == "sales") {
	    buildMap("./static/json/state-ex.tsv");
	}
});



//map stuff


var width = 960,
height = 500,
maxValue = .5,
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
var quantize = d3.scale.quantize()
    .domain([0, maxValue])
    .range(d3.range(9).map(function(i) { return "q" + i + "-9"; }));

//d3.json("./static/json/mbostock-us.json", ready);

function buildMap(file) {
    g.selectAll("g").remove();
    g.selectAll("path").remove();

    queue()
	.defer(d3.json, "./static/json/mbostock-us.json")
	.defer(d3.tsv, file, function(d) { rateById.set(d.id, +d.rate); })
	.defer(d3.tsv, "./static/json/us-state-names.tsv", function(d) { nameById.set(d.id, d.name); })
	.await(ready);
    
}

buildMap("./static/json/state-ex.tsv");


function ready(error, us) {
    g.append("g")
	.attr("id", "states")
	.selectAll("path")
	.data(topojson.feature(us, us.objects.states).features)
	.enter().append("path")
	.attr("class", function(d) { return quantize(rateById.get(d.id)); })
	.attr("d", path)
	.on("click", clicked);
    
    g.append("path")
	.datum(topojson.mesh(us, us.objects.states, function(a, b) { return a !== b; }))
	.attr("id", "state-borders")
	.attr("d", path);
}

function clicked(d) {
    if (toggle == "income")
	$("#state_info").html("Effective Income tax rate for a person earning $100k in "+nameById.get(d.id)+": "+rateById.get(d.id)*100+"%");
    else if (toggle == "sales")
	$("#state_info").html("Sales tax rate for "+nameById.get(d.id)+": "+rateById.get(d.id)*100+"%");

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
