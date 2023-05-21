import { db } from '../glob.js';
import { ICommand } from '../interfaces/ICommand.js';
import {
	Client,
	SlashCommandBuilder,
	ChatInputCommandInteraction,
} from 'discord.js';

export default class implements ICommand {
	data = new SlashCommandBuilder()
		.setName('economy')
		.setDescription('Economy! Play with $IRON, the new bot currency!')
		.addSubcommand((x) =>
			x
				.setName('add')
				.setDescription('Adds a certain amount of $IRON to you')
				.addIntegerOption((opt) =>
					opt
						.setName('iron')
						.setDescription('The quantity of $IRON to add')
						.setMinValue(0)
						.setMaxValue(10000)
						.setRequired(true),
				),
		)
		.addSubcommand((x) =>
			x
				.setName('remove')
				.setDescription('Removes a certain amount of $IRON from you')
				.addIntegerOption((opt) =>
					opt
						.setName('iron')
						.setDescription('The quantity of $IRON to remove')
						.setMinValue(0)
						.setRequired(true),
				),
		)
		.addSubcommand((x) =>
			x
				.setName('set')
				.setDescription("Sets someone's $IRON")
				.addUserOption((opt) =>
					opt
						.setName('target')
						.setDescription('The user to set $IRON')
						.setRequired(true),
				)
				.addIntegerOption((opt) =>
					opt
						.setName('iron')
						.setDescription('The quantity of $IRON to set')
						.setRequired(true),
				),
		)
		.addSubcommand((x) =>
			x.setName('balance').setDescription('Your quantity of $IRON'),
		)
		.addSubcommand((x) =>
			x
				.setName('buyban')
				.setDescription('Purchase the ban of another user. ($IRON 1,000,000)')
				.addUserOption((opt) =>
					opt
						.setName('target')
						.setDescription('The user to ban')
						.setRequired(true),
				),
		)
		.addSubcommand((x) =>
			x
				.setName('gamble')
				.setDescription('Gamble some money, win or lose!')
				.addIntegerOption((x) =>
					x
						.setName('iron')
						.setDescription('The quantity to gamble')
						.setMinValue(0)
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
				const cash = interaction.options.getInteger('iron');
				if (cash == null) {
					await interaction.reply({
						ephemeral: true,
						content: 'There was an error while executing this command!',
					});
					return;
				}

				userData.money += cash;
				db.prepare('UPDATE eco SET money = ? WHERE user_id = ?').run(
					userData.money,
					interaction.user.id,
				);
				await interaction.reply({
					content: `Your new balance is $IRON ${userData.money}.`,
				});
				break;
			}
			case 'remove': {
				const cash = interaction.options.getInteger('iron');
				if (cash == null) {
					await interaction.reply({
						content: 'There was an error while executing this command!',
						ephemeral: true
					});
					return;
				}

				if (cash > userData.money) {
					await interaction.reply({
						content:
							'You have less money than the amount to remove!',
					});
					return;
				}

				userData.money -= cash;
				db.prepare('UPDATE eco SET money = ? WHERE user_id = ?').run(
					userData.money,
					interaction.user.id,
				);

				await interaction.reply({
					content: `Your new balance is $IRON ${userData.money}.`,
				});
				break;
			}
			case 'set': {
				if (interaction.user.id != process.env.OWNER_ID) {
					await interaction.reply({
						ephemeral: true,
						content: 'This command can only be used by the bot owner.',
					});
					return;
				}
				const cash = interaction.options.getInteger('iron');
				if (cash == null) {
					await interaction.reply({
						content: 'There was an error while executing this command!',
						ephemeral: true
					});
					return;
				}

				db.prepare('UPDATE eco SET money = ? WHERE user_id = ?').run(
					cash,
					interaction.options.getUser('target')?.id,
				);

				await interaction.reply({
					content: '$IRON set to the value specified.',
				});
				break;
			}
			case 'buyban':
				if (userData.money < 1000000) {
					await interaction.reply({
						content: "You don't have enough $IRON!",
					});
					return;
				}
				userData.money -= 1000000;
				db.prepare('UPDATE eco SET money = ? WHERE user_id = ?').run(
					userData.money,
					interaction.user.id,
				);

				await interaction.reply({ content: "Why would you want to ban another user? That's rude... I'm taking that $IRON, though." });
				break;
			case 'gamble': {
				const cash = interaction.options.getInteger('iron');
				if (cash == null) {
					await interaction.reply({
						content: 'There was an error while executing this command!',
						ephemeral: true
					});
					return;
				}

				if (cash > userData.money) {
					await interaction.reply({
						content: "You don't have that much $IRON!",
					});
					return;
				}

				userData.money -= cash;
				const moneyMultiplier = weightedRandomNumber();
				const multipliedMoney = Math.floor(cash * moneyMultiplier);
				userData.money += multipliedMoney;
				const difference = multipliedMoney - cash;

				db.prepare('UPDATE eco SET money = ? WHERE user_id = ?').run(
					userData.money,
					interaction.user.id,
				);

				await interaction.reply({
					content: `The $IRON ${cash} you gambled is now $IRON ${multipliedMoney}! That means you ${
						difference < 0 ? 'lost' : 'gained'
					} $IRON ${Math.abs(difference)}.`,
				});

				break;
			}

			case 'balance':
				await interaction.reply(`You have $IRON ${userData.money}.`);
				break;
			default:
				await interaction.reply({
					ephemeral: true,
					content: 'Command not implemented.',
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
