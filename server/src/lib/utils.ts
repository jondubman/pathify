import * as fs from 'fs';

import { log } from 'lib/log-bunyan';

const utils = {
  // secrets folder is excluded from Git repo.
  // returns null if secret not found.
  // the .. in front of secrets is to get us up and out of the lib module.
  getSecret: (filename: string) => {
    try {
      const filepath = __dirname + '/../secrets/' + filename;
      log.info('getSecret: reading local file', filepath);
      return fs.readFileSync(filepath, 'utf8');
    } catch (err) {
      log.warn(`utils.getSecret failed for ${filename}`);
      return null;
    }
  }
}

export { utils };
