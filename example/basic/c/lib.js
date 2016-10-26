var Buffer = require("buffer").Buffer;
var crypto = require("crypto");
var md5 = {
	encode: function(data){
		var buf = new Buffer(data);
	  var str = buf.toString("binary");
	  return crypto.createHash("md5").update(str).digest("hex");
	}
}

module.exports["md5"] = md5;
;
