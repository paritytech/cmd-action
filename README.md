# CMD-Action

GitHub action which provides interfaces for executing pre-defined commands on GitHub Actions.

## How it works
CMD-Action executes arbitrary commands on GitHub Actions from commands in pull request comments.

## Configuration
Create a file named `.github/workflows/cmd-action.yml` and add the following:
```yaml
name: Command-Action

on:
  pull_request:
  issue_comment:
    types: [created]

jobs:
  cmd-check:
    runs-on: ubuntu-latest
    outputs:
      commands: ${{ steps.cmd.outputs.commands }}
      branch: ${{ steps.branch.outputs.branch }}
    name: Bot
    steps:
      - uses: actions/checkout@v4.1.1
      # Switch to the PR branch if it's triggered by a comment
      - run: gh pr checkout ${{ github.event.issue.number || github.event.pull_request.number }}
        if: ${{ github.event.issue.pull_request }}
        env:
          GITHUB_TOKEN: ${{ github.token }}
      - uses: paritytech/cmd-action@main
        id: cmd
        with: 
          commands-directory: '.github/scripts'
      - name: Export branch name
        run: echo "branch=$(git rev-parse --abbrev-ref HEAD)" >> "$GITHUB_OUTPUT"
        id: branch

  cmd-run:
    needs: [cmd-check]
    continue-on-error: true
    # We set the current machine here (to differ between ours and generic ones)
    runs-on: ubuntu-latest
    strategy:
      matrix:
        command: ${{ fromJson(needs.cmd-check.outputs.commands) }}
    name: Run command
    steps:
      - uses: paritytech/cmd-action/run@main
        with:
          branch: ${{ needs.cmd-check.outputs.branch }}
          command: ${{ matrix.command }}
```

#### Inputs
You can find all the inputs in [the action file](./action.yml), but let's walk through each one of them:
- `commands-directory`: Location of the commands configuration files.
	- **Optional**: Defaults to `./github/commands `.
	- Make sure that this directory contains the commands extension as `.yml` (**not `.yaml`**)
