var $ = require('jquery');

module.exports = {

    read: function(path) {
        var features = [];
        return $.get(path, function(gff3_data) {
            gff3_data.split('\n').map(function(line) {
                if (!line.startsWith('#') && line.length != 0) {
                    var parts = line.split('\t');

                    if (parts.length !== 9) {
                        //the file might use spaces instead of tabs
                        //ill try to split it by spaces
                        parts = line.trim().split(/\s+/);
                    }

                    if (parts.length == 9) {
                        var attParts = parts[8].split(';');
                        var arrayObject = {};
                        for (var i = 0; i < attParts.length; ++i) {
                            var pair = attParts[i].split("=");
                            arrayObject[pair[0]] = pair[1];
                        }

                        var feature = {
                            seqid: parts[0],
                            source: parts[1],
                            type: parts[2],
                            start: parts[3],
                            end: parts[4],
                            score: parts[5],
                            strand: parts[6],
                            phase: parts[7],
                            attributes: arrayObject
                        };
                        features.push(feature)
                    } else {
                        var err = new Error('9 parts of feature not found');
                        console.log(err);
                    }
                }
            });
        })
        .done(function(data) {
            console.log('done');
            return features;
        });
    },
};
