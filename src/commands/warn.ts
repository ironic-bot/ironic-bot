import { ICommand } from '../interfaces/ICommand.js';
import { db } from '../glob.js';
import {
	Client,
	PermissionFlagsBits,
	SlashCommandBuilder,
	ChatInputCommandInteraction,
	GuildMemberRoleManager,
} from 'discord.js';
import { SnowflakeUtil } from 'discord.js';

export default class implements ICommand {
	data = new SlashCommandBuilder()
		.setName('warn')
		.setDescription('Warns an user.')
		.addUserOption(option => option.setName('target').setDescription("The user to warn").setRequired(true))
		.addStringOption(option => option.setName('reason').setDescription("The reason to warn").setRequired(true))
		.setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers);

	guildOnly = true;

	async run(_client: Client, interaction: ChatInputCommandInteraction): Promise<void> {
		if (!interaction.member) return;
		if (!interaction.guild) return;
		// Get the member

		const user = interaction.options.getUser('target');
		if (!user) return;

		const member = interaction.guild.members.cache.get(user.id);
		const reason = interaction.options.getString('reason');
		if (!member) return;
		if (!reason) return;
		// Check if the member has a higher role
		if (
			member.roles.highest.position >= (interaction.member.roles as GuildMemberRoleManager).highest.position
		) {
			interaction.reply({ content: "You can't warn this user.", ephemeral: true });
			return;
		}
		// Warn
		db.prepare(
			'INSERT INTO warns (warn_id, guild_id, user_id, moderator_id, reason, time) VALUES (?, ?, ?, ?, ?, ?)',
		).run(
			SnowflakeUtil.generate(),
			interaction.guild.id,
			member.id,
			interaction.user.id,
			reason,
			Date.now(),
		);
		interaction.reply({ content: `${member.user.tag} has been warned`, ephemeral: true });
	}
}
