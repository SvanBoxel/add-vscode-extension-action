# Add File to Repositories Action

This GitHub Action creates a pull request adding a specified file to selected repositories in an organization. It also adds recommended extensions to the `.vscode/extensions.json` file in each repository.

## Inputs

### `organization-name`

**Required** The name of the organization.

### `file-path`

**Required** The path to the file to be added.

### `file-content`

**Required** The content of the file to be added.

### `repositories`

**Optional** A comma-separated list of repositories to add the file to. If not provided, the action will add the file to all repositories in the organization.

### `extensions`

**Required** A newline-separated list of recommended extensions to add to the `.vscode/extensions.json` file.

## Example usage

```yaml
name: Add file to repos

on:
  push:
    branches:
      - main

jobs:
  add-file:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v2

      - name: Add file to repos
        uses: ./path/to/action
        with:
          organization-name: YOUR_ORGANIZATION_NAME
          file-path: PATH_TO_YOUR_FILE
          file-content: CONTENT_OF_YOUR_FILE
          repositories: repo1,repo2
          extensions: |
            ms-vscode.cpptools
            ms-python.python