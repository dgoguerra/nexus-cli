const axios = require("axios");
const https = require("https");
const debug = require("debug")("nexus");
const { Transform } = require("stream");

class NexusClient {
  constructor({ host, username, password, strictSsl = true }) {
    const axiosOpts = { baseURL: host, auth: { username, password } };
    if (!strictSsl) {
      axiosOpts.httpsAgent = new https.Agent({ rejectUnauthorized: false });
    }
    this.client = axios.create(axiosOpts);
  }

  // https://help.sonatype.com/repomanager3/rest-and-integration-api/repositories-api
  listRepositories() {
    return this._stream("/service/rest/v1/repositories");
  }

  listComponents(repository) {
    return this._streamPages("/service/rest/v1/components", { repository });
  }

  // https://help.sonatype.com/repomanager3/rest-and-integration-api/search-api
  search(params) {
    return this._streamPages("/service/rest/v1/search", params);
  }

  _stream(url, params = {}) {
    const rs = this._resultSet();

    debug({ url, params });
    this.client.get(url, { params }).then((res) => {
      res.data.forEach((it) => rs.push(it));
      rs.push(null);
    });

    return rs;
  }

  _streamPages(url, params = {}) {
    const rs = this._resultSet();

    const getNextPage = async (url, params) => {
      const { data } = await this.client.get(url, { params });
      data.items.forEach((it) => rs.push(it));
      if (data.continuationToken) {
        getNextPage(url, {
          ...params,
          continuationToken: data.continuationToken,
        });
      } else {
        rs.push(null);
      }
    };

    debug({ url, params });
    getNextPage(url, params);

    return rs;
  }

  _resultSet(opts = {}) {
    const stream = new Transform({
      objectMode: true,
      transform: (row, enc, next) => next(null, row),
      ...opts,
    });

    stream.wait = async () => {
      return new Promise((resolve, reject) => {
        stream.once("end", resolve);
        stream.once("error", reject);
      });
    };

    stream.rows = async () => {
      const rows = [];
      stream.on("data", (data) => rows.push(data));
      await stream.wait();
      return rows;
    };

    stream.map = (mapper) => {
      return stream.transform({
        transform: (row, enc, next) => next(null, mapper(row)),
      });
    };

    stream.filter = (filter) => {
      return stream.transform({
        transform: (row, enc, next) => (filter(row) ? next(null, row) : next()),
      });
    };

    stream.transform = (opts) => {
      const rs = this._resultSet(opts);
      return stream.on("error", (err) => rs.emit("error", err)).pipe(rs);
    };

    return stream;
  }
}

module.exports = { NexusClient };
