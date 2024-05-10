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
      - uses: paritytech/cmd-action/check@main
        id: command

  cmd-run:
    needs: [cmd-check]
    if: ${{ github.event.issue.pull_request }}
    continue-on-error: true
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
          pr-number: ${{ github.event.issue.number || github.event.pull_request.number }}
        # If you need to push your changes you can do so like this
      - uses: stefanzweifel/git-auto-commit-action@v5
        with:
          commit_message: cmd-action - changes
          branch: ${{ needs.cmd-check.outputs.branch }}
          pr-number: ${{ github.event.issue.number || github.event.pull_request.number }}
    conclude:
      runs-on: ubuntu-latest
      name: Checks passed
      needs: [cmd-run] # It will only run if all the runs were completed
      steps:
      - name: Report Success
        shell: bash
        run: gh pr comment $NUMBER --body "Completed action run. See logs <a href=\"$RUN\">here</a>."
        env:
          RUN: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}
          GH_TOKEN: ${{ github.token }}
          NUMBER: ${{ github.event.issue.number || github.event.pull_request.number }}
```

#### Inputs
You can find all the inputs in [the action file](./action.yml), but let's walk through each one of them:
- `commands-directory`: Location of the commands configuration files.
	- **Optional**: Defaults to `./github/commands `.
	- Make sure that this directory contains the commands extension as `.yml` (**not `.yaml`**)
