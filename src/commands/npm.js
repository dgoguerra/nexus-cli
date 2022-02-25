const { app } = require("../CliApp");
const { sortByVersion, groupByVersion } = require("../utils/versions");

module.exports = {
  command: "npm <action>",
  describe: "Run command on a npm repository",
  builder: (yargs) =>
    yargs
      .option("repository", {
        alias: "r",
        description: "Repository name",
        type: "string",
        default: process.env.NEXUS_NPM_REPOSITORY,
      })
      .command({
        command: "packages",
        description: "List npm packages",
        handler: async (argv) => {
          const seen = {};
          app.nexus.search({ repository: argv.repository }).on("data", (it) => {
            const key = `${it.name}:${it.group}`;
            if (!seen[key]) {
              console.log(it.name);
              seen[key] = true;
            }
          });
        },
      })
      .command({
        command: "package <name>",
        describe: "List npm package versions",
        handler: async (argv) => {
          app.nexus
            .search({ repository: argv.repository, name: argv.name })
            .transform(sortByVersion())
            .transform(groupByVersion())
            .on("data", (it) =>
              console.log(
                `${it.name}@${it.version}` +
                  (it._versionsStr ? ` (${it._versionsStr})` : ``)
              )
            );
        },
      }),
};
