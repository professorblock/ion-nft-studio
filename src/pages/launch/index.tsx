import { useState } from "react";
import { Screen, ScreenContent } from "components/Screen";
import { CollectionType } from "lib/nft/nft-deploy-controller";
import { StepOne } from "./StepOne";
import { StepTwo } from "./StepTwo";

type WizardState = { step: "one" } | { step: "two"; type: CollectionType };

export function LaunchPage() {
  const [state, setState] = useState<WizardState>({ step: "one" });

  return (
    <Screen>
      <ScreenContent>
        {state.step === "one" ? (
          <StepOne onPick={(type) => setState({ step: "two", type })} />
        ) : (
          <StepTwo type={state.type} onBack={() => setState({ step: "one" })} />
        )}
      </ScreenContent>
    </Screen>
  );
}
