import { Component, ChangeDetectionStrategy, input } from '@angular/core';

@Component({
  selector: 'app-skeleton-loader',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div [class]="'animate-pulse-skeleton rounded-md bg-gray-200 ' + className()"
         [style.width]="width()"
         [style.height]="height()"
         role="status"
         aria-label="Carregando...">
    </div>
  `,
})
export class SkeletonLoaderComponent {
  width = input('100%');
  height = input('1rem');
  className = input('');
}
