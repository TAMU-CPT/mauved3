var d3 = require('d3');
var $ = require('jquery');
var gff = require('./gff3.js')

var margin = {top: 0, right: 0, bottom: 0, left: 0},
    width = 960 - margin.left - margin.right,
    height = 600 - margin.top - margin.bottom;

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

// background
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

// draw genomes as lines
var draw_genomes = function(data) {
    var genomes = container.selectAll("line")
                    .data(data)
                    .enter()
                        .append("line")
                            .attr("x1", 30)
                            .attr("y1", function(d,i) {return 30 + i*100})
                            .attr("x2", function(d) {return 30 + d.length;})
                            .attr("y2", function(d,i) {return 30 + i*100})
                            .attr("stroke-width", 10)
                            .attr("stroke", "green");
};

// draw genome features for each genome
var draw_features = function(gff3, genomes, rows) {
    var compute_height = function(index) {
        for(var row in rows) {
            if (rows[row].indexOf(index) > -1) {
                return row;
            }
        }
    };
    function find_index(name) {
        for (var genome in genomes) {
            if (name == genomes[genome].name) {
                return genome;
            }
        }
    };

    var index = find_index(gff3[0].seqid);

    var genes = container.selectAll('gene' + index)
                    .data(gff3)
                    .enter()
                        .append("rect")
                            .attr("width", function(d, i) {return d.end - d.start;})
                            .attr("height", 5)
                            .attr("x", function(d, i) {return 30 + d.start;})
                            .attr("y", function(d, i) {
                                return 40 + compute_height(i)*10 + index*100;
                            })
                            .style("fill", "black");
};

function draw_lcbs(lcb, longest, index, color) {
    var lcbs = container.selectAll('lcb' + index)
                    .data(lcb)
                    .enter()
                        .append("rect")
                            .attr("width", function(d, i) {return (d.end - d.start)/longest*(900);})
                            .attr("height", 20)
                            .attr("x", function(d, i) {return 30 + d.start/longest*(900);})
                            .attr("y", function(d, i) {
                                return 20 + (d.id - 1)*100;
                            })
                            .style("fill", color)
                            .style("opacity", 0.5);
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
    fasta.map(function(data) {
        if (data.length > longest) longest = data.length;
    });
    return longest
}

// adjust pixels to genome length
var adjust_genomes = function(data, longest) {
    adjusted_genomes = []
    $.each(data, function(key, fasta) {
        adjusted_genomes.push({name: fasta.name, length: fasta.length/longest * (width-60)});
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

// space genes out by putting them on different rows
var assign_rows = function(gff3) {
    last_placed = [null];
    var rows = {0:[]}
    gff3.map(function(gene, i) {
        for (locs in last_placed) {
            if (last_placed[locs] == null || gene.start > 1+last_placed[locs]) {
                if (last_placed[locs] == null) {
                    last_placed.push(null);
                    rows[parseInt(locs)+1] = [];
                }
                last_placed[locs] = gene.end;
                rows[locs].push(i);
                return;
            }
        }
    });
    return rows;
};

function sortByKey(array, key) {
    return array.sort(function(a, b) {
        var x = a[key]; var y = b[key];
        return ((x < y) ? -1 : ((x > y) ? 1 : 0));
    });
}

//get fasta, gff3, and xmfa data
$.getJSON(parseQueryString(location.search).url, function(json) {
    longest = find_longest(json.fasta);
    adjusted_genomes = adjust_genomes(json.fasta, longest);
    draw_genomes(adjusted_genomes);

    for (var j in json.gff3) {
        $.get(json.gff3[j], function(gff3_data) {
            var gff3  = gff.process(gff3_data, ['CDS'], longest);
            draw_features(gff3, adjusted_genomes, assign_rows(sortByKey(gff3, 'start')));
        });
    }
    var colors = ['red', 'blue', 'green', 'black'];
    $.getJSON(json.xmfa, function(xmfa) {
        xmfa.map(function(lcb, i) {
            draw_lcbs(lcb, longest, i, colors[i]);
        });
    });
});
