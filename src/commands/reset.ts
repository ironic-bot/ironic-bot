import { ICommand } from '../interfaces/ICommand.js';
import { ChatInputCommandInteraction, Client, SlashCommandBuilder } from 'discord.js';
import * as bing from '../bing.js';

export default class implements ICommand {
	data = new SlashCommandBuilder()
		.setName('reset')
		.setDescription('Resets the current Bing Chat conversation.');

	async run(_client: Client, interaction: ChatInputCommandInteraction): Promise<void> {
		bing.reset();
		await interaction.reply("Conversation reset!");
	}
}
