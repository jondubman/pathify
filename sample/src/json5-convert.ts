#!/usr/bin/env ts-node

// usage:
// json5-convert json5/singleJson5file.json5
// json5-convert json5/*.json5

// Convert JSON5 file to JSON.

import * as json5 from 'json5';
import * as fs from 'fs';

function main() {
  const suffix = 'json5';

  // Note this expects to be run in the sample project root folder, and it puts all the results in the json subfolder.
  // Not too flexible, but, good enough for now.
  function convert(path: string) {
    if (path.endsWith(suffix)) {
      if (fs.existsSync(path)) {
        const contents = fs.readFileSync(path).toString();
        const obj = json5.parse(contents);

        // from json5/foo.json5 to json/foo
        const json5filename = path.split('/')[1];
        const jsonFilename = 'json/' + json5filename.substr(0, json5filename.length - suffix.length - 1);
        // console.log(obj);
        fs.writeFileSync(jsonFilename, JSON.stringify(obj) + '\n');
        console.log(`Converted ${path} to ${jsonFilename}`);
        }
    }
  }

  for (let j = 2; j < process.argv.length; j++) {
    convert(process.argv[j]);
  }
}

main()
