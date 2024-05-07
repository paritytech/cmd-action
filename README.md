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
      commands: ${{ steps.command.outputs.commands }}
      branch: ${{ steps.command.outputs.branch }}
    name: Bot
    steps:
      - uses: paritytech/cmd-action/check@parse-comment
        id: command

  cmd-run:
    needs: [cmd-check]
    if: ${{ github.event.issue.pull_request }}
    continue-on-error: true
    # We set the current machine here (to differ between ours and generic ones)
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        command: ${{ fromJson(needs.cmd-check.outputs.commands) }}
    name: Run command
    steps:
      - uses: paritytech/cmd-action/run@main
        with:
          branch: ${{ needs.cmd-check.outputs.branch }}
          command: ${{ matrix.command }}
        # If you need to push your changes you can do so like this
      - uses: stefanzweifel/git-auto-commit-action@v5
        with:
          commit_message: cmd-action - changes
          branch: ${{ needs.cmd-check.outputs.branch }}
```

#### Inputs
You can find all the inputs in [the action file](./action.yml), but let's walk through each one of them:
- `commands-directory`: Location of the commands configuration files.
	- **Optional**: Defaults to `./github/commands `.
	- Make sure that this directory contains the commands extension as `.yml` (**not `.yaml`**)
