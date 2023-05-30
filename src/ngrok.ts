import nconf from 'nconf';
import * as ngrok from 'ngrok';
import * as path from 'path';
import * as fs from 'fs';

nconf.argv().env().file({ file: 'config.json' });

(async function main() {
	await ngrok.authtoken(nconf.get('NGROK_API_KEY'));
	const httpsHost = await ngrok.connect(nconf.get('PORT'));
	console.log(httpsHost);

	const pathToConfig = path.resolve(__dirname, '..', 'config.json');
	const configStr = fs.readFileSync(pathToConfig, 'utf-8');
	const configJson = JSON.parse(configStr);
	configJson['HTTPS_HOST'] = httpsHost;
	fs.writeFileSync(pathToConfig, JSON.stringify(configJson), 'utf-8');
})();
