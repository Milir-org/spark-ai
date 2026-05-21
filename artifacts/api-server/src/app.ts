import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { createProxyMiddleware } from "http-proxy-middleware";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const proxy = (target: string) =>
  createProxyMiddleware({ target, changeOrigin: true, on: {
    error: (err, _req, res: any) => {
      logger.error({ err, target }, "Proxy error");
      res.status(502).json({ error: "Service unavailable", target });
    },
  }});

app.use("/api/auth",            proxy("http://localhost:8088"));
app.use("/api/users",           proxy("http://localhost:8088"));
app.use("/api/campaigns",       proxy("http://localhost:8082"));
app.use("/api/approvals",       proxy("http://localhost:8083"));
app.use("/api/integrations",    proxy("http://localhost:8084"));
app.use("/api/channels",        proxy("http://localhost:8085"));
app.use("/api/recommendations", proxy("http://localhost:8085"));
app.use("/api/segments",        proxy("http://localhost:8085"));
app.use("/api/assets",          proxy("http://localhost:8086"));
app.use("/api/reports",         proxy("http://localhost:8087"));
app.use("/api/dashboard",       proxy("http://localhost:8087"));

app.use("/api", router);

export default app;
