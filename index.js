const fs = require("fs");
const { Octokit } = require("@octokit/rest");


const { composeCreatePullRequest } = require("octokit-plugin-create-pull-request");

const core = require('@actions/core');


const config = {
  orgName: core.getInput('organization-name'),
  input_extensions: core.getInput('extensions'),
  repositories: core.getInput('repositories'),
  token: core.getInput('github-token'),
  branchName: "add-extension-file",
  commitMessage: "Add/edit vscode default extension file",
  filePath: ".vscode/extensions.json",
}

const createPr = async (octokit, owner, repo, newContent, options) => {
  const defaultOptions = {
    base: "main",
    branchName: "add-extension-file",
    pullRequestTitle: "Adding recommended extensions to vscode recommedations file",
    pullRequestBody: "Adding recommended extensions to vscode recommedations file",
    commitMessage: "Add/edit vscode recommended extension file",
  }

  const mergedOptions = {
    ...defaultOptions,
    ...options
  }

  composeCreatePullRequest(octokit, {
    owner,
    repo,
    title: mergedOptions.pullRequestTitle,
    body: mergedOptions.pullRequestBody,
    head: mergedOptions.branchName,
    base: mergedOptions.base,
    update: true /* update existing pull requests */,
    forceFork: false /* optional: force creating fork even when user has write rights */,
    changes: [
      {
        /* optional: if `files` is not passed, an empty commit is created instead */
        files: {
          [config.filePath]: ({ exists, encoding, content }) => {
            // // do not create the file if it does not exist
            // if (!exists) return null;

            return Buffer.from(btoa(newContent), encoding).toString("utf-8")
          },
        },
        commit: config.commitMessage,
        author: {
          name: "Author LastName",
          email: "Author.LastName@acme.com",
          date: new Date().toISOString(), // must be ISO date string
        },
        /* optional: if not passed, will use the information set in author */
        committer: {
          name: "Committer LastName",
          email: "Committer.LastName@acme.com",
          date: new Date().toISOString(), // must be ISO date string
        },
        /* optional: if not passed, commit won't be signed*/
        signature: async function (commitPayload) {
          // import { createSignature } from 'github-api-signature'
          //
          // return createSignature(
          //   commitPayload,
          //   privateKey,
          //   passphrase
          // );
        },
      },
    ],
  })
}

const getRepos = async (octokit, orgName, repos) => {
  let resultRepos = [];

  if (repos) {
    // If a list of repositories is provided, get the details of those repositories
    const repoNames = repos.split(",");

    for (const repoName of repoNames) {
      const repo = await octokit.repos.get({
        owner: orgName,
        repo: repoName.trim(),
      });
      resultRepos.push(repo.data);
    }
  } else {
    // If no list of repositories is provided, get the list of all repositories in the organization
    const response = await octokit.repos.listForOrg({
      org: orgName,
    });
    resultRepos = response.data;
  }


  return resultRepos;
}

const updateExtensionFile = (currentExtensionContent, extensions) => {
  if (!currentExtensionContent) return;

  let newExtensionContent; 

  try {
    newExtensionContent = JSON.parse(currentExtensionContent);
  } catch (error) {
    throw new Error("The extensions.json file is not valid JSON");
  }

  // Add the Copilot extension to the file
  if (!newExtensionContent.recommendations) {
    newExtensionContent.recommendations = [];
  }

  const recommendedExtensions = extensions.split(",");
  for (const extension of recommendedExtensions) {
    if (!newExtensionContent.recommendations.includes(extension.trim())) {
      newExtensionContent.recommendations.push(extension.trim());
    }
  }

  return JSON.stringify(newExtensionContent, null, 2);
}

const main = async () => {
  const stats = {
    repositoriesCount: 0,
    filesUpdated: 0,
    filesCreated: 0,
    failed: 0,
  }

  const octokit = new Octokit({
    auth: config.token
  });

  let repos = await getRepos(octokit, config.orgName, config.repositories)

  stats.repositoriesCount = repos.length;

  for (const repo of repos) {
    // checkout file to see if it exists
    let fileContent = null;
    let type = null;
    try {
      file = await octokit.repos.getContent({
        owner: config.orgName,
        repo: repo.name,
        path: config.filePath,
        ref: repo.default_branch,
      });

      fileContent = Buffer.from(file.data.content, 'base64').toString()
      type = 'update'
    } catch (error) {
      // If the file doesn't exist, create an empty object
      if (error.code === "ENOENT" || error.status === 404 ) {
        fileContent = "{}";
        type = 'create'
      } else {
        throw error;
      }
    }

    let updatedFileContent;
    try {
      updatedFileContent = updateExtensionFile(fileContent, config.input_extensions, type);

      console.log({
        owner: config.orgName,
        repo: repo.name,
        updatedFileContent: updatedFileContent,
      })
      await createPr(octokit, config.orgName, repo.name, updatedFileContent);

      if (type === 'create') {
        stats.filesCreated += 1;
      } else {
        stats.filesUpdated += 1;
      }
    } catch (error) {
      console.log(error);
      stats.failed += 1;
      continue;
    }
  }

  console.log(stats);
}

main();

module.exports = {
  createPr,
  updateExtensionFile,
  getRepos,
  main,
}