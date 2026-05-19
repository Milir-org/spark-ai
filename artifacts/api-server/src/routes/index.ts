import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import dashboardRouter from "./dashboard";
import campaignsRouter from "./campaigns";
import channelsRouter from "./channels";
import integrationsRouter from "./integrations";
import recommendationsRouter from "./recommendations";
import approvalsRouter from "./approvals";
import segmentsRouter from "./segments";
import assetsRouter from "./assets";
import reportsRouter from "./reports";
import usersRouter from "./users";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(dashboardRouter);
router.use(campaignsRouter);
router.use(channelsRouter);
router.use(integrationsRouter);
router.use(recommendationsRouter);
router.use(approvalsRouter);
router.use(segmentsRouter);
router.use(assetsRouter);
router.use(reportsRouter);
router.use(usersRouter);

export default router;
