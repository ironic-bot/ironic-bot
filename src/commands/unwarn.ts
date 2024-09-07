import { ICommand } from '../interfaces/ICommand.js';
import { db } from '../glob.js';
import {
	Client,
	PermissionFlagsBits,
	SlashCommandBuilder,
	ChatInputCommandInteraction,
	GuildMemberRoleManager,
} from 'discord.js';


export default class implements ICommand {
	data = new SlashCommandBuilder()
		.setName('unwarn')
		.setDescription('Unwarns an user.')
		.addStringOption(option => option.setName('target').setDescription("The warn's ID").setRequired(true))
		.setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers);

	guildOnly = true;

	async run(client: Client, interaction: ChatInputCommandInteraction): Promise<void> {
		if (!interaction.member) return;
		if (!interaction.guild) return;
		if (!client.user) return; // TypeScript "fix"
		// Get the member
		const id = interaction.options.getString('target');
		if (!id) return;
		const data = db.prepare('SELECT * FROM warns WHERE warn_id = ?').get(id) as { warn_id: string, guild_id: string, user_id: string, moderator_id: string, reason: string, time: number };
		if (!data) {
			interaction.reply({ content: "This warn doesn't exist.", ephemeral: true });
			return;
		}
		const member = interaction.guild.members.cache.get(data.user_id);
		// Check if the member has a higher role
		if (
			!member ||
			member.roles.highest.position >= (interaction.member.roles as GuildMemberRoleManager).highest.position
		) {
			interaction.reply({ content: "You can't unwarn this user.", ephemeral: true });
			return;
		}
		// Unwarn
		db.prepare('DELETE FROM warns WHERE warn_id = ?').run(id);
		interaction.reply({ content: 'Warn removed!', ephemeral: true });
	}
}
