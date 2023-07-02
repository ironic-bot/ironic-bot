import { v4 as uuidv4 } from 'uuid';
import { ICommand } from '../interfaces/ICommand.js';
import { ChatInputCommandInteraction, Client, SlashCommandBuilder } from 'discord.js';
import got from 'got';
import fs from 'fs';
import * as bing from '../bing.js';
import { db } from '../glob.js';

export default class implements ICommand {
    data = new SlashCommandBuilder()
        .setName('spotify')
        .setDescription("Ionic's Spotify integration.")
        .addSubcommand(subcommand =>
            subcommand
                .setName('authorize')
                .setDescription('Authorize Ionic to access your Spotify account.')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('recommend')
                .setDescription('Gives you ten song recommendations based on your account.')
        )

    async run(_client: Client, interaction: ChatInputCommandInteraction): Promise<void> {
        if (!fs.existsSync(process.env.COOKIE_FILE ?? '')) {
			await interaction.reply('Bing support not enabled!');
			return;
		}

        if (interaction.options.getSubcommand() === 'authorize') {
            const spotifyData = db
                .prepare(
                    'SELECT * FROM spotify WHERE user_id = ?',
                )
                .get(interaction.user.id) as { user_id: string; access_token: string; refresh_token: string };

            if (!spotifyData) {
                const usedState = global.spotifyStates.find(x => x.userId === interaction.user.id);

                if (!usedState) {
                    const uuid = uuidv4();
                    global.spotifyStates.push({ userId: interaction.user.id, state: uuid });

                    await interaction.reply({ content: `Use this link to authorize Ionic to access your Spotify account. This link is only for you, so don't share it. ${process.env.SPOTIFY_AUTHORIZE_URI}?state=${uuid}`, ephemeral: true });
                } else {
                    await interaction.reply({ content: `Use this link to retry to authorize Ionic to access your Spotify account. This link is only for you, so don't share it. ${process.env.SPOTIFY_AUTHORIZE_URI}?state=${usedState.state}`, ephemeral: true });
                }
            } else {
                await interaction.reply({ content: 'Ionic is already authorized to access your Spotify account!', ephemeral: true });
            }
        } else if (interaction.options.getSubcommand() === 'recommend') {
            await interaction.deferReply();
            const spotifyData = db
                .prepare(
                    'SELECT * FROM spotify WHERE user_id = ?',
                )
                .get(interaction.user.id) as { user_id: string; access_token: string; refresh_token: string };

            if (spotifyData) {


                new Promise(async resolve => {
                    resolve(await got.get('https://api.spotify.com/v1/me/top/tracks', {
                        headers: {
                            'Authorization': 'Bearer ' + spotifyData.access_token
                        }
                    }).json().catch(async () => {
                        const jsonRefresh = await got.post('https://accounts.spotify.com/api/token', {
                            form: {
                                grant_type: 'refresh_token',
                                refresh_token: spotifyData.refresh_token
                            },
                            headers: {
                                'Authorization': 'Basic ' + Buffer.from(process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET).toString('base64')
                            }
                        }).json();
    
                        db.prepare(
                            'UPDATE spotify SET access_token = ? WHERE user_id = ?',
                        ).run(
                            (jsonRefresh as any).access_token,
                            interaction.user.id
                        );
    
                        resolve(await got.get('https://api.spotify.com/v1/me/top/tracks', {
                            headers: {
                                'Authorization': 'Bearer ' + (jsonRefresh as any).access_token
                            }
                        }).json());
                    }));
                }).then(async json => {
                    const stuffy = (json as any).items.map(x => x.name + ' by ' + x.artists.map(x => x.name).join(', '));

                    const bingEngine = await bing.initialize();

                    await bing.ask(bingEngine, 'Could you give me 10 songs recommendations based on my Top 10 listened songs? Here they are (divided with a ;): ' + stuffy.join('; '), bing.ConversationStyle.creative);
                    const bingReply = await bing.ask(bingEngine, 'Can you send me your recommended songs list in JSON format? I want a main "songs" key, with an array of objects with every song inside of it (with a "title" and a "artist" key).' + stuffy.join('; '), bing.ConversationStyle.creative);
                    const finalJson = JSON.parse(bingReply.split("```").find(x => x.startsWith('json')).slice(4));

                    await interaction.editReply(`Here are ten song recommendations by **Bing Chat**:\n${finalJson.songs.map(x => `**${x.title}** by **${x.artist}**`).join('\n')}`);
                });
            } else {
                await interaction.editReply('You must authorize Ionic to access your Spotify account!');
            }
        }
    }
}
