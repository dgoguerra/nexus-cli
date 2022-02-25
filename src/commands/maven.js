const { app } = require("../CliApp");
const { sortByVersion, groupByVersion } = require("../utils/versions");

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
          const seen = {};
          app.nexus.search({ repository: argv.repository }).on("data", (it) => {
            if (!seen[it.group]) {
              console.log(it.group);
              seen[it.group] = true;
            }
          });
        },
      })
      .command({
        command: "artifacts [group]",
        description: "List maven artifacts",
        handler: async (argv) => {
          const seen = {};
          app.nexus
            .search({
              repository: argv.repository,
              "maven.groupId": argv.group || undefined,
            })
            .on("data", (it) => {
              const key = `${it.name}:${it.group}`;
              if (!seen[key]) {
                console.log(`${it.name} group=${it.group}`);
                seen[key] = true;
              }
            });
        },
      })
      .command({
        command: "artifact <name>",
        describe: "List maven artifact versions",
        builder: (yargs) =>
          yargs.option("group", {
            alias: "g",
            description: "Artifact groupId",
            type: "string",
          }),
        handler: async (argv) => {
          app.nexus
            .search({
              repository: argv.repository,
              "maven.artifactId": argv.name,
              "maven.groupId": argv.group || undefined,
            })
            // TODO maven.artifactId seems to not be an equality filter,
            // the Search endpoint is also returning similar artifacts.
            .filter((it) => it.name === argv.name)
            .transform(sortByVersion())
            .transform(groupByVersion())
            .on("data", (it) =>
              console.log(
                `${it.name} group=${it.group} version=${it.version}` +
                  (it._versionsStr ? ` (${it._versionsStr})` : ``)
              )
            );
        },
      }),
};
