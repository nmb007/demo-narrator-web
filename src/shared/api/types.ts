import type { components } from "@/shared/api/generated/schema";

export type User = components["schemas"]["UserResponse"];
export type Token = components["schemas"]["TokenResponse"];
export type VideoListItem = components["schemas"]["VideoListItem"];
export type VideoRunSummary = components["schemas"]["VideoRunSummary"];
export type VideoPage =
  components["schemas"]["Page_TypeVar_Customized_VideoListItem_"];
export type Run = components["schemas"]["RunResponse"];
export type RunStatus = components["schemas"]["RunStatus"];
export type NarrationStep = components["schemas"]["NarrationStep"];
