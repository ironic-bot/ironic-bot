import { Message, Client } from 'discord.js';

import { IMiddleware } from '../interfaces/IMiddleware.js';
import XPMiddleware from '../message-middleware/xp.js';
import WordCountMiddleware from '../message-middleware/wordCount.js';

const messageMiddlewares: IMiddleware[] = [new XPMiddleware(), new WordCountMiddleware()];

export default async function (client: Client, message: Message) {
	if (message.author.bot) return;
	if (!message.member) return;

	for (const middleware of messageMiddlewares) {
		await middleware.run(client, message);
	}
}
