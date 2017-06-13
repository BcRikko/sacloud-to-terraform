import * as fs from 'fs';
import * as yaml from 'js-yaml';
import Terraform from './Terraform';

interface IEnv {
    account: string
    accessToken: string;
    secretToken: string;
    defaultZone: string;
}

process.on('unhandledRejection', console.dir);

async function main() {
    const envs:IEnv[] = yaml.safeLoad(fs.readFileSync('env.yml', 'utf-8'));
    const config = envs.find(a => a.account === process.env.ACCOUNT) || envs[0]

    const tf = new Terraform({
        accessToken: config.accessToken,
        secretToken: config.secretToken,
        defaultZone: config.defaultZone
    });

    await tf.load();

    const file = tf.exportFile();
    console.log(JSON.stringify(file, null, 2));
}

main();