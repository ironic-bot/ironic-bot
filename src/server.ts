import * as Express from 'express';
import express from 'express';
import RateLimit from 'express-rate-limit';
import queryString from 'query-string';
import got from 'got';
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
  discriminator: string;
  avatar: string;
}

app.use(express.json());

// set up rate limiter: maximum of five requests per minute
const limiter = RateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // max 100 requests per windowMs
});

// apply rate limiter to all requests
app.use(limiter);

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
        members: dataPaged[page].map(x => {
          return {
            id: x.user_id,
            username: x.username ?? 'Unknown User',
            discriminator: x.discriminator ?? '0000',
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

app.get('/authorizeSpotify', (req: Express.Request, res: Express.Response) => {
  const state = req.query.state || null;

  if (state === null || !global.spotifyStates.findLast(x => x.state === state)) {
    res.status(401).send({
      error: "Unauthorized"
    });
  } else {
    res.redirect('https://accounts.spotify.com/authorize?' +
      queryString.stringify({
        response_type: 'code',
        client_id: process.env.SPOTIFY_CLIENT_ID,
        scope: 'user-top-read',
        redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
        state: state
      }));
  }
});

app.get('/spotifyCallback', (req: Express.Request, res: Express.Response) => {
  const code = req.query.code || null;
  const state = req.query.state || null;

  if (state === null) {
    res.redirect('/#' +
      queryString.stringify({
        error: 'state_mismatch'
      }));
  } else {
    got.post('https://accounts.spotify.com/api/token', {
      form: {
        code: code,
        redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + Buffer.from(process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET).toString('base64')
      }
    }).json<{ access_token: string; token_type: string; expires_in: number; refresh_token: string; scope: string; }>().then(data => {
      const realStateIndex = global.spotifyStates.findLastIndex(x => x.state === state);

      if (realStateIndex > -1) {
        const realState = global.spotifyStates[realStateIndex];

        const spotifyData = db
          .prepare(
            'SELECT * FROM spotify WHERE user_id = ?',
          )
          .get(realState.userId) as { user_id: string; access_token: string; refresh_token: string };

        if (spotifyData) {
          db.prepare(
            'UPDATE spotify SET access_token = ?, refresh_token = ? WHERE user_id = ?',
          ).run(
            data.access_token,
            data.refresh_token,
            realState.userId
          );
        } else {
          db.prepare(
            'INSERT INTO spotify (user_id, access_token, refresh_token) VALUES (?, ?, ?)',
          ).run(
            realState.userId,
            data.access_token,
            data.refresh_token
          );
        }

        global.spotifyStates.splice(realStateIndex, 1);
      }
    });
  }
  res.end();
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
