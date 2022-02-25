const { app } = require("../CliApp");
const { sortByVersion, groupByVersion } = require("../utils/versions");

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
      .command({
        command: "images",
        description: "List docker images",
        handler: async (argv) => {
          app.nexus
            .search({ repository: argv.repository, version: "latest" })
            .on("data", (it) => console.log(it.name));
        },
      })
      .command({
        command: "image <name>",
        describe: "List docker image versions",
        handler: async (argv) => {
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
