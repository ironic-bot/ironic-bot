import * as Express from 'express';
import express from 'express';
import RateLimit from 'express-rate-limit';
import { Client } from 'discord.js';
import { db } from './glob.js';
const app = express();
const port = 3000;

let client: Client;


type DBData = {
  guild_id: string;
  user_id: string;
  xp: number;
  level: number;
  total_xp: number;
  last_message_time: number;
  username: string;
  avatar: string;
}

app.use(express.json());

// If not in dev mode..
if (!(process.execArgv[1].includes('node_modules/tsx'))) {
  // set up rate limiter: maximum of five requests per minute
  const limiter = RateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // max 100 requests per windowMs
  });

  // apply rate limiter to all requests
  app.use(limiter);
}

app.use((_req: express.Request, res: express.Response, next: express.NextFunction) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});

app.get('/leaderboard/*', async (req: Express.Request, res: Express.Response) => {
  const guildId = Object.values(req.params)
    .map((x) => x.replace(/\//g, ''))
    .filter((x) => {
      return x != '';
    })[0];
  const page = !isNaN(Number(req.query?.page)) ? Number(req.query?.page) : 0;
  const quantityOn = !isNaN(Number(req.query?.quantity)) ? Number(req.query?.quantity) : 100

  const guild = client.guilds.cache.get(guildId);

  if (guild) {

    const data = db
      .prepare(
        'SELECT * FROM levels WHERE guild_id = ?',
      )
      .all(guildId) as DBData[];

    const dataPaged = data.reduce((finalArray: DBData[][], item) => {
      if (finalArray.length < 1 || finalArray[finalArray.length - 1].length > (quantityOn - 1)) {
        finalArray.push([]);
      }
      if (finalArray[finalArray.length - 1].length < quantityOn) {
        finalArray[finalArray.length - 1].push(item);
      }
      return finalArray;
    }, []);

    if (dataPaged.length > page) {
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
          minRange: settings?.rank_min_range ?? 15,
          maxRange: settings?.rank_max_range ?? 25
        },
        roles: roles.map(x => {
          return {
            id: x.role_id,
            name: guild?.roles.cache.get(x.role_id)?.name,
            color: guild?.roles.cache.get(x.role_id)?.hexColor,
            level: x.level
          };
        }),
        members: dataPaged[page].map(x => {
          return {
            id: x.user_id,
            username: x.username ?? 'Unknown User',
            avatar: x.avatar ?? 'https://cdn.discordapp.com/embed/avatars/1.png',
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
