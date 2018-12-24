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
gitpost-cli/0.0.1 darwin-x64 node-v8.12.0
$ gitpost --help [COMMAND]
USAGE
  $ gitpost COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`gitpost help [COMMAND]`](#gitpost-help-command)
* [`gitpost hexo`](#gitpost-hexo)
* [`gitpost init FOLDER`](#gitpost-init-folder)

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

## `gitpost hexo`

Proxy hexo commands,support all hexo commands

```
USAGE
  $ gitpost hexo

EXAMPLE
  $ gitpost hexo server
```

_See code: [src/commands/hexo.ts](https://github.com/xiaomingplus/gitpost-cli/blob/v0.0.1/src/commands/hexo.ts)_

## `gitpost init FOLDER`

Init a gitpost project

```
USAGE
  $ gitpost init FOLDER

OPTIONS
  -h, --help  show CLI help

EXAMPLE
  $ gitpost init blog
```

_See code: [src/commands/init.ts](https://github.com/xiaomingplus/gitpost-cli/blob/v0.0.1/src/commands/init.ts)_
<!-- commandsstop -->
