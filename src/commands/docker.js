const { Fzf } = require("@dgoguerra/fzf");
const { app } = require("../CliApp");
const { sortByVersion, groupByVersion } = require("../utils/versions");

function listImages(argv) {
  if (argv.full) {
    // Alternative to also return the images which don't have a "latest" tag,
    // but its really slow (returns and filters all versions of all images):
    return app.nexus
      .search({ repository: argv.repository })
      .map((it) => it.name)
      .unique();
  }

  return app.nexus
    .search({ repository: argv.repository, version: "latest" })
    .map((it) => it.name);
}

module.exports = {
  command: "docker <action>",
  describe: "Run command on a docker repository",
  builder: (yargs) =>
    yargs
      .option("repository", {
        alias: "r",
        description: "Repository name",
        type: "string",
        default: process.env.NEXUS_DOCKER_REPOSITORY,
      })
      .option("full", {
        description:
          "Get full images list. Very slow, since it filters through " +
          "all versions of all images",
        type: "boolean",
        default: false,
      })
      .command({
        command: "list",
        aliases: ["ls"],
        description: "List docker images",
        handler: async (argv) => {
          listImages(argv).on("data", (it) => console.log(it));
        },
      })
      .command({
        command: "get [name]",
        describe: "List docker image versions",
        handler: async (argv) => {
          if (!argv.name) {
            argv.name = await new Fzf().run(
              listImages(argv).map((it) => `${it}\n`)
            );
          }
          app.nexus
            .search({
              repository: argv.repository,
              "docker.imageName": argv.name,
            })
            .transform(sortByVersion())
            .transform(groupByVersion())
            .on("data", (it) => {
              console.log(
                `${it.name}:${it.version}` +
                  (it._versionsStr ? ` (${it._versionsStr})` : ``)
              );
            });
        },
      }),
};
