import * as fs from 'fs';
import * as path from 'path';

import { Telegraf, Context, Markup } from 'telegraf';
import nconf from 'nconf';

nconf.argv().env().file({ file: 'config.json' });

(async function main() {
	const bot = new Telegraf(nconf.get('TELEGRAM_API_KEY'));

	const pathToDir = path.resolve(process.env.HOME as string);
	bot.command('list', async (ctx: Context) => {
		const dirContent = await fs.promises.readdir(pathToDir, { encoding: 'utf-8', withFileTypes: true });
		const certificates = dirContent.filter((dirName) => dirName.name.endsWith('.ovpn'))
			.map((dirName) => dirName.name);

		await ctx.reply('Existed sertificates:', Markup.inlineKeyboard(
			certificates.map(certificate => [Markup.button.callback(certificate, certificate)])
		));
	});

	bot.action(/.\.ovpn/g, (ctx: Context) => {
		if ('callback_query' in ctx.update) {
			console.log(ctx.update.callback_query)
		}
	})

	bot.command('get', async (ctx) => {
		const [, filename] = ctx.message.text.split(' ');

		if (!filename?.length) {
			ctx.reply(`Invalid filename: "${ filename }"`);
			return;
		}

		const pathToFile = path.resolve(pathToDir, filename);
		if (!fs.existsSync(pathToFile)) {
			ctx.reply('Not found :(');
			return;
		}

		ctx.telegram.sendDocument(ctx.from.id, {
			source: pathToFile,
			filename,
		});
	});

	await bot.launch({
		webhook: {
			domain: nconf.get('HTTPS_HOST'),
			port: nconf.get('PORT'),
		},
	});
	console.log('Bot started');

	// Enable graceful stop
	process.once('SIGINT', () => bot.stop('SIGINT'))
	process.once('SIGTERM', () => bot.stop('SIGTERM'))
})();
