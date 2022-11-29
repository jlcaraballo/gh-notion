# gh-notion

Sync your commits, branches and/or pull requests with an Notion issue.

## Workflow

Create a `.github/workflow/{filename}.yml` file.

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
        uses: jlcaraballo/gh-notion@v0.1.0
        with:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NOTION_SECRET: ${{ secrets.NOTION_SECRET }}
          NOTION_DATABASE: ${{ secrets.NOTION_DATABASE }}

```

## Previous steps

1. Setting database code (Required)

- Add property called "Code" with the formula -> `slice(id(), round(toNumber(replaceAll(id(), "[^0-9]", "")) % 4), 6)`

2. Add properties type text (`Pull Requests`, `Branch`, `Commits`)

## Usage

### Commits

Write commit message including issue code `"#{Code} Commit message"`
Example:

```git
git commit -m '#a2b3c4 first commit'
```

### Branch

Write branch name including issue code `"#{Code}_my_branch"`
Example:

```git
git checkout -b feature/#a2b3c4_my_branch
```

### Pull Requests

Write PR title including issue code `"#{Code} My pull request"`
