import {Octokit} from "@octokit/rest";
import {version} from "../../package.json";
import {getGitHubApiUri} from "../configuration/configuration";
import {getProxyUrl} from "../configuration/configuration";
import {ProxyAgent, fetch as undiciFetch} from "undici";

export const userAgent = `VS Code GitHub Actions (${version})`;

const proxyUrl = getProxyUrl();

const myFetch: typeof undiciFetch = (url, opts) => {
  return undiciFetch(url, {
    ...opts,
    dispatcher: new ProxyAgent({
      uri: proxyUrl,
      keepAliveTimeout: 10,
      keepAliveMaxTimeout: 10
    })
  });
};

export function getClient(token: string): Octokit {
  if (proxyUrl == "" || proxyUrl == null) {
    return new Octokit({
      auth: token,
      userAgent: userAgent,
      baseUrl: getGitHubApiUri()
    });
  } else {
    return new Octokit({
      auth: token,
      userAgent: userAgent,
      baseUrl: getGitHubApiUri(),
      request: {fetch: myFetch}
    });
  }
}
