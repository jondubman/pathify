#!/usr/bin/env ts-node

// import * as child_process from 'child_process';
import { exec, spawn, fork, execFile } from 'promisify-child-process';
import * as fs from 'fs';
import * as getStdin from 'get-stdin';

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
    query: { type: 'activityIds' },
  }
}
log(stringify(getActivityIds));

const exportActivity = (activityId: string) => ({
  type: 'appQuery',
  params: {
    include: { activityId },
    query: {
      type: 'exportActivity',
    },
  },
})

const main = async () => {
  try {
    // const input = await getStdin();
    // log('input:', input);

    const PATHIFY_SERVER = process.env.PATHIFY_SERVER;
    const CLIENT_ALIAS = process.env.CA || 'app'; // TODO
    const curl = `curl -s "${PATHIFY_SERVER}push?clientAlias=${CLIENT_ALIAS}" -H "Content-Type: application/json" -d @-`;

    const { stderr, stdout } = await exec(`echo '${JSON.stringify(getActivityIds)}' | ${curl}`, options);
    log('stdout:', stdout);
    const response = JSON.parse(stdout as string);
    // log('response:', response);
    if (response.activityIds) {
      const ids = (response.activityIds.kept || []).concat((response.activityIds.orphaned || []));
      log('ids', ids.length);
      const date = Date.now().toString();
      const folder = `./data/activities/${CLIENT_ALIAS}-${date}`;
      await exec(`mkdir ${folder}`);
      for (const id of ids) {
        log('id', id);
        const exportCommand = JSON.stringify(exportActivity(id));
        log('exportCommand', exportCommand);
        const theCommand = `echo '${exportCommand}' | ${curl}`;
        log('theCommand', theCommand);
        const { stderr, stdout } = await exec(`echo '${exportCommand}' | ${curl}`, options);
        if (stdout) {
          log('success', id);
          fs.writeFileSync(`${folder}/${id}`, stdout);
        }
      }
    }
  } catch(err) {
    console.error('error', err);
  }
}

main();
