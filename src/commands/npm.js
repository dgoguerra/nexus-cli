const { Fzf } = require("@dgoguerra/fzf");
const { app } = require("../CliApp");
const { sortByVersion, groupByVersion } = require("../utils/versions");

function listPackages(argv) {
  return app.nexus
    .search({ repository: argv.repository })
    .map((it) => (it.group ? `@${it.group}/${it.name}` : it.name))
    .unique();
}

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
        command: "list",
        aliases: ["ls"],
        description: "List npm packages",
        handler: async (argv) => {
          listPackages(argv).on("data", (it) => console.log(it));
        },
      })
      .command({
        command: "get [name]",
        describe: "List npm package versions",
        handler: async (argv) => {
          if (!argv.name) {
            argv.name = await new Fzf().run(
              listPackages(argv).map((it) => `${it}\n`)
            );
          }

          const [, group, name] = argv.name.match(/^@(.+)\/(.+)$/) || [
            undefined,
            undefined,
            argv.name,
          ];

          app.nexus
            .search({ repository: argv.repository, name, group })
            .transform(sortByVersion())
            .transform(groupByVersion())
            .on("data", (it) =>
              console.log(
                (it.group ? `@${it.group}/` : ``) +
                  `${it.name}:${it.version}` +
                  (it._versionsStr ? ` (${it._versionsStr})` : ``)
              )
            );
        },
      }),
};
