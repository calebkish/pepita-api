import { GlobalPositionStrategy, Overlay, OverlayRef } from "@angular/cdk/overlay";
import { ComponentPortal } from "@angular/cdk/portal";
import { ComponentRef, inject, Injectable, InjectionToken, Injector } from "@angular/core";
import { ToastComponent } from "../components/toast.component";

interface ToastConfig {
  autoDismissSeconds?: number;
  message: string;
}

export type InjectedToastConfig = ToastConfig & {
  componentRef: ComponentRef<ToastComponent>,
  overlayRef: OverlayRef,
};

export const TOAST_CONFIG = new InjectionToken<InjectedToastConfig>('ToastConfig');

@Injectable({ providedIn: 'root' })
export class ToastService {
  overlay = inject(Overlay);
  injector = inject(Injector);

  currentlyOpenComponentRef: ComponentRef<ToastComponent> | null = null;

  open(config: ToastConfig): void {

    // @ts-ignore
    const configToInject: InjectedToastConfig = config ?? {};

    const positionStrategy = new GlobalPositionStrategy();
    positionStrategy.top('0');
    positionStrategy.centerHorizontally();
    const overlayRef = this.overlay.create({
      positionStrategy,
    });

    const injector = Injector.create({
      parent: this.injector,
      providers: [
        { provide: TOAST_CONFIG, useValue: configToInject },
      ],
    });

    const containerPortal = new ComponentPortal(
      ToastComponent,
      undefined,
      injector,
    );

    if (this.currentlyOpenComponentRef) {
      this.currentlyOpenComponentRef.instance.delete();
    }
    const componentRef = overlayRef.attach(containerPortal);
    this.currentlyOpenComponentRef = componentRef;

    configToInject.componentRef = componentRef;
    configToInject.overlayRef = overlayRef;

    setTimeout(() => {
      componentRef.instance.delete();
    }, (config?.autoDismissSeconds ?? 2) * 1000);
  }

}

