require("dotenv").config({ path: `${process.env.HOME}/.nexus` });

const _ = require("lodash");
const yargs = require("yargs");
const { NexusClient } = require("./NexusClient");
const { sortByVersion } = require("./utils/versions");

class CliApp {
  async runYargs() {
    this.cli = this.buildYargs();
    this.argv = this.cli.argv;

    await this.argv;
    await this.cleanupCommon();
  }

  buildYargs() {
    return yargs
      .help()
      .alias("h", "help")
      .version()
      .strict()
      .middleware((argv) => this.initCommon(argv))
      .commandDir(`${__dirname}/commands`)
      .demandCommand()
      .example([
        [`$0 repos`],
        [`$0 component REPOSITORY NAME`],

        [`$0 npm list`],
        [`$0 npm get NAME`],
        [`$0 npm get @ORG/NAME`],

        [`$0 docker list`],
        [`$0 docker get NAME`],

        [`$0 maven groups`],
        [`$0 maven list`],
        [`$0 maven list --group=GROUP`],
        [`$0 maven get --group=GROUP`],
        [`$0 maven get GROUP:NAME`],
      ]);
  }

  initCommon(argv) {
    // Equivalent to env DEBUG=nexus*
    if (argv.debug) {
      debug.enable("nexus*");
    }

    this.nexus = new NexusClient({
      host: process.env.NEXUS_HOST,
      username: process.env.NEXUS_USER,
      password: process.env.NEXUS_PASS,
      strictSsl: process.env.NEXUS_STRICT_SSL !== "false",
    });
  }

  async cleanupCommon() {
    // Nothing to do
  }

  error(message) {
    this.cli.showHelp();
    console.error(`\nError: ${message}\n`);
    process.exit(1);
  }
}

// Expose a default CliApp instance as a singleton
module.exports = { CliApp, app: new CliApp() };
