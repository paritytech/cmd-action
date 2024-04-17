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

jobs:
  cmd-check:
    runs-on: ubuntu-latest
    name: Bot
    steps:
      - uses: actions/checkout@v4.1.1
      - uses: paritytech/cmd-action@main
        with: 
          commands-directory: '.github/scripts'
          GITHUB_TOKEN: ${{ github.token }}
```

#### Inputs
You can find all the inputs in [the action file](./action.yml), but let's walk through each one of them:

- `GITHUB_TOKEN`: Token to access to the repository.
	-  **required**
	-  This is provided by the repo, you can simply use `${{ github.token }}`.
- `commands-directory`: Location of the commands configuration files.
	- **Optional**: Defaults to `./github/commands `.
	- Make sure that this directory contains the commands extension as `.yml` (**not `.yaml`**)
