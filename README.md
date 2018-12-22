gitpost-cli
===========

gitpost command line

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/gitpost-cli.svg)](https://npmjs.org/package/gitpost-cli)
[![CircleCI](https://circleci.com/gh/xiaomingplus/gitpost-cli/tree/master.svg?style=shield)](https://circleci.com/gh/xiaomingplus/gitpost-cli/tree/master)
[![Codecov](https://codecov.io/gh/xiaomingplus/gitpost-cli/branch/master/graph/badge.svg)](https://codecov.io/gh/xiaomingplus/gitpost-cli)
[![Downloads/week](https://img.shields.io/npm/dw/gitpost-cli.svg)](https://npmjs.org/package/gitpost-cli)
[![License](https://img.shields.io/npm/l/gitpost-cli.svg)](https://github.com/xiaomingplus/gitpost-cli/blob/master/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g gitpost-cli
$ gitpost COMMAND
running command...
$ gitpost (-v|--version|version)
gitpost-cli/0.0.0 darwin-x64 node-v8.12.0
$ gitpost --help [COMMAND]
USAGE
  $ gitpost COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`gitpost hello [FILE]`](#gitpost-hello-file)
* [`gitpost help [COMMAND]`](#gitpost-help-command)

## `gitpost hello [FILE]`

describe the command here

```
USAGE
  $ gitpost hello [FILE]

OPTIONS
  -f, --force
  -h, --help       show CLI help
  -n, --name=name  name to print

EXAMPLE
  $ gitpost hello
  hello world from ./src/hello.ts!
```

_See code: [src/commands/hello.ts](https://github.com/xiaomingplus/gitpost-cli/blob/v0.0.0/src/commands/hello.ts)_

## `gitpost help [COMMAND]`

display help for gitpost

```
USAGE
  $ gitpost help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v2.1.4/src/commands/help.ts)_
<!-- commandsstop -->
