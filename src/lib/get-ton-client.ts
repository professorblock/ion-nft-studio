import { TonClient } from "ton";

const ION_ENDPOINT = "https://api.mainnet.ice.io/http/v2/jsonRPC";

async function _getClient() {
  return new TonClient({
    endpoint: ION_ENDPOINT,
  });
}

const clientP = _getClient();

export async function getClient() {
  return clientP;
}

export async function getEndpoint() {
  return Promise.resolve(ION_ENDPOINT);
}
