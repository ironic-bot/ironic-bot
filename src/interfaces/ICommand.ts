import { ChatInputCommandInteraction, Client, SlashCommandBuilder } from 'discord.js';

export interface ICommand {
	data: Omit<SlashCommandBuilder, string>;
	guildOnly?: boolean;
	run(client: Client, interaction: ChatInputCommandInteraction): Promise<void>;
}
