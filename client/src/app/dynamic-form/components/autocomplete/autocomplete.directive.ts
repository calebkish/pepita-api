import { ConnectionPositionPair, Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { Directive, ElementRef, inject, Input, ViewContainerRef } from '@angular/core';
import { NgControl } from '@angular/forms';
import { filter, fromEvent, ReplaySubject, takeUntil } from 'rxjs';
import { AutocompleteComponent } from './autocomplete.component';
import { ESCAPE, TAB } from '@angular/cdk/keycodes';

@Directive({
  selector: '[appAutocomplete]',
  standalone: true,
})
export class AutocompleteDirective {
  private readonly host: ElementRef<HTMLInputElement> = inject(ElementRef<HTMLInputElement>);
  private readonly ngControl: NgControl = inject(NgControl);
  private readonly vcr: ViewContainerRef = inject(ViewContainerRef);
  private readonly overlay: Overlay = inject(Overlay);

  @Input() appAutocomplete!: AutocompleteComponent;
  private overlayRef: OverlayRef | null = null;

  ngOnInit(): void {
    fromEvent(this.host.nativeElement, 'click')
      .pipe(takeUntil(this.onDestroy$))
      .subscribe(() => {
        if (this.overlayRef === null) {
          this.openDropdown();
          this.appAutocomplete.value$()
            .pipe(takeUntil(this.overlayRef!.detachments()))
            .subscribe((value: string) => {
              this.ngControl.control?.setValue(value);
              this.close();
            });
        }
      });

    fromEvent(this.host.nativeElement, 'keydown')
      .pipe(takeUntil(this.onDestroy$))
      .subscribe((e: any) => {
        if (e.keyCode === ESCAPE || e.keyCode === TAB) {
          this.close();
          return;
        }

        if (this.host.nativeElement === null) {
          this.openDropdown();
          this.appAutocomplete.value$()
            .pipe(takeUntil(this.overlayRef!.detachments()))
            .subscribe((value: string) => {
              this.ngControl.control?.setValue(value);
              this.close();
            });
        }

        this.appAutocomplete.onKeydown(e);
      });


    fromEvent(this.host.nativeElement, 'focus')
      .pipe(takeUntil(this.onDestroy$))
      .subscribe(() => {
        if (this.overlayRef) {
          return;
        }

        this.openDropdown();

        this.appAutocomplete.value$()
          .pipe(takeUntil(this.overlayRef!.detachments()))
          .subscribe((value: string) => {
            this.ngControl.control?.setValue(value);
            this.close();
          });
      });
  }

  private onDestroy$ = new ReplaySubject<void>(1);
  ngOnDestroy() {
    this.onDestroy$.next();
  }

  openDropdown() {
    this.overlayRef = this.overlay.create({
      width: this.host.nativeElement.offsetWidth,
      maxHeight: 40 * 3,
      backdropClass: '',
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
      positionStrategy: this.getOverlayPosition(),
    });

    const template = new TemplatePortal(this.appAutocomplete.rootTemplate, this.vcr);

    this.overlayRef.attach(template);

    overlayClickOutside(this.overlayRef, this.host.nativeElement)
      .subscribe(() => this.close());
  }

  private close() {
    this.overlayRef?.detach();
    this.overlayRef = null;
  }

  private getOverlayPosition() {
    const positions = [
      new ConnectionPositionPair(
        { originX: 'start', originY: 'bottom' },
        { overlayX: 'start', overlayY: 'top' },
      ),
    ];

    return this.overlay
      .position()
      .flexibleConnectedTo(this.host.nativeElement)
      .withPositions(positions)
      .withFlexibleDimensions(false)
      .withPush(false);
  }

}

export function overlayClickOutside(overlayRef: OverlayRef, origin: HTMLElement) {
  return fromEvent<MouseEvent>(document, 'click').pipe(
    filter(event => {
      const clickTarget = event.target as HTMLElement;
      const isNotOrigin = clickTarget !== origin;
      const isNotOverlay = !!overlayRef && (overlayRef.overlayElement.contains(clickTarget) === false);
      return isNotOrigin && isNotOverlay;
    }),
    takeUntil(overlayRef.detachments()),
  );
}
