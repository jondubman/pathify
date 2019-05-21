// Note "prisma generate" must have occurred earlier for the prisma-client code to be present and updated.
// To run: prisma seed
// import { prisma } from './generated/prisma-client'

async function main() {
  // // Create some sample data
  // let s = 1; // speed
  // for (let t = 1000; t < 1050; t += (t % 10) ? 1 : 2) {
  //   await prisma.createEvent({
  //     t,
  //     type: 'LOC',
  //     data: { speed: parseFloat(s.toFixed(2)) },
  //   })
  //   s *= 1.1;
  // }
}

main().catch(e => console.error(e))
