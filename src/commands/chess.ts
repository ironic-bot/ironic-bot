import { ICommand } from '../interfaces/ICommand.js';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, Client, InteractionResponse, SlashCommandBuilder } from 'discord.js';
import { Chess } from 'chess.js';
import canvasPkg, { Canvas, CanvasRenderingContext2D, loadImage, Image, registerFont } from 'canvas';
const { createCanvas } = canvasPkg;

// Register fonts
registerFont('./assets/fonts/PlusJakartaSans-VariableFont_wght.ttf', {
    family: 'Plus Jakarta Sans',
});

type CoordPieces = {
    [key: string]: {
        x: number;
        y: number;
    };
};

type Images = {
    b: {
        b: Image;
        k: Image;
        n: Image;
        p: Image;
        q: Image;
        r: Image;
    };
    w: {
        b: Image;
        k: Image;
        n: Image;
        p: Image;
        q: Image;
        r: Image;
    };
};

const chesses:
    {
        white: string;
        black: string;
        chess: Chess;
        message: InteractionResponse;
        canvas: Canvas;
        ctx: CanvasRenderingContext2D;
        coordPieces: CoordPieces;
        images: Images;
    }[] = [];

export default class implements ICommand {
    data = new SlashCommandBuilder()
        .setName('chess')
        .setDescription('Play chess with another member!')
        .addSubcommand(subcommand =>
            subcommand
                .setName('start')
                .setDescription('Start a chess game with the bot or another member!')
                .addUserOption(option => option.setName('target').setDescription('The user to challenge').setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('move')
                .setDescription('Move a piece on the board.')
                .addStringOption(option => option.setName('from').setDescription('The algebraic notation of the piece to move').setRequired(true))
                .addStringOption(option => option.setName('to').setDescription('The algebraic notation of the destination').setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('end')
                .setDescription('End a chess game.'))

    async run(client: Client, interaction: ChatInputCommandInteraction): Promise<void> {
        if (interaction.options.getSubcommand() === 'start') {
            const userToPlayWith = interaction.options.getUser('target');

            if (userToPlayWith?.id !== interaction.user.id) {
                if (!chesses.find(x => x.white === interaction.user?.id || x.black === interaction.user?.id)) {
                    if (userToPlayWith?.id !== client.user?.id) {
                        if (!chesses.find(x => x.white === userToPlayWith?.id || x.black === userToPlayWith?.id)) {

                            const accept = new ButtonBuilder()
                                .setCustomId('accept')
                                .setLabel('Yes')
                                .setStyle(ButtonStyle.Success);

                            const cancel = new ButtonBuilder()
                                .setCustomId('cancel')
                                .setLabel('No')
                                .setStyle(ButtonStyle.Danger);

                            const row = new ActionRowBuilder<ButtonBuilder>().addComponents(accept, cancel);

                            const response = await interaction.reply({
                                content: `Hey <@!${userToPlayWith?.id}>! ${interaction.user.tag} wants to play chess with you! Do you accept the game?`,
                                components: [row],
                            });

                            const collectorFilter = (i: { user: { id: string | undefined; }; }) => i.user.id === userToPlayWith?.id;

                            try {
                                const confirmation = await response.awaitMessageComponent({ filter: collectorFilter, time: 60000 });

                                if (confirmation.customId === 'accept' && interaction.user.id && userToPlayWith?.id) {
                                    const chess = new Chess();

                                    const canvas = createCanvas(1024, 1024);
                                    const ctx = canvas.getContext('2d');

                                    const coordPieces: CoordPieces = {};

                                    const images: Images = {
                                        b: {
                                            b: await loadImage('assets/chess/black/bishop.png'),
                                            k: await loadImage('assets/chess/black/king.png'),
                                            n: await loadImage('assets/chess/black/knight.png'),
                                            p: await loadImage('assets/chess/black/pawn.png'),
                                            q: await loadImage('assets/chess/black/queen.png'),
                                            r: await loadImage('assets/chess/black/rook.png'),
                                        },
                                        w: {
                                            b: await loadImage('assets/chess/white/bishop.png'),
                                            k: await loadImage('assets/chess/white/king.png'),
                                            n: await loadImage('assets/chess/white/knight.png'),
                                            p: await loadImage('assets/chess/white/pawn.png'),
                                            q: await loadImage('assets/chess/white/queen.png'),
                                            r: await loadImage('assets/chess/white/rook.png'),
                                        }
                                    };

                                    // Initialize board
                                    cleanBoard(ctx, coordPieces, true);

                                    drawMoves(ctx, images, coordPieces, chess);

                                    const message = await confirmation.update({ content: `White is ${interaction.user.tag} and black is ${userToPlayWith?.tag}!`, files: [{ attachment: canvas.toBuffer(), name: 'chess.png' }], components: [] });
                                    chesses.push({
                                        white: interaction.user.id,
                                        black: userToPlayWith.id,
                                        chess: chess,
                                        message: message,
                                        canvas: canvas,
                                        ctx: ctx,
                                        coordPieces: coordPieces,
                                        images: images
                                    });
                                } else if (confirmation.customId === 'cancel') {
                                    await confirmation.update({ content: 'Game cancelled.', components: [] });
                                }
                            } catch {
                                await interaction.editReply({ content: 'Confirmation not received within 1 minute, cancelling...', components: [] });
                            }
                        } else {
                            await interaction.reply({ content: "Your opponent is already in a game!", ephemeral: true });
                        }
                    } else {
                        const chess = new Chess();

                        const canvas = createCanvas(1024, 1024);
                        const ctx = canvas.getContext('2d');

                        const coordPieces: CoordPieces = {};

                        const images: Images = {
                            b: {
                                b: await loadImage('assets/chess/black/bishop.png'),
                                k: await loadImage('assets/chess/black/king.png'),
                                n: await loadImage('assets/chess/black/knight.png'),
                                p: await loadImage('assets/chess/black/pawn.png'),
                                q: await loadImage('assets/chess/black/queen.png'),
                                r: await loadImage('assets/chess/black/rook.png'),
                            },
                            w: {
                                b: await loadImage('assets/chess/white/bishop.png'),
                                k: await loadImage('assets/chess/white/king.png'),
                                n: await loadImage('assets/chess/white/knight.png'),
                                p: await loadImage('assets/chess/white/pawn.png'),
                                q: await loadImage('assets/chess/white/queen.png'),
                                r: await loadImage('assets/chess/white/rook.png'),
                            }
                        };

                        // Initialize board
                        cleanBoard(ctx, coordPieces, true);

                        drawMoves(ctx, images, coordPieces, chess);

                        const message = await interaction.reply({ content: `White is ${interaction.user.tag} and black is ${userToPlayWith?.tag}!`, files: [{ attachment: canvas.toBuffer(), name: 'chess.png' }] });
                        chesses.push({
                            white: interaction.user.id,
                            black: 'auto',
                            chess: chess,
                            message: message,
                            canvas: canvas,
                            ctx: ctx,
                            coordPieces: coordPieces,
                            images: images
                        });
                    }
                } else {
                    await interaction.reply({ content: "You're already in a game!", ephemeral: true });
                }
            } else {
                await interaction.reply({ content: "You can't play with yourself!", ephemeral: true });
            }
        }
        else if (interaction.options.getSubcommand() === 'move') {
            const chessIndex = chesses.findIndex(x => x.white === interaction.user?.id || x.black === interaction.user?.id);
            const chess = chesses[chessIndex];
            if (chess) {
                cleanBoard(chess.ctx, chess.coordPieces, true);

                try {
                    chess.chess.move({ from: interaction.options.getString('from') ?? '', to: interaction.options.getString('to') ?? '' })

                    if (chess.black === 'auto') {
                        try {
                            chess.chess.move(findBestMove(chess.chess));
                        } catch {
                            return;
                        }
                    }

                    drawMoves(chess.ctx, chess.images, chess.coordPieces, chess.chess);

                    let imageToSend = chess.canvas.toBuffer();

                    if (chess.chess.turn() === 'b') {
                        const newCanvas = createCanvas(1024, 1024);
                        const newCtx = newCanvas.getContext('2d');

                        newCtx.save()
                        newCtx.translate(0, 1024);
                        newCtx.scale(1, -1);
                        newCtx.drawImage(chess.canvas, 0, 0, 1024, 1024);
                        newCtx.restore();

                        imageToSend = newCanvas.toBuffer();
                    }

                    if (!chess.chess.isGameOver()) {
                        if (chess.black !== 'auto') {
                            await chess.message.edit({ content: `${chess.white === interaction?.user.id ? 'White' : 'Black'} moved! It's ${chess.black === interaction?.user.id ? 'White' : 'Black'}'s turn!`, files: [{ attachment: imageToSend, name: 'chess.png' }] });
                        } else {
                            await chess.message.edit({ content: "Black moved! It's White's turn!", files: [{ attachment: imageToSend, name: 'chess.png' }] });
                        }
                    } else {
                        await chess.message.edit({ content: 'Game ends!', files: [{ attachment: imageToSend, name: 'chess.png' }] });
                        chesses.splice(chessIndex, 1);
                    }

                    await interaction.reply({ content: "Move made!", ephemeral: true });
                } catch {
                    await interaction.reply({ content: "Illegal move!", ephemeral: true });
                }
            } else {
                await interaction.reply({ content: "You aren't in any game!", ephemeral: true });
            }
        } else if (interaction.options.getSubcommand() === 'end') {
            const chessIndex = chesses.findIndex(x => x.white === interaction.user?.id || x.black === interaction.user?.id);
            const chess = chesses[chessIndex];
            if (chess) {
                let imageToSend = chess.canvas.toBuffer();

                if (chess.chess.turn() === 'b') {
                    const newCanvas = createCanvas(1024, 1024);
                    const newCtx = newCanvas.getContext('2d');

                    newCtx.save()
                    newCtx.translate(0, 1024);
                    newCtx.scale(1, -1);
                    newCtx.drawImage(chess.canvas, 0, 0, 1024, 1024);
                    newCtx.restore();

                    imageToSend = newCanvas.toBuffer();
                }

                await chess.message.edit({ content: 'Game ends!', files: [{ attachment: imageToSend, name: 'chess.png' }] });
                chesses.splice(chessIndex, 1);
                await interaction.reply({ content: "Game ended!", ephemeral: true });
            } else {
                await interaction.reply({ content: "You aren't in any game!", ephemeral: true });
            }
        }
    }
}

function cleanBoard(ctx: CanvasRenderingContext2D, coordPieces: CoordPieces, initialize?: boolean, invert?: boolean) {
    for (let x = 0; x < 8; x++) {
        for (let y = 0; y < 8; y++) {
            ctx.fillStyle = (x % 2) ? ((y % 2) ? '#eeeed2' : '#769656') : ((y % 2) ? '#769656' : '#eeeed2');
            ctx.fillRect(128 * x, 128 * y, 128, 128);

            const letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
            const numbers = ['8', '7', '6', '5', '4', '3', '2', '1'];

            if (initialize) {
                coordPieces[letters[x] + numbers[y]] = {
                    x: 128 * x,
                    y: 128 * y
                }
            }

            ctx.fillStyle = '#000000';
            ctx.font = '24px Plus Jakarta Sans'
            Object.entries(coordPieces).forEach(x => {
                if (!invert) {
                    ctx.fillText(x[0], x[1].x + 4, x[1].y + 24);
                } else {
                    ctx.save()
                    ctx.translate(x[1].x + 4, x[1].y + 128 - 24);
                    ctx.scale(1, -1);
                    ctx.fillText(x[0], 0, 0);
                    ctx.restore();
                }
            });

        }
    }
}

function drawMoves(ctx: CanvasRenderingContext2D, images: Images, coordPieces: CoordPieces, chess: Chess) {
    cleanBoard(ctx, coordPieces, false, chess.turn() === 'b');
    chess.board().flat().forEach(x => {
        if (x?.square) {
            if (chess.turn() === 'w') {
                ctx.drawImage(images[x.color][x.type], coordPieces[x.square].x, coordPieces[x.square].y, 128, 128);
            } else {
                ctx.save()
                ctx.translate(coordPieces[x.square].x, coordPieces[x.square].y + 128);
                ctx.scale(1, -1);
                ctx.drawImage(images[x.color][x.type], 0, 0, 128, 128);
                ctx.restore();
            }
        }
    });
}


// AI, thanks ChatGPT

// The maximum depth for the minimax algorithm
const MAX_DEPTH = 3;

// Minimax algorithm with alpha-beta pruning
function minimax(board: Chess, depth: number, alpha: number, beta: number, maximizingPlayer: boolean) {
    if (depth === 0 || board.isGameOver()) {
        return 0;
    }

    if (maximizingPlayer) {
        let maxScore = -Infinity;
        const moves = board.moves();

        for (let i = 0; i < moves.length; i++) {
            board.move(moves[i]);
            maxScore = Math.max(maxScore, minimax(board, depth - 1, alpha, beta, false));
            board.undo();

            alpha = Math.max(alpha, maxScore);
            if (alpha >= beta) {
                break;
            }
        }

        return maxScore;
    } else {
        let minScore = Infinity;
        const moves = board.moves();

        for (let i = 0; i < moves.length; i++) {
            board.move(moves[i]);
            minScore = Math.min(minScore, minimax(board, depth - 1, alpha, beta, true));
            board.undo();

            beta = Math.min(beta, minScore);
            if (beta <= alpha) {
                break;
            }
        }

        return minScore;
    }
}

// Function to find the best move using the minimax algorithm
function findBestMove(board: Chess) {
    let bestMove = '';
    let bestScore = -Infinity;
    const moves = board.moves();

    for (let i = 0; i < moves.length; i++) {
        board.move(moves[i]);
        const score = minimax(board, MAX_DEPTH, -Infinity, Infinity, false);
        board.undo();

        if (score > bestScore) {
            bestScore = score;
            bestMove = moves[i];
        }
    }

    return bestMove;
}
