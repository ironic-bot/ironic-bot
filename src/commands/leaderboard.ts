import { ICommand } from '../interfaces/ICommand.js';
import { ChatInputCommandInteraction, Client, SlashCommandBuilder } from 'discord.js';

export default class implements ICommand {
	data = new SlashCommandBuilder()
		.setName('leaderboard')
		.setDescription("Send the link to this server's ranking leaderboard.");

	guildOnly = true;

	async run(_client: Client, interaction: ChatInputCommandInteraction): Promise<void> {
		await interaction.reply({ content: `You can visit the leaderboard [here](${process.env.WEBSITE}/leaderboard/${interaction.guildId}).`, ephemeral: true });
	}
}
