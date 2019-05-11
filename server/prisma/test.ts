// Note "prisma generate" must have occurred earlier for the prisma-client code to be present and updated.
// To run: ts-node test

// https://www.prisma.io/docs/1.31/prisma-client/basic-data-access/reading-data-TYPESCRIPT-rsc3/

import { prisma } from './generated/prisma-client'
import * as util from 'util';

async function main() {
  const query = `query allEvents {
    events {
      t
      data
      type
    }
  }`
  const result =  await prisma.$graphql(query);
  console.log(util.inspect(result, { depth: 4 }));
}

main().catch(e => console.error(e))

// await prisma.createEvent({
//   t: 2000,
// })
// await prisma.updateManyEvents({
//   data: {
//     t: 2001,
//     data: {x: 123, y: 456},
//   },
//   where: {
//     t: 2000
//   },
// })
//   await prisma.updateManyEvents({
//     data: {
//       t: 2000,
//       data: { x: 101112 },
//     },
//     where: {
//       t: 2000
//     },
//   })
//   await prisma.deleteManyEvents({
//     t: 2000
//   })
// const exists = await prisma.$exists.event({ t: 1000 });
