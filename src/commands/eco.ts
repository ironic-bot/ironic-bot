import { db } from '../glob.js';
import { ICommand } from '../interfaces/ICommand.js';
import {
	Client,
	SlashCommandBuilder,
	ChatInputCommandInteraction,
} from 'discord.js';

export default class implements ICommand {
	data = new SlashCommandBuilder()
		.setName('eco')
		.setDescription('economy')
		.addSubcommand((x) =>
			x
				.setName('add')
				.setDescription('give me cash')
				.addIntegerOption((opt) =>
					opt
						.setName('cash')
						.setDescription('how money')
						.setMinValue(0)
						.setMaxValue(10000)
						.setRequired(true),
				),
		)
		.addSubcommand((x) =>
			x
				.setName('remove')
				.setDescription('remove me cash')
				.addIntegerOption((opt) =>
					opt
						.setName('cash')
						.setDescription('how money')
						.setMinValue(0)
						.setRequired(true),
				),
		)
		.addSubcommand((x) =>
			x
				.setName('set')
				.setDescription("set someone's money")
				.addUserOption((opt) =>
					opt
						.setName('user')
						.setDescription('user to set money for')
						.setRequired(true),
				)
				.addIntegerOption((opt) =>
					opt
						.setName('cash')
						.setDescription('how much cash to set')
						.setRequired(true),
				),
		)
		.addSubcommand((x) =>
			x.setName('balance').setDescription('how much money you have'),
		)
		.addSubcommand((x) =>
			x
				.setName('buyban')
				.setDescription('Purchase the banishment of another user. ($1,000,000)')
				.addUserOption((opt) =>
					opt
						.setName('user')
						.setDescription('User select to purcahse for banishment')
						.setRequired(true),
				),
		)
		.addSubcommand((x) =>
			x
				.setName('gamble')
				.setDescription('its not an addiction!!')
				.addIntegerOption((x) =>
					x
						.setName('cash')
						.setDescription('how much to gamble (your life savings)')
						.setRequired(true),
				),
		);

	async run(
		_client: Client,
		interaction: ChatInputCommandInteraction,
	): Promise<void> {
		const userData = getUser(interaction.user.id);
		switch (interaction.options.getSubcommand()) {
			case 'add': {
				const cash = interaction.options.getInteger('cash');
				if (cash == null) {
					await interaction.reply({
						ephemeral: true,
						content: 'cash was null?? how?!?!?',
					});
					return;
				}

				userData.money += cash;
				db.prepare('UPDATE eco SET money = ? WHERE user_id = ?').run(
					userData.money,
					interaction.user.id,
				);
				await interaction.reply({
					content: `ok, you now have $${userData.money}`,
				});
				break;
			}
			case 'remove': {
				const cash = interaction.options.getInteger('cash');
				if (cash == null) {
					await interaction.reply({
						content: 'cash was null?? how?!?!?',
					});
					return;
				}

				if (cash > userData.money) {
					await interaction.reply({
						content:
							'umm akcshually... 🤓 you have less than that amount 🤓🤓🤓',
					});
					return;
				}

				userData.money -= cash;
				db.prepare('UPDATE eco SET money = ? WHERE user_id = ?').run(
					userData.money,
					interaction.user.id,
				);

				await interaction.reply({
					content: `ok, you now have $${userData.money}`,
				});
				break;
			}
			case 'set': {
				if (interaction.user.id != process.env.OWNER_ID) {
					await interaction.reply({
						ephemeral: true,
						content: 'ur not allowed to use this',
					});
					return;
				}
				const cash = interaction.options.getInteger('cash');
				if (cash == null) {
					await interaction.reply({
						content: 'cash was null?? how?!?!?',
					});
					return;
				}

				db.prepare('UPDATE eco SET money = ? WHERE user_id = ?').run(
					cash,
					interaction.options.getUser('user')?.id,
				);

				await interaction.reply({
					content: 'ok i set it',
				});
				break;
			}
			case 'buyban':
				if (userData.money < 1000000) {
					await interaction.reply({
						content: 'you need more money',
					});
					return;
				}
				userData.money -= 1000000;
				db.prepare('UPDATE eco SET money = ? WHERE user_id = ?').run(
					userData.money,
					interaction.user.id,
				);

				await interaction.reply({ content: 'get scammed, you just lost 1m' });
				break;
			case 'gamble': {
				const cash = interaction.options.getInteger('cash');
				if (cash == null) {
					await interaction.reply({
						content: 'cash was null?? how?!?!?',
					});
					return;
				}

				if (cash < 0) {
					await interaction.reply({
						content: 'Hey... thats not a valid amount!!!!',
					});
					return;
				}

				if (cash > userData.money) {
					await interaction.reply({
						content: "YOU CAN'T GAMBLE MONEY YOU DON'T HAVE...",
					});
					return;
				}

				userData.money -= cash;
				const moneyMultiplier = weightedRandomNumber();
				console.log(moneyMultiplier);
				const multipliedMoney = Math.floor(cash * moneyMultiplier);
				userData.money += multipliedMoney;
				const difference = multipliedMoney - cash;

				db.prepare('UPDATE eco SET money = ? WHERE user_id = ?').run(
					userData.money,
					interaction.user.id,
				);

				await interaction.reply({
					content: `woah... ur $${cash} turned into $${multipliedMoney}, so you ${
						difference < 0 ? 'lost' : 'gained'
					} $${Math.abs(difference)}`,
				});

				break;
			}

			case 'balance':
				await interaction.reply(`you have $${userData.money}`);
				break;
			default:
				await interaction.reply({
					ephemeral: true,
					content: 'command not implemented',
				});
				break;
		}
	}
}

function getUser(userId: string): { money: number } {
	const data = db
		.prepare('SELECT money FROM eco WHERE user_id = ?')
		.get(userId) as { money: number };

	if (data == null) {
		db.prepare('INSERT INTO eco (user_id, money) VALUES (?, ?)').run(userId, 0);
		return { money: 0 };
	} else {
		return data;
	}
}

function weightedRandomNumber(): number {
	let num = Math.random();
	num = Math.pow(num, 3);
	return num * 5;
}
