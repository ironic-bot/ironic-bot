import { ICommand } from '../interfaces/ICommand.js';
import {
	ChatInputCommandInteraction,
	Client,
	EmbedBuilder,
	SlashCommandBuilder,
} from 'discord.js';

export default class implements ICommand {
	data = new SlashCommandBuilder()
		.setName('poll')
		.setDescription('Creates a poll')
		.addStringOption(option => option.setName('question').setDescription("The question to ask").setRequired(true))
		.addStringOption(option => option.setName('answeri').setDescription("A custom answer"))
		.addStringOption(option => option.setName('answerii').setDescription("A custom answer"))
		.addStringOption(option => option.setName('answeriii').setDescription("A custom answer"))
		.addStringOption(option => option.setName('answeriv').setDescription("A custom answer"))
		.addStringOption(option => option.setName('answerv').setDescription("A custom answer"))
		.addStringOption(option => option.setName('answervi').setDescription("A custom answer"))
		.addStringOption(option => option.setName('answervii').setDescription("A custom answer"))
		.addStringOption(option => option.setName('answerviii').setDescription("A custom answer"))
		.addStringOption(option => option.setName('answerix').setDescription("A custom answer"))
		.addStringOption(option => option.setName('answerx').setDescription("A custom answer"))
		.addStringOption(option => option.setName('answerxi').setDescription("A custom answer"))

	async run(_client: Client, interaction: ChatInputCommandInteraction): Promise<void> {
		const pollArgs = [
			interaction.options.getString('question'),
			interaction.options.getString('answeri'),
			interaction.options.getString('answerii'),
			interaction.options.getString('answeriii'),
			interaction.options.getString('answeriv'),
			interaction.options.getString('answerv'),
			interaction.options.getString('answervi'),
			interaction.options.getString('answervii'),
			interaction.options.getString('answerviii'),
			interaction.options.getString('answerix'),
			interaction.options.getString('answerx'),
			interaction.options.getString('answerxi'),
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
