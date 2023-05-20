import { ICommand } from '../interfaces/ICommand.js';
import { ChatInputCommandInteraction, Client, SlashCommandBuilder } from 'discord.js';
import fs from 'fs';
import * as bing from '../bing.js';

export default class implements ICommand {
	data = new SlashCommandBuilder()
		.setName('bing')
		.setDescription('Chat with Bing! The conversation is kept until you end it')
		.addStringOption(option => option.setName('message').setDescription('The message to send').setRequired(true))
		.addStringOption(option => option.setName('style').setDescription('The conversation style')
		.addChoices(
			{ 'name': 'Creative', value: 'creative' },
			{ 'name': 'Balanced (default)', value: 'balanced' },
			{ 'name': 'Precise', value: 'precise' },
		));

	async run(_client: Client, interaction: ChatInputCommandInteraction): Promise<void> {
		await interaction.deferReply();

		if(!fs.existsSync(process.env.COOKIE_FILE ?? '')) {
			await interaction.editReply('Bing support not enabled!');
			return;
		}

		const conversationStyle = interaction.options.getString('style');

		await interaction.editReply(await bing.ask(interaction.options.getString('message') ?? '', (conversationStyle === 'creative') ? bing.ConversationStyle.creative : (conversationStyle === 'precise') ? bing.ConversationStyle.precise : bing.ConversationStyle.balanced));
	}
}
