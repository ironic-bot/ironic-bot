import * as Express from 'express';
import express from 'express';
import { Client, User } from 'discord.js';
import { db } from './glob.js';
const app = express();
const port = 3000;

let client: Client;

app.use(express.json());

app.get('/leaderboard/*', async (req: Express.Request, res: Express.Response) => {
  const guildId = Object.values(req.params)
    .map((x) => x.replace(/\//g, ''))
    .filter((x) => {
      return x != '';
    })[0];

  const guild = client.guilds.cache.get(guildId);

  if (guild) {

    const data = db
      .prepare(
        'SELECT * FROM levels WHERE guild_id = ?',
      )
      .all(guildId) as {
        guild_id: string;
        user_id: string;
        xp: number;
        level: number;
        total_xp: number;
        last_message_time: number;
      }[];

    const players: { guild_id: string; user_id: string; xp: number; level: number; total_xp: number; last_message_time: number; user: User; }[] = [];
    for (const player of data) {
      const user = await client.users.fetch(player.user_id);
      players.push({
        guild_id: player.guild_id,
        user_id: player.user_id,
        xp: player.xp,
        level: player.level,
        total_xp: player.total_xp,
        last_message_time: player.last_message_time,
        user: user
      });
    }

    const settings = db
      .prepare(
        'SELECT rank_min_range, rank_max_range FROM settings WHERE guild_id = ?',
      )
      .get(guildId) as { rank_min_range: number; rank_max_range: number };

    const roles = db
      .prepare(
        'SELECT role_id, level FROM rankroles WHERE guild_id = ?',
      )
      .all(guildId) as { role_id: string; level: number }[];

    res.send({
      guild: {
        name: guild?.name,
        description: guild?.description,
        icon: guild?.icon
      },
      settings: {
        minRange: settings.rank_min_range,
        maxRange: settings.rank_max_range
      },
      roles: roles.map(x => {
        return {
          id: x.role_id,
          name: guild?.roles.cache.get(x.role_id)?.name,
          level: x.level
        };
      }),
      members: players.map(x => {
        return {
          id: x.user_id,
          username: x.user.username ?? 'Unknown User',
          discriminator: x.user.discriminator ?? '0000',
          avatar: x.user.avatar ?? 'https://cdn.discordapp.com/embed/avatars/1.png',
          xp: x.xp,
          level: x.level
        };
      })
    });
  } else {
    res.status(404).send({
      error: "Not found."
    });
  }
});

app.use((_req: express.Request, res: express.Response) => {
  res.status(404).send({ error: "Not found." });
});

export function initialize(clientO: Client) {
  app.listen(port, () => {
    client = clientO;
    console.log(`Server listening on port ${port}`);
  });
}
