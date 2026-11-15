import { createBackendHandler } from '../server/v1/http.ts';

/** AgroField API v1 (profiles, drones, lots, analyses, drone requests, history). See server/v1/router.ts. */
export default createBackendHandler(process.env);
