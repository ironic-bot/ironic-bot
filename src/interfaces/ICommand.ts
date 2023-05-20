import { ChatInputCommandInteraction, Client, SlashCommandBuilder } from 'discord.js';

export interface ICommand {
	data: Omit<SlashCommandBuilder, string>;
	run(client: Client, interaction: ChatInputCommandInteraction): Promise<void>;
}
