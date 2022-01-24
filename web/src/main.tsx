import "bootstrap/dist/css/bootstrap.min.css";
import React, { PropsWithChildren } from "react";
import ReactDOM from "react-dom";
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { Container } from "reactstrap";
import "./app.css";
import { getToken, refreshToken } from "./auth";
import App from "./pages/App";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

function Layout() {
  return <Container>
    <Outlet />
  </Container>;
}

function RequireAuth(props: PropsWithChildren<{}>) {
  if (getToken() != null) {
    return <>{props.children}</>;
  } else {
    return <Navigate to="/login" />
  }
}

refreshToken();

ReactDOM.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="login" element={<Login />} />
          <Route path="app" element={<RequireAuth><App /></RequireAuth>} />
          <Route path="/" element={<Navigate to="/app" />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
  document.getElementById("root")
);
