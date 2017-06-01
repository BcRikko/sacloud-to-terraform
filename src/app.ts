import * as fs from 'fs';
import * as yaml from 'js-yaml';
import Terraform from './Terraform';

process.on('unhandledRejection', console.dir);

async function main() {
    const config = yaml.safeLoad(fs.readFileSync('env.yml', 'utf-8'));

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