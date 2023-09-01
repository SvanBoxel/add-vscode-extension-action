  # Add File to Repositories Action

This GitHub Action creates a pull request adding recommended extensions to the `.vscode/extensions.json` file in each repository.

## tldr;
This GitHub Actions reads the list of repositories to add the file to, adds the recommended extensions to the `.vscode/extensions.jso`n file, creates a new branch, adds the specified file to the branch, and creates a new pull request from the branch to the default branch of the repository for each repository.


## Inputs

- `github-token`: **Required**. The GitHub token to use for authentication.  Should have access to repositories listed in the repositories input.
- `organization-name`: **Required**. The name of the organization that owns the repositories to update.
- `repositories`: A comma-separated list of repository names to update. If not provided, all repositories in the organization will be updated.
- `extensions`: **Required**. A comma-separated list of recommended VS Code extensions to add to the `extensions.json` file.
- `only-if-file-exists`: If set to `true`, the action will only update the `extensions.json` file if it already exists in the repository. Defaults to `false`.
- `base`: The name of the branch to use as the base for the pull request. Defaults to `main`.
- `branch-name`: The name of the branch to create for the pull request. Defaults to `update-vscode-extensions`.
- `pull-request-title`: The title of the pull request. Defaults to `Update VS Code extensions`.
- `pull-request-body`: The body of the pull request. Defaults to an empty string.
- `commit-message`: The commit message to use for the changes. Defaults to `Update extensions.json`.
- `author-name`: The name of the author to use for the commit. Defaults to the name of the user associated with the GitHub token.
- `author-email`: The email address of the author to use for the commit. Defaults to the email address of the user associated with the GitHub token.

## Outputs

None.

## Example Usage

```yaml
name: Update VS Code Extensions

on:
  push:
    branches:
      - main

jobs:
  update-extensions:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v2
      - name: Update VS Code extensions
        uses: username/update-vscode-extensions@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          organization-name: my-org
          extensions: ms-vscode.cpptools, ms-python.python
```