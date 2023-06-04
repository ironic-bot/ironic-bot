import { ICommand } from '../interfaces/ICommand.js';
import {
	Client,
	EmbedBuilder,
	SlashCommandBuilder,
	ChatInputCommandInteraction,
} from 'discord.js';
import { commands } from '../glob.js';

export default class implements ICommand {
	data = new SlashCommandBuilder()
		.setName('help')
		.setDescription('Lists all commands and their descriptions.');

	async run(_client: Client, interaction: ChatInputCommandInteraction): Promise<void> {
		const embed = new EmbedBuilder()
			.setColor('#0099ff')
			.setTitle('Command list');
		for (const command of commands.values()) {
			embed.addFields([
				{
					name: '/' + JSON.parse(JSON.stringify(command.data)).name,
					value: JSON.parse(JSON.stringify(command.data)).description,
				},
			]);
		}
		await interaction.reply({ embeds: [embed] });
	}
}
