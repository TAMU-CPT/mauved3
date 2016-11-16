var d3 = require('d3');
var $ = require('jquery');
var gff = require('./gff3.js')

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

function zoomed() {
    tx = d3.event.transform;
    txf = "translate(" + tx.x + " " + tx.y + ") scale(" + tx.k + ")";
    container.attr("transform", txf);
}

var draw_genomes = function(data) {
    var genomes = container.selectAll("line")
                    .data(data)
                    .enter()
                        .append("line")
                            .attr("x1", 30)
                            .attr("y1", function(d,i) {return 30 + i*100})
                            .attr("x2", function(d) {return 30 + d;})
                            .attr("y2", function(d,i) {return 30 + i*100})
                            .attr("stroke-width", 10)
                            .attr("stroke", "green");
};

var draw_features = function(gff3, index, length) {
    var genes = container.selectAll("rect")
                    .data(gff3)
                    .enter()
                        .append("rect")
                            .attr("width", function(d, i) {return d.end - d.start;})
                            .attr("height", 5)
                            .attr("x", function(d, i) {return 30 + d.start;})
                            .attr("y", function(d, i) {return 40;})
                            .style("fill", "black");
};

//var bars = container.selectAll("rect")
            //.data(data)
            //.enter()
                //.append("rect")
                //.attr("width", 10)
                //.attr("height", 10)
                //.attr("x", function(d, i) {return i*12;})
                //.style("fill", function(nuc) {
                    //switch(nuc) {
                        //case "A":
                            //return "blue";
                        //case "T":
                            //return "red";
                        //case "G":
                            //return "yellow";
                        //case "C":
                            //return "green";
                    //}
                //});

// find genome with longest length
var find_longest = function(fasta) {
    var longest = 0;
    $.each(fasta, function(key, data) {
        if (data.length > longest) longest = data.length;
    });
    return longest
}

// adjust pixels to genome length
var adjust_genomes = function(data, longest) {
    adjusted_genomes = []
    $.each(data, function(key, fasta) {
        adjusted_genomes.push(fasta.length/longest * 900);
    });
    return adjusted_genomes;
};

// parse url
var parseQueryString = function(url) {
  var urlParams = {};
  url.replace(
    new RegExp("([^?=&]+)(=([^&]*))?", "g"),
    function($0, $1, $2, $3) {
      urlParams[$1] = $3;
    }
  );
  return urlParams;
}

//get fasta and gff3 data
$.getJSON(parseQueryString(location.search).url, function(json) {
    longest = find_longest(json.fasta);
    adjusted_genomes = adjust_genomes(json.fasta, longest);
    draw_genomes(adjusted_genomes);
    //$.get(json.gff3[0], function(gff3_data) {
        //var gff3  = gff.process(gff3_data, ['gene']);
        //draw_features(gff3, 0, adjusted_genomes.length, longest);
    //});
    for (var j in json.gff3) {
        $.get(json.gff3[j], function(gff3_data) {
            var gff3  = gff.process(gff3_data, ['gene'], longest);
            draw_features(gff3, j, adjusted_genomes.length);
        });
    }
});
