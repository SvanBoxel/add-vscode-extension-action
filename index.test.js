const { Octokit } = require("@octokit/rest");

const assert = require('assert');
const { updateExtensionFile, getRepos } = require('./index');


jest.mock("@octokit/rest");

afterEach(async () => {
  jest.clearAllMocks();
});


describe("getRepos", () => {
  const octokit = new Octokit({ auth: "some-token" });

  const mockOrgName = "test-org";
  const mockRepos = ["test-repo1", "test-repo2"]
  const mockResponse = {
    data: [
      {
        name: mockRepos[0],
        default_branch: "main",
      },
      {
        name: mockRepos[1],
        default_branch: "not_main",
      },
    ],
  };

  beforeEach(() => {    
    octokit.repos = {
      listForOrg:  jest.fn().mockResolvedValue(mockResponse),
      get: jest.fn()
        .mockReturnValueOnce({ data: mockResponse.data[0] })
        .mockReturnValueOnce({ data: mockResponse.data[1] })
    }
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
  
  it("should get all repositories in the organization if no list of repositories is provided", async () => {
    const repos = await getRepos(octokit, mockOrgName);

    expect(octokit.repos.listForOrg).toHaveBeenCalledWith({
      org: mockOrgName,
    });
    expect(repos).toEqual(mockResponse.data);
  });

  it("should get the details of the provided repositories", async () => {
    const repos = await getRepos(octokit, mockOrgName, mockRepos.join(", "));

    expect(octokit.repos.get).toHaveBeenCalledWith({
      owner: mockOrgName,
      repo: mockRepos[0],
    });

    expect(octokit.repos.get).toHaveBeenCalledWith({
      owner: mockOrgName,
      repo: mockRepos[1],
    });


    expect(repos).toEqual(mockResponse.data);
  });
});


describe('updateExtensionFile', () => {
    it('should add recommended extensions to the file', () => {
      const currentExtensionContent = '{"recommendations": ["ms-python.python"]}';
      const expectedExtensionContent = `{
  "recommendations": [
    "ms-python.python",
    "ms-vscode-remote.remote-ssh",
    "ms-vscode-remote.remote-ssh-edit",
    "ms-vscode-remote.vscode-remote-extensionpack",
    "ms-vscode.cpptools",
    "ms-vscode.vscode-typescript-tslint-plugin",
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode"
  ]
}`;

      const add_extensions = ["ms-vscode-remote.remote-ssh", "ms-vscode-remote.remote-ssh-edit", "ms-vscode-remote.vscode-remote-extensionpack", "ms-vscode.cpptools", "ms-vscode.vscode-typescript-tslint-plugin", "dbaeumer.vscode-eslint", "esbenp.prettier-vscode"];
      const result = updateExtensionFile(currentExtensionContent, add_extensions.join(', '));

      assert.strictEqual(result, expectedExtensionContent);
    });

  it('should throw an error if the file is not valid JSON', () => {
    const currentExtensionContent = 'invalid json';

    assert.throws(() => {
      updateExtensionFile(currentExtensionContent);
    }, /The extensions.json file is not valid JSON/);
  });
});