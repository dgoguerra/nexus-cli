const { Fzf } = require("@dgoguerra/fzf");
const { app } = require("../CliApp");
const { sortByVersion, groupByVersion } = require("../utils/versions");

function listArtifacts(argv) {
  return app.nexus
    .search({
      repository: argv.repository,
      "maven.groupId": argv.group || undefined,
    })
    .map((it) => `${it.group}:${it.name}`)
    .unique();
}

module.exports = {
  command: "maven <action>",
  describe: "Run command on a maven repository",
  builder: (yargs) =>
    yargs
      .option("repository", {
        alias: "r",
        description: "Repository name",
        type: "string",
        default: process.env.NEXUS_MAVEN_REPOSITORY,
      })
      .command({
        command: "groups",
        description: "List maven artifact groups",
        handler: async (argv) => {
          app.nexus
            .search({ repository: argv.repository })
            .unique((it) => it.group)
            .on("data", (it) => console.log(it.group));
        },
      })
      .command({
        command: "list",
        aliases: ["ls"],
        description: "List maven artifacts",
        builder: (yargs) =>
          yargs.option("group", {
            alias: "g",
            description: "Artifact groupId",
            type: "string",
          }),
        handler: async (argv) => {
          listArtifacts(argv).on("data", (it) => console.log(it));
        },
      })
      .command({
        command: "get [name]",
        describe: "List maven artifact versions",
        builder: (yargs) =>
          yargs.option("group", {
            alias: "g",
            description: "Artifact groupId",
            type: "string",
          }),
        handler: async (argv) => {
          if (!argv.name) {
            argv.name = await new Fzf().run(
              listArtifacts(argv).map((it) => `${it}\n`)
            );
          }
          const [groupId, artifactId] = argv.name.split(":");
          app.nexus
            .search({
              repository: argv.repository,
              "maven.artifactId": artifactId,
              "maven.groupId": groupId,
            })
            // TODO maven.artifactId seems to not be an equality filter,
            // the Search endpoint is also returning similar artifacts.
            .filter((it) => it.name === artifactId)
            .transform(sortByVersion())
            .transform(groupByVersion())
            .on("data", (it) =>
              console.log(
                `${it.group}:${it.name}:${it.version}` +
                  (it._versionsStr ? ` (${it._versionsStr})` : ``)
              )
            );
        },
      }),
};
