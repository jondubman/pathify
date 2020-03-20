#!/usr/bin/env ts-node

// import * as getStdin from 'get-stdin';
// const input = await getStdin();
// log('input:', input);

import * as commander from 'commander';
import * as fs from 'fs';
import { exec, spawn, fork, execFile } from 'promisify-child-process';

const log = console.log;
const mb = 10;
const options = { maxBuffer: 1024 * 1024 * mb }; // required by exec
const stringify = (obj: any, indent = 2) => (
  JSON.stringify(obj, null, indent)
)

// This is essentially a Redux action creator.
// TODO data is actually of type ExportedActivity; should import that.
// const importActivity = (data: any) => ({
//   type: 'importActivity',
//   params: {
//     include: data,
//   },
// })

const importActivity = (data: any) => (`{
  "type": "importActivity",
  "params": {
    "include": ${data}
  }
}`)

interface ImportCLI extends commander.Command {
  client?: string;
  folder?: string;
  server?: string;
}

const main = async () => {
  try {
    const cli: ImportCLI = commander
      .option('-c, --client [client]', 'clientAlias (e.g. app or device)')
      .requiredOption('-f, --folder [folder]', 'folder path for source data')
      .option('-s, --server [server]', 'path to Pathify server')
      .parse(process.argv);
    const { folder } = cli;
    log('folder:', folder);

    const client = cli.client || process.env.CA || 'app'; // TODO
    log('client:', client);

    const server = cli.server || process.env.PATHIFY_SERVER;
    log('server:', server);

    const items = fs.readdirSync(folder).filter((item: string) => !item.endsWith('import'));
    log('folder items', items);
    for (const filename of items) {
      log('Importing activity', filename);
      const fileContents = fs.readFileSync(`${folder}/${filename}`);
      const importCommand = importActivity(fileContents);
      const tempFile = `${folder}/${filename}.import`;
      fs.writeFileSync(tempFile, importCommand);
      const curl = `curl -s "${server}push?clientAlias=${client}" -H "Content-Type: application/json" -d @-`;
      const command = `cat ${tempFile} | ${curl}`;
      log(command);
      const { stderr, stdout } = await exec(command, options);
    }
  } catch(err) {
    console.error('error', err);
  }
}

main();
