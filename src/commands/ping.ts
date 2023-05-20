import { ICommand } from '../interfaces/ICommand.js';
import { ChatInputCommandInteraction, Client, SlashCommandBuilder } from 'discord.js';

export default class implements ICommand {
	data = new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Pong!');

	async run(_client: Client, interaction: ChatInputCommandInteraction): Promise<void> {
		await interaction.reply('Pong!');
	}
}
