import { ICommand } from '../interfaces/ICommand.js';
import {
	Client,
	PermissionFlagsBits,
	SlashCommandBuilder,
	ChatInputCommandInteraction,
} from 'discord.js';

export default class implements ICommand {
	data = new SlashCommandBuilder()
		.setName('unban')
		.setDescription('Unbans an user.')
		.addStringOption(option => option.setName('target').setDescription('The ID of user to unban').setRequired(true))
		.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers);

	guildOnly = true;

	async run(client: Client, interaction: ChatInputCommandInteraction): Promise<void> {
		if (!interaction.member) return;
		if (!interaction.guild) return;
		if (!client.user) return; // TypeScript "fix"
		// Get the member
		const memberId = interaction.options.getString('target');

		if (!memberId) return;

		const member = await interaction.guild.bans.fetch(memberId).catch(() => null);
		if (!member) {
			interaction.reply({ content: "That member isn't banned or doesn't exist.", ephemeral: true });
			return;
		}
		// Unban
		await interaction.guild.bans.remove(memberId);
		interaction.reply({ content: `${member.user.tag} has been unbanned`, ephemeral: true });
	}
}
