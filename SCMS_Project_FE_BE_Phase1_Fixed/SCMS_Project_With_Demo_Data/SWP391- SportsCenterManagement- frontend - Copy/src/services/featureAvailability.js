// These screens have no supported backend workflow in this project revision.
// Retain direct routes to explain the limitation; hide them from navigation.
export const UNAVAILABLE_FEATURE_ROUTES = Object.freeze([
  '#/coach/members', '#/coach/training-plan',
  '#/coach/progress', '#/coach/notifications', '#/coach/ai-recommendation',
  '#/member/progress', '#/member/ai-assistant',
  '#/manager/roles-permissions'
]);

export function isUnavailableFeatureRoute(path) {
  return UNAVAILABLE_FEATURE_ROUTES.includes(path);
}
