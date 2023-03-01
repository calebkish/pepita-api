import { Directive, Input, TemplateRef, ViewContainerRef } from '@angular/core';

// `https://angular.io/guide/structural-directives`

@Directive({
  selector: '[appBe]',
  standalone: true,
})
export class BeDirective<T = unknown> {
  private _context: BeContext<T> = new BeContext<T>();

  @Input()
  set appBe(value: T) {
    this._context.$implicit = this._context.appBe = value;
  }

  constructor(
    _viewContainer: ViewContainerRef,
    _templateRef: TemplateRef<BeContext<T>>,
  ) {
    _viewContainer.createEmbeddedView(_templateRef, this._context);
  }

  /**
   * Assert the correct type of the expression bound to the `appBe` input within the template.
   *
   * The presence of this static field is a signal to the Ivy template type check compiler that
   * when the `AppBe` structural directive renders its template, the type of the expression bound
   * to `appBe` should be narrowed in some way. For `AppBe`, the binding expression itself is used to
   * narrow its type, which allows the strictNullChecks feature of TypeScript to work with `AppBe`.
   */
  static ngTemplateGuard_appBe: 'binding';

  /**
   * Asserts the correct type of the context for the template that `AppBe` will render.
   *
   * The presence of this method is a signal to the Ivy template type-check compiler that the
   * `AppBe` structural directive renders its template with a specific context type.
   */
  static ngTemplateContextGuard<T>(
    dir: BeDirective<T>,
    ctx: unknown,
  ): ctx is BeContext<T> {
    return true;
  }

}

class BeContext<T = unknown> {
  $implicit: T | undefined = undefined;
  appBe: T | undefined = undefined;
}
