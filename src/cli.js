#!/usr/bin/env node

require("dotenv").config({ path: `${process.env.HOME}/.nexus` });

const _ = require("lodash");
const yargs = require("yargs");
const { NexusClient } = require("./NexusClient");

const nexus = new NexusClient({
  host: process.env.NEXUS_HOST,
  username: process.env.NEXUS_USER,
  password: process.env.NEXUS_PASS,
  strictSsl: process.env.NEXUS_STRICT_SSL !== "false",
});

function sortableSemver(version, digits = 5) {
  return String(version)
    .split(".")
    .map((part) => {
      const arr = part.match(/^(\d+)(.*)/);
      return arr && arr[1] ? arr[1].padStart(digits, "0") + arr[2] : part;
    })
    .join(".");
}

yargs
  .help()
  .alias("h", "help")
  .version()
  .strict()
  .command({
    command: "repositories",
    aliases: ["repos"],
    describe: "List repositories",
    handler: async () => {
      _(await nexus.listRepositories().rows())
        .groupBy("format")
        .forEach((items, format) => {
          console.log(format);
          items.forEach((it) => {
            const extras = it.attributes.proxy
              ? `remoteUrl=${it.attributes.proxy.remoteUrl}`
              : "";
            console.log(`  ${it.name} type=${it.type} ${extras}`);
          });
        });
    },
  })
  .command({
    command: "components <repository>",
    describe: "List components of a repository",
    handler: async (argv) => {
      nexus.listComponents(argv.repository).on("data", (it) => {
        console.log(`${it.name} group=${it.group} version=${it.version}`);
      });
    },
  })
  .command({
    command: "component <repository> <name>",
    describe: "List component versions",
    handler: async (argv) => {
      const items = await nexus
        .search({ repository: argv.repository, name: argv.name })
        .rows();
      _(items)
        .sortBy([(it) => sortableSemver(it.version), "version"])
        .forEach((it) => {
          console.log(`${it.name} group=${it.group} version=${it.version}`);
        });
    },
  })
  .command({
    command: "search <query...>",
    describe: "List components of a repository",
    handler: async (argv) => {
      const query = [];
      const args = {};

      argv.query.forEach((q) => {
        const [key, val = null] = q.split("=");
        if (val === null) {
          query.push(q);
        } else {
          args[key] = val;
        }
      });

      nexus
        .search({ ...args, q: query.join(" ") })
        .on("data", (it) =>
          console.log(
            `${it.name} repository=${it.repository} group=${it.group} version=${it.version}`
          )
        );
    },
  })
  .command({
    command: "images",
    describe: "List docker images",
    builder: (yargs) =>
      yargs.option("repository", {
        alias: "r",
        description: "Docker repository name",
        type: "string",
      }),
    handler: async (argv) => {
      const repository = argv.repository || process.env.NEXUS_DOCKER_REPOSITORY;
      nexus
        .search({ repository, version: "latest" })
        .on("data", (it) => console.log(it.name));
    },
  })
  .command({
    command: "image <image>",
    describe: "List docker image versions",
    builder: (yargs) =>
      yargs.option("repository", {
        alias: "r",
        description: "Docker repository name",
        type: "string",
      }),
    handler: async (argv) => {
      const items = await nexus
        .search({
          repository: argv.repository || process.env.NEXUS_DOCKER_REPOSITORY,
          "docker.imageName": argv.image,
        })
        .rows();

      // Known tags with the least weigth, to always print them as extra tags
      const leastWeight = ["latest", "master", "release-next"];

      _(items)
        .groupBy((it) => it.assets[0].checksum.sha256)
        .mapValues((items) => {
          const [first, ...rest] = _.sortBy(items, (it) =>
            leastWeight.includes(it.version) ? 100 : -it.version.length
          );
          return { ...first, extraTags: rest.map((it) => it.version) };
        })
        .sortBy([(it) => sortableSemver(it.version), "version"])
        .forEach((it) => {
          console.log(
            `${it.name}:${it.version}` +
              (it.extraTags.length ? ` (${it.extraTags.join(", ")})` : ``)
          );
        });
    },
  })
  .demandCommand()
  .example([[`$0 repos`], [`$0 images`]]).argv;
