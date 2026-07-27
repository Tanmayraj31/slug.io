
import { Router } from "express";
import { ApiError } from "../errors/app.error.js";


const healthRouter = Router();

healthRouter.get("/live",(request, response, next)=>{
    if(request.query.fail === "true"){
        return next(new ApiError(503,"SERVICE_UNAVAILABLE","Service is temporarily unavailable."))
    }
      response.status(200).json({ status: "ok" });
});

export default healthRouter;