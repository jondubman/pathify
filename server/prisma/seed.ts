// Note "prisma generate" must have occurred earlier for the prisma-client code to be present and updated.
// To run: prisma seed
import { prisma } from './generated/prisma-client'

async function main() {
  // Create some sample data
  let s = 1;
  for (let t = 1000; t < 1010; t++) {
    await prisma.createEvent({
      t,
      type: 'OTHER',
      data: { speed: parseFloat(s.toFixed(2)) },
    })
    s *= 1.1;
  }
}

main().catch(e => console.error(e))
