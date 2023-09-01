const fs = require("fs");
const { Octokit } = require("@octokit/rest");

const { composeCreatePullRequest } = require("octokit-plugin-create-pull-request");

const core = require('@actions/core');
const FILE_PATH = ".vscode/extensions.json";

const createPr = async (octokit, owner, repo, newContent, options) => {
  const defaultOptions = {
    base: core.getInput('base'),
    branchName: core.getInput('branch-name'),
    pullRequestTitle:  core.getInput('pull-request-title'),
    pullRequestBody: core.getInput('pull-request-body'),
    commitMessage: core.getInput('commit-message'),
    authorName: core.getInput('author-name'),
    authorEmail: core.getInput('author-email')
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
        files: {
          [FILE_PATH]: ({ exists }) => {
            return Buffer.from(btoa(newContent), 'base64').toString("utf-8")
          },
        },
        commit: mergedOptions.commitMessage,
        author: {
          name: mergedOptions.authorName,
          email: mergedOptions.authorEmail,
          date: new Date().toISOString(), // must be ISO date string
        },
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

module.exports = {
  createPr,
  updateExtensionFile,
  getRepos,
}