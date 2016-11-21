var d3 = require('d3');
var $ = require('jquery');
var gff = require('./gff3.js')

// margin is space between genomes and container
var margin = {top: 30, right: 30, bottom: 30, left: 30},
    width = 960 - margin.left - margin.right,
    height = 660 - margin.top - margin.bottom,
    genome_offset = 0,
    genes_offset = 5, // from lcb
    genome_height = 10,
    lcb_overflow = 10,
    longest = 0;

var set_genome_offset = function(num_genomes) {
    genome_offset = height/num_genomes;
};

var convert = function(length) {
    return length/longest * width;
};

var zoom = d3.zoom()
    .scaleExtent([1, 100])
    .on("zoom", zoomed);

var svg = d3.select("body").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .style("display", "block")
  .append("g")
    //.attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    .call(zoom);

// background
var rect = svg.append("rect")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .style("fill", "pink")
    .style("opacity", 0.4)
    .style("pointer-events", "all");

container = svg.append("g");

function zoomed() {
    tx = d3.event.transform;
    txf = "translate(" + tx.x + ") scale(" + tx.k + ",1"+ ")";
    container.attr("transform", txf);
}

// draw genomes as lines
var draw_genomes = function(data) {
    var genomes = container.selectAll("genomes")
                    .data(data)
                    .enter()
                        .append("rect")
                            .attr("width", function(d) {return d.length;})
                            .attr("height", genome_height)
                            .attr("x", margin.left)
                            .attr("y", function(d,i) {return margin.top + i*genome_offset})
                            .style("fill", "green");
};

// draw genome features for each genome
var draw_features = function(gff3, genomes, rows) {
    var compute_height = function(index) {
        for(var row in rows) {
            if (rows[row].indexOf(index) > -1) {
                return row*10;
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
                            .attr("width", function(d, i) {return convert(d.end - d.start);})
                            .attr("height", 5)
                            .attr("x", function(d, i) {return margin.left + convert(d.start);})
                            .attr("y", function(d, i) {
                                return genes_offset + margin.top + genome_height + lcb_overflow/2 + compute_height(i) + index*genome_offset;
                            })
                            .style("fill", "black");
};

function draw_lcbs(lcb, index, color) {
    var lcbs = container.selectAll('lcb' + index)
                    .data(lcb)
                    .enter()
                        .append("rect")
                            .attr("width", function(d, i) {return convert(d.end - d.start);})
                            .attr("height", genome_height+lcb_overflow)
                            .attr("x", function(d, i) {return margin.left + convert(d.start);})
                            .attr("y", function(d, i) {
                                return margin.top-(lcb_overflow/2) + (d.id - 1)*genome_offset;
                            })
                            .style("fill", color)
                            .style("opacity", 0.5);

    for (var i = 0; i < lcb.length-1; i++) {
        var l11x = (margin.left + lcb[i].start/longest*width).toString();
        var l11y = (margin.top+genome_height+(lcb_overflow/2) + (lcb[i].id - 1)*genome_offset).toString();
        var l12x = (margin.left + lcb[i].end/longest*width).toString();
        var l12y = (margin.top+genome_height+(lcb_overflow/2) + (lcb[i].id - 1)*genome_offset).toString();
        var l22x = (margin.left + lcb[i+1].end/longest*width).toString();
        var l22y = (margin.top-(lcb_overflow/2) + (lcb[i+1].id - 1)*genome_offset).toString();
        var l21x = (margin.left + lcb[i+1].start/longest*width).toString();
        var l21y = (margin.top-(lcb_overflow/2) + (lcb[i+1].id - 1)*genome_offset).toString();
        var l11 = l11x + ',' + l11y + ' ';
        var l12 = l12x + ',' + l12y + ' ';
        var l22 = l22x + ',' + l22y + ' ';
        var l21 = l21x + ',' + l21y;
        container.append("polygon")
                    .attr("points", l11+l12+l22+l21)
                    .style("fill", color)
                    .style("opacity", 0.5)
    }
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
    return Math.max.apply(null, fasta.map(function(data) {
        return data.length;
    }));
}

// adjust pixels to genome length
var adjust_genomes = function(data) {
    adjusted_genomes = []
    $.each(data, function(key, fasta) {
        adjusted_genomes.push({name: fasta.name, length: convert(fasta.length)});
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
            if (last_placed[locs] == null || convert(gene.start) > 1+last_placed[locs]) {
                if (last_placed[locs] == null) {
                    last_placed.push(null);
                    rows[parseInt(locs)+1] = [];
                }
                last_placed[locs] = convert(gene.end);
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
    set_genome_offset(json.fasta.length);
    adjusted_genomes = adjust_genomes(json.fasta);
    draw_genomes(adjusted_genomes);

    var colors = ['red', 'blue', 'green', 'black'];
    $.getJSON(json.xmfa, function(xmfa) {
        xmfa.map(function(lcb, i) {
            draw_lcbs(lcb, i, colors[i]);
        });
    });

    for (var j in json.gff3) {
        $.get(json.gff3[j], function(gff3_data) {
            var gff3  = gff.process(gff3_data, ['CDS']);
            draw_features(gff3, adjusted_genomes, assign_rows(sortByKey(gff3, 'start')));
        });
    }
});
