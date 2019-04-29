// Note "prisma generate" must have occurred earlier for the prisma-client code to be present and updated.
import { prisma } from './generated/prisma-client'

async function main() {
  await prisma.createEvent({
    t: 1000
  })
  await prisma.createEvent({
    t: 2000
  })
}

main().catch(e => console.error(e))
