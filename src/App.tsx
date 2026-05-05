import { styled } from "@mui/material";
import { Box } from "@mui/system";
import { createContext, useEffect } from "react";
import { APP_GRID, ROUTES } from "consts";
import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { HomePage, LaunchPage, CollectionPage } from "pages";
import analytics from "services/analytics";
import { Footer } from "components/footer";
import { Header } from "components/header";
import useNotification from "hooks/useNotification";

analytics.init();

const AppWrapper = styled(Box)(() => ({
  display: "flex",
  flexDirection: "column",
  height: "100vh",
  overflowY: "scroll",
}));

const FooterBox = styled(Box)(() => ({
  display: "flex",
  flex: 1,
  alignItems: "flex-end",
  justifyContent: "center",
}));

const ScreensWrapper = styled(Box)({
  "*::-webkit-scrollbar": { display: "none" },
  "*::-webkit-scrollbar-track": { display: "none" },
  "*::-webkit-scrollbar-thumb": { display: "none" },
});

const FlexibleBox = styled(Box)(({ theme }) => ({
  maxWidth: APP_GRID,
  width: "calc(100% - 50px)",
  marginLeft: "auto",
  marginRight: "auto",
  [theme.breakpoints.down("sm")]: {
    width: "calc(100% - 30px)",
  },
}));

export const EnvContext = createContext({
  isSandbox: false,
  isTestnet: false,
});

const PageNotFound = () => {
  const { showNotification } = useNotification();
  useEffect(() => {
    showNotification("Page not found", "error");
  }, []);
  return <Box />;
};

const ContentWrapper = ({ children }: { children?: any }) => (
  <FlexibleBox>
    {children}
    <Outlet />
  </FlexibleBox>
);

const App = () => {
  const location = useLocation();

  useEffect(() => {
    // Re-trigger any page-mount analytics on route changes if needed.
  }, [location.pathname]);

  const isSandbox = window.location.search.includes("sandbox");
  const isTestnet = window.location.search.includes("testnet");

  return (
    <AppWrapper>
      <EnvContext.Provider value={{ isSandbox, isTestnet }}>
        <ScreensWrapper>
          <Routes>
            <Route
              path="*"
              element={
                <>
                  <Header />
                  <Navigate to={ROUTES.home} />
                  <PageNotFound />
                </>
              }
            />
            <Route path="/" element={<Header />}>
              <Route path="/" element={<ContentWrapper />}>
                <Route path={ROUTES.home} element={<HomePage />} />
                <Route path={ROUTES.launch} element={<LaunchPage />} />
                <Route path={ROUTES.collectionId} element={<CollectionPage />} />
              </Route>
            </Route>
          </Routes>
        </ScreensWrapper>
      </EnvContext.Provider>
      <FooterBox mt={5}>
        <Footer />
      </FooterBox>
    </AppWrapper>
  );
};

export default App;
