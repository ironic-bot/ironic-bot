import { db } from '../glob.js';
import { ICommand } from '../interfaces/ICommand.js';
import {
	Client,
	SlashCommandBuilder,
	ChatInputCommandInteraction,
} from 'discord.js';
import { stocksNeededTime } from '../main.js';

type YourStocks = {
	user_id: string;
	crl: number;
	chc: number;
	btr: number;
	sug: number;
	nut: number;
	slt: number;
	vnl: number;
	egg: number;
	cnm: number;
}

export default class implements ICommand {
	data = new SlashCommandBuilder()
		.setName('economy')
		.setDescription('Economy! Play with fake internet money!')
		.addSubcommand((x) =>
			x
				.setName('set')
				.setDescription("Sets someone's money")
				.addUserOption((opt) =>
					opt
						.setName('target')
						.setDescription('The user to set money')
						.setRequired(true),
				)
				.addIntegerOption((opt) =>
					opt
						.setName('money')
						.setDescription('The quantity of money to set')
						.setRequired(true),
				),
		)
		.addSubcommand((x) =>
			x.setName('balance').setDescription('Your money'),
		)
		.addSubcommandGroup((x) =>
			x.setName('stocks').setDescription('Fun & Stocks!').addSubcommand((x) =>
				x.setName('look').setDescription('Look at the stocks')
			)
				.addSubcommand((x) =>
					x.setName('lookyou').setDescription('Look at your stocks')
				)
				.addSubcommand((x) =>
					x.setName('buy').setDescription("Buy stocks")
						.addStringOption(option => option.setName('stocks').setDescription('The stocks to buy')
							.addChoices(
								{ 'name': '$CRL', value: 'crl' },
								{ 'name': '$CHC', value: 'chc' },
								{ 'name': '$BTR', value: 'btr' },
								{ 'name': '$SUG', value: 'sug' },
								{ 'name': '$NUT', value: 'nut' },
								{ 'name': '$SLT', value: 'slt' },
								{ 'name': '$VNL', value: 'vnl' },
								{ 'name': '$EGG', value: 'egg' },
								{ 'name': '$CNM', value: 'cnm' },
							)
							.setRequired(true)
						)
						.addIntegerOption((x) => x.setName('quantity').setDescription('The quantity of stocks to buy').setMinValue(1).setMaxValue(100).setRequired(true))
				)
				.addSubcommand((x) =>
					x.setName('sell').setDescription("Sell your stocks")
						.addStringOption(option => option.setName('stocks').setDescription('The stocks to sell')
							.addChoices(
								{ 'name': '$CRL', value: 'crl' },
								{ 'name': '$CHC', value: 'chc' },
								{ 'name': '$BTR', value: 'btr' },
								{ 'name': '$SUG', value: 'sug' },
								{ 'name': '$NUT', value: 'nut' },
								{ 'name': '$SLT', value: 'slt' },
								{ 'name': '$VNL', value: 'vnl' },
								{ 'name': '$EGG', value: 'egg' },
								{ 'name': '$CNM', value: 'cnm' },
							)
							.setRequired(true)
						)
						.addIntegerOption((x) => x.setName('quantity').setDescription('The quantity of stocks to sell').setMinValue(1).setMaxValue(100).setRequired(true))
				)
		)
		.addSubcommand((x) =>
			x
				.setName('gamble')
				.setDescription('Gamble some money, win or lose!')
				.addIntegerOption((x) =>
					x
						.setName('money')
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
		const stocks = db.prepare('SELECT * from stocks').all() as { name: string, price: number, percent_change: string }[];
		const yourStocks = db.prepare('SELECT * from owned_stocks WHERE user_id = ?').get(interaction.user.id) as YourStocks;

		const stockName = interaction.options.getString('stocks');
		const stockQuantity = interaction.options.getInteger('quantity');

		const stocksPrice = (stocks.find(x => x.name === stockName?.toUpperCase())?.price ?? 0) * (stockQuantity ?? 0);

		switch (interaction.options.getSubcommand()) {
			case 'set': {
				if (interaction.user.id != process.env.OWNER_ID) {
					await interaction.reply({
						ephemeral: true,
						content: 'This command can only be used by the bot owner.',
					});
					return;
				}
				const cash = interaction.options.getInteger('money');
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
					content: 'Money set to the value specified.',
				});
				break;
			}
			case 'gamble': {
				const cash = interaction.options.getInteger('money');
				if (cash == null) {
					await interaction.reply({
						content: 'There was an error while executing this command!',
						ephemeral: true
					});
					return;
				}

				if (cash > userData.money) {
					await interaction.reply({
						content: "You don't have that much money!",
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
					content: `The ¥${cash} you gambled is now ¥${multipliedMoney}! That means you ${difference < 0 ? 'lost' : 'gained'
						} ¥${Math.abs(difference)}.`,
				});

				break;
			}

			case 'balance':
				await interaction.reply(`You have ¥${userData.money}.`);
				break;
			case 'look':
				await interaction.reply('Stock prices:\n\n' + stocks.map(x => `Name: \`$${x.name.toUpperCase()}\` | Price: \`¥${x.price}\` | Change: \`${x.percent_change}\``).join('\n') + `\n\nThese update every minute, so the next update will be in ${Math.floor((stocksNeededTime - Date.now()) / 1000)} seconds. **Buy low, sell high!**`);
				break;
			case 'lookyou':
				if(yourStocks) {
					let yourStocksThing = Object.entries(yourStocks);
					yourStocksThing.shift();
					yourStocksThing = yourStocksThing.filter(x => (x[1] as number) > 0);
					if(yourStocksThing.length < 1) {
						await interaction.reply("You don't own any stocks!");
						return;
					}
					await interaction.reply('Your stocks:\n\n' + yourStocksThing.map(x => `Name: \`$${x[0].toUpperCase()}\` | Quantity owned: \`${x[1]}\` | One sell price: \`¥${stocks.find(y => y.name === x[0].toUpperCase())?.price}\` | All sell price: \`¥${(stocks.find(y => y.name === x[0].toUpperCase())?.price ?? 0) * (x[1] as number)}\``).join('\n') + `\n\nThese update every minute, so the next update will be in ${Math.floor((stocksNeededTime - Date.now()) / 1000)} seconds. **Buy low, sell high!**`);
				} else {
					await interaction.reply("You don't own any stocks!");
				}
				break;
			case 'buy':
				if(!(!yourStocks || yourStocks[stockName ?? ''] < 100)) {
					await interaction.reply({
						content: "You have too many of these stocks!",
					});
					return;
				}

				if(userData.money < stocksPrice) {
					await interaction.reply({
						content: "You don't have enough money!",
					});
					return;
				}

				userData.money -= stocksPrice;
				db.prepare('UPDATE eco SET money = ? WHERE user_id = ?').run(
					userData.money,
					interaction.user.id,
				);

				if(yourStocks) {
					db.prepare(`UPDATE owned_stocks SET ${stockName} = ? WHERE user_id = ?`).run(
						yourStocks[stockName ?? ''] + stockQuantity,
						interaction.user.id,
					);
				} else {
					db.prepare(
						`INSERT INTO owned_stocks (user_id, crl, chc, btr, sug, nut, slt, vnl, egg, cnm) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
					).run(
						interaction.user.id,
						(stockName === 'crl') ? stockQuantity : 0,
						(stockName === 'chc') ? stockQuantity : 0,
						(stockName === 'btr') ? stockQuantity : 0,
						(stockName === 'sug') ? stockQuantity : 0,
						(stockName === 'nut') ? stockQuantity : 0,
						(stockName === 'slt') ? stockQuantity : 0,
						(stockName === 'vnl') ? stockQuantity : 0,
						(stockName === 'egg') ? stockQuantity : 0,
						(stockName === 'cnm') ? stockQuantity : 0
					);
				}

				await interaction.reply(`You bought ${stockQuantity} stocks from $${stockName?.toUpperCase()} for ¥${stocksPrice}!`);
				break;
			case 'sell':
				if(!yourStocks || yourStocks[stockName ?? ''] > (stockQuantity ?? 0)) {
					await interaction.reply({
						content: "You don't have enough of these stocks!",
					});
					return;
				}

				db.prepare(`UPDATE owned_stocks SET ${stockName} = ? WHERE user_id = ?`).run(
					yourStocks[stockName ?? ''] - (stockQuantity ?? 0),
					interaction.user.id,
				);

				userData.money += stocksPrice;
				db.prepare('UPDATE eco SET money = ? WHERE user_id = ?').run(
					userData.money,
					interaction.user.id,
				);

				await interaction.reply(`You sold ${stockQuantity} stocks from $${stockName?.toUpperCase()} for ¥${stocksPrice}!`);

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
