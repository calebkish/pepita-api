import { ActivatedRouteSnapshot, DetachedRouteHandle, RouteReuseStrategy } from "@angular/router";

export class CustomRouteReuseStrategy extends RouteReuseStrategy {
  retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle | null {
    return null;
  }

  shouldAttach(route: ActivatedRouteSnapshot): boolean {
    return false;
  }

  shouldDetach(route: ActivatedRouteSnapshot): boolean {
    return false;
  }

  shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
    // console.log('curr:', curr.url.join('/'), '\nfuture:', future.url.join('/'));
    if (
      curr?.data?.reuseComponentOnNavigateTo !== undefined &&
      Array.isArray(curr.data.reuseComponentOnNavigateTo) &&
      future?.routeConfig?.path !== undefined &&
      curr.data.reuseComponentOnNavigateTo.includes(future.routeConfig.path)
    ) {
      return true;
    }

    return future.routeConfig === curr.routeConfig;
  }

  store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle | null): void {
  }
}
