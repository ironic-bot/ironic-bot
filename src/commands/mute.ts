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
		.setName('mute')
		.setDescription('Mutes an user')
		.addUserOption(option => option.setName('target').setDescription('The user to mute').setRequired(true))
		.addStringOption(option => option.setName('time').setDescription('Time in WdXhYmZs format').setRequired(true))
		.addStringOption(option => option.setName('reason').setDescription('The reason').setRequired(true))
		.setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers);

	async run(client: Client, interaction: ChatInputCommandInteraction): Promise<void> {
		if (!interaction.member) return;
		if (!interaction.guild) return;
		if (!client.user) return; // TypeScript "fix"
		// Get the member
		const user = interaction.options.getUser('target');
		if (!user) return;

		const member = interaction.guild.members.cache.get(user.id);

		if (!member) return;

		const time = parseTime(interaction.options.getString('time') ?? '');
		const reason = interaction.options.getString('reason');

		if (!time) return;

		if (!reason) return;

		if (!time) {
			await interaction.reply({ content: 'Please specify a valid time.', ephemeral: true });
			return;
		}
		// Check if the member has a higher role
		if (
			member.roles.highest.position >= (interaction.member.roles as GuildMemberRoleManager).highest.position
		) {
			await interaction.reply({ content: "You can't mute this user.", ephemeral: true });
			return;
		}
		if (
			member.roles.highest.position >=
			(await interaction.guild.members.fetch(client.user.id)).roles.highest.position
		) {
			await interaction.reply({ content: "I can't mute this user.", ephemeral: true });
			return;
		}
		// Mute
		await member.timeout(time, reason);
		await interaction.reply({ content: `${member.user.tag} has been muteed`, ephemeral: true });
	}
}

function parseTime(string: string) {
	const messageToWork = string.toString().toLowerCase();
	let array;
	if (
		/^([0-9]|1[0-9]|2[0-3])[d]([0-9]|[1-4][0-9]|5[0-9])[h]([0-9]|[1-4][0-9]|5[0-9])[m]([0-9]|[1-4][0-9]|5[0-9])[s]$/.test(
			messageToWork,
		)
	) {
		array = messageToWork
			.replace('d', ' ')
			.replace('h', ' ')
			.replace('m', ' ')
			.replace('s', ' ')
			.split(' ');
		return (
			array[0] * 86400000 +
			array[1] * 3600000 +
			array[2] * 60000 +
			array[3] * 1000
		);
	} else {
		return 0;
	}
}
