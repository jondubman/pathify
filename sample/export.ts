#!/usr/bin/env ts-node

// Bulk export script (for now, just for development purposes)

import * as commander from 'commander';
import * as fs from 'fs';
import { exec, spawn, fork, execFile } from 'promisify-child-process';

const log = console.log;
const mb = 10;
const options = { maxBuffer: 1024 * 1024 * mb }; // required by promisify-child-process.exec
const stringify = (obj: any, indent = 2) => (
  JSON.stringify(obj, null, indent)
)

// actions
const getActivityIds = {
  type: 'appQuery',
  params: {
    query: {
      type: 'activityIds'
    },
  }
}

const exportActivity = (activityId: string) => ({
  type: 'appQuery',
  params: {
    query: {
      activityId,
      type: 'exportActivity',
    },
  },
})

interface ExportCLI extends commander.Command {
  client?: string;
  filter?: string;
  server?: string;
}

const main = async () => {
  try {
    const cli: ExportCLI = commander
      .option('-c, --client [client]', 'clientAlias (e.g. app or device)')
      .option('-f, --filter [filter]', 'filter (e.g. all, selected, or some activityId)')
      .option('-s, --server [server]', 'path to Pathify server')
      .parse(process.argv);

    const client = cli.client || process.env.CA || 'app'; // TODO
    log('client:', client);

    const filter = cli.filter || 'all';
    log('filter:', filter);

    const server = cli.server || process.env.PATHIFY_SERVER;
    log('server:', server);

    const curl = `curl -s "${server}push?clientAlias=${client}" -H "Content-Type: application/json" -d @-`;
    const getCommand = JSON.stringify(getActivityIds);
    // log('getCommand:', getCommand);
    const { stderr, stdout } = await exec(`echo '${getCommand}' | ${curl}`, options);
    log('stdout:', stdout);
    const response = JSON.parse(stdout as string);
    log('response:', response);
    if (response.activityIds) {
      const allIds = (response.activityIds.kept || []).concat((response.activityIds.orphaned || []));
      const ids = allIds.filter((id: string) => (
        filter === 'all' ||
        filter === id ||
        filter === 'selected' && (id === response.currentActivityId || id === response.selectedActivityId)
      ))
      log('count of activities to export:', ids.length);
      const date = Date.now().toString();
      const folder = `./data/activities/${client}-${date}`;
      await exec(`mkdir ${folder}`);
      for (const id of ids) {
        log('id', id);
        const exportCommand = JSON.stringify(exportActivity(id));
        const command = `echo '${exportCommand}' | ${curl}`;
        log(command);
        const { stderr, stdout } = await exec(`echo '${exportCommand}' | ${curl}`, options);
        if (stdout) {
          log('exported', id);
          fs.writeFileSync(`${folder}/${id}`, stdout);
        }
      }
      log(`exported ${ids.length} to ${folder}`);
    }
  } catch(err) {
    console.error('error', err);
  }
}

main();
