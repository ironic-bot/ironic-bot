import { ICommand } from '../interfaces/ICommand.js';
import { ChatInputCommandInteraction, Client, SlashCommandBuilder } from 'discord.js';

import { Image } from 'image-js';
import got from 'got';

export default class implements ICommand {
	data = new SlashCommandBuilder()
		.setName('lsd')
		.setDescription('Makes your images very 60s!')
        .addAttachmentOption(option => option.setName('image').setDescription('The image to 60fy').setRequired(true))

	async run(_client: Client, interaction: ChatInputCommandInteraction): Promise<void> {
        await interaction.deferReply();
        try {
			const response = await got(interaction.options.getAttachment('image')?.url ?? '', { responseType: 'buffer' });
			const image = await Image.load(response.body);
			const filtered = image.blurFilter().gaussianFilter().medianFilter().scharrFilter().sobelFilter();
			await interaction.editReply({
				files: [{ attachment: Buffer.from(filtered.toBuffer()), name: 'result.png' }],
			});
		} catch(e) { 
			await interaction.editReply('Something went wrong!');
		}
	}
}
