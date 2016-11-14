data = ["A", "G", "T", "T", "C", "T", "A", "A", "G", "A", "C", "T", "A", "C", "G", "A", "C", "A", "T", "G", "A", "T", "G"]

var margin = {top: 0, right: 0, bottom: 0, left: 0},
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

var zoom = d3.zoom()
    .scaleExtent([1, 32])
    .on("zoom", zoomed);

var svg = d3.select("body").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .style("display", "block")
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    .call(zoom);

var rect = svg.append("rect")
    .attr("width", width)
    .attr("height", height)
    .style("fill", "pink")
    .style("opacity", 0.4)
    .style("pointer-events", "all");

container = svg.append("g");

var bars = container.selectAll("rect")
            .data(data)
            .enter()
                .append("rect")
                .attr("width", 10)
                .attr("height", 10)
                .attr("x", function(d, i) {return i*12;})
                .style("fill", function(nuc) {
                    switch(nuc) {
                        case "A":
                            return "blue";
                        case "T":
                            return "red";
                        case "G":
                            return "yellow";
                        case "C":
                            return "green";
                    }
                });


function zoomed() {
    tx = d3.event.transform;
    txf = "translate(" + tx.x + " " + tx.y + ") scale(" + tx.k + ")";
    container.attr("transform", txf);
}

// get fasta data
//var parseQueryString = function(url) {
  //var urlParams = {};
  //url.replace(
    //new RegExp("([^?=&]+)(=([^&]*))?", "g"),
    //function($0, $1, $2, $3) {
      //urlParams[$1] = $3;
    //}
  //);
  //return urlParams;
//}

//$.getJSON(parseQueryString(location.search).url, function(json) {
    //$.get(json.fasta[0], function(fasta_data) {
        //draw(fasta_data.trim().split(""));
        //console.log(fasta_data.trim().split(""));
    //});
//});
