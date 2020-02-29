"use strict";
// Convert JSON5 file to JSON.
exports.__esModule = true;
var json5 = require("json5");
var fs = require("fs");
function main() {
    var suffix = 'json5';
    // Note this expects to be run in the sample project root folder! Not too flexible, but, good enough for now.
    function convert(path) {
        if (path.endsWith(suffix)) {
            if (fs.existsSync(path)) {
                var contents = fs.readFileSync(path).toString();
                var obj = json5.parse(contents);
                // from json5/foo.json5 to json/foo
                var json5filename = path.split('/')[1];
                var jsonFilename = 'json/' + json5filename.substr(0, json5filename.length - suffix.length - 1);
                // console.log(obj);
                fs.writeFileSync(jsonFilename, JSON.stringify(obj) + '\n');
                console.log("Converted " + path + " to " + jsonFilename);
            }
        }
    }
    // usage:
    // node index.js json5/singleJson5file.json5
    // node index.js json5/*.json5
    for (var j = 2; j < process.argv.length; j++) {
        convert(process.argv[j]);
    }
}
main();
