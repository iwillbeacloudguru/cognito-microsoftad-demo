import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("/callback", "routes/callback.tsx"),
  route("/hr-app", "routes/hr-app.tsx")
] satisfies RouteConfig;
