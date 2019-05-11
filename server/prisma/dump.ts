// Note "prisma generate" must have occurred earlier for the prisma-client code to be present and updated.
// To run: ts-node dump
// Logs all events to console.

import { prisma } from './generated/prisma-client'

async function main() {
  const events = await prisma.events();
  console.log(events);
}

main().catch(e => console.error(e))
