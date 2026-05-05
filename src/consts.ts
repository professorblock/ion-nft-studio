import { getNetwork } from "./lib/hooks/useNetwork";

/**
 * Route map for ION Hub | NFT Studio.
 *   /                    → home (NFT Studio landing)
 *   /launch              → deploy new collection
 *   /collection/:address → collection viewer + mint UI
 */
const ROUTES = {
  home: "/",
  launch: "/launch",
  collection: "/collection",
  collectionId: "/collection/:address",
};

const APP_GRID = 1280;
const LOCAL_STORAGE_PROVIDER = "wallet_provider";
const APP_DISPLAY_NAME = "ION Hub";
const APP_PRODUCT_NAME = "NFT Studio"; // shown next to wordmark in header/footer
const NFT_STUDIO_GITHUB = "https://github.com/professorblock/ion-nft-studio";

const EXAMPLE_ADDRESS =
  getNetwork(new URLSearchParams(window.location.search)) === "testnet"
    ? "EQBP4L9h4272Z0j_w9PE2tjHhi8OwkrRbTmatKszMyseis05"
    : "EQD-LkpmPTHhPW68cNfc7B83NcfE9JyGegXzAT8LetpQSRSm";

const SEARCH_HISTORY = "searchHistory";

// Sister Hub product (Jetton minter) — used for cross-product nav.
const ION_HUB_LAUNCH_URL = "https://launch.ionhub.io";

export {
  ROUTES,
  LOCAL_STORAGE_PROVIDER,
  APP_GRID,
  NFT_STUDIO_GITHUB,
  APP_DISPLAY_NAME,
  APP_PRODUCT_NAME,
  EXAMPLE_ADDRESS,
  SEARCH_HISTORY,
  ION_HUB_LAUNCH_URL,
};
