import { ICommand } from '../interfaces/ICommand.js';
import {
	ChannelType,
	ChatInputCommandInteraction,
	Client,
	EmbedBuilder,
	SlashCommandBuilder,
} from 'discord.js';

export default class implements ICommand {
	data = new SlashCommandBuilder()
		.setName('poll')
		.setDescription('Creates a poll.')
		.addStringOption(option => option.setName('question').setDescription("The question to ask").setRequired(true))
		.addStringOption(option => option.setName('answer1').setDescription("A custom answer"))
		.addStringOption(option => option.setName('answer2').setDescription("A custom answer"))
		.addStringOption(option => option.setName('answer3').setDescription("A custom answer"))
		.addStringOption(option => option.setName('answer4').setDescription("A custom answer"))
		.addStringOption(option => option.setName('answer5').setDescription("A custom answer"))
		.addStringOption(option => option.setName('answer6').setDescription("A custom answer"))
		.addStringOption(option => option.setName('answer7').setDescription("A custom answer"))
		.addStringOption(option => option.setName('answer8').setDescription("A custom answer"))
		.addStringOption(option => option.setName('answer9').setDescription("A custom answer"))
		.addStringOption(option => option.setName('answer10').setDescription("A custom answer"))
		.addStringOption(option => option.setName('answer11').setDescription("A custom answer"))

	guildOnly = true;

	async run(_client: Client, interaction: ChatInputCommandInteraction): Promise<void> {
		if (interaction.channel?.type !== ChannelType.GuildText) {
			await interaction.reply({ content: "Not implemented!", ephemeral: true });
			return;
		}
		
		const pollArgs = [
			interaction.options.getString('question'),
			interaction.options.getString('answer1'),
			interaction.options.getString('answer2'),
			interaction.options.getString('answer3'),
			interaction.options.getString('answer4'),
			interaction.options.getString('answer5'),
			interaction.options.getString('answer6'),
			interaction.options.getString('answer7'),
			interaction.options.getString('answer8'),
			interaction.options.getString('answer9'),
			interaction.options.getString('answer10'),
			interaction.options.getString('answer11'),
		].filter(x => x);
		if (pollArgs.length == 1) {
			await interaction.reply({ content: "Poll sent!", ephemeral: true })
			const pollMessage = await interaction.channel?.send('📊' + pollArgs[0]);
			await pollMessage?.react('✅');
			await pollMessage?.react('❌');
		} else if (pollArgs.length < 13) {
			const reactions = [
				'0️⃣',
				'1️⃣',
				'2️⃣',
				'3️⃣',
				'4️⃣',
				'5️⃣',
				'6️⃣',
				'7️⃣',
				'8️⃣',
				'9️⃣',
				'🔟',
			];
			const options: string[] = [];
			pollArgs.slice(1).forEach((option, i) => {
				options.push(reactions[i] + ': ' + option);
			});
			const embed = new EmbedBuilder().setDescription(options.join('\n'));
			await interaction.reply({ content: "Poll sent!", ephemeral: true })
			const pollMessage = await interaction.channel?.send({
				content: pollArgs[0] ?? '',
				embeds: [embed],
			});
			options.forEach(async (_, i) => {
				await pollMessage?.react(reactions[i]);
			});
		}
	}
}
