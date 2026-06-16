import { readFileSync, writeFileSync } from 'node:fs';
import { config } from '../src/config/index.js';
import { gamesService } from '../src/services/gamesService.js';

const levels = JSON.parse(readFileSync(config.levelsFile, 'utf8')) as Array<{
  id: string;
  gameTitle: string;
  gameId?: string;
  coverImage?: string;
  audioFile: string;
}>;

const updated = [];
for (const level of levels) {
  const results = await gamesService.searchGames(level.gameTitle);
  const match =
    results.find((r) => r.name.toLowerCase() === level.gameTitle.toLowerCase()) ?? results[0];
  if (match) {
    updated.push({
      ...level,
      gameId: String(match.id),
      coverImage: match.coverImage ?? level.coverImage,
    });
    console.log(`${level.gameTitle} -> ${match.id} (${match.name})`);
  } else {
    updated.push(level);
    console.log(`NO MATCH: ${level.gameTitle}`);
  }
}

writeFileSync(config.levelsFile, `${JSON.stringify(updated, null, 2)}\n`);
