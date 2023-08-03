# nexus-cli

Nexus Repository Manager CLI.

## Installation

Install with:

```bash
npm install -g .
```

Save your Nexus credentials in `~/.nexus`:

```bash
$ cat ~/.nexus
NEXUS_HOST=https://path-to-nexus.com
NEXUS_USER=
NEXUS_PASS=
#NEXUS_STRICT_SSL=false
#NEXUS_DOCKER_REPOSITORY=docker-repo-name
#NEXUS_MAVEN_REPOSITORY=maven-repo-name
#NEXUS_NPM_REPOSITORY=npm-repo-name
```

## Usage

```
nexus <command>

Commands:
  nexus component <repository> <name>  List component versions
  nexus components <repository>        List components of a repository
  nexus docker <action>                Run command on a docker repository
  nexus maven <action>                 Run command on a maven repository
  nexus npm <action>                   Run command on a npm repository
  nexus repositories                   List repositories        [aliases: repos]
  nexus search <query...>              List components of a repository

Options:
      --version  Show version number                                   [boolean]
  -h, --help     Show help                                             [boolean]

Examples:
  nexus repos
  nexus component REPOSITORY NAME
  nexus npm list
  nexus npm get NAME
  nexus npm get @ORG/NAME
  nexus docker list
  nexus docker get NAME
  nexus maven groups
  nexus maven list
  nexus maven list --group=GROUP
  nexus maven get --group=GROUP
  nexus maven get GROUP:NAME
```
