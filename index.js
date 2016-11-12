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

$.getJSON(parseQueryString(location.search).url, function(json) {
    $.get(json.fasta[0], function(fasta) {
        console.log(fasta);
    });
});
