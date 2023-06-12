const util = require('util');
const exec = util.promisify(require('node:child_process').exec);

export function promisedExec(command: string): Promise<{ stdout: string; stderr: string }> {
	return exec(command);
}
