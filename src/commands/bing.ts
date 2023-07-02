import { ICommand } from '../interfaces/ICommand.js';
import { ChatInputCommandInteraction, Client, SlashCommandBuilder } from 'discord.js';
import fs from 'fs';
import * as bing from '../bing.js';

export default class implements ICommand {
	data = new SlashCommandBuilder()
		.setName('bing')
		.setDescription('Chat with Bing! The conversation is kept until you end it.')
		.addSubcommand(subcommand =>
			subcommand.setName('chat').setDescription("Sends this message to Bing Chat. If you already started a conversation, it'll continue.")
				.addStringOption(option => option.setName('message').setDescription('The message to send').setRequired(true))
				.addStringOption(option => option.setName('style').setDescription('The conversation style')
					.addChoices(
						{ 'name': 'Creative', value: 'creative' },
						{ 'name': 'Balanced (default)', value: 'balanced' },
						{ 'name': 'Precise', value: 'precise' },
					))
		)
		.addSubcommand(subcommand =>
			subcommand.setName('reset').setDescription('Resets your Bing Chat conversation.'))

	async run(_client: Client, interaction: ChatInputCommandInteraction): Promise<void> {
		await interaction.deferReply();

		if (!fs.existsSync(process.env.COOKIE_FILE ?? '')) {
			await interaction.editReply('Bing support not enabled!');
			return;
		}

		if (interaction.options.getSubcommand() === 'chat') {

			const conversationStyle = interaction.options.getString('style');

			let chatBot;

			if (global.chatBots.find(x => x.userId === interaction.user.id)) {
				chatBot = global.chatBots.find(x => x.userId === interaction.user.id).chatBot;
			} else {
				const newChatBot = await bing.initialize();
				global.chatBots.push({ userId: interaction.user.id, chatBot: newChatBot });
				chatBot = newChatBot;
			}

			await interaction.editReply(await bing.ask(chatBot, interaction.options.getString('message') ?? '', (conversationStyle === 'creative') ? bing.ConversationStyle.creative : (conversationStyle === 'precise') ? bing.ConversationStyle.precise : bing.ConversationStyle.balanced));
		} else if (interaction.options.getSubcommand() === 'reset') {
			const chatBotIndex = global.chatBots.findIndex(x => x.userId === interaction.user.id);

			if (chatBotIndex > -1) {
				global.chatBots.splice(chatBotIndex, 1);
				await interaction.editReply("Conversation reset!");
			} else {
				await interaction.editReply("You aren't in a conversation!");
			}
		}
	}
}
