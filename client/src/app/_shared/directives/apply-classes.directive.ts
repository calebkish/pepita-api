import { Directive, ElementRef, EventEmitter, Input, OnInit, Output, Renderer2 } from '@angular/core';

/**
  Apply classes over a particular duration on a host element event.
*/
@Directive({
  selector: '[appApplyClasses]',
  standalone: true,
})
export class ApplyClassesDirective implements OnInit {
  @Input() appApplyClasses!: { duration: number, onEvent: string };

  @Output() inDuration = new EventEmitter<boolean>();

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngOnInit(): void {
    const { duration = 500, onEvent } = this.appApplyClasses;
    this.renderer.listen(this.el.nativeElement, onEvent, () => {
      this.inDuration.emit(true);

      setTimeout(() => {
        this.inDuration.emit(false);
      }, duration);
    });
  }

}
