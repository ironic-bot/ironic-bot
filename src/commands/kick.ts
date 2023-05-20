import { ICommand } from '../interfaces/ICommand.js';
import {
	Client,
	PermissionFlagsBits,
	SlashCommandBuilder,
	ChatInputCommandInteraction,
	GuildMemberRoleManager,
} from 'discord.js';

export default class implements ICommand {
	data = new SlashCommandBuilder()
		.setName('kick')
		.setDescription('Kicks an user')
		.addUserOption(option => option.setName('target').setDescription('The user to kick').setRequired(true))
		.setDefaultMemberPermissions(PermissionFlagsBits.KickMembers);

	async run(client: Client, interaction: ChatInputCommandInteraction): Promise<void> {
		if (!interaction.member) return;
		if (!interaction.guild) return;
		if (!client.user) return; // TypeScript "fix"
		// Get the member
		const user = interaction.options.getUser('target');
		if (!user) return;

		const member = interaction.guild.members.cache.get(user.id);

		if (!member) return;

		// Check if the member has a higher role
		if (
			member.roles.highest.position >= (interaction.member.roles as GuildMemberRoleManager).highest.position
		) {
			await interaction.reply({ content: "You can't kick this user.", ephemeral: true });
			return;
		}
		if (
			member.roles.highest.position >=
			(await interaction.guild.members.fetch(client.user.id)).roles.highest.position
		) {
			await interaction.reply({ content: "I can't kick this user.", ephemeral: true });
			return;
		}
		// Kick
		await member.kick();
		await interaction.reply({ content: `${member.user.tag} has been kicked`, ephemeral: true });
	}
}
