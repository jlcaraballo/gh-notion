# gh-notion

Sync your commits, branches and/or pull requests with an Notion issue.

## Introduction

The `gh-notion` tool allows you to seamlessly sync your GitHub commits, branches, and pull requests with a Notion issue. By automating this process, you can keep your Notion issue up to date with the latest changes in your GitHub repository.

## Workflow

Create a `.github/workflow/{filename}.yml` file with the following content:

```.yml
name: GH to Notion
on:
  push:
    branches:
      - main
      - feature/**
      - bugfix/**
      - hotfix/**
  pull_request:
    types: [opened, reopened, closed]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: GH to Notion
        uses: jlcaraballo/gh-notion@v1.0.3
        env:
          NOTION_STATUS: |
            TODO=Not Started
            PROGRESS=In Progress
            DONE=Done
            REVIEW=In review
            MERGED=Staged
        with:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NOTION_SECRET: ${{ secrets.NOTION_SECRET }}
          NOTION_DATABASE: ${{ secrets.NOTION_DATABASE }}

```

## Previous steps

### Notion

1. Setting database code (Optional)

   - Add property called "Code" with the formula -> `slice(id(), round(toNumber(replaceAll(id(), "[^0-9]", "")) % 4), 6)`

2. Add properties type text (`Pull Requests`, `Branch`, `Commits`)

3. Add property type status (`Status`) with the example following options:
   - Not Started
   - In Progress
   - Done
   - In review
   - Merged

### Github

1. Add secret `NOTION_SECRET` with the value of the Notion integration secret.
2. Add secret `NOTION_DATABASE` with the value of the Notion database id.

## Usage

### Syncing Branches

To sync a branch with a Notion issue, follow one method below:

#### With branch name property

Add branch name to issue property `Branch` and create a git branch with the name of the property.

```shell
git checkout -b feature/my_branch
git push -u origin feature/my_branch
```

NOTE: When you create a pull request with this branch, the property `Pull Requests` will be updated with the pull request url.

#### With issue code

Write branch name including issue code `"#{Code}_my_branch"`
Example:

```shell
git checkout -b feature/#a2b3c4_my_branch
```

### Pull Requests

Write PR title including issue code `"#{Code} My pull request"`

### Commits

Write commit message including issue code `"#{Code} Commit message"`
Example:

```shell
git commit -m '#a2b3c4 first commit'
```

### Status

The status change in the following cases:

1. When you create a branch and the status is `Not Started` the status will be updated to `In Progress`.
1. When you create a pull request the status will be updated to `In review`.
1. When you merge a pull request the status will be updated to `Merged`.

## License

This project is licensed under the [MIT License](LICENSE).
