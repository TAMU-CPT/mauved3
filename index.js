var d3 = require('d3');
var $ = require('jquery');
var gff = require('./gff3.js');
var Color = require('color');

// margin is space between genomes and container
var margin = {top: 30, right: 30, bottom: 30, left: 30},
    width = 960 - margin.left - margin.right,
    height = 660 - margin.top - margin.bottom,
    genome_offset = 0,
    genes_offset = 5, // from lcb
    genome_height = 10,
    lcb_overflow = 10,
    longest = 0;

var gff3s = [];
var adjusted_genomes = [];
var genome_map = {};
var gene_rows = {};
var xmfas;

var genomeGroup;
var genesGroups = [];
var lcbGroups = [];
var textGroups = [];
var lcb_areaGroup = [];

// find length as a function of longest genome/canvas width
function convert(length) {
    return length/longest * width;
};

var zoom = d3.zoom()
    .scaleExtent([1, 1000])
    .on("zoom", zoomed);

var svg = d3.select("body").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    //.style("display", "block")
    //.attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    .call(zoom);

// background
var rect = svg.append("rect")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .style("fill", "white")
    .style("opacity", 0.4)
    .style("pointer-events", "all");

// where genome name labels go
var border = d3.select("body")
    .append("svg")
        .attr("width", 100)
        .attr("height", height + margin.top + margin.bottom)

var info = d3.select("body")
    .append("svg")
        .attr("width", 500)
        .attr("height", height + margin.top + margin.bottom)

container = svg.append("g");
//genome_elements = container.append("g");

function zoomed() {
    tx = d3.event.transform;
    txf = "translate(" + tx.x + ") scale(" + tx.k + ",1"+ ")";
    container.attr("transform", txf);
    if (tx.k == 1000) {
        var x = tx.x
        console.log(x);
        draw_bars();
    }
}

// draw genomes as rectangles
function draw_genomes() {
    genomeGroup = container.selectAll("genomes")
                    .data(adjusted_genomes)
                    .enter()
                        .append("rect")
                            .attr("width", function(d) {return d.length;})
                            .attr("height", genome_height)
                            .attr("x", margin.left)
                            .attr("y", function(d,i) {return margin.top + i*genome_offset})
                            .attr("id", function(d, i){ return d.name; })
                            .style("fill", "green");

    var text = border.selectAll("text")
                        .data(adjusted_genomes)
                        .enter()
                            .append("text")
                                .attr("y", function(d,i) {return margin.top + i*genome_offset + lcb_overflow;})
                                .text( function (d) { return d.name; })
                                .attr("font-family", "sans-serif")
                                .attr("font-size", "20px");
};

function gene_clicked(d){
    colors = {
        '%23FFFF00': 'DNA replication/recombination',
        '%23FFA500': 'regulation',
        '%2387CEFA': 'structural/morphogenesis',
        '%23FF00FF': 'lysis',
        '%2371BC78': 'packaging',
        'black': 'other',
    }

    metadata = [d.seqid + ' ' + d.attributes.num, d.attributes.product, colors[d.attributes.color]];
    console.log(metadata.join(' | '))

    sizes = ['20px', '15px', '15px', '15px'];
    if (textGroups.length) {
        // if text already there, then change text
        textGroups.map(function(old_text) {
            old_text.text(function(d, i) {return metadata[i];})
        });
    }
    else {
        text = info.selectAll("text")
                        .data(metadata)
                        .enter()
                            .append("text")
                                .attr("x", '100')
                                .attr("y", function(d,i) {return i*20 + (height-80)/2;})
                                .text( function (d) {return d;})
                                .attr("font-family", "sans-serif")
                                .attr("font-size", function(d,i) {return sizes[i];});
                                //.attr("font-size", "20px");
        textGroups.push(text);
    }

};

function compute_height(genome_index, feat_index) {
    for(var row in gene_rows[genome_index]) {
        if (gene_rows[genome_index][row].indexOf(feat_index) > -1) {
            return row*10;
        }
    }
};

function find_index(name) {
    for (var genome in adjusted_genomes) {
        if (name == adjusted_genomes[genome].name) {
            return genome;
        }
    }
};

function gene_points(x_offset, gff3, i) {
    var index = find_index(gff3[0].seqid);
    var starting_x = x_offset + margin.left + convert(gff3[i].start);
    var starting_y = genes_offset + margin.top + genome_height + lcb_overflow/2 + compute_height(index, i) + index*genome_offset;
    var width = convert(gff3[i].end - gff3[i].start);
    var height = 10;
    if (width < 5) {
        // draw tiny genes as just triangles
        if (gff3[i].strand == '-') {
            starting_x = starting_x + width;
            return [
                [starting_x, starting_y],
                [starting_x - width, starting_y + height/2],
                [starting_x, starting_y + height]
            ].join(' ');
        }
        return [
            [starting_x, starting_y],
            [starting_x + width, starting_y + height/2],
            [starting_x, starting_y + height]
        ].join(' ');
    }

    if (gff3[i].strand == '-') {
        starting_x = starting_x + width;
        return [
            [starting_x, starting_y],
            [starting_x, starting_y + height],
            [starting_x - width + 5, starting_y + height],
            [starting_x - width, starting_y + height/2],
            [starting_x - width + 5, starting_y]
        ].join(' ');
    }
    return [
        [starting_x, starting_y],
        [starting_x, starting_y + height],
        [starting_x + width - 5, starting_y + height],
        [starting_x + width, starting_y + height/2],
        [starting_x + width - 5, starting_y]
    ].join(' ');
}

// draw genome features for each genome
function draw_features(gff3) {
    var index = find_index(gff3[0].seqid);

    var genes = container.selectAll('gene' + index)
                    .data(gff3)
                    .enter()
                        .append("polygon")
                            .attr("points", function(d,i) {return gene_points(0, gff3, i);})
                        //.append("rect")
                            //.attr("class", "gene")
                            //.attr("width", function(d, i) {return convert(d.end - d.start);})
                            //.attr("height", 10)
                            //.attr("x", function(d, i) {return margin.left + convert(d.start);})
                            //.attr("y", function(d, i) {
                                //return genes_offset + margin.top + genome_height + lcb_overflow/2 + compute_height(index, i) + index*genome_offset;
                            //})
                            .style("fill", function(d,i) {
                                if (d.attributes.color) {
                                    return d.attributes.color.replace("%23", "#");
                                }
                                return "black";
                            })
                            .on("click", gene_clicked);
                            //.on("click", function(){
                                        ////PointColors = [PointColors[1], PointColors[0]]
                                        //d3.selectAll(".gene").style("fill", "black");
                                        //d3.select(this).style("fill", "blue");
                            //});
    genesGroups.push(genes);
};

function calculate_offset(genome, lcb) {
    xmfas[lcb].map(function(g) {
        adjusted_genomes[g.id-1].x_offset = convert(genome.start - g.start);
    });
};

function redraw() {
    genomeGroup.attr("x", function(d) {return margin.left + d.x_offset;})

    lcbGroups.map(function(lcb) {
        lcb.attr("x", function(d, i) {return adjusted_genomes[d.id-1].x_offset + margin.left + convert(d.start);})
    });
    lcb_areaGroup.map(function(lcb_area, index) {
        lcb_area.attr("points", function(d,i) {return configure_lcb_areas(xmfas[index], i);})
    });

    genesGroups.map(function(genes, index) {
        genes.attr("points", function(d, i) {return gene_points(adjusted_genomes[genome_map[d.seqid]].x_offset, gff3s[index], i);})
        //genes.attr("x", function(d, i) {return adjusted_genomes[genome_map[d.seqid]].x_offset + margin.left + convert(d.start);})
    });
};

function configure_lcb_areas(lcb, i) {
    var l11x = (adjusted_genomes[lcb[i].id-1].x_offset + margin.left + lcb[i].start/longest*width).toString();
    var l11y = (margin.top+genome_height+(lcb_overflow/2) + (lcb[i].id - 1)*genome_offset).toString();
    var l12x = (adjusted_genomes[lcb[i].id-1].x_offset + margin.left + lcb[i].end/longest*width).toString();
    var l12y = (margin.top+genome_height+(lcb_overflow/2) + (lcb[i].id - 1)*genome_offset).toString();
    var l22x = (adjusted_genomes[lcb[i+1].id-1].x_offset + margin.left + lcb[i+1].end/longest*width).toString();
    var l22y = (margin.top-(lcb_overflow/2) + (lcb[i+1].id - 1)*genome_offset).toString();
    var l21x = (adjusted_genomes[lcb[i+1].id-1].x_offset + margin.left + lcb[i+1].start/longest*width).toString();
    var l21y = (margin.top-(lcb_overflow/2) + (lcb[i+1].id - 1)*genome_offset).toString();
    if (lcb[i].strand != lcb[i+1].strand) {
        return [[l11x,l11y],[l12x,l12y],[l21x,l21y],[l22x,l22y]].join(' ')
    } else { return [[l11x,l11y],[l12x,l12y],[l22x,l22y],[l21x,l21y]].join(' ') }
};

function draw_lcbs(lcb, index, color, color2) {
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
                            .attr("id", function(d, i){ return d.rid; })
                            //.style("fill", color2)
                            .style("fill", "blue")
                            .style("opacity", 0.5)
                        .on("click", function(genome){
                            calculate_offset(genome, index);
                            redraw();
                        });
    lcbGroups.push(lcbs);

    sliced_lcb = lcb.slice(0,lcb.length-1); // need to use +1, so slice array so no range error
    var lcb_areas = container.selectAll('lcb_area' + index)
                    .data(sliced_lcb)
                    .enter()
                        .append("polygon")
                            .attr("points", function(d,i) {return configure_lcb_areas(lcb, i);})
                            .style("fill", "gray")
                            //.style("stroke", "green")
                            //.style("stroke-width", "0.1")
                            //.style("fill", color)
                            .style("opacity", 0.65)
                            //.style("opacity", 0.5)

    lcb_areaGroup.push(lcb_areas);
};

function draw_bars() {
    // want to draw nucleotides upon full zoom eventually
    var w = width/longest;

    //adjusted_genomes.map(function(g, index) {
        //var bars = container.selectAll("bars")
                    //.data(adjusted_genomes[0].seq)
                    //.enter()
                        //.append("rect")
                        //.attr("width", w)
                        //.attr("height", genome_height)
                        //.attr("x", function(d, i) {return margin.left + i*w})
                        //.attr("y", function(d) {console.log(d); return margin.top + 0*genome_offset})
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
    //});
};


// find genome with longest length
function find_longest(fasta) {
    return Math.max.apply(null, fasta.map(function(data) {
        return data.length;
    }));
}

// find how far apart genomes should be from each other
function set_genome_offset(num_genomes) {
    genome_offset = height/num_genomes;
};

// adjust pixels to genome length
function adjust_genomes(data) {
    $.each(data, function(key, fasta, i) {
        adjusted_genomes.push({name: fasta.name, length: convert(fasta.length), x_offset:0, seq:''});
        genome_map[fasta.name] = key;
    });
};

// parse url
function parseQueryString(url) {
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
function assign_rows(gff3) {
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
    longest = find_longest(json.fasta);    // use this as reference for length ratios
    set_genome_offset(json.fasta.length);  // how far apart the genomes should be
    adjust_genomes(json.fasta);
    draw_genomes();

    var colors = ["#a6cee3","#b2df8a","#fb9a99","#fdbf6f","#cab2d6", "#ffff99"];
    colors = colors.map(function(c){ return Color(c) });

    //var colors = ["#a6cee3","#1f78b4","#b2df8a","#33a02c","#fb9a99","#e31a1c","#fdbf6f","#ff7f00","#cab2d6","#6a3d9a"];
    $.getJSON(json.xmfa, function(xmfa) {
        xmfas = xmfa;
        var promises = xmfa.map(function(lcb, i) {
            var c = colors[i % colors.length];
            draw_lcbs(lcb, i, c.rgb().string(), c.darken(0.5).rgb().string());
        });
        Promise.all(promises).then(function(values) {
            for (var j in json.gff3) {
                $.get(json.gff3[j], function(gff3_data) {
                    var gff3  = gff.process(gff3_data, ['CDS']);
                    gff3s.push(gff3);
                    gene_rows[find_index(gff3[0].seqid)] = assign_rows(sortByKey(gff3, 'start'));
                    draw_features(gff3);
                });
            }
        });
    });

    (json.fasta).map(function(f) {
        $.get(f.path, function(sequence) {
            adjusted_genomes[genome_map[f.name]].seq = sequence;
        });
    });
});
