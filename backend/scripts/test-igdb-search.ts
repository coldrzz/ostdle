import { gamesService } from '../src/services/gamesService.js';

const queries = ['mario gala', 'super mario gal', 'super mario galaxy', 'zelda', 'red dead'];

for (const q of queries) {
  const results = await gamesService.searchGames(q);
  console.log(`\n"${q}":`);
  results.slice(0, 5).forEach((g) => console.log(`  - ${g.name}`));
}
