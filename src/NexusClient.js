const axios = require("axios");
const https = require("https");
const debug = require("debug")("nexus");

class NexusClient {
  constructor({ host, username, password, strictSsl = true }) {
    const axiosOpts = { baseURL: host, auth: { username, password } };
    if (!strictSsl) {
      axiosOpts.httpsAgent = new https.Agent({ rejectUnauthorized: false });
    }
    this.client = axios.create(axiosOpts);
  }

  // https://help.sonatype.com/repomanager3/rest-and-integration-api/repositories-api
  async listRepositories() {
    const { data } = await this.client.get("/service/rest/v1/repositories");
    return data;
  }

  async listComponents(repository) {
    return await this._getAllPages("/service/rest/v1/components", {
      repository,
    });
  }

  // https://help.sonatype.com/repomanager3/rest-and-integration-api/search-api
  async search(params) {
    return await this._getAllPages("/service/rest/v1/search", params);
  }

  async _getAllPages(url, searchParams = {}) {
    const items = [];
    const params = { ...searchParams };
    do {
      const { data } = await this.client.get(url, { params });
      params.continuationToken = data.continuationToken || undefined;
      data.items.forEach((it) => {
        debug(it);
        items.push(it);
      });
    } while (params.continuationToken);
    return items;
  }
}

module.exports = { NexusClient };
