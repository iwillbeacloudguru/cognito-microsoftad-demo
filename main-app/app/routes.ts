import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("/callback", "routes/callback.tsx"),
  route("/mfa", "routes/mfa.tsx")
] satisfies RouteConfig;
