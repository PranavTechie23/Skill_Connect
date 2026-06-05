import { Router } from "express";
import { createApplication, getUserApplications } from "./applications";

/**
 * Application routes mounted at `/api/applications`.
 * Handlers enforce session auth internally.
 */
const router = Router();

router.post("/quick-apply", createApplication);
router.get("/user", getUserApplications);

export default router;
