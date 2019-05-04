// Note "prisma generate" must have occurred earlier for the prisma-client code to be present and updated.
import { prisma } from './generated/prisma-client'

async function main() {
  await prisma.createEvent({
    t: 1000,
  })
  await prisma.createEvent({
    t: 2000,
  })
  await prisma.updateManyEvents({
    data: {
      t: 2001,
      data: {x: 123, y: 456},
    },
    where: {
      t: 2000
    },
  })
  await prisma.createEvent({
    t: 2000,
    data: {x: 789},
  })
  await prisma.updateManyEvents({
    data: {
      t: 2000,
      data: { x: 101112 },
    },
    where: {
      t: 2000
    },
  })
  await prisma.deleteManyEvents({
    t: 2000
  })
}

main().catch(e => console.error(e))
