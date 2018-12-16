# gitpost-cli

Command line interface for [gitpost](https://github.com/xiaomingplus/gitpost)

## Installation

```bash
npm install gitpost-cli -g
```

## 如何开发

本项目采用[prettier](https://prettier.io/)来统一代码风格，并且会在`pre-commit`前自动 format 你本次提交的代码，推荐你在你的编辑器里安装 prettier 插件，并且开启保存文件就自动 format 选项，这样可以在开发的时候，就能自动 format

本项目采用[git flow](https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow) 工作流，请按照 git flow 工作流来提交合并代码

推荐使用`npm run cm`来代替`git commit`作为格式化 commit 信息的工具

```shell
npm run cm
```

## License

MIT
