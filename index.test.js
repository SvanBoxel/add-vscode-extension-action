const fs = require("fs");
const { Octokit } = require("@octokit/rest");
const sinon = require("sinon");
const { expect } = require("chai");

const octokit = new Octokit({
  auth: "test_token",
});

const addFileToRepo = require("./index").addFileToRepo;

describe("addFileToRepo", () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    sandbox.stub(fs, "readFileSync").returns(JSON.stringify({}));
    sandbox.stub(fs, "writeFileSync");
    sandbox.stub(octokit.repos, "createOrUpdateFileContents");
  });

  afterEach(() => {
    sandbox.restore();
  });

  it("should add recommended extensions to the extensions.json file", async () => {
    const repo = { name: "test-repo" };
    process.env.INPUT_EXTENSIONS = "test-extension-1, test-extension-2";
    await addFileToRepo(repo);
    const expectedContent = JSON.stringify({
      recommendations: ["test-extension-1", "test-extension-2"],
    });
    expect(fs.writeFileSync.calledOnceWith(".vscode/extensions.json", expectedContent)).to.be.true;
  });

  it("should not add duplicate extensions to the extensions.json file", async () => {
    const repo = { name: "test-repo" };
    process.env.INPUT_EXTENSIONS = "test-extension-1, test-extension-2";
    sandbox.stub(fs, "readFileSync").returns(JSON.stringify({ recommendations: ["test-extension-1"] }));
    await addFileToRepo(repo);
    const expectedContent = JSON.stringify({
      recommendations: ["test-extension-1", "test-extension-2"],
    });
    expect(fs.writeFileSync.calledOnceWith(".vscode/extensions.json", expectedContent)).to.be.true;
  });
});