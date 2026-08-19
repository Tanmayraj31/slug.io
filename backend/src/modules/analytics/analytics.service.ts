import { ApiError } from "../../common/errors/app.error.js";
import { findLinkForAnalytics } from "./analytics.repository.js";
import type { AnalyticsResponseDto } from "./analytics.types.js";

export async function getLinkAnalytics(
  linkId: number,
  userId: number,
): Promise<AnalyticsResponseDto>{
    const link = await findLinkForAnalytics(linkId,userId);

    if(!link){
       throw new ApiError(404, "LINK_NOT_FOUND", "Link not found."); 
    }

    return{
        totalClicks: link.totalClicks,
        detailed:null,
    };
}