import * as fs from 'fs';
import * as path from 'path';

import { Telegraf, Context, Markup } from 'telegraf';
import nconf from 'nconf';
import { type CallbackQuery } from 'typegram/markup';
import { promisedExec, textToZeroWidth } from './utils';

nconf.argv().env().file({ file: 'config.json' });

(async function main() {
	const bot = new Telegraf(nconf.get('TELEGRAM_API_KEY'));

	const pathToDir = path.resolve(process.env.HOME as string);

	bot.command('list', async (ctx: Context) => {
		const dirContent = await fs.promises.readdir(pathToDir, { encoding: 'utf-8', withFileTypes: true });
		const certificates = dirContent.filter((dirName) => dirName.name.endsWith('.ovpn')).map((dirName) => dirName.name);

		await ctx.reply(
			'Existed sertificates:',
			Markup.inlineKeyboard(certificates.map((certificate) => [Markup.button.callback(certificate, certificate)])),
		);
	});

	bot.action(/.\.ovpn/g, (ctx: Context) => {
		const callbackQuery = ctx.callbackQuery as CallbackQuery.DataQuery;

		const filename = callbackQuery.data;
		if (!filename.length) {
			ctx.reply(`Invalid filename: "${filename}"`);
			return;
		}

		const pathToFile = path.resolve(pathToDir, filename);
		if (!fs.existsSync(pathToFile)) {
			ctx.reply('Not found :(');
			return;
		}

		ctx.telegram.sendDocument((ctx.from as any).id, {
			source: pathToFile,
			filename,
		});
	});

	bot.command('create', async (ctx: Context) => {
		const userState = textToZeroWidth(
			JSON.stringify({
				step: 'waitForName',
			}),
		);
		await ctx.reply('Введите имя для нового vpn пользователя' + userState);
	});

	bot.on('message', async (ctx: Context) => {
		// todo: state machine
		const command = nconf.get('PATH_TO_VPN_SCRIPT');
		const name = (ctx.message as any).text;
		if (!name) return;
		const { stderr } = await promisedExec(`sudo bash ${command} "1" ${name}`);

		if (stderr.length) {
			await ctx.reply('Ошибка при создании сертификата :(\n' + stderr);
		} else {
			await ctx.reply(`Сертификат с именем ${name} успешно создан`);
		}
	});

	await bot.launch({
		webhook: {
			domain: nconf.get('HTTPS_HOST'),
			port: nconf.get('PORT'),
		},
	});
	console.log('Bot started');

	// Enable graceful stop
	process.once('SIGINT', () => bot.stop('SIGINT'));
	process.once('SIGTERM', () => bot.stop('SIGTERM'));
})();
