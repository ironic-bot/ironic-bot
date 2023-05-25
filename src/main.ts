import { Client, GatewayIntentBits, REST, Routes } from 'discord.js';

import { readdir } from 'fs/promises';

import detectTSNode from 'detect-ts-node';

import { config } from 'dotenv';
config();

import { commands, db, initDb } from './glob.js';

import * as bing from './bing.js';

import * as server from './server.js';
import { calculatePercentageChange, getRandomNumberBetween } from './utils.js';

const client = new Client({
	intents:
		GatewayIntentBits.Guilds |
		GatewayIntentBits.GuildMessages |
		GatewayIntentBits.GuildVoiceStates |
		GatewayIntentBits.MessageContent |
		GatewayIntentBits.GuildMessageReactions |
		GatewayIntentBits.GuildModeration,
});

let stocksNeededTime: number;

client.on('ready', async () => {
	await bing.initialize();

	server.initialize(client);

	console.log('Logged in as user', client?.user?.tag);
	initDb();
	// Event loader
	let events: string[];
	if (!detectTSNode) {
		events = await readdir('./build/src/events')
	} else {
		events = await readdir('./src/events');
	}
	for (const event of events) {
		if (!event.endsWith('.js') && !event.endsWith('.ts')) continue;
		const eventName = event.split('.')[0];
		const eventModule = await import(`./events/${event}`);
		client.on(eventName, (...args) => eventModule.default(client, ...args));
	}
	// Command loader
	let commandFiles: string[];
	if (!detectTSNode) {
		commandFiles = await readdir('./build/src/commands');
	} else {
		commandFiles = await readdir('./src/commands');
	}
	for (const command of commandFiles) {
		if (!command.endsWith('.js') && !command.endsWith('.ts')) continue;
		const commandName = command.split('.')[0];
		const commandModule = await import(`./commands/${command}`);
		commands.set(commandName, new commandModule.default());
	}

	if (process.env.DISCORD_TOKEN && process.env.CLIENT_ID) {
		try {
			const rest = new REST().setToken(process.env.DISCORD_TOKEN);

			await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
				body: Array.from(commands.values()).map(x => x.data)
			});
		} catch (e) {
			console.log(e);
		}
	}

	modifyStocks();

	setInterval(() => modifyStocks, 60000);
});

export { stocksNeededTime };

client.login(process.env.DISCORD_TOKEN);

function modifyStocks() {
	const stocks = db.prepare('SELECT * from stocks').all() as { name: string, price: number, percent_change: string }[];

	stocks.forEach(stock => {
		const change = getRandomNumberBetween(((getRandomNumberBetween(0, (stock.price - 1))) * -1), 1000);
		const newPrice = stock.price + change;
		const percentChange = calculatePercentageChange(stock.price, newPrice);

		db.prepare(
			'UPDATE stocks SET price = ?, percent_change = ? WHERE name = ?',
		).run(
			newPrice,
			percentChange,
			stock.name
		);
	});

	stocksNeededTime = Date.now() + 60000;
}
