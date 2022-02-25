const _ = require("lodash");

// Known tags with the least weigth, to always show them as extra tags
const EXTRA_VERSIONS = ["latest", "master", "release-next"];

function sortableSemver(version, digits = 5) {
  return String(version)
    .split(".")
    .map((part) => {
      const arr = part.match(/^(\d+)(.*)/);
      return arr && arr[1] ? arr[1].padStart(digits, "0") + arr[2] : part;
    })
    .join(".");
}

function sortByVersion(version = (it) => it.version) {
  const items = [];
  return {
    transform(it, enc, next) {
      items.push(it);
      next();
    },
    flush(next) {
      _(items)
        .sortBy([(it) => sortableSemver(version(it)), version])
        .forEach((it) => this.push(it));
      next();
    },
  };
}

function groupByVersion(
  version = (it) => it.version,
  id = (it) => it.assets[0].checksum.sha256 || it.assets[0].checksum.sha1
) {
  const items = [];
  return {
    transform(it, enc, next) {
      items.push(it);
      next();
    },
    flush(next) {
      _(items)
        .groupBy(id)
        .mapValues((items) => {
          const [first, ...rest] = _.sortBy(items, (it) =>
            EXTRA_VERSIONS.includes(version(it)) ? 100 : -version(it).length
          );
          const versions = rest.map(version);
          return {
            ...first,
            _versions: versions,
            _versionsStr: versions.join(", "),
          };
        })
        .forEach((it) => this.push(it));
      next();
    },
  };
}

module.exports = { sortByVersion, groupByVersion };
