import { Client, Message } from 'discord.js';

export interface IMiddleware {
	run(client: Client, message: Message): Promise<void>;
}
