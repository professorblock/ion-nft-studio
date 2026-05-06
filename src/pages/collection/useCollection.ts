import { useEffect, useState } from "react";
import {
  CollectionData,
  CollectionLoadError,
  CollectionLoadErrorKind,
  loadCollection,
} from "lib/nft/collection-reader";

export type CollectionState =
  | { status: "loading" }
  | { status: "success"; data: CollectionData }
  | { status: "error"; kind: CollectionLoadErrorKind; reason: string };

export function useCollection(addressString: string | undefined): CollectionState {
  const [state, setState] = useState<CollectionState>({ status: "loading" });

  useEffect(() => {
    if (!addressString) {
      setState({
        status: "error",
        kind: "invalid-address",
        reason: "No collection address in the URL.",
      });
      return;
    }

    let cancelled = false;
    setState({ status: "loading" });

    loadCollection(addressString)
      .then((data) => {
        if (!cancelled) setState({ status: "success", data });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof CollectionLoadError) {
          setState({ status: "error", kind: err.kind, reason: err.message });
        } else {
          const msg = err instanceof Error ? err.message : String(err);
          setState({ status: "error", kind: "metadata-fetch-failed", reason: msg });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [addressString]);

  return state;
}
