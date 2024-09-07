import { ICommand } from '../interfaces/ICommand.js';
import { db } from '../glob.js';
import {
	Client,
	EmbedBuilder,
	SlashCommandBuilder,
	ChatInputCommandInteraction,
} from 'discord.js';

export default class implements ICommand {
	data = new SlashCommandBuilder()
		.setName('warns')
		.setDescription("Look at an user's warns.")
		.addUserOption(option => option.setName('target').setDescription("The user to look at").setRequired(true))

	guildOnly = true;

	async run(client: Client, interaction: ChatInputCommandInteraction): Promise<void> {
		if (!interaction.member) return;
		if (!interaction.guild) return;
		if (!client.user) return; // TypeScript "fix"
		// Get the member
		const user = interaction.options.getUser('target');
		if (!user) return;

		const member = interaction.guild.members.cache.get(user.id);

		if (!member) return;
		const data = db
			.prepare('SELECT * FROM warns WHERE user_id = ? AND guild_id = ?')
			.all(member.id, interaction.guild.id) as { warn_id: string, guild_id: string, user_id: string, moderator_id: string, reason: string, time: number }[];
		const embed = new EmbedBuilder()
			.setColor('#0099ff')
			.setTitle(`${member.user.tag}'s warns`)
			.setDescription(
				data.length > 0 ? data
					.map(
						(warn) =>
							`\`${warn.warn_id}\`: ${warn.reason} - <t:${Math.floor(
								warn.time / 1000,
							)}>`,
					)
					.join('\n') : "No warns found!",
			);
		interaction.reply({
			embeds: [embed],
		});
	}
}
